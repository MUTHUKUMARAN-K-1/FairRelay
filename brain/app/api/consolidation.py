"""
API endpoints for AI Load Consolidation.

POST /consolidate           — Run consolidation (LangGraph multi-agent pipeline)
POST /consolidate/sync      — Run consolidation (synchronous fallback)
POST /consolidate/simulate  — Compare multiple scenarios
"""

from typing import List
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.consolidation import (
    ConsolidationRequest,
    SimulationRequest,
    ConsolidationResult,
)
from app.services.consolidation_engine import run_consolidation_pipeline

router = APIRouter(prefix="/consolidate", tags=["Consolidation"])


@router.post("", response_model=ConsolidationResult)
async def consolidate(req: ConsolidationRequest):
    """
    Run AI Load Consolidation through the 5-agent LangGraph pipeline.

    Agents executed in order:
      1. GeoClusteringAgent — geographic proximity clustering
      2. TimeWindowAgent — time-window compatibility filtering
      3. CapacityOptimizationAgent — FFD bin-packing
      4. ScoringConfidenceAgent — AI confidence + optimization score
      5. ContinuousLearningAgent — actionable insights
    """
    if not req.shipments:
        raise HTTPException(400, "shipments array must not be empty")
    if not req.trucks:
        raise HTTPException(400, "trucks array must not be empty")

    shipments = [s.model_dump() for s in req.shipments]
    trucks = [t.model_dump() for t in req.trucks]
    options = req.options.model_dump()

    try:
        from app.services.consolidation_workflow import invoke_consolidation_workflow
        result = await invoke_consolidation_workflow(
            shipments=shipments,
            trucks=trucks,
            options=options,
            thread_id=str(uuid4()),
        )
    except Exception as e:
        # Fallback to synchronous pipeline if LangGraph fails
        print(f"LangGraph consolidation failed ({e}), using sync pipeline")
        result = run_consolidation_pipeline(shipments, trucks, options)

    return ConsolidationResult(**result)


@router.post("/sync", response_model=ConsolidationResult)
async def consolidate_sync(req: ConsolidationRequest):
    """
    Run consolidation using the synchronous multi-agent pipeline (no LangGraph).
    Useful for environments without LangGraph installed.
    """
    if not req.shipments:
        raise HTTPException(400, "shipments array must not be empty")
    if not req.trucks:
        raise HTTPException(400, "trucks array must not be empty")

    shipments = [s.model_dump() for s in req.shipments]
    trucks = [t.model_dump() for t in req.trucks]
    options = req.options.model_dump()

    result = run_consolidation_pipeline(shipments, trucks, options)
    return ConsolidationResult(**result)


@router.post("/simulate")
async def simulate_scenarios(req: SimulationRequest):
    """
    Compare multiple consolidation strategies side-by-side.
    Returns results for each scenario and a recommendation.
    """
    if not req.shipments or not req.trucks:
        raise HTTPException(400, "shipments and trucks arrays required")
    if not req.scenarios:
        raise HTTPException(400, "at least one scenario required")

    shipments = [s.model_dump() for s in req.shipments]
    trucks = [t.model_dump() for t in req.trucks]

    results = []
    for sc in req.scenarios:
        opts = {
            "maxGroupRadiusKm": sc.maxGroupRadiusKm,
            "timeWindowToleranceMinutes": sc.timeWindowToleranceMinutes,
            "scenarioName": sc.name,
        }
        r = run_consolidation_pipeline(shipments, trucks, opts)
        results.append({"name": sc.name, **r})

    best = max(results, key=lambda r: r["metrics"]["optimizationScore"])

    return {
        "scenarios": results,
        "recommendation": best["name"],
    }
