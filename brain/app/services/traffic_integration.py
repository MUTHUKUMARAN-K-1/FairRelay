"""
Real-Time Traffic Integration via OLA Maps API.
Provides traffic-aware route factors for Indian logistics.

API: OLA Maps (by Ola Krutrim) — https://maps.olakrutrim.com/
FREE for Indian developers — real-time traffic across all Indian cities.

Fallback: Indian city empirical traffic patterns by hour (no API key needed).
"""

import os
import math
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
from functools import lru_cache

import httpx

logger = logging.getLogger("fairrelay.traffic")

OLA_MAPS_BASE = "https://api.olamaps.io"
OLA_API_KEY = os.getenv("OLA_MAPS_API_KEY", "")

# ═══════════════════════════════════════════════════════════════
# INDIAN CITY TRAFFIC PATTERNS (empirical, by hour)
# Used as fallback when OLA Maps API is unavailable
# ═══════════════════════════════════════════════════════════════

# Congestion multiplier by hour (0-23) for Indian metros
INDIAN_METRO_TRAFFIC = {
    0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.05,
    6: 1.15, 7: 1.35, 8: 1.55, 9: 1.65, 10: 1.45, 11: 1.30,
    12: 1.25, 13: 1.20, 14: 1.15, 15: 1.20, 16: 1.35,
    17: 1.55, 18: 1.70, 19: 1.60, 20: 1.40, 21: 1.25, 22: 1.10, 23: 1.05,
}

# City-specific multipliers (relative to metro baseline)
CITY_FACTORS = {
    "mumbai": 1.25,      # Worst traffic in India
    "bangalore": 1.20,   # Tech corridor congestion
    "delhi": 1.15,       # NCR sprawl
    "chennai": 1.10,     # Moderate
    "hyderabad": 1.08,   # Improving infra
    "pune": 1.05,        # Medium city
    "kolkata": 1.12,     # Dense but compact
    "ahmedabad": 0.95,   # Good roads, lower density
    "jaipur": 0.90,      # Less congestion
    "default": 1.0,
}

# Haversine to road distance multiplier (Indian roads are not straight)
INDIA_ROAD_FACTOR = 1.35


# ═══════════════════════════════════════════════════════════════
# CORE FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def get_fallback_traffic_factor(
    lat1: float = 0, lng1: float = 0,
    lat2: float = 0, lng2: float = 0,
    city: str = "default",
    hour: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Fallback traffic factor using Indian city patterns.
    No API call — pure empirical data.
    """
    if hour is None:
        hour = datetime.now().hour
    
    base_factor = INDIAN_METRO_TRAFFIC.get(hour, 1.2)
    city_mult = CITY_FACTORS.get(city.lower(), CITY_FACTORS["default"])
    
    traffic_factor = base_factor * city_mult
    
    # Estimate road distance from Haversine
    haversine_dist = haversine_km(lat1, lng1, lat2, lng2) if (lat1 and lng1 and lat2 and lng2) else 0
    road_distance = haversine_dist * INDIA_ROAD_FACTOR
    
    # Effective speed (avg Indian logistics: 25-45 km/h depending on traffic)
    base_speed = 40.0  # km/h on clear roads
    effective_speed = base_speed / traffic_factor
    
    return {
        "traffic_factor": round(traffic_factor, 3),
        "road_distance_km": round(road_distance, 2),
        "haversine_distance_km": round(haversine_dist, 2),
        "effective_speed_kmh": round(effective_speed, 1),
        "estimated_time_minutes": round((road_distance / effective_speed) * 60, 1) if effective_speed > 0 else 0,
        "congestion_level": "heavy" if traffic_factor > 1.5 else "moderate" if traffic_factor > 1.2 else "light",
        "source": "fallback_empirical",
        "hour": hour,
        "city": city,
    }


async def get_traffic_factor(
    lat1: float, lng1: float,
    lat2: float, lng2: float,
    city: str = "default",
) -> Dict[str, Any]:
    """
    Get real-time traffic factor between two points.
    
    Tries OLA Maps API first, falls back to empirical patterns.
    
    Returns dict with:
    - traffic_factor: float (1.0 = no traffic, 2.0 = severe)
    - road_distance_km: float
    - effective_speed_kmh: float
    - estimated_time_minutes: float
    - congestion_level: "light" | "moderate" | "heavy"
    - source: "ola_maps" | "fallback_empirical"
    """
    # Try OLA Maps API if key is configured
    if OLA_API_KEY:
        try:
            result = await _call_ola_directions(lat1, lng1, lat2, lng2)
            if result:
                return result
        except Exception as e:
            logger.warning(f"OLA Maps API failed: {e}, using fallback")
    
    # Fallback to empirical patterns
    return get_fallback_traffic_factor(lat1, lng1, lat2, lng2, city)


async def get_traffic_matrix(
    origins: List[Tuple[float, float]],
    destinations: List[Tuple[float, float]],
    city: str = "default",
) -> List[List[Dict[str, Any]]]:
    """
    Get traffic factors for a matrix of origin-destination pairs.
    Uses OLA Maps Distance Matrix API if available, else computes individually.
    """
    if OLA_API_KEY and len(origins) <= 25 and len(destinations) <= 25:
        try:
            result = await _call_ola_distance_matrix(origins, destinations)
            if result:
                return result
        except Exception as e:
            logger.warning(f"OLA Distance Matrix failed: {e}")
    
    # Fallback: compute individually
    matrix = []
    for o_lat, o_lng in origins:
        row = []
        for d_lat, d_lng in destinations:
            factor = get_fallback_traffic_factor(o_lat, o_lng, d_lat, d_lng, city)
            row.append(factor)
        matrix.append(row)
    return matrix


# ═══════════════════════════════════════════════════════════════
# OLA MAPS API CALLS
# ═══════════════════════════════════════════════════════════════

async def _call_ola_directions(
    lat1: float, lng1: float,
    lat2: float, lng2: float,
) -> Optional[Dict[str, Any]]:
    """
    Call OLA Maps Directions API with traffic metadata.
    Returns traffic-aware route info or None on failure.
    """
    url = f"{OLA_MAPS_BASE}/routing/v1/directions"
    params = {
        "origin": f"{lat1},{lng1}",
        "destination": f"{lat2},{lng2}",
        "mode": "driving",
        "alternatives": "false",
        "traffic_metadata": "true",
        "api_key": OLA_API_KEY,
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        
        if response.status_code != 200:
            logger.warning(f"OLA Directions API returned {response.status_code}")
            return None
        
        data = response.json()
        
        if data.get("status") != "SUCCESS" or not data.get("routes"):
            return None
        
        route = data["routes"][0]
        legs = route.get("legs", [{}])
        leg = legs[0] if legs else {}
        
        # Extract distance and duration
        distance_m = leg.get("distance", {}).get("value", 0)
        duration_s = leg.get("duration", {}).get("value", 0)
        duration_traffic_s = leg.get("duration_in_traffic", {}).get("value", duration_s)
        
        road_distance_km = distance_m / 1000
        haversine_dist = haversine_km(lat1, lng1, lat2, lng2)
        
        # Traffic factor = actual time / free-flow time
        traffic_factor = (duration_traffic_s / duration_s) if duration_s > 0 else 1.2
        traffic_factor = max(1.0, min(3.0, traffic_factor))  # Clamp to reasonable range
        
        effective_speed = (road_distance_km / (duration_traffic_s / 3600)) if duration_traffic_s > 0 else 30.0
        
        return {
            "traffic_factor": round(traffic_factor, 3),
            "road_distance_km": round(road_distance_km, 2),
            "haversine_distance_km": round(haversine_dist, 2),
            "effective_speed_kmh": round(effective_speed, 1),
            "estimated_time_minutes": round(duration_traffic_s / 60, 1),
            "free_flow_time_minutes": round(duration_s / 60, 1),
            "congestion_level": "heavy" if traffic_factor > 1.5 else "moderate" if traffic_factor > 1.2 else "light",
            "source": "ola_maps",
            "polyline": route.get("overview_polyline", {}).get("points", ""),
        }


async def _call_ola_distance_matrix(
    origins: List[Tuple[float, float]],
    destinations: List[Tuple[float, float]],
) -> Optional[List[List[Dict[str, Any]]]]:
    """
    Call OLA Maps Distance Matrix API for batch traffic computations.
    Max 25 origins × 25 destinations per call.
    """
    url = f"{OLA_MAPS_BASE}/routing/v1/distanceMatrix"
    
    origins_str = "|".join(f"{lat},{lng}" for lat, lng in origins)
    destinations_str = "|".join(f"{lat},{lng}" for lat, lng in destinations)
    
    params = {
        "origins": origins_str,
        "destinations": destinations_str,
        "mode": "driving",
        "api_key": OLA_API_KEY,
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params)
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        if data.get("status") != "OK":
            return None
        
        rows = data.get("rows", [])
        matrix = []
        
        for i, row in enumerate(rows):
            elements = row.get("elements", [])
            matrix_row = []
            for j, elem in enumerate(elements):
                if elem.get("status") == "OK":
                    distance_m = elem.get("distance", {}).get("value", 0)
                    duration_s = elem.get("duration", {}).get("value", 1)
                    duration_traffic_s = elem.get("duration_in_traffic", {}).get("value", duration_s)
                    
                    road_km = distance_m / 1000
                    traffic_factor = max(1.0, min(3.0, duration_traffic_s / duration_s)) if duration_s > 0 else 1.2
                    effective_speed = (road_km / (duration_traffic_s / 3600)) if duration_traffic_s > 0 else 30.0
                    
                    matrix_row.append({
                        "traffic_factor": round(traffic_factor, 3),
                        "road_distance_km": round(road_km, 2),
                        "effective_speed_kmh": round(effective_speed, 1),
                        "estimated_time_minutes": round(duration_traffic_s / 60, 1),
                        "congestion_level": "heavy" if traffic_factor > 1.5 else "moderate" if traffic_factor > 1.2 else "light",
                        "source": "ola_maps_matrix",
                    })
                else:
                    # Element failed — use fallback
                    o_lat, o_lng = origins[i]
                    d_lat, d_lng = destinations[j]
                    matrix_row.append(get_fallback_traffic_factor(o_lat, o_lng, d_lat, d_lng))
            
            matrix.append(matrix_row)
        
        return matrix


# ═══════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def detect_city_from_coords(lat: float, lng: float) -> str:
    """Detect Indian city from coordinates (approximate bounding boxes)."""
    city_bounds = {
        "mumbai": (18.85, 72.75, 19.30, 73.05),
        "delhi": (28.40, 76.80, 28.90, 77.35),
        "bangalore": (12.75, 77.40, 13.20, 77.80),
        "chennai": (12.80, 80.05, 13.30, 80.40),
        "hyderabad": (17.20, 78.20, 17.60, 78.70),
        "pune": (18.40, 73.70, 18.70, 74.00),
        "kolkata": (22.40, 88.20, 22.70, 88.50),
        "ahmedabad": (22.90, 72.45, 23.15, 72.75),
        "jaipur": (26.75, 75.65, 27.05, 75.95),
    }
    
    for city, (lat_min, lng_min, lat_max, lng_max) in city_bounds.items():
        if lat_min <= lat <= lat_max and lng_min <= lng <= lng_max:
            return city
    
    return "default"


def get_effective_speed(
    lat1: float, lng1: float,
    lat2: float, lng2: float,
    hour: Optional[int] = None,
) -> float:
    """
    Quick synchronous function to get traffic-aware effective speed.
    Uses fallback patterns (no async, no API call).
    
    Returns: effective speed in km/h
    """
    city = detect_city_from_coords(lat1, lng1)
    result = get_fallback_traffic_factor(lat1, lng1, lat2, lng2, city, hour)
    return result["effective_speed_kmh"]
