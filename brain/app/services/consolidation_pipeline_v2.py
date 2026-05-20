"""
8-Agent LangGraph Workflow for AI Load Consolidation.

Pipeline:
  Validation → Compatibility → Clustering → Optimization →
  Packing → Scenario → Explainability → Feedback → END

Also provides a synchronous runner for environments without LangGraph.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

import numpy as np

from app.services.agents.validation_agent import ValidationAgent
from app.services.agents.compatibility_agent import CompatibilityAgent
from app.services.agents.clustering_agent import ClusteringAgent
from app.services.agents.optimization_agent import OptimizationAgent
from app.services.agents.packing_agent import PackingAgent
from app.services.agents.scenario_agent import ScenarioAgent
from app.services.agents.explainability_agent import ExplainabilityAgent
from app.services.agents.feedback_agent import FeedbackAgent
from app.services.clustering import haversine_distance

logger = logging.getLogger("fairrelay.consolidation_v2")


# ═══════════════════════════════════════════════════════════════════════════════
# SYNCHRONOUS 8-AGENT PIPELINE (primary runner)
# ═══════════════════════════════════════════════════════════════════════════════

def run_consolidation_pipeline_v2(
    shipments: List[Dict],
    trucks: List[Dict],
    options: Dict,
) -> Dict[str, Any]:
    """Run the full 8-agent consolidation pipeline synchronously."""
    run_id = str(uuid4())[:8]
    agent_steps = []

    # ── Agent 1: Validation ──
    validator = ValidationAgent()
    valid_s, valid_t, val_report, val_log = validator.run(shipments, trucks)
    agent_steps.append(val_log)

    if not valid_s or not valid_t:
        return _empty_result(run_id, agent_steps, val_report,
                             "No valid shipments or trucks after validation")

    # ── Agent 2: Compatibility ──
    compat_agent = CompatibilityAgent()
    compat_graph, compat_scores, compat_log = compat_agent.run(valid_s, options)
    agent_steps.append(compat_log)

    # ── Agent 3: Clustering ──
    cluster_agent = ClusteringAgent()
    groups, cluster_quality, cluster_log = cluster_agent.run(
        valid_s, compat_graph, valid_t, options
    )
    agent_steps.append(cluster_log)

    # ── Agent 4: Optimization ──
    optimizer = OptimizationAgent()
    bins, opt_meta, opt_log = optimizer.run(groups, valid_t, options)
    agent_steps.append(opt_log)

    if not bins:
        return _empty_result(run_id, agent_steps, val_report,
                             "Optimization produced no feasible bins")

    # ── Agent 5: 3D Packing ──
    packer = PackingAgent()
    load_plans, packing_results, pack_log = packer.run(bins, options)
    agent_steps.append(pack_log)

    # ── Build groups with scoring ──
    scored_groups = _build_groups(bins, valid_s, valid_t, load_plans, compat_graph)
    metrics = _compute_metrics(scored_groups, bins, valid_s, valid_t,
                                packing_results, opt_meta)

    # ── Agent 6: Scenario Simulation (optional, runs if no custom scenario) ──
    scenario_results = []
    scenario_rec = ""
    if not options.get("scenarioName"):
        try:
            scenario_agent = ScenarioAgent()
            scenario_results, scenario_rec, sc_log = scenario_agent.run(
                valid_s, valid_t, compat_graph, options=options
            )
            agent_steps.append(sc_log)
        except Exception as e:
            logger.warning(f"Scenario simulation skipped: {e}")

    # ── Agent 7: Explainability ──
    explain_agent = ExplainabilityAgent()
    explanations, insights, explain_log = explain_agent.run(
        scored_groups, bins, metrics, val_report,
        compat_graph, packing_results, scenario_results, options
    )
    agent_steps.append(explain_log)

    # ── Agent 8: Feedback Learning ──
    feedback_agent = FeedbackAgent()
    learning_updates, fb_insights, fb_log = feedback_agent.run(
        valid_s, scored_groups, metrics, options
    )
    agent_steps.append(fb_log)
    insights.extend(fb_insights)

    return {
        "runId": run_id,
        "groups": scored_groups,
        "metrics": metrics,
        "insights": insights,
        "agentSteps": agent_steps,
        "explanations": explanations,
        "loadPlans": [p for p in load_plans if p.get("placements")],
        "paretoFront": [],
        "validationReport": val_report,
        "scenarioResults": scenario_results,
        "scenarioRecommendation": scenario_rec,
        "learningUpdates": learning_updates,
    }


def _empty_result(run_id, steps, report, reason):
    return {
        "runId": run_id, "groups": [],
        "metrics": {"totalShipments": 0, "totalGroups": 0, "totalTrucks": 0,
                     "utilizationBefore": 0, "utilizationAfter": 0,
                     "utilizationImprovement": 0, "tripsReduced": 0,
                     "tripReductionPercent": 0, "distanceSavedKm": 0,
                     "carbonSavedKg": 0, "carbonCreditUSD": 0, "fuelSavedINR": 0,
                     "costSavedPercent": 0, "naiveTotalDistanceKm": 0,
                     "consolidatedDistanceKm": 0, "optimizationScore": 0,
                     "avgConfidence": 0, "totalEmissionKg": 0, "totalCostINR": 0,
                     "emissionReductionPercent": 0, "avgPackingScore": 0,
                     "avgSequenceScore": 0, "solverMethod": "none",
                     "solverRuntimeMs": 0, "paretoSolutionsCount": 0,
                     "validationIssues": report.get("issueCount", 0),
                     "packingFeasibilityRate": 0},
        "insights": [{"type": "warning", "text": reason, "impact": "high"}],
        "agentSteps": steps, "explanations": [], "loadPlans": [],
        "paretoFront": [], "validationReport": report,
    }


def _build_groups(bins, shipments, trucks, load_plans, compat_graph):
    """Build scored group objects from optimized bins."""
    naive_dist = sum(
        haversine_distance(s["pickupLat"], s["pickupLng"], s["dropLat"], s["dropLng"])
        for s in shipments
    )
    total_weight = sum(s.get("weight", 0) for s in shipments)
    avg_cap = np.mean([t["maxWeight"] for t in trucks]) if trucks else 1

    groups = []
    for i, b in enumerate(bins):
        ss = b["shipments"]
        truck = b["truck"]
        cap_w = min((b["usedW"] / truck["maxWeight"]) * 100, 100)
        cap_v = min((b["usedV"] / truck["maxVolume"]) * 100, 100)

        # Geographic score
        if len(ss) > 1:
            dists = [haversine_distance(s1["pickupLat"], s1["pickupLng"],
                                         s2["pickupLat"], s2["pickupLng"])
                     for si, s1 in enumerate(ss) for s2 in ss[si+1:]]
            geo_score = max(0, 100 - np.mean(dists) * 3) if dists else 100
        else:
            geo_score = 100

        # Time score
        time_score = 100
        tw_starts = []
        for s in ss:
            if s.get("timeWindowStart"):
                try:
                    tw_starts.append(datetime.fromisoformat(
                        s["timeWindowStart"].replace("Z", "+00:00")).timestamp())
                except Exception:
                    pass
        if len(tw_starts) > 1:
            spread_h = (max(tw_starts) - min(tw_starts)) / 3600
            time_score = max(0, 100 - spread_h * 15)

        confidence = round(cap_w * 0.35 + geo_score * 0.30 + time_score * 0.20 + 15)

        plan = load_plans[i] if i < len(load_plans) else {}
        cargo_types = list(set(s.get("cargoType", "GENERAL") for s in ss))

        groups.append({
            "groupId": i + 1,
            "truckId": truck["id"],
            "truckName": truck.get("name", f"Truck-{i+1}"),
            "truckCapacity": {"maxWeight": truck["maxWeight"], "maxVolume": truck["maxVolume"]},
            "shipmentCount": len(ss),
            "shipments": [{"id": s["id"], "pickupLocation": s.get("pickupLocation", ""),
                           "dropLocation": s.get("dropLocation", ""),
                           "weight": s.get("weight", 0), "volume": s.get("volume", 0)}
                          for s in ss],
            "totalWeight": b["usedW"], "totalVolume": b["usedV"],
            "utilizationWeight": round(cap_w, 1),
            "utilizationVolume": round(cap_v, 1),
            "routeDistanceKm": b.get("routeDistanceKm", 0),
            "confidence": min(confidence, 100),
            "capFit": round(cap_w, 1), "geoScore": round(geo_score, 1),
            "timeScore": round(time_score, 1),
            "compatibilityScore": round(np.mean([cap_w, geo_score, time_score]) * 0.9, 1),
            "cargoTypes": cargo_types,
            "emissionKg": b.get("emissionKg", 0),
            "costINR": b.get("costINR", 0),
            "loadPlan": plan if plan.get("placements") else None,
        })
    return groups


def _compute_metrics(groups, bins, shipments, trucks, packing, opt_meta):
    total_weight = sum(s.get("weight", 0) for s in shipments)
    avg_cap = np.mean([t["maxWeight"] for t in trucks]) if trucks else 1
    naive_util = (total_weight / (len(shipments) * avg_cap)) * 100 if shipments else 0
    cons_util = (total_weight / (len(bins) * avg_cap)) * 100 if bins else 0

    naive_dist = sum(haversine_distance(s["pickupLat"], s["pickupLng"],
                                         s["dropLat"], s["dropLng"]) for s in shipments)
    cons_dist = sum(b.get("routeDistanceKm", 0) for b in bins)
    dist_saved = max(0, naive_dist - cons_dist)
    trips_reduced = max(0, len(shipments) - len(bins))
    trip_pct = (trips_reduced / max(len(shipments), 1)) * 100
    carbon_saved = dist_saved * 0.21
    total_emission = sum(b.get("emissionKg", 0) for b in bins)
    total_cost = sum(b.get("costINR", 0) for b in bins)

    avg_conf = round(np.mean([g["confidence"] for g in groups])) if groups else 0
    util_gain = min(cons_util - naive_util, 50)
    opt_score = round(
        avg_conf * 0.30 + min(cons_util, 100) * 0.25 +
        trip_pct * 0.20 * 0.01 * 100 + min(util_gain * 2, 25)
    )

    return {
        "totalShipments": len(shipments), "totalGroups": len(groups),
        "totalTrucks": len(trucks),
        "utilizationBefore": round(min(naive_util, 100), 1),
        "utilizationAfter": round(min(cons_util, 100), 1),
        "utilizationImprovement": round(min(cons_util - naive_util, 100), 1),
        "tripsReduced": trips_reduced,
        "tripReductionPercent": round(trip_pct, 1),
        "distanceSavedKm": round(dist_saved, 1),
        "carbonSavedKg": round(carbon_saved, 1),
        "carbonCreditUSD": round((carbon_saved / 1000) * 25, 2),
        "fuelSavedINR": round(dist_saved * 22.5),
        "costSavedPercent": round(trip_pct, 1),
        "naiveTotalDistanceKm": round(naive_dist, 1),
        "consolidatedDistanceKm": round(cons_dist, 1),
        "optimizationScore": min(opt_score, 100),
        "avgConfidence": avg_conf,
        "totalEmissionKg": round(total_emission, 1),
        "totalCostINR": round(total_cost, 1),
        "emissionReductionPercent": round((dist_saved / max(naive_dist, 1)) * 100, 1),
        "avgPackingScore": packing.get("avgPackingScore", 80),
        "avgSequenceScore": packing.get("avgSequenceScore", 80),
        "solverMethod": opt_meta.get("method", ""),
        "solverRuntimeMs": opt_meta.get("solverRuntimeMs", 0),
        "paretoSolutionsCount": 0,
        "validationIssues": 0,
        "packingFeasibilityRate": packing.get("feasibilityRate", 100),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# LANGGRAPH WORKFLOW (optional - falls back to sync)
# ═══════════════════════════════════════════════════════════════════════════════

try:
    from langgraph.graph import StateGraph, END
    from app.schemas.consolidation import ConsolidationState
    _LANGGRAPH_AVAILABLE = True
except ImportError:
    _LANGGRAPH_AVAILABLE = False


def _lg_validation(state: dict) -> dict:
    agent = ValidationAgent()
    vs, vt, report, log = agent.run(state["shipments"], state["trucks"])
    return {"validated_shipments": vs, "validated_trucks": vt,
            "validation_report": report, "validation_agent_log": log,
            "agent_steps": state.get("agent_steps", []) + [log]}


def _lg_compatibility(state: dict) -> dict:
    agent = CompatibilityAgent()
    graph, scores, log = agent.run(state["validated_shipments"], state.get("options"))
    return {"compatibility_graph": graph, "compatibility_scores": scores,
            "compatibility_agent_log": log,
            "agent_steps": state.get("agent_steps", []) + [log]}


def _lg_clustering(state: dict) -> dict:
    agent = ClusteringAgent()
    groups, quality, log = agent.run(
        state["validated_shipments"], state["compatibility_graph"],
        state["validated_trucks"], state.get("options"))
    return {"candidate_groups": groups, "cluster_quality": quality,
            "clustering_agent_log": log,
            "agent_steps": state.get("agent_steps", []) + [log]}


def _lg_optimization(state: dict) -> dict:
    agent = OptimizationAgent()
    bins, meta, log = agent.run(state["candidate_groups"], state["validated_trucks"],
                                 state.get("options"))
    return {"optimized_loads": bins, "optimization_meta": meta,
            "optimization_agent_log": log,
            "agent_steps": state.get("agent_steps", []) + [log]}


def _lg_packing(state: dict) -> dict:
    agent = PackingAgent()
    plans, results, log = agent.run(state["optimized_loads"], state.get("options"))
    return {"load_plans": plans, "packing_results": results,
            "packing_agent_log": log,
            "agent_steps": state.get("agent_steps", []) + [log]}


def _lg_scoring(state: dict) -> dict:
    """Build final groups and metrics."""
    groups = _build_groups(state["optimized_loads"], state["validated_shipments"],
                           state["validated_trucks"], state["load_plans"],
                           state["compatibility_graph"])
    metrics = _compute_metrics(groups, state["optimized_loads"],
                               state["validated_shipments"], state["validated_trucks"],
                               state["packing_results"], state.get("optimization_meta", {}))
    return {"groups": groups, "metrics": metrics,
            "agent_steps": state.get("agent_steps", [])}


def _lg_explainability(state: dict) -> dict:
    agent = ExplainabilityAgent()
    exps, insights, log = agent.run(
        state["groups"], state["optimized_loads"], state["metrics"],
        state["validation_report"], state["compatibility_graph"],
        state["packing_results"], [], state.get("options"))
    return {"explanations": exps, "insights": insights,
            "explainability_agent_log": log,
            "agent_steps": state.get("agent_steps", []) + [log]}


def _lg_feedback(state: dict) -> dict:
    agent = FeedbackAgent()
    updates, fb_insights, log = agent.run(
        state["validated_shipments"], state["groups"], state["metrics"],
        state.get("options"))
    all_insights = state.get("insights", []) + fb_insights
    return {"learning_updates": updates, "feedback_agent_log": log,
            "insights": all_insights,
            "agent_steps": state.get("agent_steps", []) + [log]}


def create_consolidation_graph_v2(checkpointer=None):
    if not _LANGGRAPH_AVAILABLE:
        return None
    wf = StateGraph(ConsolidationState)
    wf.add_node("validation", _lg_validation)
    wf.add_node("compatibility", _lg_compatibility)
    wf.add_node("clustering", _lg_clustering)
    wf.add_node("optimization", _lg_optimization)
    wf.add_node("packing", _lg_packing)
    wf.add_node("scoring", _lg_scoring)
    wf.add_node("explainability", _lg_explainability)
    wf.add_node("feedback", _lg_feedback)

    wf.set_entry_point("validation")
    wf.add_edge("validation", "compatibility")
    wf.add_edge("compatibility", "clustering")
    wf.add_edge("clustering", "optimization")
    wf.add_edge("optimization", "packing")
    wf.add_edge("packing", "scoring")
    wf.add_edge("scoring", "explainability")
    wf.add_edge("explainability", "feedback")
    wf.add_edge("feedback", END)

    return wf.compile(checkpointer=checkpointer) if checkpointer else wf.compile()


_graph_v2 = None

def get_consolidation_graph_v2():
    global _graph_v2
    if _graph_v2 is None and _LANGGRAPH_AVAILABLE:
        _graph_v2 = create_consolidation_graph_v2()
    return _graph_v2


async def invoke_consolidation_workflow_v2(shipments, trucks, options, thread_id=None):
    graph = get_consolidation_graph_v2()
    if graph is None:
        return run_consolidation_pipeline_v2(shipments, trucks, options)

    initial = {
        "shipments": shipments, "trucks": trucks, "options": options,
        "run_id": str(uuid4())[:8],
        "validated_shipments": [], "validated_trucks": [],
        "validation_report": {}, "compatibility_graph": {},
        "compatibility_scores": [], "candidate_groups": [],
        "cluster_quality": {}, "optimized_loads": [],
        "optimization_meta": {}, "load_plans": [],
        "packing_results": {}, "scenario_results": [],
        "explanations": [], "learning_updates": {},
        "groups": [], "metrics": None, "insights": [],
        "agent_steps": [],
    }
    config = {"configurable": {"thread_id": thread_id}} if thread_id else {}
    result = await graph.ainvoke(initial, config=config)
    return {
        "runId": result.get("run_id", ""),
        "groups": result.get("groups", []),
        "metrics": result.get("metrics", {}),
        "insights": result.get("insights", []),
        "agentSteps": result.get("agent_steps", []),
        "explanations": result.get("explanations", []),
        "loadPlans": result.get("load_plans", []),
        "paretoFront": [], "validationReport": result.get("validation_report", {}),
    }
