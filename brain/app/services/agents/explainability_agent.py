"""
Agent 7: Explainability & Analytics Agent.

Generates human-readable explanations for every consolidation decision:
  - Why shipments were grouped together
  - Why some shipments were rejected
  - Why a specific vehicle was chosen
  - Trade-off analysis between cost, emissions, and service
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.services.clustering import haversine_distance

logger = logging.getLogger("fairrelay.agent.explainability")


class ExplainabilityAgent:
    name = "ExplainabilityAgent"

    def run(
        self,
        groups: List[Dict],
        bins: List[Dict],
        metrics: Dict[str, Any],
        validation_report: Dict[str, Any],
        compatibility_graph: Dict[str, Any],
        packing_results: Dict[str, Any],
        scenario_results: Optional[List[Dict]] = None,
        options: Optional[Dict] = None,
    ) -> Tuple[List[Dict], List[Dict], Dict[str, Any]]:
        """Returns: (explanations, insights, agent_log)"""
        t0 = datetime.utcnow()
        explanations = []
        insights = []

        # Group explanations
        for g in groups:
            exp = self._explain_group(g, compatibility_graph)
            explanations.append(exp)

        # Rejected shipments
        rejected = validation_report.get("rejectedIds", [])
        for rid in rejected:
            explanations.append({
                "entityId": rid, "entityType": "shipment",
                "decisionType": "rejected",
                "message": f"Shipment {rid} was rejected during validation due to invalid or missing data.",
                "reasonCodes": ["VALIDATION_FAILURE"],
                "confidence": 100,
                "details": {},
            })

        # Packing warnings
        for warning in packing_results.get("warnings", []):
            insights.append({
                "type": "warning", "text": warning,
                "impact": "medium", "category": "packing",
            })

        # Optimization insights
        insights.extend(self._generate_optimization_insights(metrics))

        # Trade-off analysis
        insights.extend(self._trade_off_analysis(metrics))

        # Scenario insights
        if scenario_results:
            insights.extend(self._scenario_insights(scenario_results))

        # Corridor detection
        insights.extend(self._corridor_detection(groups))

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        log = {
            "agent": self.name, "action": "explainability_generation",
            "explanations_generated": len(explanations),
            "insights_generated": len(insights),
            "duration_ms": round(duration_ms, 2),
        }
        return explanations, insights, log

    def _explain_group(self, group: Dict, compat_graph: Dict) -> Dict:
        sid_list = [s.get("id", "?") for s in group.get("shipments", [])]
        truck = group.get("truckName", "Unknown")
        util_w = group.get("utilizationWeight", 0)
        conf = group.get("confidence", 0)
        compat = group.get("compatibilityScore", 0)

        reasons = []
        codes = []

        if util_w > 70:
            reasons.append(f"High weight utilization ({util_w}%) — excellent capacity fit")
            codes.append("HIGH_UTILIZATION")
        elif util_w > 40:
            reasons.append(f"Moderate weight utilization ({util_w}%)")
            codes.append("MODERATE_UTILIZATION")
        else:
            reasons.append(f"Low weight utilization ({util_w}%) — consider merging with another group")
            codes.append("LOW_UTILIZATION")

        geo = group.get("geoScore", 0)
        if geo > 70:
            reasons.append("Shipments are geographically close — efficient routing")
            codes.append("GEO_PROXIMITY")

        time_s = group.get("timeScore", 0)
        if time_s > 70:
            reasons.append("Time windows overlap well — no scheduling conflicts")
            codes.append("TIME_COMPATIBLE")

        cargo_types = group.get("cargoTypes", [])
        if len(set(cargo_types)) <= 1:
            reasons.append("All shipments have the same cargo type — no compatibility issues")
            codes.append("CARGO_HOMOGENEOUS")

        message = (
            f"Group #{group.get('groupId', '?')} assigned to {truck} "
            f"with {len(sid_list)} shipments ({', '.join(sid_list[:5])}). "
            + " ".join(reasons[:3])
        )

        return {
            "entityId": str(group.get("groupId", "")),
            "entityType": "group",
            "decisionType": "grouped",
            "message": message,
            "reasonCodes": codes,
            "confidence": conf,
            "details": {"shipments": sid_list, "truck": truck, "utilization": util_w},
        }

    def _generate_optimization_insights(self, metrics: Dict) -> List[Dict]:
        insights = []
        util_after = metrics.get("utilizationAfter", 0)
        util_before = metrics.get("utilizationBefore", 0)
        trips = metrics.get("tripsReduced", 0)
        carbon = metrics.get("carbonSavedKg", 0)

        if util_after > util_before:
            insights.append({
                "type": "pattern",
                "text": f"Utilization improved from {util_before}% to {util_after}% (+{util_after-util_before:.1f}pp). "
                        f"Fleet now operates at {util_after:.0f}% efficiency.",
                "impact": "high", "category": "optimization",
            })

        if trips > 0:
            insights.append({
                "type": "learning",
                "text": f"{trips} trips eliminated ({metrics.get('tripReductionPercent', 0):.1f}% reduction). "
                        f"Saved {metrics.get('distanceSavedKm', 0):.0f} km and ₹{metrics.get('fuelSavedINR', 0):,.0f} in fuel.",
                "impact": "high", "category": "optimization",
            })

        if carbon > 10:
            insights.append({
                "type": "pattern",
                "text": f"{carbon:.1f} kg CO₂ saved. Carbon credit value: ${metrics.get('carbonCreditUSD', 0):.2f}. "
                        f"Emission reduction: {metrics.get('emissionReductionPercent', 0):.1f}%.",
                "impact": "high", "category": "emissions",
            })

        return insights

    def _trade_off_analysis(self, metrics: Dict) -> List[Dict]:
        util = metrics.get("utilizationAfter", 0)
        cost_pct = metrics.get("costSavedPercent", 0)
        carbon = metrics.get("carbonSavedKg", 0)

        analysis = []
        if util > 80 and cost_pct > 30:
            analysis.append({
                "type": "recommendation",
                "text": f"Excellent trade-off achieved: {util:.0f}% utilization with {cost_pct:.0f}% cost reduction and {carbon:.0f}kg CO₂ saved.",
                "impact": "high", "category": "trade_off",
            })
        elif util > 60:
            analysis.append({
                "type": "recommendation",
                "text": f"Good balance: {util:.0f}% utilization. Consider widening time windows for higher consolidation.",
                "impact": "medium", "category": "trade_off",
            })
        return analysis

    def _scenario_insights(self, results: List[Dict]) -> List[Dict]:
        valid = [r for r in results if not r.get("failed")]
        if len(valid) < 2:
            return []

        best = max(valid, key=lambda r: r.get("score", 0))
        worst = min(valid, key=lambda r: r.get("score", 0))
        return [{
            "type": "recommendation",
            "text": f"'{best['name']}' scenario outperforms '{worst['name']}' by "
                    f"{best.get('score', 0) - worst.get('score', 0):.1f} points. "
                    f"Recommended strategy: {best['name']}.",
            "impact": "high", "category": "scenario",
        }]

    def _corridor_detection(self, groups: List[Dict]) -> List[Dict]:
        corridors = {}
        for g in groups:
            if g.get("shipmentCount", 0) > 1 and g.get("shipments"):
                first = g["shipments"][0]
                p = first.get("pickupLocation", "Origin")
                d = first.get("dropLocation", "Dest")
                key = f"{p.split()[0] if p else 'O'} → {d.split()[0] if d else 'D'}"
                corridors[key] = corridors.get(key, 0) + g["shipmentCount"]

        insights = []
        top = sorted(corridors.items(), key=lambda x: -x[1])
        if top:
            insights.append({
                "type": "pattern",
                "text": f"High-density corridor: {top[0][0]} ({top[0][1]} shipments). "
                        f"Schedule fixed consolidation runs on this route.",
                "impact": "high", "category": "grouping",
            })
        return insights
