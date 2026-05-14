import { useState } from 'react'
import './HowItWorks.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://fairrelay-backend.onrender.com'

const steps = [
  {
    step: '01',
    title: 'Geographic Clustering Agent',
    desc: 'scikit-learn KMeans clusters shipments by pickup/drop proximity (4D feature vectors). Silhouette-score selects optimal K. Groups nearby shipments heading the same direction.',
    code: `curl -X POST ${API_URL}/api/v1/consolidate/optimize \\
  -H "Content-Type: application/json" \\
  -d '{
    "shipments": [
      {"id": "SH-1", "pickupLat": 19.076, "pickupLng": 72.877,
       "dropLat": 18.520, "dropLng": 73.856, "weight": 800}
    ],
    "trucks": [{"id": "T-1", "maxWeight": 2000, "maxVolume": 8}]
  }'`,
    color: '#f97316',
    endpoint: 'POST /api/v1/consolidate/optimize',
  },
  {
    step: '02',
    title: 'Time Window Compatibility Agent',
    desc: 'Filters clusters by delivery time window overlap. Splits groups where shipments have incompatible schedules. Configurable tolerance (default: 120 min).',
    code: `# Time windows are part of the shipment payload:
{
  "shipments": [{
    "id": "SH-1",
    "timeWindowStart": "2026-02-20T06:00:00Z",
    "timeWindowEnd": "2026-02-20T12:00:00Z",
    ...
  }]
}
# Agent auto-splits groups with >120min gap`,
    color: '#3b82f6',
    endpoint: 'Integrated in consolidate pipeline',
  },
  {
    step: '03',
    title: 'Capacity Optimization Agent',
    desc: 'OR-Tools CP-SAT integer programming solver assigns shipments to trucks. Minimizes vehicles used while respecting weight + volume constraints. FFD heuristic fallback.',
    code: `# Response includes packed truck assignments:
{
  "groups": [{
    "groupId": 1,
    "truckId": "T-1",
    "shipmentCount": 3,
    "totalWeight": 1850,
    "utilizationWeight": 92.5
  }],
  "metrics": {
    "utilizationBefore": 27.3,
    "utilizationAfter": 82.1,
    "tripsReduced": 4
  }
}`,
    color: '#10b981',
    endpoint: 'Response from /consolidate/optimize',
  },
  {
    step: '04',
    title: 'Fair Dispatch Engine (8 Agents)',
    desc: 'LangGraph multi-agent workflow: ML Effort → Route Planner (OR-Tools) → Fairness Manager (Gini ≤ 0.33) → Driver Liaison → Final Resolution → Explainability.',
    code: `curl -X POST ${API_URL}/api/dispatch/allocate \\
  -H "Content-Type: application/json" \\
  -d '{
    "drivers": [
      {"id": "D-1", "name": "Rajesh", "vehicle_capacity_kg": 500}
    ],
    "packages": [
      {"id": "P-1", "weight_kg": 12, "latitude": 19.13,
       "longitude": 72.82, "priority": "HIGH"}
    ],
    "warehouse": {"lat": 19.076, "lng": 72.877}
  }'`,
    color: '#f59e0b',
    endpoint: 'POST /api/dispatch/allocate',
  },
  {
    step: '05',
    title: 'Continuous Learning Agent',
    desc: 'Q-learning RL agent records (state, action, reward) per run. Builds Q-table over time to recommend optimal parameters. Self-improves with every execution.',
    code: `# Health check — verify all agents are active:
curl ${API_URL}/api/dispatch/health

# Response:
{
  "brain_status": "connected",
  "brain_health": {"status": "healthy", "database": "connected"},
  "gateway": "operational"
}`,
    color: '#ec4899',
    endpoint: 'GET /api/dispatch/health',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button onClick={handleCopy} className="hiw__copy-btn" title="Copy to clipboard">
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

export default function HowItWorks() {
  return (
    <section className="hiw" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="tag">Multi-Agent Pipeline</div>
          <h2 className="section-title">How FairRelay's AI Engine works</h2>
          <p className="section-sub">
            13 specialized AI agents orchestrated by LangGraph — 8 for fair dispatch + 5 for load consolidation.
            Every endpoint is live. Try the curl commands below.
          </p>
        </div>

        <div className="hiw__steps">
          {steps.map((s, i) => (
            <div key={s.step} className="hiw__step">
              <div className="hiw__step-num" style={{ color: s.color, borderColor: s.color + '33', background: s.color + '0d' }}>
                {s.step}
              </div>
              {i < steps.length - 1 && (
                <div className="hiw__connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke={s.color} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
              <div className="hiw__step-content">
                <h3 className="hiw__step-title">{s.title}</h3>
                <p className="hiw__step-desc">{s.desc}</p>
                <div className="hiw__step-endpoint" style={{ color: s.color }}>
                  <code>{s.endpoint}</code>
                </div>
                <div className="hiw__step-code">
                  <CopyButton text={s.code} />
                  <pre><code>{s.code}</code></pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hiw__copy-btn { position: absolute; top: 8px; right: 8px; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); color: #f97316; font-size: 0.7rem; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-weight: 600; z-index: 2; transition: all 0.2s; }
        .hiw__copy-btn:hover { background: rgba(249,115,22,0.25); }
        .hiw__step-code { position: relative; }
        .hiw__step-endpoint { font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; margin-bottom: 0.5rem; opacity: 0.8; }
        .hiw__step-endpoint code { background: rgba(255,255,255,0.03); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06); }
      `}</style>
    </section>
  )
}
