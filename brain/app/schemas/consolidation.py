"""
Pydantic schemas for the Load Consolidation pipeline.
Defines input/output contracts for the multi-agent consolidation workflow.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


# ─── Input schemas ────────────────────────────────────────────────────────────

class ShipmentInput(BaseModel):
    id: str
    pickupLat: float
    pickupLng: float
    dropLat: float
    dropLng: float
    pickupLocation: str = ""
    dropLocation: str = ""
    weight: float = Field(ge=0, description="Weight in kg")
    volume: float = Field(ge=0, description="Volume in m³")
    timeWindowStart: Optional[str] = None
    timeWindowEnd: Optional[str] = None
    priority: Optional[str] = "MEDIUM"


class TruckInput(BaseModel):
    id: str
    name: str = ""
    maxWeight: float = Field(gt=0)
    maxVolume: float = Field(gt=0)
    licensePlate: Optional[str] = None
    co2PerKm: float = 0.21


class ConsolidationOptions(BaseModel):
    maxGroupRadiusKm: float = Field(default=30, ge=1, le=200)
    timeWindowToleranceMinutes: float = Field(default=120, ge=0, le=1440)
    scenarioName: Optional[str] = None


class ConsolidationRequest(BaseModel):
    shipments: List[ShipmentInput]
    trucks: List[TruckInput]
    options: ConsolidationOptions = Field(default_factory=ConsolidationOptions)


class ScenarioConfig(BaseModel):
    name: str
    maxGroupRadiusKm: float = 30
    timeWindowToleranceMinutes: float = 120


class SimulationRequest(BaseModel):
    shipments: List[ShipmentInput]
    trucks: List[TruckInput]
    scenarios: List[ScenarioConfig]


# ─── Output schemas ───────────────────────────────────────────────────────────

class GroupedShipment(BaseModel):
    id: str
    pickupLocation: str
    dropLocation: str
    weight: float
    volume: float


class ConsolidatedGroup(BaseModel):
    groupId: int
    truckId: str
    truckName: str
    shipmentCount: int
    shipments: List[GroupedShipment]
    totalWeight: float
    totalVolume: float
    utilizationWeight: float
    utilizationVolume: float
    routeDistanceKm: float
    confidence: int = Field(ge=0, le=100)
    capFit: float
    geoScore: float
    timeScore: float


class ConsolidationMetrics(BaseModel):
    totalShipments: int
    totalGroups: int
    totalTrucks: int
    utilizationBefore: float
    utilizationAfter: float
    utilizationImprovement: float
    tripsReduced: int
    tripReductionPercent: float
    distanceSavedKm: float
    carbonSavedKg: float
    carbonCreditUSD: float
    fuelSavedINR: float
    costSavedPercent: float
    naiveTotalDistanceKm: float
    consolidatedDistanceKm: float
    optimizationScore: int
    avgConfidence: int


class LearningInsight(BaseModel):
    type: str  # "pattern", "recommendation", "learning"
    text: str
    impact: str  # "high", "medium", "low"


class ConsolidationResult(BaseModel):
    groups: List[ConsolidatedGroup]
    metrics: ConsolidationMetrics
    insights: List[LearningInsight]
    agentSteps: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Agent decision log for explainability"
    )


# ─── LangGraph state ─────────────────────────────────────────────────────────

class ConsolidationState(BaseModel):
    """LangGraph state for the consolidation workflow."""

    # Input
    shipments: List[Dict[str, Any]] = Field(default_factory=list)
    trucks: List[Dict[str, Any]] = Field(default_factory=list)
    options: Dict[str, Any] = Field(default_factory=dict)

    # Phase 1: Geographic Clustering Agent output
    geo_clusters: List[List[Dict[str, Any]]] = Field(default_factory=list)
    geo_agent_log: Optional[Dict[str, Any]] = None

    # Phase 2: Time Window Compatibility Agent output
    time_groups: List[List[Dict[str, Any]]] = Field(default_factory=list)
    time_agent_log: Optional[Dict[str, Any]] = None

    # Phase 3: Bin-Packing / Capacity Agent output
    packed_bins: List[Dict[str, Any]] = Field(default_factory=list)
    capacity_agent_log: Optional[Dict[str, Any]] = None

    # Phase 4: Scoring & Confidence Agent output
    groups: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Optional[Dict[str, Any]] = None
    scoring_agent_log: Optional[Dict[str, Any]] = None

    # Phase 5: Learning / Insights Agent output
    insights: List[Dict[str, Any]] = Field(default_factory=list)
    learning_agent_log: Optional[Dict[str, Any]] = None

    # Observability
    agent_steps: List[Dict[str, Any]] = Field(default_factory=list)
    workflow_start: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
