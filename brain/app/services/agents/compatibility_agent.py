"""
Agent 2: Compatibility Intelligence Agent (GNN + Heuristic Fallback).

Purpose:
  Score pairwise shipment compatibility for consolidation potential.
  Uses a multi-factor heuristic scoring system with optional GNN enhancement.

Inputs:  Validated shipments, route/time/cargo metadata
Outputs: Compatibility graph with edge scores, explanation features, confidence
"""

import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from app.services.clustering import haversine_distance
from app.services.agents.cargo_compat import (
    INCOMPATIBLE_PAIRS,
    CARGO_COMPAT,
    cargo_compatibility as _cargo_compatibility,
)

logger = logging.getLogger("fairrelay.agent.compatibility")


class CompatibilityAgent:
    """
    Scores pairwise shipment compatibility using multi-factor heuristics.

    Factors:
      - Geographic proximity (pickup + drop distance)
      - Time window overlap
      - Cargo type compatibility
      - Weight/volume ratio similarity
      - Priority alignment
      - Route direction similarity (corridor match)

    Falls back to heuristic scoring when GNN is unavailable.
    """

    name = "CompatibilityAgent"

    # Scoring weights
    W_GEO = 0.30
    W_TIME = 0.20
    W_CARGO = 0.20
    W_CAPACITY = 0.15
    W_ROUTE = 0.10
    W_PRIORITY = 0.05

    def run(
        self,
        shipments: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Dict[str, Any]]:
        """
        Returns:
            (compatibility_graph, compatibility_scores, agent_log)
        """
        t0 = datetime.utcnow()
        opts = options or {}
        max_radius = opts.get("maxGroupRadiusKm", 30)
        use_gnn = opts.get("enableGNN", True)

        n = len(shipments)
        # method stays heuristic until GNN inference is actually wired up.
        # gnn_available signals the model *could* be loaded, not that it was used.
        method = "heuristic_multi_factor"
        gnn_available = False

        if use_gnn:
            try:
                from app.services.agents.gnn_model import GNNCompatibilityModel  # noqa: F401
                gnn_available = True
                # method intentionally left as heuristic_multi_factor until
                # GNN inference path is wired up (see Issue #3).
            except ImportError:
                logger.info(f"[{self.name}] PyTorch/PyG not available, using heuristic fallback")

        # Build pairwise compatibility scores
        edges: List[Dict[str, Any]] = []
        adj_matrix = np.zeros((n, n))

        for i in range(n):
            for j in range(i + 1, n):
                score, factors = self._compute_pairwise_score(
                    shipments[i], shipments[j], max_radius
                )
                adj_matrix[i][j] = score
                adj_matrix[j][i] = score

                if score > 0.1:  # Only store meaningful edges
                    edges.append({
                        "source": shipments[i]["id"],
                        "target": shipments[j]["id"],
                        "sourceIdx": i,
                        "targetIdx": j,
                        "score": round(score, 3),
                        "factors": factors,
                    })

        # Compute node-level compatibility (avg edge score per node)
        node_scores = []
        for i in range(n):
            if n > 1:
                avg_score = float(np.sum(adj_matrix[i]) / (n - 1))
            else:
                avg_score = 1.0
            node_scores.append({
                "shipmentId": shipments[i]["id"],
                "avgCompatibility": round(avg_score, 3),
                "maxCompatibility": round(float(np.max(adj_matrix[i])) if n > 1 else 1.0, 3),
                "compatibleCount": int(np.sum(adj_matrix[i] > 0.5)),
            })

        graph = {
            "nodeCount": n,
            "edgeCount": len(edges),
            "method": method,
            "avgScore": round(float(np.mean(adj_matrix[adj_matrix > 0])) if np.any(adj_matrix > 0) else 0, 3),
            "edges": edges,
            "nodeScores": node_scores,
            "adjacencyMatrix": adj_matrix.tolist(),
        }

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        log = {
            "agent": self.name,
            "action": "compatibility_scoring",
            "method": method,
            "gnn_available": gnn_available,
            "shipments_analyzed": n,
            "edges_computed": len(edges),
            "avg_compatibility": graph["avgScore"],
            "high_compat_pairs": sum(1 for e in edges if e["score"] > 0.7),
            "duration_ms": round(duration_ms, 2),
        }

        logger.info(
            f"[{self.name}] Scored {len(edges)} pairs, "
            f"avg={graph['avgScore']:.2f}, method={method}"
        )

        return graph, edges, log

    def _compute_pairwise_score(
        self, s1: Dict, s2: Dict, max_radius: float
    ) -> Tuple[float, Dict[str, float]]:
        """Compute compatibility between two shipments."""

        # 1. Geographic proximity
        pickup_dist = haversine_distance(
            s1["pickupLat"], s1["pickupLng"],
            s2["pickupLat"], s2["pickupLng"]
        )
        drop_dist = haversine_distance(
            s1["dropLat"], s1["dropLng"],
            s2["dropLat"], s2["dropLng"]
        )
        avg_dist = (pickup_dist + drop_dist) / 2
        geo_score = max(0, 1 - (avg_dist / (max_radius * 2)))

        # 2. Time window overlap
        time_score = self._time_overlap_score(s1, s2)

        # 3. Cargo compatibility
        cargo_a = s1.get("cargoType", "GENERAL")
        cargo_b = s2.get("cargoType", "GENERAL")
        cargo_score = _cargo_compatibility(cargo_a, cargo_b)

        # 4. Capacity fit (similar weight/volume ratio = good for balanced loads)
        w1, w2 = s1.get("weight", 10), s2.get("weight", 10)
        v1, v2 = s1.get("volume", 0.1), s2.get("volume", 0.1)
        weight_ratio = min(w1, w2) / max(w1, w2, 0.01)
        volume_ratio = min(v1, v2) / max(v1, v2, 0.01)
        capacity_score = (weight_ratio + volume_ratio) / 2

        # 5. Route direction similarity (dot product of direction vectors)
        route_score = self._route_direction_score(s1, s2)

        # 6. Priority alignment
        prio_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
        p1 = prio_map.get(s1.get("priority", "MEDIUM"), 2)
        p2 = prio_map.get(s2.get("priority", "MEDIUM"), 2)
        priority_score = 1.0 - abs(p1 - p2) / 3

        # Weighted combination
        total = (
            self.W_GEO * geo_score
            + self.W_TIME * time_score
            + self.W_CARGO * cargo_score
            + self.W_CAPACITY * capacity_score
            + self.W_ROUTE * route_score
            + self.W_PRIORITY * priority_score
        )

        # Hard constraint: incompatible cargo = 0
        if cargo_score == 0:
            total = 0

        factors = {
            "geo": round(geo_score, 3),
            "time": round(time_score, 3),
            "cargo": round(cargo_score, 3),
            "capacity": round(capacity_score, 3),
            "route": round(route_score, 3),
            "priority": round(priority_score, 3),
        }

        return round(total, 3), factors

    @staticmethod
    def _time_overlap_score(s1: Dict, s2: Dict) -> float:
        """Calculate time window overlap ratio."""
        def parse_ts(ts_str):
            if not ts_str:
                return None
            try:
                return datetime.fromisoformat(ts_str.replace("Z", "+00:00")).timestamp()
            except Exception:
                return None

        start1 = parse_ts(s1.get("timeWindowStart"))
        end1 = parse_ts(s1.get("timeWindowEnd"))
        start2 = parse_ts(s2.get("timeWindowStart"))
        end2 = parse_ts(s2.get("timeWindowEnd"))

        # If either has no time window, assume fully compatible
        if not start1 or not end1 or not start2 or not end2:
            return 0.8

        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)

        if overlap_end <= overlap_start:
            return 0  # No overlap

        overlap_duration = overlap_end - overlap_start
        max_duration = max(end1 - start1, end2 - start2, 1)
        return min(overlap_duration / max_duration, 1.0)

    @staticmethod
    def _route_direction_score(s1: Dict, s2: Dict) -> float:
        """Score route direction similarity using cosine similarity of direction vectors."""
        dx1 = s1["dropLat"] - s1["pickupLat"]
        dy1 = s1["dropLng"] - s1["pickupLng"]
        dx2 = s2["dropLat"] - s2["pickupLat"]
        dy2 = s2["dropLng"] - s2["pickupLng"]

        mag1 = math.sqrt(dx1 ** 2 + dy1 ** 2)
        mag2 = math.sqrt(dx2 ** 2 + dy2 ** 2)

        if mag1 < 1e-6 or mag2 < 1e-6:
            return 0.5

        cos_sim = (dx1 * dx2 + dy1 * dy2) / (mag1 * mag2)
        return max(0, (cos_sim + 1) / 2)  # Normalize [-1,1] -> [0,1]
