import './HowItWorks.css'

const steps = [
  {
    step: '01',
    title: 'Geographic Clustering Agent',
    desc: 'scikit-learn KMeans clusters shipments by pickup/drop proximity (4D feature vectors). Silhouette-score selects optimal K. Groups nearby shipments heading the same direction.',
    code: 'Agent 1: GeoClusteringAgent\n→ KMeans + Silhouette Score\n→ 15 shipments → 4 clusters',
    color: '#f97316',
  },
  {
    step: '02',
    title: 'Time Window Compatibility Agent',
    desc: 'Filters clusters by delivery time window overlap. Splits groups where shipments have incompatible schedules. Configurable tolerance (default: 120 min).',
    code: 'Agent 2: TimeWindowAgent\n→ Temporal overlap filter\n→ 4 clusters → 5 time-valid groups',
    color: '#3b82f6',
  },
  {
    step: '03',
    title: 'Capacity Optimization Agent',
    desc: 'OR-Tools CP-SAT integer programming solver assigns shipments to trucks. Minimizes vehicles used while respecting weight + volume constraints. FFD heuristic fallback.',
    code: 'Agent 3: CapacityOptimizationAgent\n→ OR-Tools CP-SAT solver (3s limit)\n→ 5 groups → 3 packed trucks',
    color: '#10b981',
  },
  {
    step: '04',
    title: 'Scoring & Confidence Agent',
    desc: 'Computes per-group AI confidence (capacity fit × geo proximity × time alignment). Calculates global metrics: utilization%, trips reduced, CO₂ saved, cost saved.',
    code: 'Agent 4: ScoringConfidenceAgent\n→ Confidence: 78-95%\n→ Utilization: 27% → 82%',
    color: '#f59e0b',
  },
  {
    step: '05',
    title: 'Continuous Learning Agent',
    desc: 'Q-learning RL agent records (state, action, reward) per run. Builds Q-table over time to recommend optimal (radius, tolerance) parameters. Self-improves with every execution.',
    code: 'Agent 5: RL Q-Learning\n→ Episodes: 47 | Reward: 73.2/100\n→ Optimal: radius=30km, tol=120min',
    color: '#ec4899',
  },
]

export default function HowItWorks() {
  return (
    <section className="hiw" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="tag">5-Agent Pipeline</div>
          <h2 className="section-title">How the AI Consolidation Engine works</h2>
          <p className="section-sub">
            5 specialized AI agents orchestrated by LangGraph — each handles one aspect of the
            consolidation problem, collaborating to maximize vehicle utilization.
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
