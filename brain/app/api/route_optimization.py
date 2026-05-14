"""
Route Optimization API — Exposes VRP/TSP and before/after comparison.
Addresses Challenge #4: "Comparison between current vs optimized routes"
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter(prefix="/routes", tags=["Route Optimization"])


class StopInput(BaseModel):
    id: str
    latitude: float
    longitude: float
    address: str = ""
    weight_kg: float = 0.0
    service_time_min: float = 5.0
    time_window_start: Optional[int] = None
    time_window_end: Optional[int] = None
    priority: str = "normal"


class RouteInput(BaseModel):
    id: str = "route_1"
    stops: List[StopInput]


class OptimizeRequest(BaseModel):
    routes: List[RouteInput]
    warehouse_lat: float = 19.076
    warehouse_lng: float = 72.877
    speed_kmh: float = 30.0
    use_time_windows: bool = True


class ClusterRequest(BaseModel):
    packages: List[Dict[str, Any]]
    method: str = "dbscan"  # "dbscan" or "kmeans"
    num_drivers: Optional[int] = None
    eps_km: float = 5.0
    min_samples: int = 2


@router.post("/optimize", summary="Optimize stop order within routes (TSP/VRP)")
async def optimize_routes(request: OptimizeRequest):
    """
    Optimize multi-stop delivery routes using OR-Tools VRP + 2-opt.
    
    Returns before/after comparison with distance savings, time savings, and CO₂ reduction.
    This directly addresses Challenge #4: "Comparison between current vs optimized routes."
    """
    from app.services.route_optimization_engine import compare_routes
    
    routes_data = []
    for route in request.routes:
        routes_data.append({
            "id": route.id,
            "stops": [s.model_dump() for s in route.stops],
        })
    
    comparisons = compare_routes(
        routes=routes_data,
        depot_lat=request.warehouse_lat,
        depot_lng=request.warehouse_lng,
        speed_kmh=request.speed_kmh,
    )
    
    # Aggregate metrics
    total_before_km = sum(c.before["distance_km"] for c in comparisons)
    total_after_km = sum(c.after["distance_km"] for c in comparisons)
    total_saved_km = total_before_km - total_after_km
    total_saved_pct = (total_saved_km / total_before_km * 100) if total_before_km > 0 else 0
    
    total_before_min = sum(c.before["time_minutes"] for c in comparisons)
    total_after_min = sum(c.after["time_minutes"] for c in comparisons)
    
    return {
        "success": True,
        "routes": [
            {
                "route_id": c.route_id,
                "before": c.before,
                "after": c.after,
                "improvement": c.improvement,
            }
            for c in comparisons
        ],
        "summary": {
            "total_routes": len(comparisons),
            "total_distance_before_km": round(total_before_km, 2),
            "total_distance_after_km": round(total_after_km, 2),
            "total_distance_saved_km": round(total_saved_km, 2),
            "total_distance_saved_pct": round(total_saved_pct, 1),
            "total_time_before_min": round(total_before_min, 1),
            "total_time_after_min": round(total_after_min, 1),
            "total_time_saved_min": round(total_before_min - total_after_min, 1),
            "total_co2_saved_kg": round(total_saved_km * 0.21, 2),
            "optimization_methods": list(set(c.after["method"] for c in comparisons)),
        },
    }


@router.post("/cluster", summary="Cluster packages using DBSCAN or KMeans")
async def cluster_packages_endpoint(request: ClusterRequest):
    """
    Cluster packages using either DBSCAN (auto-discovers K) or KMeans.
    
    DBSCAN advantages:
    - Discovers cluster count automatically
    - Handles arbitrary cluster shapes
    - Noise points merged into nearest cluster (not discarded)
    """
    if not request.packages:
        raise HTTPException(400, "packages list required")
    
    if request.method == "dbscan":
        from app.services.route_optimization_engine import cluster_packages_dbscan
        
        clusters = cluster_packages_dbscan(
            packages=request.packages,
            eps_km=request.eps_km,
            min_samples=request.min_samples,
        )
        
        return {
            "success": True,
            "method": "dbscan",
            "num_clusters": len(clusters),
            "clusters": [
                {
                    "cluster_id": i,
                    "num_packages": len(c),
                    "total_weight_kg": sum(p.get("weight_kg", 0) for p in c),
                    "packages": c,
                }
                for i, c in enumerate(clusters)
            ],
            "params": {"eps_km": request.eps_km, "min_samples": request.min_samples},
        }
    else:
        # KMeans
        from app.services.clustering import cluster_packages
        
        num_drivers = request.num_drivers or max(2, len(request.packages) // 10)
        results = cluster_packages(request.packages, num_drivers)
        
        return {
            "success": True,
            "method": "kmeans",
            "num_clusters": len(results),
            "clusters": [
                {
                    "cluster_id": r.cluster_id,
                    "num_packages": r.num_packages,
                    "total_weight_kg": r.total_weight_kg,
                    "num_stops": r.num_stops,
                    "centroid": r.centroid,
                    "packages": r.packages,
                }
                for r in results
            ],
            "params": {"num_drivers": num_drivers},
        }


@router.post("/dynamic-insert", summary="Insert new stop into existing route (cheapest insertion)")
async def dynamic_insert(
    route_stops: List[StopInput],
    new_stop: StopInput,
    warehouse_lat: float = 19.076,
    warehouse_lng: float = 72.877,
):
    """
    Dynamically insert a new delivery stop into an existing optimized route.
    Uses cheapest-insertion heuristic to find optimal position.
    """
    from app.services.route_optimization_engine import Stop, cheapest_insertion, optimize_route
    
    stops = [
        Stop(id=s.id, lat=s.latitude, lng=s.longitude, address=s.address,
             weight_kg=s.weight_kg, service_time_min=s.service_time_min)
        for s in route_stops
    ]
    
    new = Stop(id=new_stop.id, lat=new_stop.latitude, lng=new_stop.longitude,
               address=new_stop.address, weight_kg=new_stop.weight_kg,
               service_time_min=new_stop.service_time_min)
    
    # Add new stop to list
    all_stops = stops + [new]
    new_idx = len(stops)
    
    # Current order
    current_order = list(range(len(stops)))
    
    # Insert at cheapest position
    new_order = cheapest_insertion(current_order, new_idx, all_stops, warehouse_lat, warehouse_lng)
    
    # Compute distances
    from app.services.route_optimization_engine import _compute_route_distance
    before_dist = _compute_route_distance(all_stops, current_order, warehouse_lat, warehouse_lng)
    after_dist = _compute_route_distance(all_stops, new_order, warehouse_lat, warehouse_lng)
    
    return {
        "success": True,
        "new_order": [all_stops[i].id for i in new_order],
        "insertion_position": new_order.index(new_idx),
        "distance_before_km": round(before_dist, 2),
        "distance_after_km": round(after_dist, 2),
        "additional_distance_km": round(after_dist - before_dist, 2),
    }
