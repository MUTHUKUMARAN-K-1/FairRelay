"""
Agent 6: Scenario Simulation Agent.

Compares multiple consolidation strategies (Tight/Balanced/Aggressive)
and recommends the best one based on multi-objective KPI comparison.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from app.services.agents.clustering_agent import ClusteringAgent
from app.services.agents.optimization_agent import OptimizationAgent
from app.services.agents.packing_agent import PackingAgent
from app.services.clustering import haversine_distance

logger = logging.getLogger("fairrelay.agent.scenario")

DEFAULT_SCENARIOS = [
    {
        "name": "Tight Clustering",
        "description": "Conservative — dense urban, strict deadlines",
        "maxGroupRadiusKm": 15,
        "timeWindowToleranceMinutes": 60,
        "objectiveWeights": {"cost": 0.25, "emissions": 0.15, "utilization": 0.40, "service": 0.20},
    },
    {
        "name": "Balanced",
        "description": "Recommended — general purpose optimization",
        "maxGroupRadiusKm": 30,
        "timeWindowToleranceMinutes": 120,
        "objectiveWeights": {"cost": 0.30, "emissions": 0.20, "utilization": 0.30, "service": 0.20},
    },
    {
        "name": "Aggressive Merge",
        "description": "High consolidation — inter-city, flexible windows",
        "maxGroupRadiusKm": 60,
        "timeWindowToleranceMinutes": 240,
        "objectiveWeights": {"cost": 0.35, "emissions": 0.25, "utilization": 0.25, "service": 0.15},
    },
]


class ScenarioAgent:
    name = "ScenarioAgent"

    def run(
        self,
        shipments: List[Dict],
        trucks: List[Dict],
        compatibility_graph: Dict,
        scenarios: Optional[List[Dict]] = None,
        options: Optional[Dict] = None,
    ) -> Tuple[List[Dict], str, Dict[str, Any]]:
        t0 = datetime.utcnow()
        scenario_list = scenarios or DEFAULT_SCENARIOS

        results = []
        for sc in scenario_list:
            try:
                result = self._run_scenario(shipments, trucks, compatibility_graph, sc)
                results.append(result)
            except Exception as e:
                logger.error(f"[{self.name}] Scenario '{sc['name']}' failed: {e}")
                results.append({
                    "name": sc["name"], "score": 0, "failed": True,
                    "error": str(e)[:200], "metrics": {}, "groups": [],
                })

        # Select best
        valid = [r for r in results if not r.get("failed")]
        if valid:
            best = max(valid, key=lambda r: r.get("score", 0))
            best_name = best["name"]
            for r in results:
                r["recommended"] = r["name"] == best_name
        else:
            best_name = "none"

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        log = {
            "agent": self.name, "action": "scenario_simulation",
            "scenarios_run": len(results),
            "scenarios_succeeded": len(valid),
            "recommendation": best_name,
            "duration_ms": round(duration_ms, 2),
        }
        return results, best_name, log

    def _run_scenario(self, shipments, trucks, compat_graph, sc):
        opts = {
            "maxGroupRadiusKm": sc.get("maxGroupRadiusKm", 30),
            "timeWindowToleranceMinutes": sc.get("timeWindowToleranceMinutes", 120),
            "objectiveWeights": sc.get("objectiveWeights", {}),
            "solverTimeLimitSeconds": 5,
            "enable3DPacking": True,
        }

        clustering = ClusteringAgent()
        groups, quality, _ = clustering.run(shipments, compat_graph, trucks, opts)

        optimizer = OptimizationAgent()
        bins, opt_meta, _ = optimizer.run(groups, trucks, opts)

        packer = PackingAgent()
        plans, packing, _ = packer.run(bins, opts)

        # Compute metrics
        metrics = self._compute_metrics(bins, shipments, trucks, plans, packing)
        score = self._composite_score(metrics, sc.get("objectiveWeights", {}))

        formatted_groups = self._format_groups(bins, plans)

        return {
            "name": sc["name"],
            "description": sc.get("description", ""),
            "score": round(score, 1),
            "metrics": metrics,
            "groups": formatted_groups,
            "groupCount": len(formatted_groups),
            "method": opt_meta.get("method", "unknown"),
            "failed": False,
            "recommended": False,
        }

    def _compute_metrics(self, bins, shipments, trucks, plans, packing):
        total_weight = sum(s.get("weight", 0) for s in shipments)
        avg_cap = np.mean([t["maxWeight"] for t in trucks]) if trucks else 1
        naive_util = (total_weight / (len(shipments) * avg_cap)) * 100 if shipments else 0
        cons_util = (total_weight / (len(bins) * avg_cap)) * 100 if bins else 0

        naive_dist = sum(
            haversine_distance(s["pickupLat"], s["pickupLng"], s["dropLat"], s["dropLng"])
            for s in shipments
        )
        cons_dist = sum(b.get("routeDistanceKm", 0) for b in bins)
        dist_saved = max(0, naive_dist - cons_dist)
        trips_reduced = max(0, len(shipments) - len(bins))
        trip_pct = (trips_reduced / max(len(shipments), 1)) * 100

        total_emission = sum(b.get("emissionKg", 0) for b in bins)
        total_cost = sum(b.get("costINR", 0) for b in bins)
        carbon_saved = dist_saved * 0.21

        return {
            "totalShipments": len(shipments), "totalGroups": len(bins),
            "utilizationBefore": round(min(naive_util, 100), 1),
            "utilizationAfter": round(min(cons_util, 100), 1),
            "utilizationImprovement": round(min(cons_util - naive_util, 100), 1),
            "tripsReduced": trips_reduced,
            "tripReductionPercent": round(trip_pct, 1),
            "distanceSavedKm": round(dist_saved, 1),
            "carbonSavedKg": round(carbon_saved, 1),
            "totalEmissionKg": round(total_emission, 1),
            "totalCostINR": round(total_cost, 1),
            "costSavedPercent": round(trip_pct, 1),
            "fuelSavedINR": round(dist_saved * 22.5),
            "carbonCreditUSD": round((carbon_saved / 1000) * 25, 2),
            "avgPackingScore": packing.get("avgPackingScore", 80),
            "feasibilityRate": packing.get("feasibilityRate", 100),
        }

    def _composite_score(self, metrics, weights):
        w = {**{"cost": 0.3, "emissions": 0.2, "utilization": 0.3, "service": 0.2}, **weights}
        util = min(metrics.get("utilizationAfter", 0), 100) / 100
        trip = metrics.get("tripReductionPercent", 0) / 100
        feas = metrics.get("feasibilityRate", 100) / 100
        carbon = min(metrics.get("carbonSavedKg", 0) / 200, 1)
        return (w["utilization"] * util + w["cost"] * trip + w["emissions"] * carbon + w["service"] * feas) * 100

    def _format_groups(self, bins, plans):
        formatted = []
        for i, b in enumerate(bins):
            plan = plans[i] if i < len(plans) else {}
            formatted.append({
                "groupId": i + 1, "truckId": b["truck"]["id"],
                "truckName": b["truck"].get("name", f"Truck-{i+1}"),
                "shipmentCount": len(b["shipments"]),
                "totalWeight": b["usedW"], "totalVolume": b["usedV"],
                "utilizationWeight": b.get("utilizationWeight", 0),
                "utilizationVolume": b.get("utilizationVolume", 0),
                "routeDistanceKm": b.get("routeDistanceKm", 0),
                "emissionKg": b.get("emissionKg", 0),
                "costINR": b.get("costINR", 0),
                "packingScore": plan.get("packingScore", 80),
                "sequenceScore": plan.get("sequenceScore", 80),
            })
        return formatted
