"""
8-Agent Consolidation Engine — Agent Modules Package.

Agents:
  1. ValidationAgent       — Data ingestion & validation
  2. CompatibilityAgent    — GNN-based compatibility scoring
  3. ClusteringAgent       — Constraint-aware clustering
  4. OptimizationAgent     — Hybrid optimization (CP-SAT + GA + ALNS)
  5. PackingAgent          — 3D loading & sequence validation
  6. ScenarioAgent         — Multi-scenario simulation
  7. ExplainabilityAgent   — Decision explanations
  8. FeedbackAgent         — Continuous learning
"""

from app.services.agents.validation_agent import ValidationAgent
from app.services.agents.compatibility_agent import CompatibilityAgent
from app.services.agents.clustering_agent import ClusteringAgent
from app.services.agents.optimization_agent import OptimizationAgent
from app.services.agents.packing_agent import PackingAgent
from app.services.agents.scenario_agent import ScenarioAgent
from app.services.agents.explainability_agent import ExplainabilityAgent
from app.services.agents.feedback_agent import FeedbackAgent

__all__ = [
    "ValidationAgent",
    "CompatibilityAgent",
    "ClusteringAgent",
    "OptimizationAgent",
    "PackingAgent",
    "ScenarioAgent",
    "ExplainabilityAgent",
    "FeedbackAgent",
]
