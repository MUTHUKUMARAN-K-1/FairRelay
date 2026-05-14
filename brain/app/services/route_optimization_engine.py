"""
Route Optimization Engine — Full VRP/TSP Implementation
========================================================

Addresses Challenge #4: "Suboptimal route selection increasing total travel distance"

Features:
1. Multi-stop TSP within routes (OR-Tools Routing + 2-opt local search)
2. Time window constraints per stop (AddDimension + SetRange)
3. Before/after route comparison with distance savings
4. DBSCAN clustering option (discovers K automatically, handles arbitrary shapes)
5. Dynamic re-routing via cheapest-insertion heuristic
6. Traffic-aware effective speed (via traffic_integration)

This module is called AFTER clustering assigns packages to routes,
to optimize the STOP ORDER within each route.
"""

import math
import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger("fairrelay.route_optimizer")


# ═══════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════

@dataclass
class Stop:
    """A delivery stop with coordinates and optional time window."""
    id: str
    lat: float
    lng: float
    address: str = ""
    weight_kg: float = 0.0
    service_time_min: float = 5.0  # Time spent at stop
    time_window_start: Optional[int] = None  # Minutes from route start
    time_window_end: Optional[int] = None    # Minutes from route start
    priority: str = "normal"


@dataclass
class RouteOptResult:
    """Result of route optimization."""
    ordered_stops: List[Stop]
    total_distance_km: float
    total_time_minutes: float
    naive_distance_km: float       # Before optimization
    distance_saved_km: float       # Improvement
    distance_saved_pct: float      # % improvement
    optimization_method: str       # "or_tools_vrp" | "2_opt" | "nearest_neighbor"
    time_windows_respected: bool
    num_stops: int
    polyline_points: List[Tuple[float, float]]  # Ordered (lat, lng) for map


@dataclass
class RouteComparison:
    """Before vs after comparison for Challenge #4."""
    route_id: str
    before: Dict[str, Any]
    after: Dict[str, Any]
    improvement: Dict[str, Any]


# ═══════════════════════════════════════════════════════════════
# CORE: HAVERSINE DISTANCE
# ═══════════════════════════════════════════════════════════════

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def build_distance_matrix(stops: List[Stop], depot_lat: float, depot_lng: float) -> List[List[int]]:
    """Build distance matrix (in meters) with depot at index 0."""
    all_points = [(depot_lat, depot_lng)] + [(s.lat, s.lng) for s in stops]
    n = len(all_points)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                d = haversine_km(all_points[i][0], all_points[i][1], all_points[j][0], all_points[j][1])
                matrix[i][j] = int(d * 1000)  # Convert to meters for OR-Tools
    return matrix


# ═══════════════════════════════════════════════════════════════
# METHOD 1: OR-TOOLS VRP WITH TIME WINDOWS
# ═══════════════════════════════════════════════════════════════

def solve_vrp_ortools(
    stops: List[Stop],
    depot_lat: float,
    depot_lng: float,
    speed_kmh: float = 30.0,
    max_time_seconds: int = 5,
) -> Optional[List[int]]:
    """
    Solve TSP/VRP using OR-Tools Routing Library with time windows.
    
    Returns ordered indices into stops list, or None if solver fails.
    """
    try:
        from ortools.constraint_solver import routing_enums_pb2, pywrapcp
    except ImportError:
        return None
    
    n = len(stops) + 1  # +1 for depot
    if n <= 2:
        return list(range(len(stops)))
    
    # Build distance matrix
    dist_matrix = build_distance_matrix(stops, depot_lat, depot_lng)
    
    # Create routing index manager (1 vehicle, depot at node 0)
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    
    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return dist_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Time dimension (for time windows)
    has_time_windows = any(s.time_window_start is not None for s in stops)
    
    if has_time_windows:
        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            # Travel time in minutes
            dist_km = dist_matrix[from_node][to_node] / 1000
            travel_min = (dist_km / speed_kmh) * 60
            # Add service time at destination
            if to_node > 0:
                travel_min += stops[to_node - 1].service_time_min
            return int(travel_min)
        
        time_callback_index = routing.RegisterTransitCallback(time_callback)
        
        # Add time dimension
        max_route_time = 720  # 12 hours max
        routing.AddDimension(
            time_callback_index,
            30,             # Slack (waiting time allowed)
            max_route_time, # Max cumulative time
            False,          # Don't force start at 0
            'Time'
        )
        time_dimension = routing.GetDimensionOrDie('Time')
        
        # Set time windows
        for i, stop in enumerate(stops):
            node_index = manager.NodeToIndex(i + 1)
            if stop.time_window_start is not None and stop.time_window_end is not None:
                time_dimension.CumulVar(node_index).SetRange(
                    int(stop.time_window_start),
                    int(stop.time_window_end)
                )
        
        # Depot time window (start at 0, end at max)
        time_dimension.CumulVar(routing.Start(0)).SetRange(0, max_route_time)
    
    # Solve with time limit
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.FromSeconds(max_time_seconds)
    
    solution = routing.SolveWithParameters(search_params)
    
    if solution:
        # Extract route order
        order = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node > 0:  # Skip depot
                order.append(node - 1)  # Map back to stops index
            index = solution.Value(routing.NextVar(index))
        return order
    
    return None


# ═══════════════════════════════════════════════════════════════
# METHOD 2: 2-OPT LOCAL SEARCH IMPROVEMENT
# ═══════════════════════════════════════════════════════════════

def two_opt_improve(
    stops: List[Stop],
    depot_lat: float,
    depot_lng: float,
    initial_order: List[int],
    max_iterations: int = 1000,
) -> List[int]:
    """
    Apply 2-opt improvement to a route order.
    
    2-opt reverses segments of the route to reduce total distance.
    Guaranteed to converge to a local optimum.
    """
    def route_distance(order: List[int]) -> float:
        """Total route distance including depot→first and last→depot."""
        if not order:
            return 0.0
        # Depot to first stop
        total = haversine_km(depot_lat, depot_lng, stops[order[0]].lat, stops[order[0]].lng)
        # Between stops
        for i in range(len(order) - 1):
            total += haversine_km(stops[order[i]].lat, stops[order[i]].lng, stops[order[i+1]].lat, stops[order[i+1]].lng)
        # Last stop back to depot
        total += haversine_km(stops[order[-1]].lat, stops[order[-1]].lng, depot_lat, depot_lng)
        return total
    
    best_order = list(initial_order)
    best_dist = route_distance(best_order)
    improved = True
    iterations = 0
    
    while improved and iterations < max_iterations:
        improved = False
        iterations += 1
        for i in range(len(best_order) - 1):
            for j in range(i + 1, len(best_order)):
                # Reverse segment [i:j+1]
                new_order = best_order[:i] + best_order[i:j+1][::-1] + best_order[j+1:]
                new_dist = route_distance(new_order)
                if new_dist < best_dist - 0.01:  # 10m improvement threshold
                    best_order = new_order
                    best_dist = new_dist
                    improved = True
                    break
            if improved:
                break
    
    return best_order


# ═══════════════════════════════════════════════════════════════
# METHOD 3: NEAREST NEIGHBOR (BASELINE)
# ═══════════════════════════════════════════════════════════════

def nearest_neighbor_order(stops: List[Stop], depot_lat: float, depot_lng: float) -> List[int]:
    """Simple nearest-neighbor heuristic as baseline."""
    if not stops:
        return []
    
    remaining = list(range(len(stops)))
    order = []
    curr_lat, curr_lng = depot_lat, depot_lng
    
    while remaining:
        nearest_idx = min(remaining, key=lambda i: haversine_km(curr_lat, curr_lng, stops[i].lat, stops[i].lng))
        order.append(nearest_idx)
        remaining.remove(nearest_idx)
        curr_lat, curr_lng = stops[nearest_idx].lat, stops[nearest_idx].lng
    
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
    """
    Insert a new stop into an existing route at the cheapest position.
    Used for dynamic re-routing when new packages arrive mid-route.
    """
    if not existing_order:
        return [new_stop_idx]
    
    def segment_cost(from_lat, from_lng, to_lat, to_lng):
        return haversine_km(from_lat, from_lng, to_lat, to_lng)
    
    new_stop = stops[new_stop_idx]
    best_position = 0
    best_cost_increase = float('inf')
    
    # Try inserting at each position
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
        
        # Cost of current segment (prev → next)
        current_cost = segment_cost(prev_lat, prev_lng, next_lat, next_lng)
        # Cost after insertion (prev → new → next)
        new_cost = (segment_cost(prev_lat, prev_lng, new_stop.lat, new_stop.lng) +
                    segment_cost(new_stop.lat, new_stop.lng, next_lat, next_lng))
        
        cost_increase = new_cost - current_cost
        if cost_increase < best_cost_increase:
            best_cost_increase = cost_increase
            best_position = pos
    
    result = list(existing_order)
    result.insert(best_position, new_stop_idx)
    return result


# ═══════════════════════════════════════════════════════════════
# MAIN OPTIMIZER: COMBINES ALL METHODS
# ═══════════════════════════════════════════════════════════════

def optimize_route(
    stops: List[Stop],
    depot_lat: float,
    depot_lng: float,
    speed_kmh: float = 30.0,
    use_time_windows: bool = True,
    max_solver_time: int = 5,
) -> RouteOptResult:
    """
    Full route optimization pipeline:
    1. Try OR-Tools VRP with time windows (best quality)
    2. Apply 2-opt local search improvement
    3. Fallback: nearest-neighbor + 2-opt
    
    Returns optimized route with before/after comparison.
    """
    if not stops:
        return RouteOptResult(
            ordered_stops=[], total_distance_km=0, total_time_minutes=0,
            naive_distance_km=0, distance_saved_km=0, distance_saved_pct=0,
            optimization_method="empty", time_windows_respected=True,
            num_stops=0, polyline_points=[],
        )
    
    t0 = time.time()
    
    # Step 1: Compute naive (input order) distance as baseline
    naive_order = list(range(len(stops)))
    naive_dist = _compute_route_distance(stops, naive_order, depot_lat, depot_lng)
    
    # Step 2: Try OR-Tools VRP
    method = "nearest_neighbor"
    ortools_order = None
    
    if len(stops) >= 3:
        ortools_order = solve_vrp_ortools(
            stops, depot_lat, depot_lng, speed_kmh, max_solver_time
        )
    
    if ortools_order:
        method = "or_tools_vrp"
        best_order = ortools_order
    else:
        # Fallback: nearest neighbor
        best_order = nearest_neighbor_order(stops, depot_lat, depot_lng)
    
    # Step 3: Apply 2-opt improvement (always)
    if len(stops) >= 4:
        improved_order = two_opt_improve(stops, depot_lat, depot_lng, best_order)
        improved_dist = _compute_route_distance(stops, improved_order, depot_lat, depot_lng)
        current_dist = _compute_route_distance(stops, best_order, depot_lat, depot_lng)
        
        if improved_dist < current_dist:
            best_order = improved_order
            method = f"{method}+2opt"
    
    # Step 4: Compute final metrics
    optimized_dist = _compute_route_distance(stops, best_order, depot_lat, depot_lng)
    distance_saved = naive_dist - optimized_dist
    saved_pct = (distance_saved / naive_dist * 100) if naive_dist > 0 else 0
    
    # Compute total time (distance/speed + service times)
    total_time = (optimized_dist / speed_kmh) * 60 + sum(stops[i].service_time_min for i in best_order)
    
    # Check time windows respected
    tw_respected = _check_time_windows(stops, best_order, depot_lat, depot_lng, speed_kmh)
    
    # Build polyline
    polyline = [(depot_lat, depot_lng)] + [(stops[i].lat, stops[i].lng) for i in best_order] + [(depot_lat, depot_lng)]
    
    # Order stops
    ordered_stops = [stops[i] for i in best_order]
    
    return RouteOptResult(
        ordered_stops=ordered_stops,
        total_distance_km=round(optimized_dist, 2),
        total_time_minutes=round(total_time, 1),
        naive_distance_km=round(naive_dist, 2),
        distance_saved_km=round(max(0, distance_saved), 2),
        distance_saved_pct=round(max(0, saved_pct), 1),
        optimization_method=method,
        time_windows_respected=tw_respected,
        num_stops=len(stops),
        polyline_points=polyline,
    )


def compare_routes(
    routes: List[Dict[str, Any]],
    depot_lat: float,
    depot_lng: float,
    speed_kmh: float = 30.0,
) -> List[RouteComparison]:
    """
    Generate before/after route comparison for Challenge #4.
    
    Args:
        routes: List of route dicts with "stops" (list of stop dicts)
        depot_lat, depot_lng: Warehouse coordinates
        speed_kmh: Average speed
    
    Returns:
        List of RouteComparison objects showing improvement per route
    """
    comparisons = []
    
    for route in routes:
        route_id = route.get("id", f"route_{len(comparisons)}")
        raw_stops = route.get("stops", route.get("packages", []))
        
        # Convert to Stop objects
        stops = [
            Stop(
                id=s.get("id", f"stop_{i}"),
                lat=s.get("latitude", s.get("lat", 0)),
                lng=s.get("longitude", s.get("lng", 0)),
                address=s.get("address", ""),
                weight_kg=s.get("weight_kg", 0),
                service_time_min=s.get("service_time_min", 5),
                time_window_start=s.get("time_window_start"),
                time_window_end=s.get("time_window_end"),
                priority=s.get("priority", "normal"),
            )
            for i, s in enumerate(raw_stops)
        ]
        
        if not stops:
            continue
        
        # Before: naive order (as received)
        naive_dist = _compute_route_distance(stops, list(range(len(stops))), depot_lat, depot_lng)
        naive_time = (naive_dist / speed_kmh) * 60 + sum(s.service_time_min for s in stops)
        
        # After: optimized
        result = optimize_route(stops, depot_lat, depot_lng, speed_kmh)
        
        comparisons.append(RouteComparison(
            route_id=route_id,
            before={
                "distance_km": round(naive_dist, 2),
                "time_minutes": round(naive_time, 1),
                "stop_order": [s.id for s in stops],
                "co2_kg": round(naive_dist * 0.21, 2),
            },
            after={
                "distance_km": result.total_distance_km,
                "time_minutes": result.total_time_minutes,
                "stop_order": [s.id for s in result.ordered_stops],
                "co2_kg": round(result.total_distance_km * 0.21, 2),
                "method": result.optimization_method,
                "polyline": result.polyline_points,
            },
            improvement={
                "distance_saved_km": result.distance_saved_km,
                "distance_saved_pct": result.distance_saved_pct,
                "time_saved_minutes": round(naive_time - result.total_time_minutes, 1),
                "co2_saved_kg": round((naive_dist - result.total_distance_km) * 0.21, 2),
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
    DBSCAN-based clustering that discovers K automatically.
    Handles arbitrary cluster shapes (unlike KMeans).
    
    Fixes: Noise points (-1 label) are merged into nearest cluster.
    
    Args:
        packages: List of package dicts with latitude, longitude
        eps_km: Max distance between points in same cluster (km)
        min_samples: Min points to form a cluster
        max_cluster_size: Split clusters exceeding this
    
    Returns:
        List of clusters (each cluster is a list of package dicts)
    """
    import numpy as np
    from sklearn.cluster import DBSCAN
    from sklearn.metrics.pairwise import haversine_distances
    
    if not packages:
        return []
    
    if len(packages) <= min_samples:
        return [packages]
    
    # Convert to radians for haversine
    coords_rad = np.array([
        [math.radians(p["latitude"]), math.radians(p["longitude"])]
        for p in packages
    ])
    
    # eps in radians (eps_km / Earth radius)
    eps_rad = eps_km / 6371.0
    
    # Run DBSCAN
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine')
    labels = db.fit_predict(coords_rad)
    
    # Group by cluster
    clusters: Dict[int, List[int]] = {}
    noise_indices: List[int] = []
    
    for idx, label in enumerate(labels):
        if label == -1:
            noise_indices.append(idx)
        else:
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(idx)
    
    # FIX: Merge noise points into nearest cluster
    if noise_indices and clusters:
        # Compute cluster centroids
        cluster_centroids = {}
        for label, indices in clusters.items():
            lats = [packages[i]["latitude"] for i in indices]
            lngs = [packages[i]["longitude"] for i in indices]
            cluster_centroids[label] = (sum(lats)/len(lats), sum(lngs)/len(lngs))
        
        for noise_idx in noise_indices:
            pkg = packages[noise_idx]
            # Find nearest cluster
            nearest_label = min(
                cluster_centroids.keys(),
                key=lambda l: haversine_km(
                    pkg["latitude"], pkg["longitude"],
                    cluster_centroids[l][0], cluster_centroids[l][1]
                )
            )
            clusters[nearest_label].append(noise_idx)
    elif noise_indices and not clusters:
        # All points are noise — treat as one cluster
        clusters[0] = noise_indices
    
    # Split oversized clusters
    final_clusters = []
    for label, indices in clusters.items():
        if len(indices) <= max_cluster_size:
            final_clusters.append([packages[i] for i in indices])
        else:
            # Split using KMeans
            from sklearn.cluster import KMeans
            sub_coords = np.array([[packages[i]["latitude"], packages[i]["longitude"]] for i in indices])
            n_sub = max(2, len(indices) // max_cluster_size + 1)
            km = KMeans(n_clusters=n_sub, random_state=42, n_init=5)
            sub_labels = km.fit_predict(sub_coords)
            for sl in range(n_sub):
                sub_indices = [indices[j] for j in range(len(indices)) if sub_labels[j] == sl]
                if sub_indices:
                    final_clusters.append([packages[i] for i in sub_indices])
    
    return final_clusters


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def _compute_route_distance(stops: List[Stop], order: List[int], depot_lat: float, depot_lng: float) -> float:
    """Compute total route distance for a given stop order."""
    if not order:
        return 0.0
    total = haversine_km(depot_lat, depot_lng, stops[order[0]].lat, stops[order[0]].lng)
    for i in range(len(order) - 1):
        total += haversine_km(stops[order[i]].lat, stops[order[i]].lng, stops[order[i+1]].lat, stops[order[i+1]].lng)
    total += haversine_km(stops[order[-1]].lat, stops[order[-1]].lng, depot_lat, depot_lng)
    return total


def _check_time_windows(stops: List[Stop], order: List[int], depot_lat: float, depot_lng: float, speed_kmh: float) -> bool:
    """Check if all time windows are respected in the given order."""
    if not order:
        return True
    
    current_time = 0.0  # Minutes from departure
    current_lat, current_lng = depot_lat, depot_lng
    
    for idx in order:
        stop = stops[idx]
        # Travel time to this stop
        dist = haversine_km(current_lat, current_lng, stop.lat, stop.lng)
        travel_time = (dist / speed_kmh) * 60
        current_time += travel_time
        
        # Check time window
        if stop.time_window_end is not None and current_time > stop.time_window_end:
            return False
        
        # Wait if arrived too early
        if stop.time_window_start is not None and current_time < stop.time_window_start:
            current_time = stop.time_window_start
        
        # Service time
        current_time += stop.service_time_min
        current_lat, current_lng = stop.lat, stop.lng
    
    return True
