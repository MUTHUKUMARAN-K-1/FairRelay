"""
Synthetic Data Generator for Load Consolidation Testing.

Generates realistic shipment and vehicle test data for Indian logistics corridors.
"""

import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

CORRIDORS = [
    {"name": "Mumbai-Pune", "pickup": (19.076, 72.877), "drop": (18.52, 73.856), "spread": 0.05},
    {"name": "Delhi-Jaipur", "pickup": (28.704, 77.102), "drop": (26.912, 75.787), "spread": 0.04},
    {"name": "Bangalore-Chennai", "pickup": (12.971, 77.594), "drop": (13.083, 80.27), "spread": 0.03},
    {"name": "Hyderabad-Vijayawada", "pickup": (17.385, 78.486), "drop": (16.506, 80.648), "spread": 0.04},
    {"name": "Kolkata-Bhubaneswar", "pickup": (22.572, 88.363), "drop": (20.296, 85.824), "spread": 0.03},
    {"name": "Ahmedabad-Surat", "pickup": (23.022, 72.571), "drop": (21.170, 72.831), "spread": 0.04},
]

CARGO_TYPES = ["GENERAL", "FRAGILE", "PERISHABLE", "ELECTRONICS", "TEXTILES", "AUTOMOTIVE", "PHARMACEUTICALS"]
PRIORITIES = ["LOW", "MEDIUM", "MEDIUM", "MEDIUM", "HIGH", "CRITICAL"]

TRUCK_TEMPLATES = [
    {"name": "Tata Ace Gold", "maxWeight": 750, "maxVolume": 3.0, "type": "MINI_TRUCK",
     "length": 2.1, "width": 1.5, "height": 1.4, "costPerKm": 10, "emission": 0.15},
    {"name": "Mahindra Bolero Pickup", "maxWeight": 1500, "maxVolume": 6.0, "type": "LCV",
     "length": 2.8, "width": 1.7, "height": 1.5, "costPerKm": 12, "emission": 0.18},
    {"name": "Tata 407", "maxWeight": 2500, "maxVolume": 10.0, "type": "LCV",
     "length": 4.2, "width": 1.9, "height": 1.8, "costPerKm": 15, "emission": 0.21},
    {"name": "Ashok Leyland Dost", "maxWeight": 2000, "maxVolume": 8.0, "type": "LCV",
     "length": 3.5, "width": 1.8, "height": 1.6, "costPerKm": 14, "emission": 0.20},
    {"name": "Eicher Pro 2049", "maxWeight": 5000, "maxVolume": 20.0, "type": "MCV",
     "length": 5.5, "width": 2.2, "height": 2.0, "costPerKm": 20, "emission": 0.28},
    {"name": "BharatBenz 1015R", "maxWeight": 3000, "maxVolume": 12.0, "type": "MCV",
     "length": 4.8, "width": 2.0, "height": 1.9, "costPerKm": 18, "emission": 0.25},
    {"name": "Tata LPT 1613", "maxWeight": 8000, "maxVolume": 32.0, "type": "HCV",
     "length": 7.0, "width": 2.4, "height": 2.2, "costPerKm": 25, "emission": 0.35},
    {"name": "Ashok Leyland 2518", "maxWeight": 12000, "maxVolume": 48.0, "type": "HCV",
     "length": 9.0, "width": 2.5, "height": 2.4, "costPerKm": 30, "emission": 0.42},
]

LOCATIONS = {
    "Mumbai": ["Mumbai Port", "Mumbai JNPT", "Mumbai Central", "Mumbai Dock", "Andheri Hub"],
    "Pune": ["Pune Warehouse", "Pune Industrial", "Pune Hub", "Pune East", "Pimpri Depot"],
    "Delhi": ["Delhi NCR Hub", "Delhi Warehouse", "Delhi South", "Gurgaon Depot", "Noida Hub"],
    "Jaipur": ["Jaipur Depot", "Jaipur Industrial", "Jaipur West", "Sitapura RIICO"],
    "Bangalore": ["Bangalore Warehouse", "Bangalore Tech Park", "Bangalore South", "Whitefield Hub"],
    "Chennai": ["Chennai Central", "Chennai Port", "Chennai North", "Ambattur Industrial"],
    "Hyderabad": ["Hyderabad Hub", "Shamshabad Cargo", "Medchal Depot"],
    "Vijayawada": ["Vijayawada Depot", "Auto Nagar", "Gannavaram Cargo"],
}


def generate_shipments(
    count: int = 100,
    scenario: str = "stable",
    base_date: str = None,
) -> List[Dict]:
    """Generate synthetic shipment data."""
    if base_date is None:
        base_date = datetime.utcnow().strftime("%Y-%m-%d")

    base_dt = datetime.fromisoformat(base_date)
    shipments = []

    for i in range(count):
        corridor = random.choice(CORRIDORS)
        spread = corridor["spread"]
        if scenario == "volatile":
            spread *= 2

        plat = corridor["pickup"][0] + random.uniform(-spread, spread)
        plng = corridor["pickup"][1] + random.uniform(-spread, spread)
        dlat = corridor["drop"][0] + random.uniform(-spread, spread)
        dlng = corridor["drop"][1] + random.uniform(-spread, spread)

        city_p = corridor["name"].split("-")[0]
        city_d = corridor["name"].split("-")[1]
        ploc = random.choice(LOCATIONS.get(city_p, [f"{city_p} Hub"]))
        dloc = random.choice(LOCATIONS.get(city_d, [f"{city_d} Hub"]))

        # Weight/volume by scenario
        if scenario == "fragile":
            weight = random.uniform(5, 200)
            volume = random.uniform(0.05, 1.0)
            cargo = random.choice(["FRAGILE", "ELECTRONICS", "PHARMACEUTICALS"])
            fragility = random.randint(2, 5)
        elif scenario == "mixed":
            weight = random.uniform(50, 3000)
            volume = random.uniform(0.1, 8.0)
            cargo = random.choice(CARGO_TYPES)
            fragility = random.randint(0, 3)
        else:
            weight = random.uniform(100, 1500)
            volume = random.uniform(0.5, 5.0)
            cargo = random.choice(["GENERAL", "GENERAL", "TEXTILES", "ELECTRONICS", "AUTOMOTIVE"])
            fragility = random.randint(0, 2)

        hour_start = random.randint(5, 14)
        tw_start = base_dt.replace(hour=hour_start, minute=0, second=0)
        tw_end = tw_start + timedelta(hours=random.randint(4, 12))

        # Item dimensions
        item_count = random.randint(1, min(3, max(1, int(volume / 0.5))))
        items = []
        remaining_w = weight
        remaining_v = volume
        for k in range(item_count):
            iw = remaining_w / (item_count - k) * random.uniform(0.7, 1.3)
            iv = remaining_v / (item_count - k) * random.uniform(0.7, 1.3)
            side = max(iv ** (1/3), 0.1)
            items.append({
                "id": f"SH-{i+1:04d}-item-{k+1}",
                "length": round(side * random.uniform(1.0, 1.8), 2),
                "width": round(side * random.uniform(0.7, 1.2), 2),
                "height": round(side * random.uniform(0.5, 1.0), 2),
                "weight": round(min(iw, remaining_w), 1),
                "fragility": fragility,
                "orientationConstraints": ["upright_only"] if fragility >= 4 else [],
                "stackable": fragility < 3,
            })
            remaining_w -= iw
            remaining_v -= iv

        shipments.append({
            "id": f"SH-{i+1:04d}",
            "pickupLat": round(plat, 6), "pickupLng": round(plng, 6),
            "dropLat": round(dlat, 6), "dropLng": round(dlng, 6),
            "pickupLocation": ploc, "dropLocation": dloc,
            "weight": round(weight, 1), "volume": round(volume, 2),
            "timeWindowStart": tw_start.isoformat() + "Z",
            "timeWindowEnd": tw_end.isoformat() + "Z",
            "priority": random.choice(PRIORITIES),
            "cargoType": cargo, "fragility": fragility,
            "handlingConstraints": [],
            "serviceTimeMinutes": random.choice([10, 15, 20, 30]),
            "allowedVehicleTypes": [],
            "itemDimensions": items,
        })
    return shipments


def generate_trucks(count: int = 10) -> List[Dict]:
    """Generate synthetic truck fleet."""
    trucks = []
    for i in range(count):
        template = random.choice(TRUCK_TEMPLATES)
        trucks.append({
            "id": f"TRK-{i+1:03d}",
            "name": f"{template['name']} #{i+1}",
            "maxWeight": template["maxWeight"],
            "maxVolume": template["maxVolume"],
            "vehicleType": template["type"],
            "internalLength": template["length"],
            "internalWidth": template["width"],
            "internalHeight": template["height"],
            "costPerKm": template["costPerKm"],
            "co2PerKm": template["emission"],
            "emissionFactor": template["emission"],
            "compartments": 1,
        })
    return trucks


def generate_test_payload(
    shipment_count: int = 100,
    truck_count: int = 10,
    scenario: str = "stable",
) -> Dict:
    """Generate complete test payload for the consolidation API."""
    return {
        "shipments": generate_shipments(shipment_count, scenario),
        "trucks": generate_trucks(truck_count),
        "options": {
            "maxGroupRadiusKm": 30,
            "timeWindowToleranceMinutes": 120,
            "objectiveWeights": {"cost": 0.3, "emissions": 0.2, "utilization": 0.3, "service": 0.2},
            "solverTimeLimitSeconds": 10,
            "enableGNN": True,
            "enable3DPacking": True,
            "enableExplainability": True,
        },
    }
