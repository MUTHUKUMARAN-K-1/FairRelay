"""
Agent 1: Data Ingestion & Validation Agent.

Purpose:
  Validates shipment, vehicle, and item data before any optimization runs.
  Detects missing fields, invalid values, coordinate errors, and time window issues.
  Generates canonical domain objects and a detailed issue report.

Inputs:  Raw shipment + vehicle records
Outputs: Validated objects + issue report + normalization log
"""

import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Tuple

from app.services.agents.cargo_compat import is_incompatible as _is_incompatible  # noqa: F401

logger = logging.getLogger("fairrelay.agent.validation")

# Backward-compat alias (used only inside this module)
_is_incompatible = _is_incompatible  # noqa: F811


class ValidationAgent:
    """Validates and normalizes all input data before optimization."""

    name = "ValidationAgent"

    def run(
        self,
        shipments: List[Dict[str, Any]],
        trucks: List[Dict[str, Any]],
    ) -> Tuple[List[Dict], List[Dict], Dict[str, Any], Dict[str, Any]]:
        """
        Returns:
            (validated_shipments, validated_trucks, validation_report, agent_log)
        """
        t0 = datetime.utcnow()
        issues: List[Dict[str, Any]] = []
        warnings: List[Dict[str, Any]] = []
        normalizations: List[Dict[str, Any]] = []
        rejected_ids: List[str] = []

        valid_shipments = []
        for s in shipments:
            s_issues = self._validate_shipment(s)
            if s_issues["critical"]:
                rejected_ids.append(s.get("id", "unknown"))
                issues.extend(s_issues["critical"])
                continue
            warnings.extend(s_issues["warnings"])
            normalized, norms = self._normalize_shipment(s)
            normalizations.extend(norms)
            valid_shipments.append(normalized)

        valid_trucks = []
        for t in trucks:
            t_issues = self._validate_truck(t)
            if t_issues["critical"]:
                rejected_ids.append(t.get("id", "unknown"))
                issues.extend(t_issues["critical"])
                continue
            warnings.extend(t_issues["warnings"])
            normalized, norms = self._normalize_truck(t)
            normalizations.extend(norms)
            valid_trucks.append(normalized)

        report = {
            "totalShipmentsReceived": len(shipments),
            "totalTrucksReceived": len(trucks),
            "validShipments": len(valid_shipments),
            "validTrucks": len(valid_trucks),
            "rejectedCount": len(rejected_ids),
            "rejectedIds": rejected_ids,
            "issueCount": len(issues),
            "warningCount": len(warnings),
            "normalizationCount": len(normalizations),
            "issues": issues[:20],  # cap for response size
            "warnings": warnings[:20],
            "normalizations": normalizations[:20],
        }

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        log = {
            "agent": self.name,
            "action": "data_validation",
            "input_shipments": len(shipments),
            "input_trucks": len(trucks),
            "valid_shipments": len(valid_shipments),
            "valid_trucks": len(valid_trucks),
            "rejected": len(rejected_ids),
            "issues": len(issues),
            "warnings": len(warnings),
            "duration_ms": round(duration_ms, 2),
        }

        logger.info(
            f"[{self.name}] Validated {len(valid_shipments)}/{len(shipments)} shipments, "
            f"{len(valid_trucks)}/{len(trucks)} trucks, {len(issues)} issues"
        )

        return valid_shipments, valid_trucks, report, log

    def _validate_shipment(self, s: Dict) -> Dict[str, List]:
        """Validate a single shipment record."""
        critical = []
        warnings = []
        sid = s.get("id", "unknown")

        # Required fields
        if not s.get("id"):
            critical.append({"id": sid, "field": "id", "msg": "Missing shipment ID"})

        # Coordinates
        for field in ["pickupLat", "pickupLng", "dropLat", "dropLng"]:
            val = s.get(field)
            if val is None:
                critical.append({"id": sid, "field": field, "msg": f"Missing {field}"})
            elif not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
                critical.append({"id": sid, "field": field, "msg": f"Invalid {field}: {val}"})

        lat_fields = [("pickupLat", -90, 90), ("dropLat", -90, 90)]
        lng_fields = [("pickupLng", -180, 180), ("dropLng", -180, 180)]
        for field, lo, hi in lat_fields + lng_fields:
            val = s.get(field)
            if isinstance(val, (int, float)) and not (lo <= val <= hi):
                critical.append({"id": sid, "field": field, "msg": f"{field}={val} out of range [{lo},{hi}]"})

        # Weight / volume
        w = s.get("weight", 0)
        v = s.get("volume", 0)
        if isinstance(w, (int, float)) and w < 0:
            critical.append({"id": sid, "field": "weight", "msg": f"Negative weight: {w}"})
        if isinstance(v, (int, float)) and v < 0:
            critical.append({"id": sid, "field": "volume", "msg": f"Negative volume: {v}"})
        if isinstance(w, (int, float)) and w == 0:
            warnings.append({"id": sid, "field": "weight", "msg": "Zero weight — will default to 10kg"})
        if isinstance(v, (int, float)) and v == 0:
            warnings.append({"id": sid, "field": "volume", "msg": "Zero volume — will default to 0.1m³"})

        # Time windows
        tw_start = s.get("timeWindowStart")
        tw_end = s.get("timeWindowEnd")
        if tw_start and tw_end:
            try:
                start_dt = datetime.fromisoformat(tw_start.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(tw_end.replace("Z", "+00:00"))
                if end_dt <= start_dt:
                    warnings.append({"id": sid, "field": "timeWindow", "msg": "End <= Start"})
            except Exception:
                warnings.append({"id": sid, "field": "timeWindow", "msg": "Invalid time format"})

        # Suspicious values
        if isinstance(w, (int, float)) and w > 50000:
            warnings.append({"id": sid, "field": "weight", "msg": f"Suspiciously large weight: {w}kg"})

        return {"critical": critical, "warnings": warnings}

    def _validate_truck(self, t: Dict) -> Dict[str, List]:
        """Validate a single truck record."""
        critical = []
        warnings = []
        tid = t.get("id", "unknown")

        if not t.get("id"):
            critical.append({"id": tid, "field": "id", "msg": "Missing truck ID"})

        mw = t.get("maxWeight", 0)
        mv = t.get("maxVolume", 0)
        if not isinstance(mw, (int, float)) or mw <= 0:
            critical.append({"id": tid, "field": "maxWeight", "msg": f"Invalid maxWeight: {mw}"})
        if not isinstance(mv, (int, float)) or mv <= 0:
            critical.append({"id": tid, "field": "maxVolume", "msg": f"Invalid maxVolume: {mv}"})

        return {"critical": critical, "warnings": warnings}

    def _normalize_shipment(self, s: Dict) -> Tuple[Dict, List[Dict]]:
        """Normalize and fill defaults for a shipment."""
        norms = []
        sid = s.get("id", "unknown")
        result = dict(s)

        if result.get("weight", 0) == 0:
            result["weight"] = 10.0
            norms.append({"id": sid, "field": "weight", "action": "default_10kg"})

        if result.get("volume", 0) == 0:
            result["volume"] = 0.1
            norms.append({"id": sid, "field": "volume", "action": "default_0.1m3"})

        if not result.get("cargoType"):
            result["cargoType"] = "GENERAL"
            norms.append({"id": sid, "field": "cargoType", "action": "default_GENERAL"})

        if not result.get("priority"):
            result["priority"] = "MEDIUM"

        if result.get("fragility") is None:
            result["fragility"] = 0

        if not result.get("itemDimensions"):
            # Synthesize a single item from shipment weight/volume
            vol = result["volume"]
            side = round(vol ** (1 / 3), 2) if vol > 0 else 0.5
            result["itemDimensions"] = [{
                "id": f"{sid}-item-1",
                "length": side,
                "width": side,
                "height": side,
                "weight": result["weight"],
                "fragility": result.get("fragility", 0),
                "orientationConstraints": [],
                "stackable": True,
            }]
            norms.append({"id": sid, "field": "itemDimensions", "action": "synthesized_from_volume"})

        return result, norms

    def _normalize_truck(self, t: Dict) -> Tuple[Dict, List[Dict]]:
        """Normalize and fill defaults for a truck."""
        norms = []
        tid = t.get("id", "unknown")
        result = dict(t)

        if not result.get("name"):
            result["name"] = f"Truck-{tid}"
            norms.append({"id": tid, "field": "name", "action": "auto_generated"})

        if result.get("co2PerKm", 0) <= 0:
            result["co2PerKm"] = 0.21
        if result.get("emissionFactor", 0) <= 0:
            result["emissionFactor"] = result.get("co2PerKm", 0.21)

        if result.get("costPerKm", 0) <= 0:
            result["costPerKm"] = 15.0

        # Synthesize internal dimensions from volume if not provided
        if result.get("internalLength", 0) <= 0:
            vol = result.get("maxVolume", 8.0)
            side = round(vol ** (1 / 3), 2)
            result["internalLength"] = round(side * 1.6, 2)
            result["internalWidth"] = round(side * 0.9, 2)
            result["internalHeight"] = round(side * 0.7, 2)
            norms.append({"id": tid, "field": "internalDimensions", "action": "synthesized_from_volume"})

        return result, norms
