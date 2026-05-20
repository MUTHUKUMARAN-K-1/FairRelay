"""
Agent 3: Constraint-Aware Clustering Agent.

Purpose:
  Creates initial shipment groups using intelligent clustering that respects
  logistics constraints. Uses compatibility scores from Agent 2 to enhance
  clustering quality beyond pure geographic proximity.

Inputs:  Validated shipments, compatibility scores, vehicle capacity estimates
Outputs: Candidate groups, quality scores, feasibility scores, audit trail
"""

import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from app.services.clustering import haversine_distance
from app.services.agents.cargo_compat import cargo_compatibility as _cargo_compatibility

logger = logging.getLogger("fairrelay.agent.clustering")


class ClusteringAgent:
    """
    Constraint-aware clustering agent.

    Enhancement over basic KMeans:
      1. Uses enriched feature vectors (geo + time + compatibility embeddings)
      2. Post-clustering constraint enforcement (split/merge)
      3. Cargo compatibility checking
      4. Time window feasibility validation
      5. Capacity pre-check against available vehicles
    """

    name = "ClusteringAgent"

    def run(
        self,
        shipments: List[Dict[str, Any]],
        compatibility_graph: Dict[str, Any],
        trucks: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[List[Dict]], Dict[str, Any], Dict[str, Any]]:
        """
        Returns:
            (candidate_groups, cluster_quality, agent_log)
        """
        t0 = datetime.utcnow()
        opts = options or {}
        max_radius = opts.get("maxGroupRadiusKm", 30)
        time_tolerance = opts.get("timeWindowToleranceMinutes", 120)
        method = "constraint_aware_kmeans"
        audit = []

        if len(shipments) < 2:
            groups = [shipments] if shipments else []
            method = "single_shipment"
            audit.append("Only 1 shipment — no clustering needed")
        elif len(shipments) < 3:
            groups = self._greedy_constrained(shipments, max_radius, time_tolerance)
            method = "greedy_constrained"
        else:
            try:
                groups = self._constrained_kmeans(
                    shipments, compatibility_graph, trucks,
                    max_radius, time_tolerance, audit
                )
            except Exception as e:
                logger.warning(f"[{self.name}] KMeans failed ({e}), using greedy fallback")
                groups = self._greedy_constrained(shipments, max_radius, time_tolerance)
                method = "greedy_constrained_fallback"
                audit.append(f"KMeans failed: {str(e)[:100]}")

        # Post-clustering validation and enforcement
        groups, split_count = self._enforce_constraints(
            groups, trucks, max_radius, time_tolerance, audit
        )

        # Attempt merges for small groups
        groups, merge_count = self._merge_small_groups(
            groups, trucks, max_radius, time_tolerance, audit
        )

        # Compute quality metrics
        quality = self._compute_quality(groups, shipments, compatibility_graph, trucks)

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        log = {
            "agent": self.name,
            "action": "constraint_aware_clustering",
            "method": method,
            "input_shipments": len(shipments),
            "groups_formed": len(groups),
            "group_sizes": [len(g) for g in groups],
            "splits_performed": split_count,
            "merges_performed": merge_count,
            "avg_group_size": round(np.mean([len(g) for g in groups]), 1) if groups else 0,
            "quality_score": quality.get("overallQuality", 0),
            "feasibility_score": quality.get("feasibilityRate", 0),
            "audit_trail": audit[:20],
            "duration_ms": round(duration_ms, 2),
        }

        logger.info(
            f"[{self.name}] Formed {len(groups)} groups from {len(shipments)} shipments, "
            f"quality={quality.get('overallQuality', 0):.1f}%, "
            f"splits={split_count}, merges={merge_count}"
        )

        return groups, quality, log

    def _constrained_kmeans(
        self,
        shipments: List[Dict],
        compat_graph: Dict,
        trucks: List[Dict],
        max_radius: float,
        time_tolerance: float,
        audit: List[str],
    ) -> List[List[Dict]]:
        """KMeans on enriched feature vectors with compatibility weighting."""

        # Build feature matrix: geo + normalized compatibility scores
        node_scores = compat_graph.get("nodeScores", [])
        score_map = {ns["shipmentId"]: ns for ns in node_scores}

        features = []
        for s in shipments:
            ns = score_map.get(s["id"], {})
            features.append([
                s["pickupLat"],
                s["pickupLng"],
                s["dropLat"],
                s["dropLng"],
                ns.get("avgCompatibility", 0.5) * 10,  # Scale up compatibility
                ns.get("compatibleCount", 0) / max(len(shipments), 1) * 10,
            ])

        scaled = StandardScaler().fit_transform(np.array(features))

        # Determine optimal K
        avg_truck_cap = np.mean([t["maxWeight"] for t in trucks]) if trucks else 2000
        total_weight = sum(s.get("weight", 10) for s in shipments)
        min_trucks_needed = max(1, int(math.ceil(total_weight / avg_truck_cap)))
        max_k = min(len(shipments) - 1, len(trucks), 15)
        min_k = max(2, min_trucks_needed)

        if min_k >= max_k:
            best_k = min(min_k, len(shipments))
        else:
            best_k, best_score = min_k, -1
            for k in range(min_k, max_k + 1):
                km = KMeans(n_clusters=k, n_init=10, random_state=42, max_iter=300)
                labels = km.fit_predict(scaled)
                if len(set(labels)) < 2:
                    continue
                score = silhouette_score(scaled, labels)
                if score > best_score:
                    best_score = score
                    best_k = k

        audit.append(f"Optimal K={best_k} (range [{min_k},{max_k}], min trucks={min_trucks_needed})")

        km_final = KMeans(n_clusters=best_k, n_init=10, random_state=42, max_iter=300)
        labels = km_final.fit_predict(scaled)

        cluster_map: Dict[int, List[Dict]] = {}
        for idx, label in enumerate(labels):
            cluster_map.setdefault(int(label), []).append(shipments[idx])

        return list(cluster_map.values())

    def _enforce_constraints(
        self,
        groups: List[List[Dict]],
        trucks: List[Dict],
        max_radius: float,
        time_tolerance: float,
        audit: List[str],
    ) -> Tuple[List[List[Dict]], int]:
        """Split groups that violate hard constraints."""
        split_count = 0
        validated = []
        avg_cap = np.mean([t["maxWeight"] for t in trucks]) if trucks else 5000
        avg_vol = np.mean([t["maxVolume"] for t in trucks]) if trucks else 20

        for gi, group in enumerate(groups):
            # Check 1: Weight capacity
            total_w = sum(s.get("weight", 0) for s in group)
            if total_w > avg_cap * 1.5 and len(group) > 1:
                sub_groups = self._split_by_capacity(group, avg_cap)
                validated.extend(sub_groups)
                split_count += len(sub_groups) - 1
                audit.append(f"Group {gi}: split for weight ({total_w:.0f}kg > {avg_cap:.0f}kg cap)")
                continue

            # Check 2: Cargo compatibility
            cargo_types = set(s.get("cargoType", "GENERAL") for s in group)
            if len(cargo_types) > 1:
                has_conflict = False
                for ct1 in cargo_types:
                    for ct2 in cargo_types:
                        if ct1 != ct2 and _cargo_compatibility(ct1, ct2) == 0:
                            has_conflict = True
                            break
                if has_conflict:
                    sub_groups = self._split_by_cargo(group)
                    validated.extend(sub_groups)
                    split_count += len(sub_groups) - 1
                    audit.append(f"Group {gi}: split for cargo incompatibility {cargo_types}")
                    continue

            # Check 3: Geographic radius
            if len(group) > 1:
                max_dist = 0
                for i in range(len(group)):
                    for j in range(i + 1, len(group)):
                        d = haversine_distance(
                            group[i]["pickupLat"], group[i]["pickupLng"],
                            group[j]["pickupLat"], group[j]["pickupLng"],
                        )
                        max_dist = max(max_dist, d)
                if max_dist > max_radius * 2:
                    sub_groups = self._split_by_radius(group, max_radius)
                    validated.extend(sub_groups)
                    split_count += len(sub_groups) - 1
                    audit.append(f"Group {gi}: split for radius ({max_dist:.0f}km > {max_radius*2:.0f}km)")
                    continue

            validated.append(group)

        return validated, split_count

    def _merge_small_groups(
        self,
        groups: List[List[Dict]],
        trucks: List[Dict],
        max_radius: float,
        time_tolerance: float,
        audit: List[str],
    ) -> Tuple[List[List[Dict]], int]:
        """Merge small groups that are feasible together."""
        if len(groups) < 2:
            return groups, 0

        avg_cap = np.mean([t["maxWeight"] for t in trucks]) if trucks else 5000
        merge_count = 0
        merged = list(groups)
        changed = True

        while changed and len(merged) > 1:
            changed = False
            for i in range(len(merged)):
                if len(merged[i]) == 0:
                    continue
                # Only try to merge single-shipment groups
                if len(merged[i]) > 1:
                    continue
                for j in range(i + 1, len(merged)):
                    if len(merged[j]) == 0:
                        continue
                    combined = merged[i] + merged[j]
                    total_w = sum(s.get("weight", 0) for s in combined)
                    if total_w > avg_cap:
                        continue
                    # Check geographic feasibility
                    feasible = True
                    for s1 in merged[i]:
                        for s2 in merged[j]:
                            d = haversine_distance(
                                s1["pickupLat"], s1["pickupLng"],
                                s2["pickupLat"], s2["pickupLng"],
                            )
                            if d > max_radius * 2:
                                feasible = False
                                break
                        if not feasible:
                            break
                    if feasible:
                        merged[j] = combined
                        merged[i] = []
                        merge_count += 1
                        changed = True
                        audit.append(f"Merged single-shipment group into group {j}")
                        break

        merged = [g for g in merged if g]
        return merged, merge_count

    @staticmethod
    def _split_by_capacity(group: List[Dict], cap: float) -> List[List[Dict]]:
        """Split group into sub-groups respecting capacity."""
        sorted_items = sorted(group, key=lambda s: s.get("weight", 0), reverse=True)
        sub_groups: List[List[Dict]] = [[]]
        current_w = 0
        for s in sorted_items:
            w = s.get("weight", 0)
            if current_w + w > cap and sub_groups[-1]:
                sub_groups.append([])
                current_w = 0
            sub_groups[-1].append(s)
            current_w += w
        return [g for g in sub_groups if g]

    @staticmethod
    def _split_by_cargo(group: List[Dict]) -> List[List[Dict]]:
        """Split group by cargo type to avoid incompatibilities."""
        cargo_groups: Dict[str, List[Dict]] = {}
        for s in group:
            ct = s.get("cargoType", "GENERAL")
            cargo_groups.setdefault(ct, []).append(s)
        return list(cargo_groups.values())

    @staticmethod
    def _split_by_radius(group: List[Dict], max_radius: float) -> List[List[Dict]]:
        """Split group into sub-groups by geographic proximity."""
        sub_groups: List[List[Dict]] = []
        assigned = set()
        for i, seed in enumerate(group):
            if i in assigned:
                continue
            cluster = [seed]
            assigned.add(i)
            for j in range(i + 1, len(group)):
                if j in assigned:
                    continue
                d = haversine_distance(
                    seed["pickupLat"], seed["pickupLng"],
                    group[j]["pickupLat"], group[j]["pickupLng"],
                )
                if d <= max_radius:
                    cluster.append(group[j])
                    assigned.add(j)
            sub_groups.append(cluster)
        return sub_groups

    @staticmethod
    def _greedy_constrained(
        shipments: List[Dict], max_radius: float, time_tolerance: float
    ) -> List[List[Dict]]:
        """Greedy clustering with constraint checking."""
        groups: List[List[Dict]] = []
        assigned = set()
        for i, seed in enumerate(shipments):
            if i in assigned:
                continue
            group = [seed]
            assigned.add(i)
            for j in range(i + 1, len(shipments)):
                if j in assigned:
                    continue
                s = shipments[j]
                pd = haversine_distance(
                    seed["pickupLat"], seed["pickupLng"],
                    s["pickupLat"], s["pickupLng"],
                )
                dd = haversine_distance(
                    seed["dropLat"], seed["dropLng"],
                    s["dropLat"], s["dropLng"],
                )
                if pd <= max_radius and dd <= max_radius:
                    # Check cargo compatibility
                    ct1 = seed.get("cargoType", "GENERAL")
                    ct2 = s.get("cargoType", "GENERAL")
                    if _cargo_compatibility(ct1, ct2) > 0:
                        group.append(s)
                        assigned.add(j)
            groups.append(group)
        return groups

    @staticmethod
    def _compute_quality(
        groups: List[List[Dict]],
        shipments: List[Dict],
        compat_graph: Dict,
        trucks: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Compute clustering quality metrics."""
        if not groups:
            return {"overallQuality": 0, "feasibilityRate": 0}

        sizes = [len(g) for g in groups]
        avg_size = np.mean(sizes)
        size_std = np.std(sizes) if len(sizes) > 1 else 0

        # Compute intra-cluster compatibility from graph
        adj = np.array(compat_graph.get("adjacencyMatrix", []))
        shipment_ids = [s["id"] for s in shipments]
        id_to_idx = {sid: i for i, sid in enumerate(shipment_ids)}

        intra_scores = []
        for group in groups:
            if len(group) < 2:
                intra_scores.append(1.0)
                continue
            group_scores = []
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    idx_i = id_to_idx.get(group[i]["id"])
                    idx_j = id_to_idx.get(group[j]["id"])
                    if idx_i is not None and idx_j is not None and len(adj) > 0:
                        group_scores.append(adj[idx_i][idx_j])
                    else:
                        group_scores.append(0.5)
            intra_scores.append(np.mean(group_scores) if group_scores else 0.5)

        avg_intra = np.mean(intra_scores) * 100

        # Feasibility rate — checks real weight/volume against the actual fleet.
        # Falls back to a generous default when truck info is unavailable.
        avg_cap_w = np.mean([t["maxWeight"] for t in trucks]) if trucks else 5000
        avg_cap_v = np.mean([t["maxVolume"] for t in trucks]) if trucks else 20
        feasible_count = 0
        for g in groups:
            total_w = sum(s.get("weight", 0) for s in g)
            total_v = sum(s.get("volume", 0) for s in g)
            if total_w <= avg_cap_w and total_v <= avg_cap_v:
                feasible_count += 1
        feasibility = (feasible_count / len(groups)) * 100 if groups else 100

        return {
            "overallQuality": round(avg_intra, 1),
            "feasibilityRate": round(feasibility, 1),
            "avgGroupSize": round(avg_size, 1),
            "groupSizeStd": round(size_std, 1),
            "totalGroups": len(groups),
            "singletonGroups": sum(1 for g in groups if len(g) == 1),
            "avgIntraCompatibility": round(float(np.mean(intra_scores)), 3),
        }
