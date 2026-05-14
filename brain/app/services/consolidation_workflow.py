"""
LangGraph workflow for AI Load Consolidation.

Orchestrates 5 agents in a pipeline:
  GeoCluster → TimeWindow → CapacityPack → Scoring → LearningInsights → END
"""

from typing import Optional, Any

from langgraph.graph import StateGraph, END

from app.schemas.consolidation import ConsolidationState
from app.services.consolidation_engine import (
    GeoClusteringAgent,
    TimeWindowAgent,
    CapacityAgent,
    ScoringAgent,
    LearningInsightsAgent,
)


# ─── LangGraph node functions ────────────────────────────────────────────────

def geo_clustering_node(state: dict) -> dict:
    """Agent 1: Geographic clustering based on pickup/drop proximity."""
    agent = GeoClusteringAgent()
    max_r = state.get("options", {}).get("maxGroupRadiusKm", 30)
    clusters, log = agent.run(state["shipments"], max_r)
    return {
        "geo_clusters": [
            [dict(s) for s in cluster] for cluster in clusters
        ],
        "geo_agent_log": log,
        "agent_steps": state.get("agent_steps", []) + [log],
    }


def time_window_node(state: dict) -> dict:
    """Agent 2: Time window compatibility filtering."""
    agent = TimeWindowAgent()
    tol = state.get("options", {}).get("timeWindowToleranceMinutes", 120)
    groups, log = agent.run(state["geo_clusters"], tol)
    return {
        "time_groups": groups,
        "time_agent_log": log,
        "agent_steps": state.get("agent_steps", []) + [log],
    }


def capacity_packing_node(state: dict) -> dict:
    """Agent 3: FFD bin-packing into trucks."""
    agent = CapacityAgent()
    bins, log = agent.run(state["time_groups"], state["trucks"])
    return {
        "packed_bins": bins,
        "capacity_agent_log": log,
        "agent_steps": state.get("agent_steps", []) + [log],
    }


def scoring_node(state: dict) -> dict:
    """Agent 4: Compute confidence scores and optimization metrics."""
    agent = ScoringAgent()
    groups, metrics, log = agent.run(
        state["packed_bins"], state["shipments"], state["trucks"]
    )
    return {
        "groups": groups,
        "metrics": metrics,
        "scoring_agent_log": log,
        "agent_steps": state.get("agent_steps", []) + [log],
    }


def learning_insights_node(state: dict) -> dict:
    """Agent 5: RL-based insights from consolidation results."""
    agent = LearningInsightsAgent()
    insights, log = agent.run(
        state["shipments"], state["groups"], state["metrics"],
        options=state.get("options"),
    )
    return {
        "insights": insights,
        "learning_agent_log": log,
        "agent_steps": state.get("agent_steps", []) + [log],
    }


# ─── Workflow builder ─────────────────────────────────────────────────────────

def create_consolidation_graph(
    checkpointer: Optional[Any] = None,
) -> StateGraph:
    """
    Build and compile the consolidation LangGraph.

    Pipeline:
        geo_cluster → time_window → capacity_pack → scoring → learning → END
    """
    workflow = StateGraph(ConsolidationState)

    workflow.add_node("geo_cluster", geo_clustering_node)
    workflow.add_node("time_window", time_window_node)
    workflow.add_node("capacity_pack", capacity_packing_node)
    workflow.add_node("scoring", scoring_node)
    workflow.add_node("learning", learning_insights_node)

    workflow.set_entry_point("geo_cluster")
    workflow.add_edge("geo_cluster", "time_window")
    workflow.add_edge("time_window", "capacity_pack")
    workflow.add_edge("capacity_pack", "scoring")
    workflow.add_edge("scoring", "learning")
    workflow.add_edge("learning", END)

    if checkpointer:
        return workflow.compile(checkpointer=checkpointer)
    return workflow.compile()


# Singleton
_consolidation_graph = None


def get_consolidation_graph(force_recreate: bool = False):
    global _consolidation_graph
    if _consolidation_graph is None or force_recreate:
        _consolidation_graph = create_consolidation_graph()
    return _consolidation_graph


async def invoke_consolidation_workflow(
    shipments: list,
    trucks: list,
    options: dict,
    thread_id: Optional[str] = None,
) -> dict:
    """Run the consolidation LangGraph workflow."""
    graph = get_consolidation_graph(force_recreate=True)

    initial = {
        "shipments": shipments,
        "trucks": trucks,
        "options": options,
        "geo_clusters": [],
        "time_groups": [],
        "packed_bins": [],
        "groups": [],
        "metrics": None,
        "insights": [],
        "agent_steps": [],
    }

    config = {}
    if thread_id:
        config["configurable"] = {"thread_id": thread_id}

    result = await graph.ainvoke(initial, config=config)

    return {
        "groups": result.get("groups", []),
        "metrics": result.get("metrics", {}),
        "insights": result.get("insights", []),
        "agentSteps": result.get("agent_steps", []),
    }
