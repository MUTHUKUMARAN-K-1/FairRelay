"""
Agent 4: Hybrid Optimization Agent (CP-SAT + GA + ALNS).

Solves shipment-to-vehicle assignment with multi-objective optimization.
Auto-selects strategy based on problem size.
"""

import logging
import math
import random
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from ortools.sat.python import cp_model

from app.services.clustering import haversine_distance

logger = logging.getLogger("fairrelay.agent.optimization")


class OptimizationAgent:
    name = "OptimizationAgent"

    def run(
        self,
        groups: List[List[Dict]],
        trucks: List[Dict],
        options: Optional[Dict] = None,
    ) -> Tuple[List[Dict], Dict[str, Any], Dict[str, Any]]:
        t0 = datetime.utcnow()
        opts = options or {}
        time_limit = opts.get("solverTimeLimitSeconds", 10.0)
        weights = opts.get("objectiveWeights", {})
        w_cost = weights.get("cost", 0.3)
        w_emit = weights.get("emissions", 0.2)
        w_util = weights.get("utilization", 0.3)
        w_svc = weights.get("service", 0.2)

        all_shipments = [s for g in groups for s in g]
        n = len(all_shipments)

        if n == 0 or not trucks:
            return [], {"method": "empty", "solverRuntimeMs": 0}, {
                "agent": self.name, "action": "optimization", "method": "empty",
                "duration_ms": 0
            }

        # Auto-select strategy
        if n <= 40:
            bins, method = self._cpsat_solve(groups, trucks, time_limit, w_cost, w_emit, w_util)
        elif n <= 200:
            bins, method = self._genetic_solve(groups, trucks, time_limit, w_cost, w_emit, w_util)
        else:
            bins, method = self._local_search_solve(groups, trucks, time_limit, w_cost, w_emit, w_util)

        if not bins:
            bins, method = self._ffd_fallback(groups, trucks)
            method = "ffd_heuristic_fallback"

        # Build scoring
        scored_bins = self._score_bins(bins, all_shipments, trucks, w_cost, w_emit, w_util, w_svc)

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        meta = {
            "method": method,
            "solverRuntimeMs": round(duration_ms, 2),
            "binsProduced": len(scored_bins),
            "totalShipments": n,
            "trucksUsed": len(scored_bins),
            "trucksAvailable": len(trucks),
        }
        log = {
            "agent": self.name, "action": "hybrid_optimization", "method": method,
            "input_groups": len(groups), "input_shipments": n,
            "trucks_available": len(trucks), "bins_packed": len(scored_bins),
            "duration_ms": round(duration_ms, 2),
        }
        return scored_bins, meta, log

    def _cpsat_solve(self, groups, trucks, time_limit, w_cost, w_emit, w_util):
        model = cp_model.CpModel()
        all_s = []
        gids = []
        for gi, grp in enumerate(groups):
            for s in grp:
                all_s.append(s)
                gids.append(gi)
        n_items = len(all_s)
        n_trucks = len(trucks)
        if n_items == 0 or n_trucks == 0:
            return [], "cpsat_empty"

        SCALE = 10
        weights = [int(s.get("weight", 0) * SCALE) for s in all_s]
        volumes = [int(s.get("volume", 0) * SCALE) for s in all_s]
        max_w = [int(t["maxWeight"] * SCALE) for t in trucks]
        max_v = [int(t["maxVolume"] * SCALE) for t in trucks]

        x = {}
        for i in range(n_items):
            for j in range(n_trucks):
                x[i, j] = model.NewBoolVar(f"x_{i}_{j}")
        y = [model.NewBoolVar(f"y_{j}") for j in range(n_trucks)]

        for i in range(n_items):
            model.Add(sum(x[i, j] for j in range(n_trucks)) == 1)
        for j in range(n_trucks):
            model.Add(sum(weights[i] * x[i, j] for i in range(n_items)) <= max_w[j])
            model.Add(sum(volumes[i] * x[i, j] for i in range(n_items)) <= max_v[j])
            for i in range(n_items):
                model.Add(x[i, j] <= y[j])

        # Cargo compatibility: incompatible shipments can't share truck
        from app.services.agents.compatibility_agent import _cargo_compatibility
        for i in range(n_items):
            for k in range(i + 1, n_items):
                ct1 = all_s[i].get("cargoType", "GENERAL")
                ct2 = all_s[k].get("cargoType", "GENERAL")
                if _cargo_compatibility(ct1, ct2) == 0:
                    for j in range(n_trucks):
                        model.Add(x[i, j] + x[k, j] <= 1)

        # Cost terms per truck (emission factor)
        cost_terms = []
        for j in range(n_trucks):
            ef = int(trucks[j].get("emissionFactor", 0.21) * 100)
            cpk = int(trucks[j].get("costPerKm", 15) * 10)
            cost_terms.append(y[j] * (1000 + ef + cpk))

        model.Minimize(sum(cost_terms))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = min(time_limit, 10.0)
        status = solver.Solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return [], "cpsat_infeasible"

        truck_bins = {}
        for i in range(n_items):
            for j in range(n_trucks):
                if solver.Value(x[i, j]) == 1:
                    if j not in truck_bins:
                        truck_bins[j] = {"truck": trucks[j], "shipments": [], "usedW": 0, "usedV": 0}
                    truck_bins[j]["shipments"].append(all_s[i])
                    truck_bins[j]["usedW"] += all_s[i].get("weight", 0)
                    truck_bins[j]["usedV"] += all_s[i].get("volume", 0)
                    break

        method = "cpsat_optimal" if status == cp_model.OPTIMAL else "cpsat_feasible"
        return list(truck_bins.values()), method

    def _genetic_solve(self, groups, trucks, time_limit, w_cost, w_emit, w_util):
        all_s = [s for g in groups for s in g]
        n = len(all_s)
        nt = len(trucks)
        if n == 0 or nt == 0:
            return [], "ga_empty"

        POP = 50
        GENS = min(100, int(time_limit * 20))
        ELITE = 5

        def fitness(chrom):
            bins = {}
            for i, tj in enumerate(chrom):
                j = tj % nt
                if j not in bins:
                    bins[j] = {"w": 0, "v": 0, "count": 0}
                bins[j]["w"] += all_s[i].get("weight", 0)
                bins[j]["v"] += all_s[i].get("volume", 0)
                bins[j]["count"] += 1
            penalty = 0
            util_sum = 0
            for j, b in bins.items():
                if b["w"] > trucks[j]["maxWeight"]:
                    penalty += (b["w"] - trucks[j]["maxWeight"]) * 10
                if b["v"] > trucks[j]["maxVolume"]:
                    penalty += (b["v"] - trucks[j]["maxVolume"]) * 10
                util_sum += b["w"] / trucks[j]["maxWeight"]
            trucks_used = len(bins)
            avg_util = (util_sum / trucks_used) if trucks_used > 0 else 0
            return avg_util * 100 * w_util - trucks_used * 50 * w_cost - penalty

        pop = [[random.randint(0, nt - 1) for _ in range(n)] for _ in range(POP)]
        best_chrom = None
        best_fit = -1e18

        for gen in range(GENS):
            fits = [(fitness(c), c) for c in pop]
            fits.sort(key=lambda x: -x[0])
            if fits[0][0] > best_fit:
                best_fit = fits[0][0]
                best_chrom = fits[0][1][:]

            new_pop = [f[1] for f in fits[:ELITE]]
            while len(new_pop) < POP:
                p1 = random.choice(fits[:POP // 2])[1]
                p2 = random.choice(fits[:POP // 2])[1]
                cx = random.randint(1, n - 1)
                child = p1[:cx] + p2[cx:]
                if random.random() < 0.15:
                    mi = random.randint(0, n - 1)
                    child[mi] = random.randint(0, nt - 1)
                new_pop.append(child)
            pop = new_pop

        if best_chrom is None:
            return [], "ga_failed"

        truck_bins = {}
        for i, tj in enumerate(best_chrom):
            j = tj % nt
            if j not in truck_bins:
                truck_bins[j] = {"truck": trucks[j], "shipments": [], "usedW": 0, "usedV": 0}
            truck_bins[j]["shipments"].append(all_s[i])
            truck_bins[j]["usedW"] += all_s[i].get("weight", 0)
            truck_bins[j]["usedV"] += all_s[i].get("volume", 0)
        return list(truck_bins.values()), "genetic_algorithm"

    def _local_search_solve(self, groups, trucks, time_limit, w_cost, w_emit, w_util):
        """FFD + greedy 1-move local-search improvement for large instances (n > 200).

        Not a full ALNS implementation — uses a simple relocate loop without
        destroy/repair operators or a simulated-annealing temperature schedule.
        Renamed from _alns_solve to avoid misleading maintainers.
        """
        bins, _ = self._ffd_fallback(groups, trucks)
        if not bins:
            return [], "local_search_empty"

        # Simple local search improvement
        improved = True
        iterations = 0
        max_iter = min(500, int(time_limit * 50))
        while improved and iterations < max_iter:
            improved = False
            iterations += 1
            for bi in range(len(bins)):
                for bj in range(bi + 1, len(bins)):
                    if not bins[bi]["shipments"] or not bins[bj]["shipments"]:
                        continue
                    si = random.randint(0, len(bins[bi]["shipments"]) - 1)
                    s = bins[bi]["shipments"][si]
                    sw = s.get("weight", 0)
                    sv = s.get("volume", 0)
                    if (bins[bj]["usedW"] + sw <= bins[bj]["truck"]["maxWeight"] and
                            bins[bj]["usedV"] + sv <= bins[bj]["truck"]["maxVolume"]):
                        bins[bj]["shipments"].append(s)
                        bins[bj]["usedW"] += sw
                        bins[bj]["usedV"] += sv
                        bins[bi]["shipments"].pop(si)
                        bins[bi]["usedW"] -= sw
                        bins[bi]["usedV"] -= sv
                        improved = True
                        break
                if improved:
                    break

        bins = [b for b in bins if b["shipments"]]
        return bins, "ffd_local_search"

    @staticmethod
    def _ffd_fallback(groups, trucks):
        bins = []
        pool = list(trucks)
        for grp in groups:
            if not pool:
                if bins:
                    target = min(bins, key=lambda b: b["usedW"])
                    for s in grp:
                        target["shipments"].append(s)
                        target["usedW"] += s.get("weight", 0)
                        target["usedV"] += s.get("volume", 0)
                continue
            sorted_s = sorted(grp, key=lambda s: s.get("weight", 0), reverse=True)
            local = [{"truck": t, "shipments": [], "usedW": 0, "usedV": 0} for t in pool]
            for s in sorted_s:
                w, v = s.get("weight", 0), s.get("volume", 0)
                placed = False
                for b in local:
                    if b["usedW"] + w <= b["truck"]["maxWeight"] and b["usedV"] + v <= b["truck"]["maxVolume"]:
                        b["shipments"].append(s)
                        b["usedW"] += w
                        b["usedV"] += v
                        placed = True
                        break
                if not placed and local:
                    local[-1]["shipments"].append(s)
                    local[-1]["usedW"] += w
                    local[-1]["usedV"] += v
            filled = [b for b in local if b["shipments"]]
            bins.extend(filled)
            used_ids = {b["truck"]["id"] for b in filled}
            pool = [t for t in pool if t["id"] not in used_ids]
        return bins, "ffd_heuristic"

    def _score_bins(self, bins, all_shipments, trucks, w_cost, w_emit, w_util, w_svc):
        """Score each bin with multi-objective metrics."""
        scored = []
        for i, b in enumerate(bins):
            ss = b["shipments"]
            truck = b["truck"]
            cap_w = (b["usedW"] / truck["maxWeight"]) * 100 if truck["maxWeight"] > 0 else 0
            cap_v = (b["usedV"] / truck["maxVolume"]) * 100 if truck["maxVolume"] > 0 else 0

            # Route distance
            if len(ss) == 1:
                dist = haversine_distance(ss[0]["pickupLat"], ss[0]["pickupLng"],
                                          ss[0]["dropLat"], ss[0]["dropLng"])
            else:
                pickups = [(s["pickupLat"], s["pickupLng"]) for s in ss]
                drops = [(s["dropLat"], s["dropLng"]) for s in ss]
                dist = self._tour_km(pickups) + haversine_distance(
                    np.mean([p[0] for p in pickups]), np.mean([p[1] for p in pickups]),
                    np.mean([d[0] for d in drops]), np.mean([d[1] for d in drops])
                ) + self._tour_km(drops)

            emission = dist * truck.get("emissionFactor", 0.21)
            cost = dist * truck.get("costPerKm", 15)

            scored.append({
                "truck": truck, "shipments": ss,
                "usedW": b["usedW"], "usedV": b["usedV"],
                "utilizationWeight": round(min(cap_w, 100), 1),
                "utilizationVolume": round(min(cap_v, 100), 1),
                "routeDistanceKm": round(dist, 1),
                "emissionKg": round(emission, 2),
                "costINR": round(cost, 1),
            })
        return scored

    @staticmethod
    def _tour_km(pts):
        if len(pts) <= 1:
            return 0
        rem = list(pts)
        cur = rem.pop(0)
        d = 0
        while rem:
            nxt = min(rem, key=lambda p: haversine_distance(cur[0], cur[1], p[0], p[1]))
            d += haversine_distance(cur[0], cur[1], nxt[0], nxt[1])
            cur = nxt
            rem.remove(nxt)
        return d
