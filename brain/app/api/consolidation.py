"""
API Router for the 8-Agent AI Load Consolidation Engine.

Endpoints:
  POST /consolidate           — Run full 8-agent pipeline
  POST /consolidate/sync      — Synchronous runner (no LangGraph)
  POST /consolidate/simulate  — Multi-scenario comparison
  GET  /consolidate/health    — Engine health check
"""

import logging
import traceback
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.consolidation import (
    ConsolidationRequest, ConsolidationResult, SimulationRequest,
)
from app.services.consolidation_pipeline_v2 import (
    run_consolidation_pipeline_v2,
    invoke_consolidation_workflow_v2,
)
from app.services.agents.scenario_agent import ScenarioAgent
from app.services.agents.compatibility_agent import CompatibilityAgent
from app.services.agents.validation_agent import ValidationAgent

logger = logging.getLogger("fairrelay.api.consolidation")

router = APIRouter(prefix="/consolidate", tags=["Load Consolidation V2"])


@router.post("", summary="Run 8-Agent Consolidation Pipeline")
async def consolidate(request: ConsolidationRequest):
    """
    Run the full 8-agent AI Load Consolidation Pipeline.

    Pipeline: Validation → Compatibility → Clustering → Optimization →
              3D Packing → Scenario → Explainability → Feedback

    Returns consolidated groups, metrics, insights, load plans, and explanations.
    """
    try:
        shipments = [s.dict() for s in request.shipments]
        trucks = [t.dict() for t in request.trucks]
        options = request.options.dict()

        logger.info(
            f"[Consolidation] Starting 8-agent pipeline: "
            f"{len(shipments)} shipments, {len(trucks)} trucks"
        )

        # Try async LangGraph, fall back to sync
        try:
            result = await invoke_consolidation_workflow_v2(
                shipments, trucks, options
            )
        except Exception as e:
            logger.warning(f"LangGraph invocation failed, using sync: {e}")
            result = run_consolidation_pipeline_v2(shipments, trucks, options)

        return result

    except Exception as e:
        logger.error(f"[Consolidation] Pipeline error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync", summary="Synchronous 8-Agent Pipeline")
async def consolidate_sync(request: ConsolidationRequest):
    """Run the consolidation pipeline synchronously (no LangGraph)."""
    try:
        shipments = [s.dict() for s in request.shipments]
        trucks = [t.dict() for t in request.trucks]
        options = request.options.dict()

        result = run_consolidation_pipeline_v2(shipments, trucks, options)
        return result

    except Exception as e:
        logger.error(f"[Consolidation/sync] Error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate", summary="Multi-Scenario Simulation")
async def simulate_scenarios(request: ConsolidationRequest):
    """
    Run Tight / Balanced / Aggressive scenarios and compare.
    Returns scenario results with recommendation.
    """
    try:
        shipments = [s.dict() for s in request.shipments]
        trucks = [t.dict() for t in request.trucks]
        options = request.options.dict()

        # Validate first
        validator = ValidationAgent()
        valid_s, valid_t, val_report, _ = validator.run(shipments, trucks)

        if not valid_s or not valid_t:
            raise HTTPException(status_code=400, detail="No valid shipments/trucks")

        # Build compatibility
        compat_agent = CompatibilityAgent()
        compat_graph, _, _ = compat_agent.run(valid_s, options)

        # Run scenarios
        scenario_agent = ScenarioAgent()
        results, rec, _ = scenario_agent.run(valid_s, valid_t, compat_graph, options=options)

        return {
            "scenarios": results,
            "recommendation": rec,
            "validationReport": val_report,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Consolidation/simulate] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", summary="Engine Health Check")
async def engine_health():
    """Return health status of the 8-agent consolidation engine."""
    from app.services.agents.gnn_model import is_gnn_available

    return {
        "status": "healthy",
        "engine": "8-Agent AI Load Consolidation",
        "version": "2.0.0",
        "agents": [
            "ValidationAgent", "CompatibilityAgent", "ClusteringAgent",
            "OptimizationAgent", "PackingAgent", "ScenarioAgent",
            "ExplainabilityAgent", "FeedbackAgent",
        ],
        "gnn_available": is_gnn_available(),
        "solver_backend": "or-tools",
    }
