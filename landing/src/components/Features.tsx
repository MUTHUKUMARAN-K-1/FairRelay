import './Features.css'

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 10.5L10.5 14L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#f97316',
    colorBg: 'rgba(249,115,22,0.1)',
    title: 'Intelligent Shipment Grouping',
    desc: 'AI-driven geographic clustering (scikit-learn KMeans) identifies shipments that can be consolidated. Considers size, route compatibility, and delivery time windows automatically.',
    badge: '5-Agent Pipeline',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    color: '#10b981',
    colorBg: 'rgba(16,185,129,0.1)',
    title: 'Capacity Optimization',
    desc: 'OR-Tools CP-SAT integer programming solver maximizes vehicle utilization. Minimizes empty miles and partially loaded trips — with First-Fit-Decreasing fallback for speed.',
    badge: 'OR-Tools Solver',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5M12 12h9m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#3b82f6',
    colorBg: 'rgba(59,130,246,0.1)',
    title: 'AI Route Optimization',
    desc: 'Multi-stop route sequencing using nearest-neighbor TSP and OR-Tools. Optimizes distance, time, cost, and delivery window constraints dynamically.',
    badge: 'Multi-stop TSP',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 14l4-4 4 4 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.1)',
    title: 'Scenario Simulation',
    desc: 'Compare different consolidation scenarios side-by-side. Simulate parameter changes (radius, time tolerance) and see impact on utilization, trips, and cost before deploying.',
    badge: 'What-if analysis',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#ec4899',
    colorBg: 'rgba(236,72,153,0.1)',
    title: 'Continuous Learning (RL)',
    desc: 'Q-learning reinforcement agent learns from every consolidation run. Automatically tunes clustering radius and time tolerance for optimal results over time.',
    badge: 'Self-improving',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 5v2M12 17v2M5 12H3M21 12h-2M7.05 7.05l-1.41-1.41M17.37 17.37l-1.41-1.41M7.05 16.95l-1.41 1.41M17.37 6.63l-1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#06b6d4',
    colorBg: 'rgba(6,182,212,0.1)',
    title: 'Carbon & Cost Tracking',
    desc: 'Every consolidation quantifies CO₂ savings, fuel reduction, and cost impact. Track carbon credits earned ($25/ton) and fuel saved (₹/km) in real-time.',
    badge: 'ESG metrics',
  },
]

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <div className="tag">Capabilities</div>
          <h2 className="section-title">AI Load Consolidation + Route Optimization</h2>
          <p className="section-sub">
            Combining Problem Statement #5 (Load Consolidation) and #4 (Route Optimization)
            into a unified AI engine that maximizes vehicle utilization and minimizes cost.
          </p>
        </div>

        <div className="features__grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon" style={{ color: f.color, background: f.colorBg }}>
                {f.icon}
              </div>
              <div className="feature-card__badge" style={{ color: f.color, borderColor: f.color + '33', background: f.color + '11' }}>
                {f.badge}
              </div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
