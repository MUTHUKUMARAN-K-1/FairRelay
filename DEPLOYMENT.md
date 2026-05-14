# 🚀 FairRelay — Production Deployment Guide

## Architecture Overview (LoRRI Integration)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LoRRI Production (logisticsnow.in)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Indent   │  │  Fleet   │  │  Trip    │  │  E-Way Bill      │   │
│  │ Mgmt     │  │ Tracking │  │  Mgmt    │  │  Generation      │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │              │                  │             │
│       └──────────────┴──────────────┴──────────────────┘             │
│                              │                                       │
│                    ┌─────────▼─────────┐                             │
│                    │  LoRRI Dispatch   │                             │
│                    │  Module           │                             │
│                    └─────────┬─────────┘                             │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ POST /v1/allocate
                               │ (API Key Auth)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              FairRelay API Gateway (ops/backend-dm)                  │
│              Render: https://fairrelay-api.onrender.com              │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ /v1/allocate│ │/v1/wellness│ │ /v1/gini   │ │/v1/consolidate │  │
│  │ /v1/carbon │ │/v1/night-  │ │ /v1/runs   │ │/v1/health      │  │
│  │            │ │  safety    │ │            │ │                │  │
│  └─────┬──────┘ └────────────┘ └────────────┘ └───────┬────────┘  │
│        │                                               │            │
│        │  Proxies to Brain when available               │            │
│        │  Falls back to demo mode otherwise             │            │
└────────┼───────────────────────────────────────────────┼────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              FairRelay AI Brain (brain/)                             │
│              Render: https://fairrelay-brain.onrender.com            │
│                                                                     │
│  ┌─────────────────── LangGraph Workflow ───────────────────────┐   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ML Effort │→ │  Route   │→ │ Fairness │→ │  Route   │   │   │
│  │  │  Agent   │  │ Planner  │  │ Manager  │  │Planner v2│   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │       │                            │              │          │   │
│  │       ▼                            ▼              ▼          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ Driver   │→ │  Final   │→ │Explainab-│→ │  Gemini  │   │   │
│  │  │ Liaison  │  │Resolution│  │  ility   │  │(optional)│   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Features: K-Means clustering, OR-Tools optimization, Gini index,  │
│  EV-first routing, night safety, recovery days, wellness scoring    │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Frontends (Vercel)                                                 │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐ │
│  │ Landing Page      │  │ Ops Dashboard     │  │ Flutter App    │ │
│  │ fairrelay.vercel  │  │ fairrelay-ops.    │  │ MyFairRelay    │ │
│  │ .app              │  │ vercel.app        │  │ (Android/iOS)  │ │
│  └───────────────────┘  └───────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Deploy Commands

### 1. AI Brain (FastAPI + LangGraph) → Render

```bash
# From /brain directory
# Render auto-deploys from GitHub via render.yaml

# Environment variables (set in Render dashboard):
DATABASE_URL=            # Leave empty for SQLite fallback (free tier)
APP_ENV=production
GOOGLE_API_KEY=          # Optional: enables Gemini explanations
LANGCHAIN_TRACING_V2=false
```

**URL**: `https://fairrelay-brain.onrender.com`
**Health**: `GET /health`
**Docs**: `GET /docs`

### 2. API Gateway (Node.js + Prisma) → Render

```bash
# From /ops/backend-dm directory
# Deploy as Docker or Node.js service

# Environment variables:
DATABASE_URL=postgresql://...  # Render PostgreSQL (free tier)
BRAIN_URL=https://fairrelay-brain.onrender.com
CORS_ORIGINS=https://fairrelay.vercel.app,https://fairrelay-ops.vercel.app
JWT_SECRET=your-secret-here
NODE_ENV=production
```

**URL**: `https://fairrelay-api.onrender.com`
**Health**: `GET /v1/health`
**Docs**: `GET /api/docs`

### 3. Landing Page (React/Vite) → Vercel

```bash
cd landing
vercel --prod

# Environment variables (set in Vercel):
VITE_API_URL=https://fairrelay-api.onrender.com
```

### 4. Ops Dashboard (React/Vite) → Vercel

```bash
cd ops/AIsupplychain/aisupply
vercel --prod

# Environment variables:
VITE_API_BASE_URL=https://fairrelay-api.onrender.com
```

## LoRRI Integration API Contract

### Authentication
```
Header: x-api-key: fr_live_xxxxxxxxxxxxxxxxxx
```

### Core Endpoint: Fair Allocation
```http
POST /v1/allocate
Content-Type: application/json
x-api-key: fr_live_xxx

{
  "drivers": [
    { "id": "drv_001", "name": "Rajesh Kumar", "hours_today": 4.5, "is_ill": false, "vehicle_type": "DIESEL", "gender": "M" },
    { "id": "drv_002", "name": "Priya Sharma", "hours_today": 8.1, "is_ill": false, "vehicle_type": "ELECTRIC", "gender": "F" }
  ],
  "routes": [
    { "id": "rt_A", "distance_km": 142, "difficulty": "medium" },
    { "id": "rt_B", "distance_km": 48, "difficulty": "easy", "is_city_centre": true }
  ],
  "options": { "ev_first": true, "night_safety": true }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "run_1708394400000",
    "allocations": [
      {
        "driver": "drv_002",
        "route": "rt_B",
        "wellness_score": 61,
        "carbon_kg": "10.1",
        "explanation": "Priya assigned city route (EV-first). 8.1h worked — shorter route for recovery."
      }
    ]
  },
  "meta": {
    "gini_index": 0.12,
    "fairness_grade": "A",
    "carbon_kg": "39.8",
    "latency_ms": 284,
    "mode": "live"
  }
}
```

### Other Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/health` | GET | System + Brain connectivity |
| `/v1/allocate` | POST | Fair route allocation |
| `/v1/wellness` | POST | Driver wellness scoring |
| `/v1/gini` | POST | Standalone Gini calculation |
| `/v1/night-safety` | POST | Night safety constraints |
| `/v1/carbon` | POST | CO₂ emission estimates |
| `/v1/consolidate` | POST | AI load consolidation |
| `/v1/runs` | GET | Recent allocation history |

## What Makes This YC-Level

1. **Real AI Pipeline** — 6-8 LangGraph agents with OR-Tools optimization (not mock data)
2. **Fairness Metrics** — Gini coefficient computed per run, tracked over time
3. **SDG Alignment** — SDG 8 (Decent Work), SDG 10 (Inequality), SDG 13 (Climate)
4. **Production Architecture** — API gateway + microservice brain + SSE streaming
5. **Explainability** — Every allocation decision has a human-readable explanation
6. **Driver Wellness** — Fatigue scoring, recovery days, night safety for women
7. **EV-First Routing** — Prioritizes electric vehicles for city-centre routes
8. **Learning Agent** — Multi-armed bandit tunes fairness thresholds over time
9. **LoRRI Integration** — Single API call from existing TMS, zero disruption
10. **Scale** — K-Means + OR-Tools handles 1000+ packages in <5s
