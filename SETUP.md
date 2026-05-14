# FairRelay — Complete Setup Guide

## Quick Start (30 seconds)

```bash
# Clone
git clone https://github.com/MUTHUKUMARAN-K-1/FairRelay.git
cd FairRelay

# Start Brain (AI Engine)
cd brain
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs (Swagger UI)

# Start Backend (API Gateway) — new terminal
cd ops/backend-dm
npm install
echo "BRAIN_URL=http://localhost:8000" > .env
node index.js
# → http://localhost:3000/health

# Start Dashboard — new terminal
cd ops/AIsupplychain/aisupply
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev
# → http://localhost:5173
```

Open http://localhost:5173 → Navigate to **Fair Dispatch** → Click **Run Fair Allocation**

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Dashboard (React + Vite)  :5173        │
│  Pages: FairDispatch, LoadConsolidation │
└────────────────┬────────────────────────┘
                 │ axios → /api/*
┌────────────────▼────────────────────────┐
│  API Gateway (Node.js + Express)  :3000 │
│  Auth, CRUD, Proxy to Brain             │
└────────────────┬────────────────────────┘
                 │ axios → BRAIN_URL
┌────────────────▼────────────────────────┐
│  AI Brain (FastAPI + LangGraph)   :8000 │
│  8 Dispatch Agents + 5 Consolidation    │
│  OR-Tools, scikit-learn, XGBoost        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Database: SQLite (auto) or PostgreSQL  │
└─────────────────────────────────────────┘
```

---

## Environment Variables

### Brain (`brain/.env`)
```env
# Required: NONE (SQLite auto-created)
# Optional:
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/fairrelay
GOOGLE_API_KEY=your-gemini-key          # For LLM explanations
GEMINI_MODEL=gemini-2.5-flash           # Model to use
OLA_MAPS_API_KEY=your-ola-key           # For real-time traffic
LANGCHAIN_API_KEY=your-langsmith-key    # For tracing (optional)
APP_ENV=development                     # Shows /docs + /redoc
```

### Backend (`ops/backend-dm/.env`)
```env
BRAIN_URL=http://localhost:8000         # Required
DATABASE_URL=postgresql://...           # For auth/drivers/packages
JWT_SECRET=your-secret                  # For auth tokens
PORT=3000
```

### Dashboard (`ops/AIsupplychain/aisupply/.env`)
```env
VITE_API_URL=http://localhost:3000      # Points to API Gateway
```

---

## What Each Agent Does

### Fair Dispatch Pipeline (8 Agents)

| # | Agent | Algorithm | What it computes |
|---|-------|-----------|-----------------|
| 1 | ML Effort | Deterministic formula + traffic | N×M effort matrix |
| 2 | Route Planner | OR-Tools SCIP/GLOP solver | Optimal 1-to-1 assignment |
| 3 | Fairness Manager | Gini coefficient | ACCEPT or REOPTIMIZE |
| 4 | Route Planner v2 | OR-Tools + penalties | Re-optimized assignment |
| 5 | Driver Liaison | Comfort band logic | Per-driver ACCEPT/COUNTER |
| 6 | Final Resolution | Metric-validated swaps | Resolve counter-proposals |
| 7 | Explainability | Template categorization | Natural language per driver |
| 8 | Gemini LLM | Gemini 2.5 Flash (optional) | Rich multilingual explanations |

### Load Consolidation Pipeline (5 Agents)

| # | Agent | Algorithm | What it computes |
|---|-------|-----------|-----------------|
| 1 | Geo Clustering | KMeans + Silhouette | Group nearby shipments |
| 2 | Time Window | Overlap filter | Split incompatible schedules |
| 3 | Capacity | OR-Tools CP-SAT | Bin-pack into trucks |
| 4 | Scoring | Multi-metric | Confidence per group |
| 5 | RL Insights | Q-Learning | Optimal parameters |

---

## API Endpoints

### Core Allocation
```bash
# Full LangGraph pipeline (8 agents)
POST /api/v1/allocate/langgraph

# Simple allocation (no LangGraph)
POST /api/v1/allocate

# Load consolidation (5 agents)
POST /api/v1/consolidate/optimize

# Compare scenarios
POST /api/v1/consolidate/simulate
```

### Monitoring
```bash
# Health check
GET /health

# SSE agent events (real-time)
GET /agent-events/stream?run_id=<uuid>

# Run history
GET /api/v1/runs
GET /api/v1/runs/<run_id>
```

### Driver Management
```bash
GET /api/v1/drivers
GET /api/v1/drivers/<id>
POST /api/v1/feedback
```

---

## Testing

```bash
cd brain

# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_langgraph_workflow.py -v

# Test full workflow manually
python test_workflow.py
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production deployment guide with:
- Render (Brain + Backend)
- Vercel (Dashboard + Landing)
- LoRRI integration patterns

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| AI Engine | Python 3.11, FastAPI, LangGraph, SQLAlchemy |
| Optimization | OR-Tools (SCIP, CP-SAT), scikit-learn, XGBoost |
| Traffic | OLA Maps API (real-time Indian traffic) |
| LLM | Gemini 2.5 Flash (multilingual explanations) |
| API Gateway | Node.js, Express, Prisma, Socket.IO |
| Dashboard | React 19, Vite, TailwindCSS, Axios |
| Mobile | Flutter (driver app) |
| Database | PostgreSQL (prod) / SQLite (dev/demo) |
| Deployment | Render (Docker) + Vercel (static) |

---

## Key Differentiators

1. **Gini Coefficient Fairness** — mathematically provable workload equity (0.85 → 0.12)
2. **EV-First Routing** — battery feasibility + charging penalty in OR-Tools cost matrix
3. **Night Safety** — gender-aware routing after 9 PM (avoid high-crime zones)
4. **Cognitive Load Index** — 6-factor driver mental fatigue scoring
5. **Explainable AI** — every allocation decision has a natural language explanation
6. **Real-Time Traffic** — OLA Maps API integration for Indian road conditions
7. **Self-Improving** — Q-Learning bandit auto-tunes fairness thresholds daily
8. **Production TMS Integration** — designed for LoRRI (logisticsnow.in) embedding
