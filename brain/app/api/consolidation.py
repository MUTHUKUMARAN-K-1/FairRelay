"""
API Router for the 8-Agent AI Load Consolidation Engine.

Endpoints:
  POST /consolidate           — Run full 8-agent pipeline
  POST /consolidate/sync      — Synchronous runner (no LangGraph)
  POST /consolidate/simulate  — Multi-scenario comparison (accepts SimulationRequest)
  GET  /consolidate/health    — Engine health check

Changelog:
  PR #1 — Issue #2:  ScenarioAgent skipped from main pipeline; only runs on /simulate.
  PR #1 — Issue #5:  /simulate restored to accept SimulationRequest (with scenarios field).
  PR #1 — Issue #6:  Empty shipments/trucks now returns HTTP 400, not HTTP 200.
  PR #1 — Issue #9:  .dict() replaced with .model_dump() (Pydantic v2).
  PR #1 — Issue #10: response_model declared on all endpoints.
  PR #1 — Issue #11: ObjectiveWeights sum validated by Pydantic model_validator on schema.
  PR #2 — P2: Removed redundant _validate_weights() (schema validator fires first).
  PR #2 — P3: detail=str(e) replaced with generic safe message in all 500 handlers.
"""

import logging
import traceback
from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.consolidation import (
    ConsolidationRequest,
    ConsolidationResult,
    SimulationRequest,
    SimulationResult,
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



def _check_not_empty(shipments, trucks) -> None:
    """Issue #6: Return HTTP 400 for empty arrays instead of HTTP 200."""
    if not shipments:
        raise HTTPException(status_code=400, detail="shipments array must not be empty")
    if not trucks:
        raise HTTPException(status_code=400, detail="trucks array must not be empty")


@router.post(
    "",
    summary="Run 8-Agent Consolidation Pipeline",
    response_model=ConsolidationResult,  # Issue #10
)
async def consolidate(request: ConsolidationRequest):
    """
    Run the full 8-agent AI Load Consolidation Pipeline.

    Pipeline: Validation → Compatibility → Clustering → Optimization →
              3D Packing → Explainability → Feedback

    Note: Scenario simulation is NOT run here (Issue #2 — prevents 4× computation
    per request). Use POST /consolidate/simulate for scenario comparison.

    Returns consolidated groups, metrics, insights, load plans, and explanations.
    """
    # Issue #9: use model_dump() instead of deprecated .dict()
    shipments = [s.model_dump() for s in request.shipments]
    trucks = [t.model_dump() for t in request.trucks]
    options = request.options.model_dump()

    _check_not_empty(shipments, trucks)  # Issue #6

    try:
        logger.info(
            f"[Consolidation] Starting 8-agent pipeline: "
            f"{len(shipments)} shipments, {len(trucks)} trucks"
        )

        # Issue #2: disable ScenarioAgent inside the main pipeline
        options["_skipScenarioAgent"] = True

        # Try async LangGraph, fall back to sync
        try:
            result = await invoke_consolidation_workflow_v2(shipments, trucks, options)
        except Exception as e:
            logger.warning(f"LangGraph invocation failed, using sync: {e}")
            result = run_consolidation_pipeline_v2(shipments, trucks, options)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Consolidation] Pipeline error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal consolidation error")


@router.post(
    "/sync",
    summary="Synchronous 8-Agent Pipeline",
    response_model=ConsolidationResult,  # Issue #10
)
async def consolidate_sync(request: ConsolidationRequest):
    """Run the consolidation pipeline synchronously (no LangGraph)."""
    shipments = [s.model_dump() for s in request.shipments]
    trucks = [t.model_dump() for t in request.trucks]
    options = request.options.model_dump()

    _check_not_empty(shipments, trucks)

    try:
        options["_skipScenarioAgent"] = True  # Issue #2
        result = run_consolidation_pipeline_v2(shipments, trucks, options)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Consolidation/sync] Error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal consolidation error")


@router.post(
    "/simulate",
    summary="Multi-Scenario Simulation",
    response_model=SimulationResult,  # Issue #10
)
async def simulate_scenarios(request: SimulationRequest):  # Issue #5: restored SimulationRequest
    """
    Run Tight / Balanced / Aggressive scenarios (or custom scenarios) and compare.

    Accepts SimulationRequest which includes an optional `scenarios` list.
    If scenarios is empty, the three default strategies are used.

    Returns scenario results with recommendation.
    """
    try:
        # Issue #9: model_dump()
        shipments = [s.model_dump() for s in request.shipments]
        trucks = [t.model_dump() for t in request.trucks]

        _check_not_empty(shipments, trucks)  # Issue #6

        base_options: dict = {}

        # Validate first
        validator = ValidationAgent()
        valid_s, valid_t, val_report, _ = validator.run(shipments, trucks)

        if not valid_s:
            raise HTTPException(status_code=400, detail="No valid shipments after validation")
        if not valid_t:
            raise HTTPException(status_code=400, detail="No valid trucks after validation")

        # Build compatibility
        compat_agent = CompatibilityAgent()
        compat_graph, _, _ = compat_agent.run(valid_s, base_options)

        # Issue #5: pass caller-supplied scenarios through to ScenarioAgent
        # Issue #2: ScenarioAgent here runs with a 3-second solver cap
        scenario_options = {**base_options, "solverTimeLimitSeconds": 3.0}
        custom_scenarios = [sc.model_dump() for sc in request.scenarios] if request.scenarios else []

        scenario_agent = ScenarioAgent()
        results, rec, _ = scenario_agent.run(
            valid_s, valid_t, compat_graph,
            options=scenario_options,
            custom_scenarios=custom_scenarios,
        )

        return SimulationResult(
            scenarios=results,
            recommendation=rec,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Consolidation/simulate] Error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal simulation error")


@router.get("/health", summary="Engine Health Check")
async def engine_health():
    """Return health status of the 8-agent consolidation engine."""
    from app.services.agents.gnn_model import is_gnn_available

    return {
        "status": "healthy",
        "engine": "8-Agent AI Load Consolidation",
        "version": "2.0.1",
        "agents": [
            "ValidationAgent", "CompatibilityAgent", "ClusteringAgent",
            "OptimizationAgent", "PackingAgent",
            "ExplainabilityAgent", "FeedbackAgent",
        ],
        "simulation_agents": ["ScenarioAgent"],
        "gnn_available": is_gnn_available(),
        "solver_backend": "or-tools",
        "notes": {
            "ScenarioAgent": "Only runs on POST /consolidate/simulate, not on main pipeline",
            "gnn_available": "Indicates model can be loaded; inference uses heuristic until wired up",
        },
    }
