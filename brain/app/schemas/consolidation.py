"""
Pydantic schemas for the 8-Agent AI Load Consolidation Pipeline.

Defines input/output contracts for the multi-agent consolidation workflow.
Backward-compatible with existing 5-agent API while adding support for:
  - Item-level dimensions & fragility
  - Vehicle interior specs & compartments
  - 3D load plans & placements
  - Explainability records
  - Feedback & learning records
  - Multi-objective optimization runs
  - Scenario simulation results
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field


# ─── Enums ────────────────────────────────────────────────────────────────────

class CargoType(str, Enum):
    GENERAL = "GENERAL"
    FRAGILE = "FRAGILE"
    PERISHABLE = "PERISHABLE"
    HAZARDOUS = "HAZARDOUS"
    LIQUID = "LIQUID"
    HEAVY_MACHINERY = "HEAVY_MACHINERY"
    ELECTRONICS = "ELECTRONICS"
    PHARMACEUTICALS = "PHARMACEUTICALS"
    TEXTILES = "TEXTILES"
    AUTOMOTIVE = "AUTOMOTIVE"


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VehicleType(str, Enum):
    MINI_TRUCK = "MINI_TRUCK"
    LCV = "LCV"
    MCV = "MCV"
    HCV = "HCV"
    TRAILER = "TRAILER"
    REFRIGERATED = "REFRIGERATED"
    FLATBED = "FLATBED"
    TANKER = "TANKER"


# ─── Input schemas ────────────────────────────────────────────────────────────

class ItemDimension(BaseModel):
    """Individual package/item dimensions for 3D packing."""
    id: str = ""
    length: float = Field(ge=0, description="Length in meters")
    width: float = Field(ge=0, description="Width in meters")
    height: float = Field(ge=0, description="Height in meters")
    weight: float = Field(ge=0, description="Weight in kg")
    fragility: int = Field(default=0, ge=0, le=5, description="0=robust, 5=extremely fragile")
    orientationConstraints: List[str] = Field(
        default_factory=list,
        description="e.g. ['upright_only', 'no_stack']"
    )
    stackable: bool = True


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
    # ─── New fields for 8-agent pipeline ───
    cargoType: str = "GENERAL"
    fragility: int = Field(default=0, ge=0, le=5)
    handlingConstraints: List[str] = Field(default_factory=list)
    serviceTimeMinutes: float = Field(default=15, ge=0)
    allowedVehicleTypes: List[str] = Field(default_factory=list)
    itemDimensions: List[ItemDimension] = Field(default_factory=list)


class TruckInput(BaseModel):
    id: str
    name: str = ""
    maxWeight: float = Field(gt=0)
    maxVolume: float = Field(gt=0)
    licensePlate: Optional[str] = None
    co2PerKm: float = 0.21
    # ─── New fields for 8-agent pipeline ───
    vehicleType: str = "LCV"
    internalLength: float = Field(default=4.0, ge=0, description="Internal cargo length (m)")
    internalWidth: float = Field(default=2.0, ge=0, description="Internal cargo width (m)")
    internalHeight: float = Field(default=2.0, ge=0, description="Internal cargo height (m)")
    costPerKm: float = Field(default=15.0, ge=0, description="Operating cost per km (INR)")
    emissionFactor: float = Field(default=0.21, ge=0, description="CO2 kg per km")
    availabilityStart: Optional[str] = None
    availabilityEnd: Optional[str] = None
    currentLat: Optional[float] = None
    currentLng: Optional[float] = None
    vehicleRestrictions: List[str] = Field(default_factory=list)
    compartments: int = Field(default=1, ge=1)


class ObjectiveWeights(BaseModel):
    """Multi-objective optimization weights (must sum to ~1.0)."""
    cost: float = Field(default=0.30, ge=0, le=1)
    emissions: float = Field(default=0.20, ge=0, le=1)
    utilization: float = Field(default=0.30, ge=0, le=1)
    service: float = Field(default=0.20, ge=0, le=1)


class ConsolidationOptions(BaseModel):
    maxGroupRadiusKm: float = Field(default=30, ge=1, le=500)
    timeWindowToleranceMinutes: float = Field(default=120, ge=0, le=1440)
    scenarioName: Optional[str] = None
    # ─── New options for 8-agent pipeline ───
    objectiveWeights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)
    solverTimeLimitSeconds: float = Field(default=10.0, ge=1, le=300)
    enableGNN: bool = True
    enable3DPacking: bool = True
    enableExplainability: bool = True
    maxSolverIterations: int = Field(default=1000, ge=10, le=100000)


class ConsolidationRequest(BaseModel):
    shipments: List[ShipmentInput]
    trucks: List[TruckInput]
    options: ConsolidationOptions = Field(default_factory=ConsolidationOptions)


class ScenarioConfig(BaseModel):
    name: str
    maxGroupRadiusKm: float = 30
    timeWindowToleranceMinutes: float = 120
    objectiveWeights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)


class SimulationRequest(BaseModel):
    shipments: List[ShipmentInput]
    trucks: List[TruckInput]
    scenarios: List[ScenarioConfig] = Field(default_factory=list)


# ─── Output schemas ───────────────────────────────────────────────────────────

class GroupedShipment(BaseModel):
    id: str
    pickupLocation: str = ""
    dropLocation: str = ""
    weight: float = 0
    volume: float = 0


class Placement3D(BaseModel):
    """3D placement of an item within a vehicle."""
    itemId: str
    x: float = 0
    y: float = 0
    z: float = 0
    length: float = 0
    width: float = 0
    height: float = 0
    rotated: bool = False
    loadingOrder: int = 0


class LoadPlan(BaseModel):
    """Physical loading plan for a vehicle."""
    planId: str = ""
    vehicleId: str = ""
    placements: List[Placement3D] = Field(default_factory=list)
    loadingOrder: List[str] = Field(default_factory=list)
    packingScore: float = Field(default=0, ge=0, le=100)
    sequenceScore: float = Field(default=0, ge=0, le=100)
    feasible: bool = True
    warnings: List[str] = Field(default_factory=list)


class ExplanationRecord(BaseModel):
    """Explainable decision record."""
    entityId: str = ""
    entityType: str = ""  # "group", "shipment", "vehicle", "scenario"
    decisionType: str = ""  # "grouped", "rejected", "assigned", "recommended"
    message: str = ""
    reasonCodes: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0, ge=0, le=100)
    details: Dict[str, Any] = Field(default_factory=dict)


class ConsolidatedGroup(BaseModel):
    groupId: int
    truckId: str
    truckName: str = ""
    shipmentCount: int = 0
    shipments: List[GroupedShipment] = Field(default_factory=list)
    totalWeight: float = 0
    totalVolume: float = 0
    utilizationWeight: float = 0
    utilizationVolume: float = 0
    routeDistanceKm: float = 0
    confidence: int = Field(default=0, ge=0, le=100)
    capFit: float = 0
    geoScore: float = 0
    timeScore: float = 0
    # ─── New fields ───
    compatibilityScore: float = Field(default=0, ge=0, le=100)
    cargoTypes: List[str] = Field(default_factory=list)
    loadPlan: Optional[LoadPlan] = None
    explanation: Optional[ExplanationRecord] = None
    emissionKg: float = 0
    costINR: float = 0
    truckCapacity: Optional[Dict[str, float]] = None


class ConsolidationMetrics(BaseModel):
    totalShipments: int = 0
    totalGroups: int = 0
    totalTrucks: int = 0
    utilizationBefore: float = 0
    utilizationAfter: float = 0
    utilizationImprovement: float = 0
    tripsReduced: int = 0
    tripReductionPercent: float = 0
    distanceSavedKm: float = 0
    carbonSavedKg: float = 0
    carbonCreditUSD: float = 0
    fuelSavedINR: float = 0
    costSavedPercent: float = 0
    naiveTotalDistanceKm: float = 0
    consolidatedDistanceKm: float = 0
    optimizationScore: int = 0
    avgConfidence: int = 0
    # ─── New metrics ───
    totalEmissionKg: float = 0
    totalCostINR: float = 0
    emissionReductionPercent: float = 0
    avgPackingScore: float = 0
    avgSequenceScore: float = 0
    solverMethod: str = ""
    solverRuntimeMs: float = 0
    paretoSolutionsCount: int = 0
    validationIssues: int = 0
    packingFeasibilityRate: float = 100.0


class LearningInsight(BaseModel):
    type: str  # "pattern", "recommendation", "learning", "explanation", "warning"
    text: str
    impact: str  # "high", "medium", "low"
    category: str = ""  # "grouping", "optimization", "packing", "scenario", "feedback"
    entityId: str = ""
    llm_generated: bool = False


class ScenarioResultOutput(BaseModel):
    """Result of a single scenario in simulation."""
    name: str
    groups: List[ConsolidatedGroup] = Field(default_factory=list)
    metrics: ConsolidationMetrics = Field(default_factory=ConsolidationMetrics)
    insights: List[LearningInsight] = Field(default_factory=list)
    agentSteps: List[Dict[str, Any]] = Field(default_factory=list)
    recommended: bool = False
    score: float = 0


class FeedbackInput(BaseModel):
    """Feedback from actual operations."""
    runId: str
    groupId: Optional[int] = None
    shipmentId: Optional[str] = None
    actualDeliveryTime: Optional[str] = None
    actualUtilization: Optional[float] = None
    manualOverride: bool = False
    overrideReason: str = ""
    driverFeedback: str = ""
    issueType: str = ""  # "delay", "damage", "capacity_mismatch", "route_issue"
    rating: int = Field(default=3, ge=1, le=5)


class ConsolidationResult(BaseModel):
    groups: List[ConsolidatedGroup] = Field(default_factory=list)
    metrics: ConsolidationMetrics = Field(default_factory=ConsolidationMetrics)
    insights: List[LearningInsight] = Field(default_factory=list)
    agentSteps: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Agent decision log for explainability"
    )
    # ─── New fields ───
    runId: str = ""
    explanations: List[ExplanationRecord] = Field(default_factory=list)
    loadPlans: List[LoadPlan] = Field(default_factory=list)
    paretoFront: List[Dict[str, Any]] = Field(default_factory=list)
    validationReport: Dict[str, Any] = Field(default_factory=dict)


class SimulationResult(BaseModel):
    """Full simulation comparison result."""
    scenarios: List[ScenarioResultOutput] = Field(default_factory=list)
    recommendation: str = ""
    comparisonMatrix: Dict[str, Any] = Field(default_factory=dict)


# ─── LangGraph state ─────────────────────────────────────────────────────────

class ConsolidationState(BaseModel):
    """LangGraph state for the 8-agent consolidation workflow."""

    # Input
    shipments: List[Dict[str, Any]] = Field(default_factory=list)
    trucks: List[Dict[str, Any]] = Field(default_factory=list)
    options: Dict[str, Any] = Field(default_factory=dict)
    run_id: str = ""

    # Phase 1: Validation Agent output
    validated_shipments: List[Dict[str, Any]] = Field(default_factory=list)
    validated_trucks: List[Dict[str, Any]] = Field(default_factory=list)
    validation_report: Dict[str, Any] = Field(default_factory=dict)
    validation_agent_log: Optional[Dict[str, Any]] = None

    # Phase 2: Compatibility Agent output
    compatibility_graph: Dict[str, Any] = Field(default_factory=dict)
    compatibility_scores: List[Dict[str, Any]] = Field(default_factory=list)
    compatibility_agent_log: Optional[Dict[str, Any]] = None

    # Phase 3: Clustering Agent output
    candidate_groups: List[List[Dict[str, Any]]] = Field(default_factory=list)
    cluster_quality: Dict[str, Any] = Field(default_factory=dict)
    clustering_agent_log: Optional[Dict[str, Any]] = None

    # Phase 4: Optimization Agent output
    optimized_loads: List[Dict[str, Any]] = Field(default_factory=list)
    optimization_meta: Dict[str, Any] = Field(default_factory=dict)
    optimization_agent_log: Optional[Dict[str, Any]] = None

    # Phase 5: 3D Packing Agent output
    load_plans: List[Dict[str, Any]] = Field(default_factory=list)
    packing_results: Dict[str, Any] = Field(default_factory=dict)
    packing_agent_log: Optional[Dict[str, Any]] = None

    # Phase 6: Scenario Agent output
    scenario_results: List[Dict[str, Any]] = Field(default_factory=list)
    scenario_recommendation: str = ""
    scenario_agent_log: Optional[Dict[str, Any]] = None

    # Phase 7: Explainability Agent output
    explanations: List[Dict[str, Any]] = Field(default_factory=list)
    explainability_agent_log: Optional[Dict[str, Any]] = None

    # Phase 8: Feedback Agent output
    learning_updates: Dict[str, Any] = Field(default_factory=dict)
    feedback_agent_log: Optional[Dict[str, Any]] = None

    # Final outputs (assembled from agents)
    groups: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Optional[Dict[str, Any]] = None
    insights: List[Dict[str, Any]] = Field(default_factory=list)

    # Observability
    agent_steps: List[Dict[str, Any]] = Field(default_factory=list)
    workflow_start: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
