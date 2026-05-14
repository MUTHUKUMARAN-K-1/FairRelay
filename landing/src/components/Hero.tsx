import './Hero.css'

const codeSnippet = `curl -X POST https://api.fairrelay.io/v1/consolidate \\
  -H "x-api-key: fr_live_••••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "shipments": [
      { "id": "sh_001", "pickupLat": 19.07, "pickupLng": 72.87,
        "dropLat": 18.52, "dropLng": 73.85, "weight": 500,
        "volume": 2.0, "timeWindowEnd": "2026-05-14T18:00" },
      { "id": "sh_002", "pickupLat": 19.08, "pickupLng": 72.88,
        "dropLat": 18.53, "dropLng": 73.86, "weight": 300,
        "volume": 1.5, "timeWindowEnd": "2026-05-14T18:00" }
    ],
    "trucks": [
      { "id": "trk_1", "maxWeight": 2000, "maxVolume": 8.0 }
    ]
  }'`

const responseSnippet = `{
  "groups": [
    { "groupId": 1, "truckId": "trk_1",
      "shipments": ["sh_001", "sh_002"],
      "utilizationWeight": 82.5,
      "confidence": 91 }
  ],
  "metrics": {
    "utilizationBefore": 27.1,
    "utilizationAfter": 82.5,
    "tripsReduced": 3,
    "tripReductionPercent": 50,
    "carbonSavedKg": 14.2,
    "optimizationScore": 87
  }
}`

export default function Hero() {
  return (
    <section className="hero">
      {/* Background glows */}
      <div className="hero__glow hero__glow--1" />
      <div className="hero__glow hero__glow--2" />
      <div className="hero__glow hero__glow--3" />

      <div className="container hero__inner">
        <div className="hero__left">
          <div className="tag" style={{ animationDelay: '0s' }}>
            <span className="tag__dot" />
            LoRRI AI Hackathon 2026 · PS#4 + PS#5
          </div>

          <h1 className="hero__headline">
            AI Load Consolidation
            <br />
            &{' '}
            <span className="gradient-text">Route Optimization</span>
          </h1>

          <p className="hero__sub">
            India's logistics networks transport <strong>60% of shipments with partially filled vehicles</strong>.
            FairRelay's 5-agent AI pipeline intelligently groups shipments, maximizes vehicle utilization,
            and optimizes multi-stop routes — reducing trips, cost, and carbon emissions.
          </p>

          <div className="hero__actions">
            <a href="#demo" className="btn btn--primary btn--lg">
              Run Live Demo
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#how-it-works" className="btn btn--outline btn--lg">
              See 5-Agent Pipeline
            </a>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <strong>27% → 82%</strong>
              <span>Vehicle utilization</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>50%</strong>
              <span>Trips reduced</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>14.2 kg</strong>
              <span>CO₂ saved/run</span>
            </div>
          </div>

          {/* Problem Statement Context */}
          <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Novelty: Two Problem Statements Combined</p>
            <p style={{ fontSize: '0.875rem', color: '#E5E7EB', lineHeight: 1.6 }}>
              <strong style={{ color: '#f97316' }}>PS#5</strong> AI Load Consolidation (primary) + <strong style={{ color: '#3b82f6' }}>PS#4</strong> AI Route Optimization (novelty).
              5 AI agents orchestrated by <strong style={{ color: '#10b981' }}>LangGraph</strong> with OR-Tools CP-SAT solver,
              K-Means clustering, and Q-learning RL — all integrated into <strong style={{ color: '#06b6d4' }}>LoRRI</strong> production via API.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {[['🧠 5 AI Agents', 'LangGraph'], ['⚙️ OR-Tools', 'CP-SAT Solver'], ['📊 scikit-learn', 'KMeans'], ['🔄 RL Agent', 'Q-Learning']].map(([num, label]) => (
                <span key={num} style={{ fontSize: '0.75rem', color: '#9CA3AF' }}><strong style={{ color: '#f97316' }}>{num}</strong> {label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero__right">
          <div className="hero__code-window">
            <div className="code-window__header">
              <div className="code-window__dots">
                <span style={{background:'#ef4444'}} />
                <span style={{background:'#f59e0b'}} />
                <span style={{background:'#10b981'}} />
              </div>
              <span className="code-window__title">POST /v1/consolidate</span>
            </div>
            <div className="code-window__body">
              <pre className="code-block code-block--request">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          </div>

          <div className="hero__response-window">
            <div className="code-window__header">
              <div className="hero__status-chip">
                <span className="hero__status-dot" />
                200 OK · 312ms
              </div>
            </div>
            <div className="code-window__body">
              <pre className="code-block code-block--response">
                <code>{responseSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll">
        <div className="hero__scroll-line" />
      </div>
    </section>
  )
}
