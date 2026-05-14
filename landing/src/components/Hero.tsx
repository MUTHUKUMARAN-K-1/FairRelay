import './Hero.css'

const codeSnippet = `curl -X POST https://api.fairrelay.io/v1/allocate \\
  -H "x-api-key: fr_live_••••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "drivers": [
      { "id": "drv_001", "hours_today": 4.5, "is_ill": false },
      { "id": "drv_002", "hours_today": 8.1, "is_ill": false }
    ],
    "routes": [
      { "id": "rt_A", "distance_km": 142, "difficulty": "medium" },
      { "id": "rt_B", "distance_km": 67,  "difficulty": "easy"   }
    ]
  }'`

const responseSnippet = `{
  "success": true,
  "data": {
    "allocations": [
      { "driver": "drv_001", "route": "rt_B" },
      { "driver": "drv_002", "route": "rt_A" }
    ]
  },
  "meta": {
    "gini_index": 0.12,
    "fairness_grade": "A",
    "explanation": "drv_002 assigned longer route 
      despite high hours — override recommended.",
    "latency_ms": 284
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
            Now in beta · Join 40+ logistics teams
          </div>

          <h1 className="hero__headline">
            Route allocation
            <br />
            that's{' '}
            <span className="gradient-text">fair by design</span>
          </h1>

          <p className="hero__sub">
            India has <strong>15M+ gig delivery workers</strong> — 73% earn below minimum wage because dispatch systems are biased. FairRelay's AI uses the <strong>Gini coefficient</strong> to distribute routes fairly, protect driver wellness, and cut carbon — via a single API call.
          </p>

          <div className="hero__actions">
            <a href="#pricing" className="btn btn--primary btn--lg">
              Get API Key — it's free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#api" className="btn btn--outline btn--lg">
              View API docs
            </a>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <strong>0.82 → 0.12</strong>
              <span>Gini reduction</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>14.2 kg</strong>
              <span>CO₂ saved/run</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>100%</strong>
              <span>decisions explained</span>
            </div>
          </div>

          {/* Real Problem Stats */}
          <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The problem we solve</p>
            <p style={{ fontSize: '0.875rem', color: '#E5E7EB', lineHeight: 1.6 }}>
              Traditional dispatch assigns <strong style={{ color: '#f97316' }}>3× more deliveries</strong> to some drivers (Gini = 0.85) while others earn near nothing. FairRelay's 8-agent AI pipeline brings this to <strong style={{ color: '#34d399' }}>Gini = 0.12</strong> — with wellness checks, night-safety routing for women, and EV-first allocation.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {[['🌍 SDG 8', 'Decent Work'], ['⚖️ SDG 10', 'Reduced Inequalities'], ['🌿 SDG 13', 'Climate Action']].map(([num, label]) => (
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
              <span className="code-window__title">POST /v1/allocate</span>
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
                200 OK · 284ms
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
