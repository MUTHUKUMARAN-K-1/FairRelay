import './HowItWorks.css'

const steps = [
  {
    step: '01',
    title: 'Generate your API key',
    desc: 'Sign up free, create an API key in the dashboard. It works immediately — no quota forms, no approval process.',
    code: 'x-api-key: fr_live_sk_xxxxxxxx',
    color: '#f97316',
  },
  {
    step: '02',
    title: 'POST your drivers & routes',
    desc: 'Send your drivers (with wellness data) and routes (with constraints) in one JSON payload. Any language, any stack.',
    code: 'POST /v1/allocate\n{ drivers: [...], routes: [...] }',
    color: '#3b82f6',
  },
  {
    step: '03',
    title: 'Get fair allocations + explanations',
    desc: 'Receive optimized assignments with Gini fairness index, per-driver wellness scores, carbon estimates, and plain-English explanations.',
    code: '{ gini_index: 0.12, grade: "A",\n  explanation: "..." }',
    color: '#10b981',
  },
]

export default function HowItWorks() {
  return (
    <section className="hiw" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="tag">How it works</div>
          <h2 className="section-title">From integration to fair routes in minutes</h2>
          <p className="section-sub">
            No ML team, no weeks of setup. Add fairness-aware routing to any logistics platform with 3 steps.
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
                <div className="hiw__step-code">
                  <pre><code>{s.code}</code></pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
