# FairRelay — Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  LoRRI Production (logisticsnow.in)                                 │
│  Embeds FairRelay via iframe/API integration                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────────┐
│  Ops Dashboard (Vercel)                                             │
│  React + Vite + TailwindCSS                                        │
│  Pages: FairDispatch, LoadConsolidation, AssignTasks, Analytics     │
│  URL: https://fairrelay.vercel.app                                  │
│  Root: ops/AIsupplychain/aisupply/                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS (axios → /api/*)
┌───────────────────────────────▼─────────────────────────────────────┐
│  Node.js API Gateway (Render)                                       │
│  Express + Prisma + Socket.IO                                       │
│  Auth, Drivers CRUD, Packages, E-Way Bills, Carbon, Wellness        │
│  Proxies /api/dispatch/* → Brain                                    │
│  URL: https://fairrelay-backend.onrender.com                        │
│  Root: ops/backend-dm/                                              │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS (proxy)
┌───────────────────────────────▼─────────────────────────────────────┐
│  AI Brain (Render - Docker)                                         │
│  FastAPI + LangGraph + SQLAlchemy                                   │
│  8 AI Agents: ML Effort → Route Planner → Fairness Manager →       │
│  Driver Liaison → Final Resolution → Explainability → Learning      │
│  + 5-Agent Consolidation Pipeline                                   │
│  URL: https://fairrelay-brain.onrender.com                          │
│  Root: brain/                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│  Databases                                                          │
│  • PostgreSQL (Render/Supabase) — primary production                │
│  • SQLite fallback (auto-created if no DATABASE_URL)                │
│  • LangSmith (optional tracing)                                     │
│  • Gemini 2.5 Flash (optional LLM explanations)                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Steps

### 1. AI Brain (FastAPI) → Render

```bash
# From the brain/ directory
cd brain

# Deploy to Render:
# 1. Create New Web Service → Docker
# 2. Root Directory: brain
# 3. Dockerfile Path: ./Dockerfile
# 4. Environment Variables:
#    APP_ENV=production
#    PORT=8000
#    DATABASE_URL=             (leave empty for SQLite fallback)
#    CORS_ORIGINS=https://fairrelay-backend.onrender.com,https://fairrelay.vercel.app,https://logisticsnow.in
#    GOOGLE_API_KEY=<your-key> (optional, for Gemini explanations)
#    GEMINI_MODEL=gemini-2.5-flash
#    ENABLE_GEMINI_EXPLAIN=true
#    LANGCHAIN_TRACING_V2=false
```

**Health check URL:** `/health`  
**API Docs:** `https://fairrelay-brain.onrender.com/docs`

### 2. Node.js Backend → Render

```bash
cd ops/backend-dm

# Deploy to Render:
# 1. Create New Web Service → Node
# 2. Root Directory: ops/backend-dm
# 3. Build Command: npm install
# 4. Start Command: node index.js
# 5. Environment Variables:
#    NODE_ENV=production
#    PORT=3000
#    BRAIN_URL=https://fairrelay-brain.onrender.com
#    DATABASE_URL=<your-postgres-url>
#    JWT_SECRET=<random-secure-string>
#    CORS_ORIGINS=https://fairrelay.vercel.app,https://logisticsnow.in
```

**Health check URL:** `/health`

### 3. Ops Dashboard → Vercel

```bash
cd ops/AIsupplychain/aisupply

# Deploy to Vercel:
# 1. Import from GitHub
# 2. Root Directory: ops/AIsupplychain/aisupply
# 3. Framework: Vite
# 4. Environment Variables:
#    VITE_API_URL=https://fairrelay-backend.onrender.com
```

### 4. Landing Page → Vercel

```bash
cd landing

# Deploy to Vercel:
# 1. Import from GitHub
# 2. Root Directory: landing
# 3. Framework: Vite
# 4. Environment Variables:
#    VITE_API_URL=https://fairrelay-backend.onrender.com
```

---

## LoRRI Integration

FairRelay integrates into LoRRI (logisticsnow.in) via:

### Option A: API Integration (Recommended)
LoRRI calls FairRelay's allocation API directly:

```bash
POST https://fairrelay-backend.onrender.com/api/dispatch/allocate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "drivers": [...],
  "routes": [...],
  "packages": [...]
}
```

### Option B: Embedded Dashboard
Embed the FairDispatch page in an iframe:

```html
<iframe src="https://fairrelay.vercel.app/fair-dispatch" 
        width="100%" height="800px" 
        frameborder="0" allow="clipboard-read">
</iframe>
```

### Option C: Webhook Integration
LoRRI sends webhook events → FairRelay processes → returns results:

```
LoRRI → POST /api/v1/allocate (with drivers + packages)
     ← Response with fair assignments + explanations
     → POST /api/v1/consolidate/optimize (with shipments + trucks)
     ← Response with consolidated groups + carbon savings
```

---

## AI Agent Pipeline (What runs on each allocation)

| Phase | Agent | What it does | Latency |
|-------|-------|-------------|---------|
| 1 | ML Effort Agent | Builds [drivers × routes] effort matrix | ~50ms |
| 2 | Route Planner | OR-Tools linear assignment (proposal 1) | ~100ms |
| 3a | Fairness Manager | Evaluates Gini/stddev/max_gap | ~20ms |
| 3b | Route Planner (re-opt) | Penalized assignment if unfair | ~80ms |
| 4 | Driver Liaison | Per-driver comfort band negotiation | ~30ms |
| 5 | Final Resolution | Resolves counter-proposals via swaps | ~50ms |
| 6 | Explainability | Generates natural language explanations | ~100ms |
| 6b | Gemini LLM (optional) | Rich multilingual explanations | ~2s |
| 7 | Learning Agent | Creates episode for config auto-tuning | ~10ms |

**Total pipeline:** ~450ms (without Gemini) / ~2.5s (with Gemini)

---

## Environment Variables Reference

### Brain (FastAPI)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | SQLite | PostgreSQL URL or empty for SQLite |
| `APP_ENV` | No | production | `development` or `production` |
| `GOOGLE_API_KEY` | No | — | Gemini API key for LLM explanations |
| `GEMINI_MODEL` | No | gemini-2.5-flash | Model for explanations |
| `ENABLE_GEMINI_EXPLAIN` | No | false | Enable Gemini agent |
| `LANGCHAIN_API_KEY` | No | — | LangSmith tracing key |
| `CORS_ORIGINS` | No | * | Comma-separated allowed origins |

### Backend (Node.js)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes* | — | PostgreSQL for auth/drivers/packages |
| `BRAIN_URL` | Yes | localhost:8000 | URL of the AI brain service |
| `JWT_SECRET` | Yes | — | Secret for JWT token signing |
| `CORS_ORIGINS` | No | localhost | Allowed CORS origins |
| `PORT` | No | 3000 | Server port |

### Dashboard (React)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | /api | Backend URL (Render) |

---

## Local Development

```bash
# Terminal 1: AI Brain
cd brain
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: Node.js Backend
cd ops/backend-dm
npm install
echo "BRAIN_URL=http://localhost:8000" > .env
node index.js

# Terminal 3: Ops Dashboard
cd ops/AIsupplychain/aisupply
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev
```

Open http://localhost:5173 → FairDispatch page → Run Fair Allocation

---

## Production Checklist

- [ ] Brain deployed on Render (Docker) ✓ Health check passes
- [ ] Node.js backend on Render ✓ `/health` returns healthy
- [ ] Dashboard on Vercel ✓ Connects to backend
- [ ] PostgreSQL database provisioned (Render/Supabase)
- [ ] `BRAIN_URL` in backend points to brain service
- [ ] `VITE_API_URL` in dashboard points to backend
- [ ] CORS origins include `logisticsnow.in`
- [ ] Gemini API key configured (optional but recommended)
- [ ] SSL/HTTPS on all services (automatic on Render/Vercel)
- [ ] Rate limiting active on auth endpoints
- [ ] Socket.IO CORS configured for real-time updates
