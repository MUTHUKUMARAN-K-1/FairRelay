"""
Gemini LLM insights for consolidation results.
Calls botlearn.ai to generate real data-driven insights from consolidation metrics.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Tuple

logger = logging.getLogger("fairrelay.consolidation_llm")


async def generate_consolidation_insights(
    metrics: Dict[str, Any],
    groups: List[Dict],
) -> Tuple[List[Dict], Dict]:
    """
    Call botlearn.ai Gemini to generate actionable logistics insights.

    Returns (insights_list, agent_log_dict).
    Both are empty on failure so callers can safely fall through to rule-based insights.
    """
    t0 = datetime.utcnow()
    api_key = os.getenv("BOTLEARN_API_KEY")

    if not api_key:
        logger.warning("[ConsolidationLLM] BOTLEARN_API_KEY not set — skipping LLM insights")
        return [], {}

    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        logger.warning("[ConsolidationLLM] langchain_openai not installed — skipping")
        return [], {}

    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    try:
        llm = ChatOpenAI(
            base_url="https://models.botlearn.ai/v1",
            api_key=api_key,
            model=gemini_model,
            temperature=0.3,
            max_tokens=900,
        )
    except Exception as e:
        logger.error(f"[ConsolidationLLM] Failed to init LLM client: {e}")
        return [], {}

    # Build a concise group summary (cap at 6 groups for prompt size)
    group_lines = []
    for g in groups[:6]:
        group_lines.append(
            f"  Group {g['groupId']}: {g['shipmentCount']} shipments | "
            f"{g['totalWeight']}kg | {g['utilizationWeight']}% capacity used | "
            f"{g['routeDistanceKm']} km route | confidence {g['confidence']}%"
        )
    groups_text = "\n".join(group_lines) if group_lines else "  (no groups)"

    prompt = f"""You are an expert AI logistics optimization analyst. A load consolidation engine just ran and produced the following results. Generate 4 sharp, data-driven insights for the logistics manager.

CONSOLIDATION SUMMARY
---------------------
Shipments processed : {metrics.get('totalShipments', 0)}
Groups formed       : {metrics.get('totalGroups', 0)}
Trucks used         : {metrics.get('totalTrucks', 0)}
Utilization         : {metrics.get('utilizationBefore', 0):.1f}% → {metrics.get('utilizationAfter', 0):.1f}%  (+{metrics.get('utilizationImprovement', 0):.1f} pp)
Trips reduced       : {metrics.get('tripsReduced', 0)}  ({metrics.get('tripReductionPercent', 0):.1f}% fewer vehicles)
Distance saved      : {metrics.get('distanceSavedKm', 0):.1f} km
CO₂ saved           : {metrics.get('carbonSavedKg', 0):.1f} kg
Fuel saved          : ₹{metrics.get('fuelSavedINR', 0):,}
Optimization score  : {metrics.get('optimizationScore', 0)}/100
Avg group confidence: {metrics.get('avgConfidence', 0)}%

CONSOLIDATED GROUPS
-------------------
{groups_text}

INSTRUCTIONS
------------
Return ONLY a valid JSON array — no markdown fences, no extra text.
Generate exactly 4 insights. Each must:
  - Reference specific numbers from the data above
  - Be 1–2 sentences, professional logistics language
  - Vary the types across the 4 entries

Schema (strict):
[
  {{"type": "pattern",        "text": "...", "impact": "high"}},
  {{"type": "recommendation", "text": "...", "impact": "medium"}},
  {{"type": "learning",       "text": "...", "impact": "high"}},
  {{"type": "pattern",        "text": "...", "impact": "high"}}
]

Valid values — type: pattern | recommendation | learning   impact: high | medium | low"""

    try:
        response = await llm.ainvoke(prompt)
        raw = response.content.strip() if hasattr(response, "content") else str(response).strip()

        # Strip markdown fences if Gemini wraps in ```json ... ```
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        insights = json.loads(raw)
        if not isinstance(insights, list):
            raise ValueError("LLM returned non-list JSON")

        # Sanitise each entry
        clean = []
        for item in insights:
            if isinstance(item, dict) and "text" in item:
                clean.append({
                    "type": item.get("type", "pattern"),
                    "text": str(item["text"]),
                    "impact": item.get("impact", "high"),
                    "llm_generated": True,
                })

        duration_ms = (datetime.utcnow() - t0).total_seconds() * 1000
        log = {
            "agent": "GeminiInsightsAgent",
            "action": "llm_consolidation_insights",
            "model": gemini_model,
            "insights_generated": len(clean),
            "duration_ms": round(duration_ms, 1),
        }

        logger.info(f"[ConsolidationLLM] Generated {len(clean)} insights in {duration_ms:.0f}ms")
        return clean, log

    except json.JSONDecodeError as e:
        logger.error(f"[ConsolidationLLM] JSON parse error: {e} — raw: {raw[:200]!r}")
        return [], {}
    except Exception as e:
        logger.error(f"[ConsolidationLLM] LLM call failed: {type(e).__name__}: {e}")
        return [], {}
