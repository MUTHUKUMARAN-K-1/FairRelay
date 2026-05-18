"""
Route Optimization Engine — Full VRP/TSP Implementation (v2)
=============================================================

Addresses Challenge #4: "Suboptimal route selection increasing total travel distance"

Features:
1. Multi-stop TSP within routes (OR-Tools Routing + 2-opt local search)
2. Time window constraints per stop (AddDimension + SetRange)
3. Vehicle capacity constraint (AddDimension weight enforcement)
4. Priority-aware routing (HIGH/EXPRESS stops penalized if placed late)
5. Traffic-aware speed via OLA Maps integration
6. Cost model (distance × fuel cost + toll + time-based labor)
7. Before/after route comparison with distance/time/CO₂/cost savings
8. DBSCAN clustering option (discovers K automatically, handles arbitrary shapes)
9. Dynamic re-routing via cheapest-insertion heuristic

This module is called AFTER clustering assigns packages to routes,
to optimize the STOP ORDER within each route.
"""

import json
import math
import threading
import time
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger("fairrelay.route_optimizer")


# ═══════════════════════════════════════════════════════════════
# COST MODEL CONSTANTS (Indian logistics, configurable)
# ═══════════════════════════════════════════════════════════════

FUEL_COST_PER_KM = 8.5         # ₹/km (diesel truck avg India 2026)
TOLL_COST_PER_KM = 1.2         # ₹/km (avg toll on state highways)
DRIVER_LABOR_PER_HOUR = 125.0  # ₹/hour (avg driver wage)
CO2_KG_PER_KM = 0.21           # kg CO₂ per km (diesel)
ROAD_FACTOR = 1.35             # Haversine to road distance multiplier (Indian roads) — default


# ═══════════════════════════════════════════════════════════════
# CONTINUOUS LEARNING — Route Performance Store
# ═══════════════════════════════════════════════════════════════

_STORE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "route_performance.json"
_MIN_SAMPLES_TO_ADAPT = 5    # adapt only after this many real feedback entries
_MAX_HISTORY = 200           # keep last N entries
_ROAD_FACTOR_CACHE_TTL = 60  # seconds between re-reads from disk

_store_lock = threading.Lock()
_rf_cache: float = ROAD_FACTOR
_rf_cache_at: float = 0.0


class RoutePerformanceStore:
    """
    Persists route estimation records and actual-distance feedback.
    Each entry: { run_id, route_id, haversine_km, estimated_km,
                  road_factor_used, num_stops, timestamp, actual_km (nullable) }

    Actual distances are submitted via POST /routes/feedback after delivery.
    Accumulated ratios (actual_km / haversine_km) drive get_road_factor().
    """

    def load(self) -> List[Dict[str, Any]]:
        try:
            if _STORE_PATH.exists():
                with open(_STORE_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
        return []

    def save(self, entries: List[Dict[str, Any]]) -> None:
        _STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        tmp = _STORE_PATH.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(entries[-_MAX_HISTORY:], f, indent=2, default=str)
        tmp.replace(_STORE_PATH)

    def record_run(
        self,
        route_id: str,
        haversine_km: float,
        estimated_km: float,
        road_factor_used: float,
        num_stops: int,
    ) -> str:
        """Store a new optimization run and return its run_id."""
        run_id = str(uuid.uuid4())
        entry = {
            "run_id": run_id,
            "route_id": route_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "haversine_km": round(haversine_km, 3),
            "estimated_km": round(estimated_km, 3),
            "road_factor_used": road_factor_used,
            "num_stops": num_stops,
            "actual_km": None,
        }
        with _store_lock:
            entries = self.load()
            entries.append(entry)
            self.save(entries)
        logger.debug(f"[RouteRL] recorded run {run_id} ({num_stops} stops, est={estimated_km:.1f}km)")
        return run_id

    def record_feedback(self, run_id: str, actual_km: float) -> Optional[float]:
        """
        Update a run entry with the actual observed distance.
        Returns the newly computed adaptive road factor, or None if not found.
        """
        with _store_lock:
            entries = self.load()
            for e in entries:
                if e["run_id"] == run_id:
                    e["actual_km"] = round(actual_km, 3)
                    break
            else:
                return None
            self.save(entries)
        return get_road_factor(force_refresh=True)

    def learning_stats(self) -> Dict[str, Any]:
        """Return stats useful for the dashboard / API."""
        entries = self.load()
        completed = [e for e in entries if e.get("actual_km") and e.get("haversine_km")]
        pending = [e for e in entries if e.get("actual_km") is None]
        if completed:
            ratios = [e["actual_km"] / e["haversine_km"] for e in completed]
            avg_ratio = round(sum(ratios) / len(ratios), 3)
            min_ratio = round(min(ratios), 3)
            max_ratio = round(max(ratios), 3)
        else:
            avg_ratio = min_ratio = max_ratio = ROAD_FACTOR
        return {
            "total_runs": len(entries),
            "completed_feedback": len(completed),
            "pending_feedback": len(pending),
            "current_road_factor": get_road_factor(),
            "default_road_factor": ROAD_FACTOR,
            "avg_observed_ratio": avg_ratio,
            "min_ratio": min_ratio,
            "max_ratio": max_ratio,
            "adapted": len(completed) >= _MIN_SAMPLES_TO_ADAPT,
        }


_perf_store = RoutePerformanceStore()


def get_road_factor(force_refresh: bool = False) -> float:
    """
    Return the adaptive road factor based on historical actual vs. haversine ratios.
    Falls back to the default ROAD_FACTOR (1.35) until MIN_SAMPLES feedback entries exist.
    Result is cached for ROAD_FACTOR_CACHE_TTL seconds to avoid disk I/O per stop.
    """
    global _rf_cache, _rf_cache_at
    if not force_refresh and (time.time() - _rf_cache_at) < _ROAD_FACTOR_CACHE_TTL:
        return _rf_cache

    try:
        entries = _perf_store.load()
        completed = [e for e in entries if e.get("actual_km") and e.get("haversine_km")]
        if len(completed) < _MIN_SAMPLES_TO_ADAPT:
            factor = ROAD_FACTOR
        else:
            ratios = [e["actual_km"] / e["haversine_km"] for e in completed[-50:]]
            factor = max(1.1, min(2.0, round(sum(ratios) / len(ratios), 3)))
            logger.info(f"[RouteRL] adaptive road_factor={factor:.3f} (from {len(completed)} samples)")
    except Exception as exc:
        logger.warning(f"[RouteRL] road factor read failed: {exc}, using default")
        factor = ROAD_FACTOR

    _rf_cache = factor
    _rf_cache_at = time.time()
    return factor

# Priority penalty multiplier for late delivery of high-priority items
PRIORITY_PENALTY = {
    "express": 3.0,   # 3x cost penalty if EXPRESS is placed late in route
    "high": 2.0,      # 2x cost penalty if HIGH is placed late
    "normal": 1.0,    # No penalty
    "low": 0.8,       # Slight discount — can be delivered last
}


# ═══════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════

@dataclass
class Stop:
    """A delivery stop with coordinates, capacity, time window, and priority."""
    id: str
    lat: float
    lng: float
    address: str = ""
    weight_kg: float = 0.0
    volume_m3: float = 0.0
    service_time_min: float = 5.0
    time_window_start: Optional[int] = None  # Minutes from route start
    time_window_end: Optional[int] = None
    priority: str = "normal"         # "express" | "high" | "normal" | "low"
    is_hazmat: bool = False          # Hazardous material flag


@dataclass
class VehicleConfig:
    """Vehicle capacity and cost configuration."""
    max_weight_kg: float = 1000.0
    max_volume_m3: float = 8.0
    fuel_cost_per_km: float = FUEL_COST_PER_KM
    co2_per_km: float = CO2_KG_PER_KM
    vehicle_type: str = "diesel"     # "diesel" | "ev" | "cng"


@dataclass
class RouteOptResult:
    """Result of route optimization."""
    ordered_stops: List[Stop]
    total_distance_km: float
    total_time_minutes: float
    total_cost_inr: float            # NEW: Total route cost in ₹
    naive_distance_km: float
    distance_saved_km: float
    distance_saved_pct: float
    cost_saved_inr: float            # NEW: Cost savings
    optimization_method: str
    time_windows_respected: bool
    capacity_respected: bool         # NEW: Vehicle capacity check
    priority_score: float            # NEW: 0-100 (how well priorities honored)
    num_stops: int
    polyline_points: List[Tuple[float, float]]


@dataclass
class RouteComparison:
    """Before vs after comparison for Challenge #4."""
    route_id: str
    run_id: str
    before: Dict[str, Any]
    after: Dict[str, Any]
    improvement: Dict[str, Any]


# ═══════════════════════════════════════════════════════════════
# CORE: DISTANCE + COST
# ═══════════════════════════════════════════════════════════════

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def road_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Estimated road distance using adaptive road factor learned from feedback."""
    return haversine_km(lat1, lng1, lat2, lng2) * get_road_factor()


def compute_cost(distance_km: float, time_hours: float, vehicle: VehicleConfig = None) -> float:
    """Compute route cost: fuel + toll + labor."""
    v = vehicle or VehicleConfig()
    fuel = distance_km * v.fuel_cost_per_km
    toll = distance_km * TOLL_COST_PER_KM
    labor = time_hours * DRIVER_LABOR_PER_HOUR
    return round(fuel + toll + labor, 2)


def get_traffic_speed(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Get traffic-aware speed. Uses traffic_integration if available."""
    try:
        from app.services.traffic_integration import get_effective_speed
        return get_effective_speed(lat1, lng1, lat2, lng2)
    except (ImportError, Exception):
        # Fallback: static Indian urban speed
        hour = time.localtime().tm_hour
        if 7 <= hour <= 10 or 17 <= hour <= 20:
            return 18.0  # Peak hours
        elif 22 <= hour or hour <= 5:
            return 40.0  # Night
        return 28.0  # Off-peak


def build_distance_matrix(stops: List[Stop], depot_lat: float, depot_lng: float) -> List[List[int]]:
    """Build distance matrix (in meters) with depot at index 0."""
    all_points = [(depot_lat, depot_lng)] + [(s.lat, s.lng) for s in stops]
    n = len(all_points)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                d = road_distance_km(all_points[i][0], all_points[i][1], all_points[j][0], all_points[j][1])
                matrix[i][j] = int(d * 1000)  # meters for OR-Tools
    return matrix


# ═══════════════════════════════════════════════════════════════
# PRIORITY SCORING
# ═══════════════════════════════════════════════════════════════

def compute_priority_score(stops: List[Stop], order: List[int]) -> float:
    """
    Score how well priorities are honored (0-100).
    HIGH/EXPRESS stops should be delivered EARLY in the route.
    Score = 100 means all high-priority stops are in first half.
    """
    if not order:
        return 100.0

    n = len(order)
    total_penalty = 0.0
    max_penalty = 0.0

    for position, idx in enumerate(order):
        stop = stops[idx]
        priority_weight = PRIORITY_PENALTY.get(stop.priority.lower(), 1.0)

        if priority_weight > 1.0:
            # High-priority stop — penalty increases with position
            normalized_position = position / max(n - 1, 1)  # 0.0 (first) to 1.0 (last)
            total_penalty += normalized_position * priority_weight
            max_penalty += 1.0 * priority_weight  # Worst case: all at end

    if max_penalty == 0:
        return 100.0

    # Invert: lower penalty = higher score
    return round(max(0, (1 - total_penalty / max_penalty)) * 100, 1)


# ═══════════════════════════════════════════════════════════════
# METHOD 1: OR-TOOLS VRP WITH CAPACITY + TIME WINDOWS + PRIORITY
# ═══════════════════════════════════════════════════════════════

def solve_vrp_ortools(
    stops: List[Stop],
    depot_lat: float,
    depot_lng: float,
    vehicle: VehicleConfig = None,
    speed_kmh: float = 30.0,
    max_time_seconds: int = 5,
) -> Optional[List[int]]:
    """
    Solve TSP/VRP using OR-Tools with:
    - Distance minimization
    - Time window constraints (AddDimension 'Time')
    - Vehicle capacity constraint (AddDimension 'Capacity')
    - Priority-aware arc costs (high-priority stops penalized if late)
    """
    try:
        from ortools.constraint_solver import routing_enums_pb2, pywrapcp
    except ImportError:
        return None

    v = vehicle or VehicleConfig()
    n = len(stops) + 1  # +1 for depot
    if n <= 2:
        return list(range(len(stops)))

    dist_matrix = build_distance_matrix(stops, depot_lat, depot_lng)

    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    # ── Distance callback with priority-aware cost ──
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        base_cost = dist_matrix[from_node][to_node]

        # Apply priority penalty: delivering high-priority late costs more
        if to_node > 0:
            stop = stops[to_node - 1]
            multiplier = PRIORITY_PENALTY.get(stop.priority.lower(), 1.0)
            # Only penalize if this would be a "late" delivery (heuristic: further from depot)
            if multiplier > 1.0:
                depot_dist = dist_matrix[0][to_node]
                if base_cost > depot_dist * 0.5:
                    base_cost = int(base_cost * (1 + (multiplier - 1) * 0.3))

        return base_cost

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # ── Capacity dimension (weight) ──
    total_weight = sum(s.weight_kg for s in stops)
    if total_weight > 0:
        def demand_callback(from_index):
            node = manager.IndexToNode(from_index)
            if node == 0:
                return 0  # Depot has no demand
            return int(stops[node - 1].weight_kg * 100)  # Scale to int (100g units)

        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,  # No slack
            [int(v.max_weight_kg * 100)],  # Vehicle capacity (in 100g units)
            True,  # Start cumul at zero
            'Capacity'
        )

    # ── Time dimension (for time windows) ──
    has_time_windows = any(s.time_window_start is not None for s in stops)

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        dist_km = dist_matrix[from_node][to_node] / 1000
        # Use traffic-aware speed
        if from_node > 0 and to_node > 0:
            spd = get_traffic_speed(stops[from_node-1].lat, stops[from_node-1].lng, stops[to_node-1].lat, stops[to_node-1].lng)
        else:
            spd = speed_kmh
        travel_min = (dist_km / max(spd, 5)) * 60
        if to_node > 0:
            travel_min += stops[to_node - 1].service_time_min
        return int(travel_min)

    time_callback_index = routing.RegisterTransitCallback(time_callback)

    max_route_time = 720  # 12 hours
    routing.AddDimension(
        time_callback_index,
        30,             # Slack
        max_route_time,
        False,
        'Time'
    )
    time_dimension = routing.GetDimensionOrDie('Time')

    if has_time_windows:
        for i, stop in enumerate(stops):
            node_index = manager.NodeToIndex(i + 1)
            if stop.time_window_start is not None and stop.time_window_end is not None:
                time_dimension.CumulVar(node_index).SetRange(
                    int(stop.time_window_start),
                    int(stop.time_window_end)
                )

    time_dimension.CumulVar(routing.Start(0)).SetRange(0, max_route_time)

    # ── Solve ──
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.FromSeconds(max_time_seconds)

    solution = routing.SolveWithParameters(search_params)

    if solution:
        order = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node > 0:
                order.append(node - 1)
            index = solution.Value(routing.NextVar(index))
        return order

    return None


# ═══════════════════════════════════════════════════════════════
# METHOD 2: 2-OPT LOCAL SEARCH (PRIORITY-AWARE)
# ═══════════════════════════════════════════════════════════════

def two_opt_improve(
    stops: List[Stop],
    depot_lat: float,
    depot_lng: float,
    initial_order: List[int],
    max_iterations: int = 1000,
) -> List[int]:
    """
    2-opt improvement with priority-aware cost function.
    High-priority stops incur penalty when placed late.
    """
    def route_cost(order: List[int]) -> float:
        if not order:
            return 0.0
        total = road_distance_km(depot_lat, depot_lng, stops[order[0]].lat, stops[order[0]].lng)
        for i in range(len(order) - 1):
            total += road_distance_km(stops[order[i]].lat, stops[order[i]].lng, stops[order[i+1]].lat, stops[order[i+1]].lng)
        total += road_distance_km(stops[order[-1]].lat, stops[order[-1]].lng, depot_lat, depot_lng)

        # Priority penalty: HIGH/EXPRESS stops later = higher cost
        n = len(order)
        for pos, idx in enumerate(order):
            mult = PRIORITY_PENALTY.get(stops[idx].priority.lower(), 1.0)
            if mult > 1.0:
                position_factor = pos / max(n - 1, 1)
                total += position_factor * mult * 0.5  # Small penalty in km-equivalent

        return total

    best_order = list(initial_order)
    best_cost = route_cost(best_order)
    improved = True
    iterations = 0

    while improved and iterations < max_iterations:
        improved = False
        iterations += 1
        for i in range(len(best_order) - 1):
            for j in range(i + 1, len(best_order)):
                new_order = best_order[:i] + best_order[i:j+1][::-1] + best_order[j+1:]
                new_cost = route_cost(new_order)
                if new_cost < best_cost - 0.01:
                    best_order = new_order
                    best_cost = new_cost
                    improved = True
                    break
            if improved:
                break

    return best_order


# ═══════════════════════════════════════════════════════════════
# METHOD 3: NEAREST NEIGHBOR (PRIORITY-FIRST)
# ═══════════════════════════════════════════════════════════════

def nearest_neighbor_order(stops: List[Stop], depot_lat: float, depot_lng: float) -> List[int]:
    """
    Priority-aware nearest-neighbor: HIGH/EXPRESS stops get preference
    when multiple stops are roughly equidistant.
    """
    if not stops:
        return []

    remaining = list(range(len(stops)))
    order = []
    curr_lat, curr_lng = depot_lat, depot_lng

    while remaining:
        # Score = distance / priority_weight (lower = better)
        def score(i):
            dist = road_distance_km(curr_lat, curr_lng, stops[i].lat, stops[i].lng)
            priority_boost = PRIORITY_PENALTY.get(stops[i].priority.lower(), 1.0)
            return dist / max(priority_boost, 0.5)

        best_idx = min(remaining, key=score)
        order.append(best_idx)
        remaining.remove(best_idx)
        curr_lat, curr_lng = stops[best_idx].lat, stops[best_idx].lng

    return order


# ═══════════════════════════════════════════════════════════════
# METHOD 4: CHEAPEST INSERTION (DYNAMIC RE-ROUTING)
# ═══════════════════════════════════════════════════════════════

def cheapest_insertion(
    existing_order: List[int],
    new_stop_idx: int,
    stops: List[Stop],
    depot_lat: float,
    depot_lng: float,
) -> List[int]:
    """Insert a new stop at the cheapest position (priority-aware)."""
    if not existing_order:
        return [new_stop_idx]

    new_stop = stops[new_stop_idx]
    best_position = 0
    best_cost_increase = float('inf')

    # High-priority stops prefer earlier positions
    priority_mult = PRIORITY_PENALTY.get(new_stop.priority.lower(), 1.0)

    for pos in range(len(existing_order) + 1):
        if pos == 0:
            prev_lat, prev_lng = depot_lat, depot_lng
        else:
            prev_stop = stops[existing_order[pos - 1]]
            prev_lat, prev_lng = prev_stop.lat, prev_stop.lng

        if pos == len(existing_order):
            next_lat, next_lng = depot_lat, depot_lng
        else:
            next_stop = stops[existing_order[pos]]
            next_lat, next_lng = next_stop.lat, next_stop.lng

        current_cost = road_distance_km(prev_lat, prev_lng, next_lat, next_lng)
        new_cost = (road_distance_km(prev_lat, prev_lng, new_stop.lat, new_stop.lng) +
                    road_distance_km(new_stop.lat, new_stop.lng, next_lat, next_lng))

        cost_increase = new_cost - current_cost
        # Priority discount for earlier positions
        if priority_mult > 1.0:
            position_penalty = pos / max(len(existing_order), 1) * (priority_mult - 1)
            cost_increase += position_penalty

        if cost_increase < best_cost_increase:
            best_cost_increase = cost_increase
            best_position = pos

    result = list(existing_order)
    result.insert(best_position, new_stop_idx)
    return result


# ═══════════════════════════════════════════════════════════════
# MAIN OPTIMIZER
# ═══════════════════════════════════════════════════════════════

def optimize_route(
    stops: List[Stop],
    depot_lat: float,
    depot_lng: float,
    vehicle: VehicleConfig = None,
    speed_kmh: float = None,
    use_time_windows: bool = True,
    max_solver_time: int = 5,
) -> RouteOptResult:
    """
    Full route optimization pipeline:
    1. Try OR-Tools VRP with capacity + time windows + priority
    2. Apply 2-opt local search improvement
    3. Fallback: priority-aware nearest-neighbor + 2-opt
    4. Compute cost model (fuel + toll + labor)
    5. Check capacity and priority compliance
    """
    v = vehicle or VehicleConfig()

    if not stops:
        return RouteOptResult(
            ordered_stops=[], total_distance_km=0, total_time_minutes=0, total_cost_inr=0,
            naive_distance_km=0, distance_saved_km=0, distance_saved_pct=0, cost_saved_inr=0,
            optimization_method="empty", time_windows_respected=True,
            capacity_respected=True, priority_score=100.0,
            num_stops=0, polyline_points=[],
        )

    # Get traffic-aware speed
    if speed_kmh is None:
        speed_kmh = get_traffic_speed(depot_lat, depot_lng, stops[0].lat, stops[0].lng)

    # Step 1: Naive baseline
    naive_order = list(range(len(stops)))
    naive_dist = _compute_route_distance(stops, naive_order, depot_lat, depot_lng)

    # Step 2: OR-Tools VRP with capacity + time + priority
    method = "nearest_neighbor"
    ortools_order = None

    if len(stops) >= 3:
        ortools_order = solve_vrp_ortools(stops, depot_lat, depot_lng, v, speed_kmh, max_solver_time)

    if ortools_order:
        method = "or_tools_vrp"
        best_order = ortools_order
    else:
        best_order = nearest_neighbor_order(stops, depot_lat, depot_lng)

    # Step 3: 2-opt improvement
    if len(stops) >= 4:
        improved_order = two_opt_improve(stops, depot_lat, depot_lng, best_order)
        if _compute_route_distance(stops, improved_order, depot_lat, depot_lng) < _compute_route_distance(stops, best_order, depot_lat, depot_lng):
            best_order = improved_order
            method = f"{method}+2opt"

    # Step 4: Compute metrics
    optimized_dist = _compute_route_distance(stops, best_order, depot_lat, depot_lng)
    distance_saved = naive_dist - optimized_dist
    saved_pct = (distance_saved / naive_dist * 100) if naive_dist > 0 else 0

    total_time_hours = (optimized_dist / max(speed_kmh, 5)) + sum(stops[i].service_time_min for i in best_order) / 60
    total_time_min = total_time_hours * 60

    # Cost model
    optimized_cost = compute_cost(optimized_dist, total_time_hours, v)
    naive_time_hours = (naive_dist / max(speed_kmh, 5)) + sum(s.service_time_min for s in stops) / 60
    naive_cost = compute_cost(naive_dist, naive_time_hours, v)
    cost_saved = naive_cost - optimized_cost

    # Capacity check
    total_weight = sum(stops[i].weight_kg for i in best_order)
    capacity_ok = total_weight <= v.max_weight_kg

    # Priority score
    priority_score = compute_priority_score(stops, best_order)

    # Time windows check
    tw_respected = _check_time_windows(stops, best_order, depot_lat, depot_lng, speed_kmh)

    # Polyline
    polyline = [(depot_lat, depot_lng)] + [(stops[i].lat, stops[i].lng) for i in best_order] + [(depot_lat, depot_lng)]
    ordered_stops = [stops[i] for i in best_order]

    return RouteOptResult(
        ordered_stops=ordered_stops,
        total_distance_km=round(optimized_dist, 2),
        total_time_minutes=round(total_time_min, 1),
        total_cost_inr=optimized_cost,
        naive_distance_km=round(naive_dist, 2),
        distance_saved_km=round(max(0, distance_saved), 2),
        distance_saved_pct=round(max(0, saved_pct), 1),
        cost_saved_inr=round(max(0, cost_saved), 2),
        optimization_method=method,
        time_windows_respected=tw_respected,
        capacity_respected=capacity_ok,
        priority_score=priority_score,
        num_stops=len(stops),
        polyline_points=polyline,
    )


def compare_routes(
    routes: List[Dict[str, Any]],
    depot_lat: float,
    depot_lng: float,
    speed_kmh: float = None,
    vehicle: VehicleConfig = None,
) -> List[RouteComparison]:
    """Generate before/after route comparison for Challenge #4."""
    comparisons = []

    for route in routes:
        route_id = route.get("id", f"route_{len(comparisons)}")
        raw_stops = route.get("stops", route.get("packages", []))

        stops = [
            Stop(
                id=s.get("id", f"stop_{i}"),
                lat=s.get("latitude", s.get("lat", 0)),
                lng=s.get("longitude", s.get("lng", 0)),
                address=s.get("address", ""),
                weight_kg=s.get("weight_kg", 0),
                volume_m3=s.get("volume_m3", 0),
                service_time_min=s.get("service_time_min", 5),
                time_window_start=s.get("time_window_start"),
                time_window_end=s.get("time_window_end"),
                priority=s.get("priority", "normal"),
                is_hazmat=s.get("is_hazmat", False),
            )
            for i, s in enumerate(raw_stops)
        ]

        if not stops:
            continue

        spd = speed_kmh or get_traffic_speed(depot_lat, depot_lng, stops[0].lat, stops[0].lng)
        v = vehicle or VehicleConfig()

        # Before
        naive_dist = _compute_route_distance(stops, list(range(len(stops))), depot_lat, depot_lng)
        naive_time_h = (naive_dist / max(spd, 5)) + sum(s.service_time_min for s in stops) / 60
        naive_cost = compute_cost(naive_dist, naive_time_h, v)
        naive_priority = compute_priority_score(stops, list(range(len(stops))))

        # After
        result = optimize_route(stops, depot_lat, depot_lng, v, spd)

        # Record run for continuous learning (feedback via POST /routes/feedback)
        raw_haversine = sum(
            haversine_km(stops[i].lat, stops[i].lng, stops[i+1].lat, stops[i+1].lng)
            for i in range(len(stops) - 1)
        ) if len(stops) > 1 else 0.0
        run_id = _perf_store.record_run(
            route_id=route_id,
            haversine_km=raw_haversine,
            estimated_km=result.total_distance_km,
            road_factor_used=get_road_factor(),
            num_stops=len(stops),
        )

        comparisons.append(RouteComparison(
            route_id=route_id,
            run_id=run_id,
            before={
                "distance_km": round(naive_dist, 2),
                "time_minutes": round(naive_time_h * 60, 1),
                "cost_inr": naive_cost,
                "co2_kg": round(naive_dist * CO2_KG_PER_KM, 2),
                "priority_score": naive_priority,
                "stop_order": [s.id for s in stops],
            },
            after={
                "distance_km": result.total_distance_km,
                "time_minutes": result.total_time_minutes,
                "cost_inr": result.total_cost_inr,
                "co2_kg": round(result.total_distance_km * CO2_KG_PER_KM, 2),
                "priority_score": result.priority_score,
                "stop_order": [s.id for s in result.ordered_stops],
                "method": result.optimization_method,
                "capacity_ok": result.capacity_respected,
                "polyline": result.polyline_points,
            },
            improvement={
                "distance_saved_km": result.distance_saved_km,
                "distance_saved_pct": result.distance_saved_pct,
                "time_saved_minutes": round(naive_time_h * 60 - result.total_time_minutes, 1),
                "cost_saved_inr": result.cost_saved_inr,
                "co2_saved_kg": round((naive_dist - result.total_distance_km) * CO2_KG_PER_KM, 2),
                "priority_improved": result.priority_score > naive_priority,
                "time_windows_respected": result.time_windows_respected,
            },
        ))

    return comparisons


# ═══════════════════════════════════════════════════════════════
# DBSCAN CLUSTERING (DISCOVERS K AUTOMATICALLY)
# ═══════════════════════════════════════════════════════════════

def cluster_packages_dbscan(
    packages: List[Dict[str, Any]],
    eps_km: float = 5.0,
    min_samples: int = 2,
    max_cluster_size: int = 30,
) -> List[List[Dict[str, Any]]]:
    """
    DBSCAN clustering — auto K, arbitrary shapes, noise merged.
    Hazmat packages are isolated into their own clusters.
    """
    import numpy as np
    from sklearn.cluster import DBSCAN

    if not packages:
        return []
    if len(packages) <= min_samples:
        return [packages]

    # Separate hazmat packages (must be isolated)
    hazmat = [p for p in packages if p.get("is_hazmat", False)]
    normal = [p for p in packages if not p.get("is_hazmat", False)]

    if not normal:
        return [[p] for p in hazmat]  # Each hazmat gets its own route

    coords_rad = np.array([
        [math.radians(p["latitude"]), math.radians(p["longitude"])]
        for p in normal
    ])

    eps_rad = eps_km / 6371.0
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine')
    labels = db.fit_predict(coords_rad)

    clusters: Dict[int, List[int]] = {}
    noise_indices: List[int] = []

    for idx, label in enumerate(labels):
        if label == -1:
            noise_indices.append(idx)
        else:
            clusters.setdefault(label, []).append(idx)

    # Merge noise into nearest cluster
    if noise_indices and clusters:
        centroids = {}
        for label, indices in clusters.items():
            lats = [normal[i]["latitude"] for i in indices]
            lngs = [normal[i]["longitude"] for i in indices]
            centroids[label] = (sum(lats)/len(lats), sum(lngs)/len(lngs))

        for ni in noise_indices:
            pkg = normal[ni]
            nearest = min(centroids.keys(), key=lambda l: haversine_km(pkg["latitude"], pkg["longitude"], centroids[l][0], centroids[l][1]))
            clusters[nearest].append(ni)
    elif noise_indices:
        clusters[0] = noise_indices

    # Split oversized + build final
    final = []
    for label, indices in clusters.items():
        if len(indices) <= max_cluster_size:
            final.append([normal[i] for i in indices])
        else:
            from sklearn.cluster import KMeans
            sub_coords = np.array([[normal[i]["latitude"], normal[i]["longitude"]] for i in indices])
            n_sub = max(2, len(indices) // max_cluster_size + 1)
            km = KMeans(n_clusters=n_sub, random_state=42, n_init=5)
            sub_labels = km.fit_predict(sub_coords)
            for sl in range(n_sub):
                sub = [indices[j] for j in range(len(indices)) if sub_labels[j] == sl]
                if sub:
                    final.append([normal[i] for i in sub])

    # Add hazmat as separate clusters
    for h in hazmat:
        final.append([h])

    return final


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def _compute_route_distance(stops: List[Stop], order: List[int], depot_lat: float, depot_lng: float) -> float:
    """Compute total road distance for a given stop order."""
    if not order:
        return 0.0
    total = road_distance_km(depot_lat, depot_lng, stops[order[0]].lat, stops[order[0]].lng)
    for i in range(len(order) - 1):
        total += road_distance_km(stops[order[i]].lat, stops[order[i]].lng, stops[order[i+1]].lat, stops[order[i+1]].lng)
    total += road_distance_km(stops[order[-1]].lat, stops[order[-1]].lng, depot_lat, depot_lng)
    return total


def _check_time_windows(stops: List[Stop], order: List[int], depot_lat: float, depot_lng: float, speed_kmh: float) -> bool:
    """Check if all time windows are respected."""
    if not order:
        return True

    current_time = 0.0
    current_lat, current_lng = depot_lat, depot_lng

    for idx in order:
        stop = stops[idx]
        dist = road_distance_km(current_lat, current_lng, stop.lat, stop.lng)
        travel_time = (dist / max(speed_kmh, 5)) * 60
        current_time += travel_time

        if stop.time_window_end is not None and current_time > stop.time_window_end:
            return False
        if stop.time_window_start is not None and current_time < stop.time_window_start:
            current_time = stop.time_window_start

        current_time += stop.service_time_min
        current_lat, current_lng = stop.lat, stop.lng

    return True
