# FairRelay — Complete API Reference

> **Live Brain:** `https://fairrelay-brain-gdm1.onrender.com`  
> **Live Backend:** `https://fairrelay-backend.onrender.com`  
> **Dashboard:** `https://fair-relay.vercel.app`  
> **API Docs (interactive):** `https://fairrelay-brain-gdm1.onrender.com/docs`

---

## LoRRI — Integration at a Glance

> **LoRRI doesn't need to rebuild anything. Three API calls — that's the entire integration.**

---

### Call 1 — Fair Dispatch

```
POST https://fairrelay-brain-gdm1.onrender.com/api/v1/allocate/langgraph
```

```json
// Send
{
  "drivers":  [ { "id": "drv_001", "name": "Rajan", "vehicle_capacity_kg": 2000 } ],
  "packages": [ { "id": "pkg_001", "weight_kg": 5.0, "latitude": 18.52, "longitude": 73.85, "address": "Pune Industrial", "fragility_level": 2 } ],
  "date":     "2026-05-16",
  "warehouse": { "lat": 19.076, "lng": 72.877 }
}
```

```json
// Get back
{
  "global_fairness": { "gini_index": 0.034, "fairness_grade": "A+" },
  "assignments": [
    {
      "driver_name": "Rajan",
      "route_summary": { "num_packages": 12, "estimated_time_minutes": 145 },
      "explanation": "Rajan gets the shorter Mumbai-Pune corridor — keeps workload balanced across the fleet.",
      "fairness_score": 0.92
    }
  ],
  "agent_events": [
    { "agent": "ml_effort_agent",  "message": "Effort matrix built"             },
    { "agent": "route_planner",    "message": "OR-Tools assignment proposed"     },
    { "agent": "fairness_manager", "message": "ACCEPT — Gini 0.034 below 0.25"  },
    { "agent": "driver_liaison",   "message": "No appeals raised"                },
    { "agent": "explainability",   "message": "Natural language explanations done" }
  ]
}
```

**8 agents. Fair assignments + Gini score + per-driver explanations + full agent trace.**

---

### Call 2 — Load Consolidation

```
POST https://fairrelay-brain-gdm1.onrender.com/api/v1/consolidate
```

```json
// Send
{
  "shipments": [
    { "id": "SH-001", "pickupLat": 19.076, "pickupLng": 72.877, "dropLat": 18.52, "dropLng": 73.856, "weight": 800  },
    { "id": "SH-002", "pickupLat": 19.113, "pickupLng": 72.869, "dropLat": 18.58, "dropLng": 73.724, "weight": 600  },
    { "id": "SH-003", "pickupLat": 19.033, "pickupLng": 72.855, "dropLat": 18.46, "dropLng": 73.850, "weight": 500  }
  ],
  "trucks":  [ { "id": "TRK-001", "maxWeight": 2000 }, { "id": "TRK-002", "maxWeight": 5000 } ],
  "options": { "maxGroupRadiusKm": 30, "timeWindowToleranceMinutes": 120 }
}
```

```json
// Get back
{
  "data": {
    "groups": [
      {
        "groupId": "G1", "truck": "TRK-001",
        "shipments": ["SH-001", "SH-002"],
        "utilizationPct": 70,
        "co2SavedKg": 22.5,
        "carbonCreditUSD": 0.34
      }
    ],
    "metrics": {
      "tripsBefore": 3, "tripsAfter": 2, "tripsReduced": 1,
      "distanceSavedKm": 137, "totalCo2SavedKg": 22.5, "fuelSavedINR": 3150
    }
  },
  "agentSteps": [
    { "agent": "GeoClusteringAgent",       "ms": 120 },
    { "agent": "TimeWindowAgent",          "ms": 85  },
    { "agent": "CapacityOptimizationAgent","ms": 340 },
    { "agent": "ScoringConfidenceAgent",   "ms": 45  },
    { "agent": "ContinuousLearningAgent",  "ms": 90  }
  ],
  "insights": [ "Consolidating SH-001+SH-002 reduces trips by 33% and saves 22.5 kg CO₂ on this corridor." ]
}
```

**5 agents. Consolidated groups + utilization metrics + CO₂ saved + Gemini AI insights.**

---

### Call 3 — Carbon Intelligence (No Auth)

```
POST https://fairrelay-brain-gdm1.onrender.com/lorri/carbon/estimate
```

```json
// Send
{
  "shipments": [
    { "id": "SH-001", "lane": "Mumbai → Pune",    "dist_km": 149, "weight_kg": 800,  "max_kg": 2000 },
    { "id": "SH-002", "lane": "Delhi → Jaipur",   "dist_km": 281, "weight_kg": 1500, "max_kg": 5000 },
    { "id": "SH-003", "lane": "Hyd → Kurnool",    "dist_km": 215, "weight_kg": 1800, "max_kg": 3000 }
  ]
}
```

```json
// Get back
{
  "data": {
    "summary": {
      "totalCo2Kg": 57.3, "savedCo2Kg": 78.2, "savingsPct": 57.7,
      "highRiskCount": 0,  "carbonCreditUSD": 1.17
    },
    "highEmissionLanes": [
      { "lane": "Hyd → Kurnool", "co2_kg": 27.1, "risk": "MEDIUM" }
    ],
    "reductionOpportunities": [
      { "lane": "Delhi → Jaipur", "type": "consolidation", "saving_kg": 16.5, "effort": "Low" }
    ],
    "aiInsight": "Fleet emitting 57.3 kg CO₂ — consolidating the Delhi-Jaipur corridor (30% loaded) delivers the fastest reduction with zero operational disruption."
  }
}
```

**5-step agent pipeline. Per-shipment CO₂ model + high-emission lane flags + Gemini AI sustainability insight.**

---

> **"LoRRI sends us their data. We run 8 + 5 + 5 agents. They get back optimized assignments, fairness scores, consolidated loads, carbon impact, and AI narratives — in under 3 seconds."**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [LoRRI Integration Guide](#2-lorri-integration-guide) ⭐ **Start here**
3. [Core AI Endpoints (Brain)](#3-core-ai-endpoints-brain)
   - [Allocation — LangGraph Pipeline](#31-allocation--langgraph-pipeline)
   - [Load Consolidation](#32-load-consolidation)
   - [Route Optimization](#33-route-optimization)
   - [Carbon Intelligence Agent](#34-carbon-intelligence-agent)
   - [Driver APIs](#35-driver-apis)
   - [Admin & Analytics](#36-admin--analytics)
   - [Real-time Events (SSE)](#37-real-time-events-sse)
4. [Node.js Backend Endpoints](#4-nodejs-backend-endpoints)
   - [Authentication & OTP](#41-authentication--otp)
   - [Drivers](#42-drivers)
   - [Shipments](#43-shipments)
   - [Deliveries](#44-deliveries)
   - [Wellness](#45-wellness)
   - [Consolidation (Proxy)](#46-consolidation-proxy)
   - [V1 API Gateway](#47-v1-api-gateway)
   - [Absorption & Synergy](#48-absorption--synergy)
   - [Virtual Hubs & E-Way Bills](#49-virtual-hubs--e-way-bills)
   - [API Keys](#410-api-keys)
5. [Error Codes Reference](#5-error-codes-reference)
6. [Rate Limits](#6-rate-limits)

---

## 1. Architecture Overview

```
LoRRI TMS (logisticsnow.in)
        │
        │ HTTPS — /lorri/* endpoints (dedicated LoRRI namespace)
        │
        ▼
AI Brain — FastAPI + LangGraph            (fairrelay-brain-gdm1.onrender.com)
  ├── /lorri/*     ← LoRRI integration adapter (API-key auth, webhook callbacks)
  ├── /api/v1/*    ← Core AI endpoints (allocation, consolidation, carbon)
  └── /health      ← Health check

Node.js Backend — Express + Prisma        (fairrelay-backend.onrender.com)
  ├── /api/*       ← CRUD: drivers, shipments, deliveries, wellness
  ├── /v1/*        ← API gateway (proxies to Brain, with fallback)
  └── Socket.IO    ← Real-time push events

Ops Dashboard — React + Vite              (fair-relay.vercel.app)
  └── Embeddable via iframe
```

**Key auth methods:**

| Service | Method | Header |
|---------|--------|--------|
| Brain `/lorri/*` | API Key | `x-api-key: fr_live_demo_key_2026` |
| Brain `/lorri/health`, `/lorri/carbon/estimate` | None | — |
| Brain `/api/v1/*` | None | — |
| Backend `/v1/*` | API Key | `x-api-key: <your-key>` |
| Backend `/api/auth/*` | OTP → JWT | `Authorization: Bearer <token>` |

---

## 2. LoRRI Integration Guide

The `/lorri/*` namespace is purpose-built for LoRRI TMS integration. It accepts LoRRI-native payload formats, handles fallbacks internally, and can push webhook callbacks on completion.

### Quick-start: 3 API calls for full integration

```
Step 1 — Check FairRelay health before dispatch:
  GET /lorri/health

Step 2 — Score driver wellness (optional but recommended):
  POST /lorri/wellness

Step 3 — Run fair allocation:
  POST /lorri/allocate

Bonus — Carbon reporting for ESG:
  POST /lorri/carbon/estimate
```

---

### 2.1 `GET /lorri/health`

Health check designed for LoRRI uptime monitoring (UptimeRobot, Pingdom, etc.). No auth required.

**Request:**
```bash
curl https://fairrelay-brain-gdm1.onrender.com/lorri/health
```

**Response `200 OK`:**
```json
{
  "status": "operational",
  "brain": "connected",
  "version": "1.0.0",
  "agents_available": 6,
  "avg_latency_ms": 312,
  "uptime_seconds": 86423.7
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"operational"` \| `"degraded"` | `degraded` means SQLite fallback active |
| `brain` | `"connected"` \| `"sqlite_fallback"` | DB connection status |
| `agents_available` | int | Number of LangGraph agents ready |
| `avg_latency_ms` | int \| null | Rolling average of last 100 requests |
| `uptime_seconds` | float | Seconds since last cold start |

---

### 2.2 `POST /lorri/allocate`

**The primary LoRRI integration endpoint.** Accepts LoRRI-native driver/route format, runs the full 8-agent LangGraph fairness pipeline, and optionally calls your webhook on completion.

**Auth:** `x-api-key` header required  
**Demo key:** `fr_live_demo_key_2026`  
**Rate limit:** 100 requests/min per key

**Request:**
```bash
curl -X POST https://fairrelay-brain-gdm1.onrender.com/lorri/allocate \
  -H "Content-Type: application/json" \
  -H "x-api-key: fr_live_demo_key_2026" \
  -d '{
    "drivers": [
      {
        "id": "drv_001",
        "name": "Rajan Kumar",
        "vehicle_capacity_kg": 2000,
        "preferred_language": "ta",
        "hours_today": 3.5
      },
      {
        "id": "drv_002",
        "name": "Suresh Pillai",
        "vehicle_capacity_kg": 5000,
        "preferred_language": "ml",
        "hours_today": 6.0
      }
    ],
    "routes": [
      {
        "id": "rt_001",
        "destination": "Pune Industrial Area",
        "distance_km": 149,
        "weight_kg": 800,
        "drop_lat": 18.5204,
        "drop_lng": 73.8567,
        "priority": "high"
      },
      {
        "id": "rt_002",
        "destination": "Nashik Depot",
        "distance_km": 167,
        "weight_kg": 1200,
        "drop_lat": 19.9975,
        "drop_lng": 73.7898,
        "priority": "normal"
      }
    ],
    "options": {
      "warehouse_lat": 19.0760,
      "warehouse_lng": 72.8777,
      "date": "2026-05-16"
    },
    "callback_url": "https://logisticsnow.in/webhooks/fairrelay"
  }'
```

**Request schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `drivers` | array | Yes | Array of driver objects |
| `drivers[].id` | string | Yes | LoRRI driver ID |
| `drivers[].name` | string | Yes | Driver name |
| `drivers[].vehicle_capacity_kg` | float | No | Default: 500 |
| `drivers[].preferred_language` | string | No | `en`, `ta`, `ml`, `hi`, `te` |
| `drivers[].hours_today` | float | No | Hours worked today (for fairness) |
| `routes` | array | Yes | Array of route/delivery objects |
| `routes[].id` | string | Yes | LoRRI route ID |
| `routes[].destination` | string | No | Destination name |
| `routes[].distance_km` | float | No | Route distance |
| `routes[].weight_kg` | float | No | Cargo weight |
| `routes[].drop_lat` | float | No | Drop latitude |
| `routes[].drop_lng` | float | No | Drop longitude |
| `routes[].priority` | string | No | `"high"`, `"normal"`, `"low"` |
| `options` | object | No | Optional configuration |
| `options.warehouse_lat` | float | No | Pickup depot latitude |
| `options.warehouse_lng` | float | No | Pickup depot longitude |
| `options.date` | string | No | ISO date (default: today) |
| `callback_url` | string | No | Webhook URL for async notification |

**Response `200 OK` (live mode):**
```json
{
  "success": true,
  "data": {
    "id": "run_a3f2b1c0-e29b-41d4-a716-446655440abc",
    "allocations": [
      {
        "driver": "drv_001",
        "driver_name": "Rajan Kumar",
        "route": "rt_001",
        "wellness_score": 72,
        "workload_score": 61.4,
        "explanation": "Rajan has completed 3.5 hours today — assigning the shorter Pune route keeps workload balanced. Estimated completion by 14:30.",
        "route_summary": {
          "packages": 4,
          "weight_kg": 800,
          "stops": 3,
          "time_minutes": 185
        }
      },
      {
        "driver": "drv_002",
        "driver_name": "Suresh Pillai",
        "route": "rt_002",
        "wellness_score": 52,
        "workload_score": 64.2,
        "explanation": "Suresh's larger vehicle handles the Nashik load efficiently. Wellness flag: 6 hours on duty — short break recommended before departure.",
        "route_summary": {
          "packages": 6,
          "weight_kg": 1200,
          "stops": 4,
          "time_minutes": 220
        }
      }
    ]
  },
  "meta": {
    "gini_index": 0.034,
    "fairness_grade": "A+",
    "avg_workload": 62.8,
    "carbon_kg": 168.0,
    "latency_ms": 387,
    "mode": "live",
    "agents_used": [
      "ml_effort",
      "route_planner",
      "fairness_manager",
      "driver_liaison",
      "final_resolution",
      "explainability"
    ]
  }
}
```

**Response `200 OK` (fallback mode — brain DB unavailable):**
```json
{
  "success": true,
  "data": {
    "id": "run_fallback_1716123456",
    "allocations": [ ... ]
  },
  "meta": {
    "gini_index": 0.08,
    "fairness_grade": "A",
    "latency_ms": 12,
    "mode": "fallback",
    "error": "Database connection timeout"
  }
}
```

**Meta fields:**

| Field | Type | Description |
|-------|------|-------------|
| `gini_index` | float [0–1] | Gini coefficient of workload distribution. `< 0.1` = A+, `< 0.2` = A, else B |
| `fairness_grade` | `"A+"` \| `"A"` \| `"B"` | Human-readable fairness grade |
| `avg_workload` | float | Mean workload score across all drivers |
| `carbon_kg` | float | Estimated total CO₂ for this dispatch (kg) |
| `latency_ms` | int | Total server-side processing time |
| `mode` | `"live"` \| `"fallback"` | Live = full LangGraph pipeline; fallback = deterministic heuristic |

**Webhook payload** (sent to `callback_url` on completion):
```json
{
  "event": "allocation.completed",
  "timestamp": "2026-05-16T08:23:45Z",
  "data": {
    "run_id": "run_a3f2b1c0-e29b-41d4-a716-446655440abc",
    "gini_index": 0.034,
    "num_drivers": 2,
    "latency_ms": 387
  }
}
```
Header: `X-FairRelay-Signature: sha256=<hmac>` (if `LORRI_WEBHOOK_SECRET` env is set)

---

### 2.3 `POST /lorri/wellness`

Score driver fitness before dispatch. Returns wellness score, risk level, and dispatch recommendation.

**Auth:** `x-api-key` header required

**Request:**
```bash
curl -X POST https://fairrelay-brain-gdm1.onrender.com/lorri/wellness \
  -H "Content-Type: application/json" \
  -H "x-api-key: fr_live_demo_key_2026" \
  -d '{
    "drivers": [
      {
        "id": "drv_001",
        "name": "Rajan Kumar",
        "hours_today": 8.5,
        "hours_since_rest": 7,
        "is_ill": false
      },
      {
        "id": "drv_002",
        "name": "Suresh Pillai",
        "hours_today": 4.0,
        "hours_since_rest": 3,
        "is_ill": true
      }
    ]
  }'
```

**Request schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `drivers[].id` | string | Yes | Driver ID |
| `drivers[].name` | string | No | Driver name |
| `drivers[].hours_today` | float | Yes | Hours on duty today |
| `drivers[].hours_since_rest` | float | Yes | Hours since last rest break |
| `drivers[].is_ill` | bool | Yes | Active illness flag |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": "drv_001",
        "name": "Rajan Kumar",
        "wellness_score": 24,
        "risk_level": "HIGH",
        "recommendation": "Mandatory rest required",
        "fit_for_dispatch": false
      },
      {
        "id": "drv_002",
        "name": "Suresh Pillai",
        "wellness_score": 8,
        "risk_level": "HIGH",
        "recommendation": "Remove from duty — illness active",
        "fit_for_dispatch": false
      }
    ]
  }
}
```

**Wellness score formula:**
```
score = 100
  - (hours_today × 8)
  - (30 if is_ill)
  - (15 if hours_since_rest >= 6)

risk_level:
  score < 40  → HIGH
  score < 70  → MEDIUM
  score >= 70 → LOW
```

---

### 2.4 `POST /lorri/carbon/estimate`

**Carbon Intelligence Agent.** No auth required. Runs a 5-step server-side pipeline to estimate per-shipment CO₂ emissions, identify high-emission lanes, generate reduction opportunities, and produce a Gemini 2.5 Flash AI insight.

**Request:**
```bash
curl -X POST https://fairrelay-brain-gdm1.onrender.com/lorri/carbon/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "shipments": [
      {
        "id": "SH-001",
        "lane": "Mumbai → Pune",
        "dist_km": 149,
        "weight_kg": 800,
        "max_kg": 2000,
        "truck": "Tata Ace Gold"
      },
      {
        "id": "SH-002",
        "lane": "Delhi NCR → Jaipur",
        "dist_km": 281,
        "weight_kg": 1500,
        "max_kg": 5000,
        "truck": "Eicher Pro 2049"
      },
      {
        "id": "SH-003",
        "lane": "Hyderabad → Kurnool",
        "dist_km": 215,
        "weight_kg": 1800,
        "max_kg": 3000,
        "truck": "BharatBenz"
      }
    ],
    "date": "2026-05-16"
  }'
```

**Request schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipments` | array | Yes | Array of shipment objects |
| `shipments[].id` | string | Yes | Shipment ID |
| `shipments[].lane` | string | Yes | Route label (e.g. "Mumbai → Pune") |
| `shipments[].dist_km` | float | Yes | Route distance in km |
| `shipments[].weight_kg` | float | Yes | Cargo weight kg |
| `shipments[].max_kg` | float | Yes | Vehicle max capacity kg |
| `shipments[].truck` | string | No | Truck model label |
| `date` | string | No | ISO date for the report |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "date": "2026-05-16",
    "shipments": [
      {
        "id": "SH-001",
        "lane": "Mumbai → Pune",
        "dist_km": 149,
        "weight_kg": 800,
        "max_kg": 2000,
        "truck": "Tata Ace Gold",
        "load_factor_pct": 40,
        "co2_kg": 12.5,
        "co2_baseline_kg": 31.3,
        "co2_saved_kg": 18.8,
        "risk": "LOW"
      },
      {
        "id": "SH-002",
        "lane": "Delhi NCR → Jaipur",
        "dist_km": 281,
        "weight_kg": 1500,
        "max_kg": 5000,
        "truck": "Eicher Pro 2049",
        "load_factor_pct": 30,
        "co2_kg": 17.7,
        "co2_baseline_kg": 59.0,
        "co2_saved_kg": 41.3,
        "risk": "LOW"
      },
      {
        "id": "SH-003",
        "lane": "Hyderabad → Kurnool",
        "dist_km": 215,
        "weight_kg": 1800,
        "max_kg": 3000,
        "truck": "BharatBenz",
        "load_factor_pct": 60,
        "co2_kg": 27.1,
        "co2_baseline_kg": 45.2,
        "co2_saved_kg": 18.1,
        "risk": "MEDIUM"
      }
    ],
    "highEmissionLanes": [
      { "lane": "Hyderabad → Kurnool", "co2_kg": 27.1, "risk": "MEDIUM" },
      { "lane": "Delhi NCR → Jaipur",  "co2_kg": 17.7, "risk": "LOW"    },
      { "lane": "Mumbai → Pune",        "co2_kg": 12.5, "risk": "LOW"    }
    ],
    "reductionOpportunities": [
      {
        "lane": "Delhi NCR → Jaipur",
        "type": "consolidation",
        "finding": "Load factor 30% — consolidation can save 16.5 kg CO₂/run.",
        "saving_kg": 16.5,
        "effort": "Low"
      },
      {
        "lane": "Hyderabad → Kurnool",
        "type": "vehicle_upgrade",
        "finding": "Upgrade to BS6 Euro-6 (emission factor 0.21→0.16 kg/km) saves 6.5 kg CO₂ on highest-emission corridor.",
        "saving_kg": 6.5,
        "effort": "Medium"
      },
      {
        "lane": "Hyderabad → Kurnool",
        "type": "scheduling",
        "finding": "Night-window dispatch (22:00–05:00) reduces fuel burn ~12% → saves 3.3 kg CO₂.",
        "saving_kg": 3.3,
        "effort": "Low"
      }
    ],
    "summary": {
      "totalCo2Kg": 57.3,
      "baselineCo2Kg": 135.5,
      "savedCo2Kg": 78.2,
      "savingsPct": 57.7,
      "highRiskCount": 0,
      "carbonCreditUSD": 1.17,
      "shipmentCount": 3
    },
    "aiInsight": "Fleet is emitting 57.3 kg CO₂ across 3 active shipments — 78.2 kg (57.7%) saved vs full-load baseline. Consolidating the Delhi-Jaipur corridor (currently 30% loaded) and switching to night-window departures on Hyderabad-Kurnool will deliver the fastest CO₂ reduction with minimal operational disruption."
  },
  "meta": {
    "model": "CO₂ = dist_km × (weight/capacity) × 0.21 kg/km",
    "emissionFactor": 0.21,
    "latency_ms": 1843,
    "agent": "CarbonIntelligenceAgent/1.0"
  }
}
```

**Emission model:** `CO₂ (kg) = distance_km × (weight_kg / max_kg) × 0.21`  
Source: IPCC AR6 India road freight emission factor.

**Risk thresholds:**

| Risk | CO₂ threshold |
|------|--------------|
| `LOW` | < 25 kg |
| `MEDIUM` | 25–50 kg |
| `HIGH` | > 50 kg |

---

### 2.5 `GET /lorri/stats`

FairRelay performance statistics for displaying in LoRRI's monitoring dashboard.

**Auth:** `x-api-key` header required

**Request:**
```bash
curl https://fairrelay-brain-gdm1.onrender.com/lorri/stats \
  -H "x-api-key: fr_live_demo_key_2026"
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "total_allocations": 142,
    "avg_latency_ms": 387,
    "avg_gini_index": 0.08,
    "agents": [
      { "name": "ML Effort Agent",          "status": "active", "type": "ml"           },
      { "name": "Route Planner (OR-Tools)", "status": "active", "type": "optimization" },
      { "name": "Fairness Manager",         "status": "active", "type": "evaluation"   },
      { "name": "Driver Liaison",           "status": "active", "type": "negotiation"  },
      { "name": "Final Resolution",         "status": "active", "type": "resolution"   },
      { "name": "Explainability Agent",     "status": "active", "type": "explanation"  }
    ],
    "uptime_seconds": 86423.7
  }
}
```

---

### 2.6 LoRRI Integration — Code Examples

#### Node.js / TypeScript
```typescript
const FAIRRELAY_BRAIN = 'https://fairrelay-brain-gdm1.onrender.com';
const API_KEY = process.env.FAIRRELAY_API_KEY || 'fr_live_demo_key_2026';

async function fairDispatch(drivers: any[], routes: any[]) {
  const res = await fetch(`${FAIRRELAY_BRAIN}/lorri/allocate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ drivers, routes, options: { date: new Date().toISOString().split('T')[0] } }),
  });

  if (!res.ok) throw new Error(`FairRelay error: ${res.status}`);
  return res.json();
}

async function carbonReport(shipments: any[]) {
  const res = await fetch(`${FAIRRELAY_BRAIN}/lorri/carbon/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipments }),
  });
  return res.json();
}
```

#### Python
```python
import httpx

BRAIN_URL = "https://fairrelay-brain-gdm1.onrender.com"
API_KEY   = "fr_live_demo_key_2026"

async def fair_dispatch(drivers: list, routes: list) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BRAIN_URL}/lorri/allocate",
            headers={"x-api-key": API_KEY},
            json={"drivers": drivers, "routes": routes},
        )
        resp.raise_for_status()
        return resp.json()

async def carbon_report(shipments: list) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BRAIN_URL}/lorri/carbon/estimate",
            json={"shipments": shipments},
        )
        return resp.json()
```

#### Webhook Receiver (Express)
```javascript
const crypto = require('crypto');

app.post('/webhooks/fairrelay', express.raw({ type: 'application/json' }), (req, res) => {
  const sig     = req.headers['x-fairrelay-signature'];
  const secret  = process.env.LORRI_WEBHOOK_SECRET;

  if (secret) {
    const expected = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');
    if (sig !== expected) return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  // event.event === "allocation.completed"
  // event.data.run_id, event.data.gini_index, event.data.latency_ms
  console.log('FairRelay allocation done:', event.data);
  res.sendStatus(200);
});
```

---

## 3. Core AI Endpoints (Brain)

Base URL: `https://fairrelay-brain-gdm1.onrender.com`  
No auth required unless noted.

---

### 3.1 Allocation — LangGraph Pipeline

#### `POST /api/v1/allocate/langgraph`

Full 8-agent LangGraph pipeline. This is the canonical allocation endpoint.

**Request:**
```json
{
  "date": "2026-05-16",
  "warehouse": { "lat": 19.0760, "lng": 72.8777 },
  "drivers": [
    {
      "id": "driver_001",
      "name": "Raju",
      "vehicle_capacity_kg": 150,
      "preferred_language": "en",
      "vehicle_type": "PETROL"
    },
    {
      "id": "driver_002",
      "name": "Kumar",
      "vehicle_capacity_kg": 200,
      "preferred_language": "ta",
      "vehicle_type": "EV",
      "ev_range_km": 120
    }
  ],
  "packages": [
    {
      "id": "pkg_001",
      "weight_kg": 2.5,
      "fragility_level": 3,
      "address": "Koramangala 4th Block, Bangalore",
      "latitude": 12.9352,
      "longitude": 77.6245,
      "priority": "HIGH"
    },
    {
      "id": "pkg_002",
      "weight_kg": 1.0,
      "fragility_level": 1,
      "address": "Indiranagar 100ft Road, Bangalore",
      "latitude": 12.9784,
      "longitude": 77.6408,
      "priority": "NORMAL"
    }
  ]
}
```

**Request schema:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `date` | string (ISO) | Yes | Allocation date |
| `warehouse` | object | Yes | `{lat, lng}` — pickup depot |
| `drivers[].id` | string | Yes | Unique driver ID |
| `drivers[].name` | string | Yes | Display name |
| `drivers[].vehicle_capacity_kg` | float | Yes | Max load capacity |
| `drivers[].preferred_language` | string | No | `en`, `ta`, `hi`, `ml`, `te` |
| `drivers[].vehicle_type` | string | No | `"PETROL"`, `"DIESEL"`, `"EV"` |
| `drivers[].ev_range_km` | float | No | EV range (EV vehicles only) |
| `packages[].id` | string | Yes | Unique package ID |
| `packages[].weight_kg` | float | Yes | Weight in kg |
| `packages[].fragility_level` | int [1–5] | Yes | 1=robust, 5=very fragile |
| `packages[].address` | string | Yes | Delivery address |
| `packages[].latitude` | float | Yes | Drop latitude |
| `packages[].longitude` | float | Yes | Drop longitude |
| `packages[].priority` | string | No | `"HIGH"`, `"NORMAL"`, `"LOW"` |

**Response `200 OK`:**
```json
{
  "allocation_run_id": "550e8400-e29b-41d4-a716-446655440000",
  "allocation_date": "2026-05-16",
  "status": "SUCCESS",
  "global_fairness": {
    "avg_workload": 63.2,
    "std_dev": 5.4,
    "gini_index": 0.084,
    "max_gap": 8.3
  },
  "assignments": [
    {
      "driver_external_id": "driver_001",
      "driver_name": "Raju",
      "route_id": "route-uuid-here",
      "workload_score": 65.3,
      "fairness_score": 0.92,
      "explanation": "Your route covers Koramangala with 12 packages. Expected 2.5 hours with moderate traffic.",
      "route_summary": {
        "num_packages": 12,
        "total_weight_kg": 28.5,
        "num_stops": 8,
        "estimated_time_minutes": 145
      }
    }
  ],
  "agent_events": [
    { "agent": "ml_effort_agent",    "status": "completed", "message": "Effort matrix built for 2 drivers × 2 routes" },
    { "agent": "route_planner",      "status": "completed", "message": "OR-Tools assignment proposed" },
    { "agent": "fairness_manager",   "status": "completed", "message": "ACCEPT — Gini 0.084 below threshold 0.25" },
    { "agent": "driver_liaison",     "status": "completed", "message": "No appeals raised" },
    { "agent": "final_resolution",   "status": "completed", "message": "All assignments confirmed" },
    { "agent": "explainability",     "status": "completed", "message": "Natural language explanations generated" }
  ]
}
```

#### `POST /api/v1/allocate`

Same as above — alternative path, same pipeline.

---

### 3.2 Load Consolidation

#### `POST /api/v1/consolidate`

5-agent LangGraph consolidation pipeline. Groups multiple shipments into shared trucks to reduce trips, distance, and CO₂.

**Request:**
```json
{
  "shipments": [
    {
      "id": "SH-001",
      "pickupLat": 19.0760,
      "pickupLng": 72.8777,
      "dropLat": 18.5204,
      "dropLng": 73.8567,
      "weight": 800,
      "volume": 3.2,
      "timeWindowStart": "08:00",
      "timeWindowEnd": "14:00"
    },
    {
      "id": "SH-002",
      "pickupLat": 19.1136,
      "pickupLng": 72.8697,
      "dropLat": 18.5893,
      "dropLng": 73.7241,
      "weight": 600,
      "volume": 2.8,
      "timeWindowStart": "09:00",
      "timeWindowEnd": "15:00"
    },
    {
      "id": "SH-003",
      "pickupLat": 19.0330,
      "pickupLng": 72.8554,
      "dropLat": 18.4655,
      "dropLng": 73.8503,
      "weight": 500,
      "volume": 2.1,
      "timeWindowStart": "07:00",
      "timeWindowEnd": "13:00"
    }
  ],
  "trucks": [
    { "id": "TRK-001", "name": "Tata Ace Gold",   "maxWeight": 2000, "maxVolume": 8.0 },
    { "id": "TRK-002", "name": "Eicher Pro 2049", "maxWeight": 5000, "maxVolume": 18.0 }
  ],
  "options": {
    "maxGroupRadiusKm": 30,
    "timeWindowToleranceMinutes": 120
  }
}
```

**Request schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipments[].id` | string | Yes | Shipment identifier |
| `shipments[].pickupLat/Lng` | float | Yes | Pickup coordinates |
| `shipments[].dropLat/Lng` | float | Yes | Drop coordinates |
| `shipments[].weight` | float | Yes | Cargo weight kg |
| `shipments[].volume` | float | No | Cargo volume m³ |
| `shipments[].timeWindowStart` | string | No | `"HH:MM"` earliest delivery |
| `shipments[].timeWindowEnd` | string | No | `"HH:MM"` latest delivery |
| `trucks[].id` | string | Yes | Truck identifier |
| `trucks[].maxWeight` | float | Yes | Max load capacity kg |
| `trucks[].maxVolume` | float | No | Max volume m³ |
| `options.maxGroupRadiusKm` | float | No | Max cluster radius (default 30) |
| `options.timeWindowToleranceMinutes` | int | No | Time window flex (default 120) |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "cons_a3b2c1d0",
    "groups": [
      {
        "groupId": "G1",
        "truck": "TRK-001",
        "shipments": ["SH-001", "SH-002"],
        "totalWeight": 1400,
        "totalVolume": 6.0,
        "utilizationPct": 70,
        "naiveDistKm": 149,
        "optimizedDistKm": 161,
        "co2SavedKg": 22.5,
        "carbonCreditUSD": 0.34,
        "confidenceScore": 0.87,
        "route": {
          "stops": [
            { "type": "pickup", "shipmentId": "SH-001", "lat": 19.0760, "lng": 72.8777 },
            { "type": "pickup", "shipmentId": "SH-002", "lat": 19.1136, "lng": 72.8697 },
            { "type": "drop",   "shipmentId": "SH-001", "lat": 18.5204, "lng": 73.8567 },
            { "type": "drop",   "shipmentId": "SH-002", "lat": 18.5893, "lng": 73.7241 }
          ]
        }
      },
      {
        "groupId": "G2",
        "truck": "TRK-002",
        "shipments": ["SH-003"],
        "totalWeight": 500,
        "utilizationPct": 10,
        "co2SavedKg": 0,
        "confidenceScore": 0.42
      }
    ],
    "metrics": {
      "shipmentCount": 3,
      "groupCount": 2,
      "tripsReduced": 1,
      "tripsBefore": 3,
      "tripsAfter": 2,
      "distanceSavedKm": 137,
      "totalCo2SavedKg": 22.5,
      "carbonCreditUSD": 0.34,
      "fuelSavedINR": 3150,
      "vehicleUtilizationPct": 40,
      "processingTimeMs": 2240
    }
  },
  "agentSteps": [
    { "agent": "GeoClusteringAgent",      "status": "done", "ms": 120, "detail": "2 clusters formed (silhouette 0.74)" },
    { "agent": "TimeWindowAgent",         "status": "done", "ms": 85,  "detail": "SH-001+SH-002 windows overlap 5h" },
    { "agent": "CapacityOptimizationAgent","status": "done", "ms": 340, "detail": "OR-Tools CP-SAT: 1 bin saved" },
    { "agent": "ScoringConfidenceAgent",  "status": "done", "ms": 45,  "detail": "Confidence: G1=0.87, G2=0.42" },
    { "agent": "ContinuousLearningAgent", "status": "done", "ms": 90,  "detail": "Q-table updated, episode stored" }
  ],
  "insights": [
    "Consolidating SH-001 and SH-002 reduces trips by 33% and saves 22.5 kg CO₂ on this corridor.",
    "SH-003 runs at only 10% utilisation — consider holding for the next Mumbai→Pune batch window."
  ]
}
```

#### `POST /api/v1/consolidate/sync`

Same consolidation pipeline but runs synchronously (no LangGraph overhead). Use as a fallback if LangGraph times out.

Same request/response shape as `/api/v1/consolidate`.

#### `POST /api/v1/consolidate/simulate`

Compare multiple consolidation strategies side-by-side.

**Request:**
```json
{
  "shipments": [ ... ],
  "trucks": [ ... ],
  "scenarios": [
    { "name": "Conservative", "maxGroupRadiusKm": 20, "timeWindowToleranceMinutes": 60  },
    { "name": "Balanced",     "maxGroupRadiusKm": 30, "timeWindowToleranceMinutes": 120 },
    { "name": "Aggressive",   "maxGroupRadiusKm": 50, "timeWindowToleranceMinutes": 240 }
  ]
}
```

**Response `200 OK`:**
```json
{
  "scenarios": [
    {
      "name": "Conservative",
      "groups": 4,
      "tripsReduced": 0,
      "co2SavedKg": 0,
      "processingTimeMs": 1200
    },
    {
      "name": "Balanced",
      "groups": 2,
      "tripsReduced": 2,
      "co2SavedKg": 22.5,
      "processingTimeMs": 2240
    },
    {
      "name": "Aggressive",
      "groups": 1,
      "tripsReduced": 3,
      "co2SavedKg": 41.2,
      "processingTimeMs": 2800
    }
  ],
  "recommendation": "Balanced — best CO₂/complexity trade-off for this shipment mix."
}
```

---

### 3.3 Route Optimization

#### `POST /api/v1/routes/optimize`

TSP/VRP route optimization using nearest-neighbour greedy + 2-opt local search. Returns before/after distance and CO₂ comparison.

**Request:**
```json
{
  "routes": [
    {
      "id": "route_001",
      "stops": [
        {
          "id": "stop_001",
          "latitude": 19.0760,
          "longitude": 72.8777,
          "address": "JNPT, Nhava Sheva",
          "weight_kg": 200,
          "service_time_min": 15,
          "time_window_start": "08:00",
          "time_window_end": "18:00",
          "priority": "HIGH"
        },
        {
          "id": "stop_002",
          "latitude": 18.5204,
          "longitude": 73.8567,
          "address": "Pune Phursungi Industrial",
          "weight_kg": 150,
          "service_time_min": 20
        }
      ]
    }
  ],
  "warehouse_lat": 19.0760,
  "warehouse_lng": 72.8777,
  "speed_kmh": 45,
  "use_time_windows": true
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "routes": [
    {
      "id": "route_001",
      "original_order": ["stop_001", "stop_002"],
      "optimized_order": ["stop_002", "stop_001"],
      "distance_before_km": 149,
      "distance_after_km": 108,
      "time_before_min": 198,
      "time_after_min": 144
    }
  ],
  "summary": {
    "total_distance_before_km": 149,
    "total_distance_after_km": 108,
    "total_distance_saved_km": 41,
    "total_distance_saved_pct": 27.5,
    "total_time_before_min": 198,
    "total_time_after_min": 144,
    "total_time_saved_min": 54,
    "total_co2_saved_kg": 8.6,
    "optimization_methods": ["2-opt local search", "nearest-neighbour greedy"]
  }
}
```

#### `POST /api/v1/routes/cluster`

Cluster packages geographically before routing.

**Request:**
```json
{
  "packages": [
    { "id": "pkg_001", "latitude": 19.076, "longitude": 72.877, "weight_kg": 5.0 },
    { "id": "pkg_002", "latitude": 19.113, "longitude": 72.869, "weight_kg": 3.0 }
  ],
  "method": "kmeans",
  "num_drivers": 3
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "method": "kmeans",
  "num_clusters": 3,
  "clusters": [
    {
      "cluster_id": 0,
      "num_packages": 4,
      "total_weight_kg": 12.5,
      "centroid": { "lat": 19.082, "lng": 72.881 },
      "packages": ["pkg_001", "pkg_003", "pkg_005", "pkg_007"]
    }
  ]
}
```

#### `POST /api/v1/routes/dynamic-insert`

Insert a new stop into an existing route at the cheapest position.

**Request:**
```json
{
  "route_stops": [
    { "id": "s1", "latitude": 19.076, "longitude": 72.877 },
    { "id": "s2", "latitude": 18.520, "longitude": 73.856 }
  ],
  "new_stop": { "id": "new_s", "latitude": 18.990, "longitude": 73.120 },
  "warehouse_lat": 19.076,
  "warehouse_lng": 72.877
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "new_order": ["s1", "new_s", "s2"],
  "insertion_position": 1,
  "distance_before_km": 149.2,
  "distance_after_km": 162.7,
  "additional_distance_km": 13.5
}
```

---

### 3.4 Carbon Intelligence Agent

See [Section 2.4](#24-post-lorricarbonestimat) for the LoRRI-facing endpoint.

The same endpoint is available without auth at: `POST /lorri/carbon/estimate`

---

### 3.5 Driver APIs

#### `GET /api/v1/drivers/{driver_id}`

```bash
curl https://fairrelay-brain-gdm1.onrender.com/api/v1/drivers/550e8400-e29b-41d4-a716-446655440000
```

**Response `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "external_id": "drv_001",
  "name": "Rajan Kumar",
  "phone": "+919876543210",
  "preferred_language": "ta",
  "vehicle_type": "PETROL",
  "vehicle_capacity_kg": 2000,
  "license_number": "TN01AB1234",
  "created_at": "2026-01-15T08:00:00Z",
  "recent_stats": [
    {
      "date": "2026-05-15",
      "num_packages": 18,
      "total_weight_kg": 42.3,
      "workload_score": 64.1,
      "fairness_score": 0.91
    }
  ]
}
```

#### `GET /api/v1/drivers/external/{external_id}`

Same response — look up by LoRRI's driver ID string instead of internal UUID.

#### `POST /api/v1/feedback`

Driver submits feedback after completing a route.

**Request:**
```json
{
  "driver_id": "550e8400-e29b-41d4-a716-446655440000",
  "assignment_id": "assign-uuid",
  "fairness_rating": 4,
  "stress_level": 3,
  "tiredness_level": 4,
  "hardest_aspect": "traffic",
  "comments": "Route was good but heavy traffic on the expressway."
}
```

**Response `201 Created`:**
```json
{
  "id": "feedback-uuid",
  "driver_id": "550e8400-...",
  "assignment_id": "assign-uuid",
  "fairness_rating": 4,
  "created_at": "2026-05-16T14:30:00Z",
  "message": "Feedback recorded. Thank you!"
}
```

---

### 3.6 Admin & Analytics

All endpoints under `/api/v1/admin/` — no auth required in current build.

#### `GET /api/v1/admin/metrics/fairness?start_date=2026-05-01&end_date=2026-05-16`

```json
{
  "time_series": [
    { "date": "2026-05-01", "gini_index": 0.12, "std_dev": 8.4, "num_allocations": 3 },
    { "date": "2026-05-02", "gini_index": 0.09, "std_dev": 6.1, "num_allocations": 5 }
  ]
}
```

#### `GET /api/v1/admin/learning/status`

```json
{
  "current_config": { "gini_threshold": 0.25, "stddev_threshold": 15 },
  "top_performing_configs": [ ... ],
  "driver_models_active": 8,
  "avg_prediction_mse": 0.034,
  "recent_episodes_7d": 42,
  "total_arms": 12
}
```

#### `POST /api/v1/admin/manual_override`

Reassign a route from one driver to another.

**Request:**
```json
{
  "allocation_run_id": "run-uuid",
  "old_driver_id": "drv-uuid-1",
  "new_driver_id": "drv-uuid-2",
  "route_id": "route-uuid",
  "reason": "Driver reported illness"
}
```

#### `POST /api/v1/admin/fairness_config`

Create a new fairness configuration (immediately active).

**Request:**
```json
{
  "workload_weight_packages": 1.0,
  "workload_weight_weight_kg": 0.5,
  "workload_weight_difficulty": 10.0,
  "workload_weight_time": 0.2,
  "gini_threshold": 0.25,
  "stddev_threshold": 15.0,
  "max_gap_threshold": 30.0,
  "recovery_mode_enabled": false
}
```

---

### 3.7 Real-time Events (SSE)

#### `GET /api/v1/agent-events/stream?run_id=<uuid>`

Subscribe to live agent progress during an allocation run. Use this to build a real-time progress indicator in LoRRI.

```javascript
const es = new EventSource(
  'https://fairrelay-brain-gdm1.onrender.com/api/v1/agent-events/stream?run_id=abc-123'
);
es.onmessage = (e) => {
  const event = JSON.parse(e.data);
  console.log(event.agent, event.status, event.message);
  // { agent: "fairness_manager", status: "completed", message: "ACCEPT — Gini 0.08" }
};
```

#### `GET /api/v1/agent-events/recent?run_id=<uuid>&limit=50`

Get recent cached events for a run (for clients that connected late).

```json
{
  "events": [
    { "agent": "ml_effort_agent", "status": "completed", "message": "Matrix built", "timestamp": "2026-05-16T08:23:41Z" }
  ],
  "count": 6
}
```

---

## 4. Node.js Backend Endpoints

Base URL: `https://fairrelay-backend.onrender.com`

---

### 4.1 Authentication & OTP

#### `POST /api/otp/send`

```json
// Request
{ "phone": "+919876543210" }

// Response 200
{ "otp_sent": true, "expires_in_seconds": 300 }
```

#### `POST /api/otp/verify`

```json
// Request
{ "phone": "+919876543210", "otp": "482916" }

// Response 200
{ "verified": true, "token": "<jwt>" }
```

#### `POST /api/auth/register`

```json
// Request
{ "phone": "+919876543210", "name": "Rajan Kumar" }

// Response 200
{ "otp_sent": true, "phone": "+919876543210" }
```

#### `POST /api/auth/verify-otp`

```json
// Request
{ "phone": "+919876543210", "otp": "482916", "role": "DRIVER" }

// Response 200
{ "token": "<jwt>", "user": { "id": "usr_001", "name": "Rajan Kumar", "role": "DRIVER" } }
```

#### `GET /api/auth/profile`
**Auth:** `Authorization: Bearer <token>`

```json
// Response 200
{ "id": "usr_001", "name": "Rajan Kumar", "phone": "+919876543210", "role": "DRIVER" }
```

---

### 4.2 Drivers

#### `GET /api/drivers`
```json
// Response 200
{
  "drivers": [
    { "id": "drv_001", "name": "Rajan Kumar", "phone": "+91...", "vehicle_type": "PETROL", "status": "ACTIVE" }
  ]
}
```

#### `POST /api/drivers`
```json
// Request
{ "name": "Suresh Pillai", "phone": "+919988776655", "vehicle_type": "EV", "vehicle_capacity_kg": 5000 }

// Response 201
{ "id": "drv_002", "name": "Suresh Pillai", ... }
```

#### `PUT /api/drivers/:id`
```json
// Request
{ "vehicle_capacity_kg": 3000, "status": "INACTIVE" }

// Response 200
{ "id": "drv_001", "vehicle_capacity_kg": 3000, "updated_at": "2026-05-16T09:00:00Z" }
```

#### `DELETE /api/drivers/:id`
```json
// Response 200
{ "success": true }
```

#### `GET /api/drivers/:truckId/active-route`
```json
// Response 200
{
  "route": { "id": "rt_001", "status": "IN_PROGRESS" },
  "stops": [
    { "order": 1, "address": "Pune Industrial", "status": "PENDING", "lat": 18.52, "lng": 73.85 }
  ]
}
```

---

### 4.3 Shipments

#### `POST /api/shipments/create`
**Auth:** JWT (SHIPPER role)
```json
// Request
{
  "pickup_address": "JNPT, Nhava Sheva, Mumbai",
  "drop_address": "Pune Phursungi Industrial Estate",
  "weight_kg": 800,
  "volume_m3": 3.2,
  "priority": "HIGH",
  "time_window_start": "08:00",
  "time_window_end": "14:00"
}

// Response 201
{ "id": "SH-001", "status": "PENDING", "created_at": "2026-05-16T07:00:00Z" }
```

#### `GET /api/shipments/my-shipments`
**Auth:** JWT (SHIPPER role)
```json
// Response 200
{ "shipments": [ { "id": "SH-001", "status": "IN_TRANSIT", "driver_id": "drv_001" } ] }
```

#### `POST /api/shipments/:id/accept`
**Auth:** JWT (DRIVER role)
```json
// Request
{ "driver_id": "drv_001" }

// Response 200
{ "shipment_id": "SH-001", "status": "ACCEPTED", "driver_id": "drv_001" }
```

---

### 4.4 Deliveries

#### `POST /api/deliveries/create`
```json
// Request
{ "shipment_id": "SH-001", "driver_id": "drv_001", "route_id": "rt_001" }

// Response 201
{ "id": "dlv_001", "status": "ASSIGNED" }
```

#### `POST /api/deliveries/:id/start`
**Auth:** JWT (DRIVER role)
```json
// Response 200
{ "id": "dlv_001", "status": "EN_ROUTE", "started_at": "2026-05-16T08:30:00Z" }
```

#### `POST /api/deliveries/:id/pickup`
**Auth:** JWT (DRIVER role)
```json
// Request
{ "cargo_details": { "verified_weight_kg": 798, "condition": "GOOD" } }

// Response 200
{ "id": "dlv_001", "status": "PICKED_UP" }
```

#### `POST /api/deliveries/:id/complete`
**Auth:** JWT (DRIVER role)
```json
// Request
{ "delivery_time": "2026-05-16T13:45:00Z", "signature": "<base64>", "photo": "<base64>" }

// Response 200
{ "id": "dlv_001", "status": "COMPLETED", "proof_url": "https://..." }
```

---

### 4.5 Wellness

#### `GET /api/wellness/summary`
```json
// Response 200
{
  "fleet_wellness": {
    "avg_score": 72,
    "at_risk_drivers": 2,
    "fit_for_duty": 8,
    "total_drivers": 10
  }
}
```

#### `GET /api/wellness/drivers`
```json
// Response 200
{
  "drivers": [
    { "id": "drv_001", "name": "Rajan", "wellness_score": 82, "status": "FIT", "risk_level": "LOW" },
    { "id": "drv_002", "name": "Suresh", "wellness_score": 38, "status": "AT_RISK", "risk_level": "HIGH" }
  ]
}
```

#### `PUT /api/wellness/drivers/:driverId`
```json
// Request
{ "hours_today": 5.5, "hours_since_rest": 4, "is_ill": false }

// Response 200
{ "driver_id": "drv_001", "wellness_score": 68, "risk_level": "MEDIUM" }
```

#### `GET /api/wellness/cognitive/:driverId`
```json
// Response 200
{
  "driver_id": "drv_001",
  "cognitive_load_score": 62,
  "fatigue_level": "MODERATE",
  "stress_level": "LOW",
  "recommendation": "Short break recommended in 90 minutes"
}
```

---

### 4.6 Consolidation (Proxy)

The backend proxies consolidation requests to the Brain. Same request/response as Brain `/api/v1/consolidate`.

#### `POST /api/consolidation/optimize`
Proxies to `https://fairrelay-brain-gdm1.onrender.com/api/v1/consolidate` with local FFD fallback.

#### `POST /api/consolidation/simulate`
Proxies to Brain `/api/v1/consolidate/simulate`.

#### `GET /api/consolidation/history`
```json
// Response 200
{
  "past_consolidations": [
    { "id": "cons_001", "date": "2026-05-15", "trips_reduced": 2, "co2_saved_kg": 22.5 }
  ]
}
```

---

### 4.7 V1 API Gateway

The `/v1` namespace is a production-hardened gateway that proxies requests to the Brain with demo-mode fallback. Requires API key.

**Auth:** `x-api-key` header  
**Demo key for testing:** `fr_live_demo_key_2026`

#### `GET /v1/health`
```bash
curl https://fairrelay-backend.onrender.com/v1/health \
  -H "x-api-key: fr_live_demo_key_2026"
```
```json
{
  "success": true,
  "data": {
    "api": "operational",
    "brain": "connected",
    "version": "1.0.0"
  },
  "meta": { "brain_latency_ms": 245, "mode": "live", "timestamp": "2026-05-16T08:00:00Z" }
}
```

#### `POST /v1/allocate`
Same schema as `/lorri/allocate`. Returns `mode: "live"` or `mode: "demo"`.

#### `POST /v1/wellness`
Same schema as `/lorri/wellness`.

#### `POST /v1/carbon`
Simplified carbon estimate (route-level, not shipment-level).

```json
// Request
{
  "routes": [
    { "id": "rt_001", "distance_km": 149, "weight_kg": 800 }
  ],
  "vehicle_type": "diesel"
}

// Response 200
{
  "success": true,
  "data": {
    "routes": [
      { "id": "rt_001", "co2_kg": 12.5, "saved_vs_baseline_kg": 18.8 }
    ],
    "total_co2_kg": 12.5,
    "total_saved_vs_diesel_kg": 18.8
  }
}
```

#### `POST /v1/gini`
Compute Gini coefficient for any set of values.

```json
// Request
{ "values": [65.3, 64.2, 58.1, 72.4], "labels": ["Rajan", "Suresh", "Kumar", "Priya"] }

// Response 200
{
  "success": true,
  "data": {
    "gini_index": 0.072,
    "fairness_grade": "A+",
    "interpretation": "Excellent workload balance — all drivers within 15% of mean.",
    "breakdown": [
      { "label": "Rajan", "value": 65.3, "deviation_from_mean": 0.3 }
    ]
  }
}
```

#### `POST /v1/night-safety`
Apply night-time wellness constraints to a driver roster.

```json
// Request
{ "drivers": [ { "id": "drv_001", "hours_today": 8 } ], "current_hour": 22 }

// Response 200
{
  "success": true,
  "data": {
    "is_night_mode": true,
    "drivers": [
      { "id": "drv_001", "fit_for_night": false, "reason": "Exceeded 8 hours on duty" }
    ]
  }
}
```

#### `POST /v1/consolidate`
Proxies to Brain. Same schema as `/api/v1/consolidate`.

---

### 4.8 Absorption & Synergy

Absorption = peer-to-peer truck handover when a driver cannot complete a delivery.

#### `GET /api/absorption/map-data`
**Auth:** JWT required
```json
// Response 200
{
  "map_data": {
    "clusters": [
      { "id": "cl_001", "center": { "lat": 19.076, "lng": 72.877 }, "size": 3 }
    ],
    "hubs": [
      { "id": "hub_001", "name": "Andheri Virtual Hub", "lat": 19.113, "lng": 72.869, "active": true }
    ],
    "live_absorptions": [
      { "id": "abs_001", "from_driver": "drv_001", "to_driver": "drv_003", "status": "IN_PROGRESS" }
    ]
  }
}
```

#### `POST /api/synergy/generate-qr`
**Auth:** JWT required
```json
// Request
{ "synergy_id": "syn_001", "receiver_driver_id": "drv_003" }

// Response 201
{ "qr_code": "<base64-png>", "expires_at": "2026-05-16T10:00:00Z" }
```

#### `POST /api/synergy/verify-qr`
**Auth:** JWT required
```json
// Request
{ "qr_data": "<scanned-qr-string>" }

// Response 200
{ "qr_valid": true, "synergy_id": "syn_001" }
```

#### `POST /api/synergy/complete`
**Auth:** JWT required
```json
// Request
{ "synergy_id": "syn_001" }

// Response 200
{ "status": "COMPLETED", "handover_time": "2026-05-16T09:45:00Z" }
```

---

### 4.9 Virtual Hubs & E-Way Bills

#### `GET /api/virtual-hubs`
```json
// Response 200
{
  "hubs": [
    { "id": "hub_001", "name": "Andheri Hub", "lat": 19.113, "lng": 72.869, "capacity": 50, "active": true }
  ]
}
```

#### `POST /api/virtual-hubs`
```json
// Request
{ "name": "Thane East Hub", "location": { "lat": 19.218, "lng": 72.978 }, "capacity": 30 }

// Response 201
{ "id": "hub_003", "name": "Thane East Hub", "created_at": "2026-05-16T09:00:00Z" }
```

#### `GET /api/eway-bills`
```json
// Response 200
{
  "bills": [
    { "id": "ewb_001", "shipment_id": "SH-001", "status": "VALID", "expiry": "2026-05-23" }
  ]
}
```

#### `POST /api/eway-bills`
```json
// Request
{
  "shipment_id": "SH-001",
  "from_location": "Mumbai JNPT",
  "to_location": "Pune Industrial",
  "weight_kg": 800,
  "value_inr": 125000,
  "hsn_code": "8471"
}

// Response 201
{ "id": "ewb_002", "ewb_number": "EWB2026051600123", "valid_until": "2026-05-23" }
```

---

### 4.10 API Keys

#### `POST /api/keys`
```json
// Request
{ "user_id": "usr_001", "name": "LoRRI Production Key", "scopes": ["allocate", "wellness", "carbon"] }

// Response 201
{ "id": "key_001", "name": "LoRRI Production Key", "api_key": "fr_live_abc123xyz", "created_at": "2026-05-16T09:00:00Z" }
```

> **Important:** The `api_key` value is shown only once at creation. Store it securely.

#### `GET /api/keys?userId=usr_001`
```json
// Response 200
{
  "keys": [
    { "id": "key_001", "name": "LoRRI Production Key", "last_used": "2026-05-16T08:30:00Z", "scopes": ["allocate"] }
  ]
}
```

#### `DELETE /api/keys/:id`
```json
// Response 200
{ "success": true, "message": "API key revoked." }
```

---

## 5. Error Codes Reference

All errors follow this shape:

```json
{
  "detail": "Human-readable error message",
  "status_code": 422
}
```

| HTTP Status | Meaning | Common cause |
|-------------|---------|--------------|
| `400` | Bad Request | Missing required field, invalid JSON |
| `401` | Unauthorized | Missing `x-api-key` or `Authorization` header |
| `403` | Forbidden | Invalid API key |
| `404` | Not Found | Driver/route/run UUID doesn't exist |
| `422` | Unprocessable Entity | Schema validation failed (Pydantic) |
| `429` | Too Many Requests | Rate limit hit (100 req/min per key) |
| `500` | Internal Server Error | Brain pipeline failure (check `/health`) |
| `503` | Service Unavailable | Brain cold-starting on Render (wait 30s and retry) |

**Render cold-start:** Free-tier Render services spin down after 15 min of inactivity. First request after a spin-down takes 30–60s. Subsequent requests are fast. Use UptimeRobot to ping `/health` every 5 min to prevent cold starts.

---

## 6. Rate Limits

| Endpoint group | Limit | Window |
|----------------|-------|--------|
| `/lorri/allocate`, `/lorri/wellness`, `/lorri/stats` | 100 req | per API key per minute |
| `/api/auth/*`, `/api/otp/*` | 30 req | per IP per minute |
| `/api/v1/*` (Brain core) | No limit | — |
| `/lorri/health`, `/lorri/carbon/estimate` | No limit | — |
| `/v1/*` (Backend gateway) | No limit | — |

Rate limit exceeded returns `429` with header `Retry-After: 60`.

---

*Generated: 2026-05-16 · FairRelay v1.0 · Brain: `fairrelay-brain-gdm1.onrender.com` · Backend: `fairrelay-backend.onrender.com`*
