"""
Agent 8: Feedback Learning Agent.

Continuously improves the system from actual operations:
  - Stores experience records
  - Updates Q-table for parameter optimization
  - Detects patterns and trends
  - Recommends future parameters
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger("fairrelay.agent.feedback")

_STORE_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "rl_experience.json"
_FEEDBACK_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "feedback_records.json"


class FeedbackStore:
    def __init__(self, path: Path, max_entries: int = 500):
        self.path = path
        self.max_entries = max_entries

    def load(self) -> List[Dict]:
        if not self.path.exists():
            return []
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def save(self, entries: List[Dict]):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(entries[-self.max_entries:], f, indent=2, default=str)

    def add(self, entry: Dict):
        entries = self.load()
        entries.append(entry)
        self.save(entries)


class FeedbackAgent:
    name = "FeedbackAgent"
    RADIUS_BUCKETS = [10, 20, 30, 50, 75, 100]
    TOLERANCE_BUCKETS = [30, 60, 120, 180, 240, 360]
    LEARNING_RATE = 0.3

    def __init__(self):
        self.experience_store = FeedbackStore(_STORE_PATH)
        self.feedback_store = FeedbackStore(_FEEDBACK_PATH, max_entries=1000)

    def run(
        self,
        shipments: List[Dict],
        groups: List[Dict],
        metrics: Dict,
        options: Optional[Dict] = None,
    ) -> Tuple[Dict[str, Any], List[Dict], Dict[str, Any]]:
        """Returns: (learning_updates, insights, agent_log)"""
        t0 = datetime.utcnow()
        insights = []

        # Record experience
        reward = self._compute_reward(metrics)
        experience = {
            "timestamp": datetime.utcnow().isoformat(),
            "n_shipments": len(shipments),
            "n_groups": len(groups),
            "radius_km": (options or {}).get("maxGroupRadiusKm", 30),
            "tolerance_min": (options or {}).get("timeWindowToleranceMinutes", 120),
            "utilization_after": metrics.get("utilizationAfter", 0),
            "trips_reduced": metrics.get("tripsReduced", 0),
            "optimization_score": metrics.get("optimizationScore", 0),
            "carbon_saved_kg": metrics.get("carbonSavedKg", 0),
            "packing_score": metrics.get("avgPackingScore", 80),
            "reward": reward,
        }
        self.experience_store.add(experience)

        # Build Q-table
        history = self.experience_store.load()
        q_table = self._build_q_table(history)
        best_action = self._best_action(q_table)
        ep_count = len(history)

        # Parameter recommendation
        if best_action and ep_count >= 2:
            br, bt = best_action
            insights.append({
                "type": "learning",
                "text": f"RL agent ({ep_count} episodes): Optimal params → radius={br}km, tolerance={bt}min "
                        f"(Q={q_table.get(best_action, 0):.1f}). Current reward: {reward:.1f}/100.",
                "impact": "high", "category": "feedback",
            })

        # Trend analysis
        if ep_count >= 3:
            recent = history[-5:]
            older = history[:-5] if len(history) > 5 else history[:1]
            avg_r = np.mean([e["reward"] for e in recent])
            avg_o = np.mean([e["reward"] for e in older])
            delta = avg_r - avg_o
            if delta > 5:
                insights.append({
                    "type": "learning",
                    "text": f"Policy converging: reward ↑ {delta:.1f} over last {len(recent)} runs.",
                    "impact": "high", "category": "feedback",
                })
            elif delta < -5:
                insights.append({
                    "type": "recommendation",
                    "text": f"Performance declining: reward ↓ {abs(delta):.1f}. Consider reverting parameters.",
                    "impact": "medium", "category": "feedback",
                })

        # Utilization report
        insights.append({
            "type": "pattern",
            "text": f"Utilization: {metrics.get('utilizationBefore', 0):.1f}% → {metrics.get('utilizationAfter', 0):.1f}% "
                    f"(+{metrics.get('utilizationImprovement', 0):.1f}pp). "
                    f"{len(groups)} trucks for {metrics.get('totalShipments', 0)} shipments.",
            "impact": "high", "category": "feedback",
        })

        # Group accuracy
        if groups:
            high_conf = sum(1 for g in groups if g.get("confidence", 0) >= 75)
            accuracy = (high_conf / len(groups)) * 100
            insights.append({
                "type": "learning",
                "text": f"Grouping accuracy: {accuracy:.0f}% ({high_conf}/{len(groups)} groups ≥75% confidence).",
                "impact": "high" if accuracy >= 90 else "medium", "category": "feedback",
            })

        learning_updates = {
            "reward": round(reward, 2),
            "episodeCount": ep_count,
            "bestAction": {"radius": best_action[0], "tolerance": best_action[1]} if best_action else None,
            "qTableSize": len(q_table),
        }

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        log = {
            "agent": self.name, "action": "feedback_learning",
            "method": "q_learning_tabular", "episodes": ep_count,
            "reward": round(reward, 2),
            "best_action": f"r={best_action[0]},t={best_action[1]}" if best_action else "exploring",
            "insights_generated": len(insights),
            "duration_ms": round(duration_ms, 2),
        }
        return learning_updates, insights, log

    def record_feedback(self, feedback: Dict):
        """Record operational feedback for future learning."""
        feedback["recorded_at"] = datetime.utcnow().isoformat()
        self.feedback_store.add(feedback)

    @staticmethod
    def _compute_reward(metrics: Dict) -> float:
        util = min(metrics.get("utilizationImprovement", 0), 60)
        trip = min(metrics.get("tripReductionPercent", 0), 80)
        score = min(metrics.get("optimizationScore", 0), 100)
        carbon = min(metrics.get("carbonSavedKg", 0) / 2, 50)
        packing = min(metrics.get("avgPackingScore", 80), 100)
        return min(max(
            0.30 * (util / 60) * 100 + 0.20 * (trip / 80) * 100 +
            0.20 * score + 0.15 * (carbon / 50) * 100 + 0.15 * packing, 0), 100)

    def _build_q_table(self, history: List[Dict]) -> Dict[tuple, float]:
        q, counts = {}, {}
        for exp in history:
            rb = self._nearest(exp.get("radius_km", 30), self.RADIUS_BUCKETS)
            tb = self._nearest(exp.get("tolerance_min", 120), self.TOLERANCE_BUCKETS)
            action = (rb, tb)
            reward = exp.get("reward", 0)
            n = counts.get(action, 0)
            old = q.get(action, 0)
            alpha = self.LEARNING_RATE / (1 + n * 0.1)
            q[action] = old + alpha * (reward - old)
            counts[action] = n + 1
        return q

    @staticmethod
    def _best_action(q_table):
        return max(q_table, key=q_table.get) if q_table else None

    @staticmethod
    def _nearest(val, buckets):
        return min(buckets, key=lambda b: abs(b - val))
