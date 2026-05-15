# FairRelay — AI Logistics Intelligence Platform

**Live:** https://fair-relay.vercel.app

React + Vite dashboard delivering two AI-powered logistics engines for the LoRRI platform.

---

## Problem Statements Covered

| # | Statement | Tab |
|---|-----------|-----|
| 5 | AI Load Consolidation Optimization Engine | Route Optimization → Tab 1 (PRIMARY) |
| 4 | AI Route Optimization Engine | Route Optimization → Tab 2 (NOVELTY) |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Live KPIs, fleet tracking, dispatch health |
| `/fair-dispatch` | AI Fair Dispatch | 8-agent LangGraph fairness allocation engine |
| `/route-optimization` | Route Optimization | **Load Consolidation + Route Optimizer (main demo)** |
| `/absorption-requests` | Absorption | Peer-to-peer truck handover with Leaflet map |
| `/packages` | Packages | Shipment creation with live form preview |
| `/allocate-routes` | Allocate Routes | Full-screen map with TSP route planning |
| `/load-consolidation` | Load Consolidation | Standalone consolidation dashboard |
| `/analytics` | Analytics | Revenue trends, Gini fairness index, driver earnings |
| `/carbon-tracking` | Carbon Tracking | ESG scores, CO₂ savings, UN SDG alignment |
| `/api-keys` | API Keys | Key management for LoRRI integration |

---

## Key Tech

- **React 18 + Vite + TypeScript + TailwindCSS**
- **Recharts** — BarChart, RadarChart, PieChart, AreaChart
- **React-Leaflet** — interactive maps with before/after toggle
- **Ola Maps Distance Matrix API** — real road distances for route optimizer
- **botlearn.ai / Gemini 2.5 Flash** — real LLM insights on consolidation results
- **2-opt local search** — nearest-neighbour TSP for multi-stop sequencing
- **OR-Tools CP-SAT / KMeans** — via brain API for consolidation

---

## Load Consolidation Engine (PRIMARY)

`/route-optimization` → Tab 1

**5-agent pipeline:**
1. **GeoClusteringAgent** — KMeans on 4D pickup+drop coordinates
2. **TimeWindowAgent** — delivery window overlap filtering
3. **CapacityOptimizationAgent** — OR-Tools CP-SAT bin-packing
4. **ScoringConfidenceAgent** — Haversine-based confidence scoring
5. **ContinuousLearningAgent** — Q-learning + Gemini 2.5 Flash insights

**Calls:** `https://fairrelay-brain-gdm1.onrender.com/api/v1/consolidate`  
**Fallback:** local FFD bin-packing engine (runs offline, 2.4s simulated pipeline)

**Metrics demonstrated:**
- % improvement in vehicle utilization
- Trips reduced (before vs after)
- Distance saved (km)
- CO₂ saved (kg) + carbon credit estimate (USD)
- Fuel saved (₹)

---

## Route Optimizer (NOVELTY)

`/route-optimization` → Tab 2

- Per-group fleet route optimization from consolidation output
- Nearest-neighbour greedy + 2-opt local search
- Mumbai last-mile demo: 10 stops, SVG before/after animated visualization
- Ola Maps integration for real road distances (haversine fallback)

---

## Local Development

```bash
cd ops/AIsupplychain/aisupply
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev
# → http://localhost:5173
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL (`https://fairrelay-backend.onrender.com`) |
| `VITE_OLA_MAPS_API_KEY` | No | Ola Maps key for real road distances |

## Build & Deploy

```bash
npm run build   # tsc -b && vite build → dist/
# Vercel auto-deploys on push to GitHub main
# vercel.json rewrites /api/* → fairrelay-backend.onrender.com/api/*
```
