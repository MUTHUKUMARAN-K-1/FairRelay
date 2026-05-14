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
    title: 'Fair Allocation Engine',
    desc: 'Gini coefficient–based scoring ensures no driver is systematically overloaded or underutilized. Every allocation is measurably fair.',
    badge: 'Gini ≤ 0.15 guaranteed',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    color: '#10b981',
    colorBg: 'rgba(16,185,129,0.1)',
    title: 'Driver Wellness Engine',
    desc: 'Real-time wellness scores track hours worked, rest since last break, illness flags, and max difficulty tolerance. Prevent burnout before it happens.',
    badge: 'Burnout prevention',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#3b82f6',
    colorBg: 'rgba(59,130,246,0.1)',
    title: 'Carbon Estimation',
    desc: 'Per-route CO₂ estimates included in every allocation response. Track fleet carbon footprint and surface eco-routing options.',
    badge: 'CO₂ per km',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.1)',
    title: 'Explainable Decisions',
    desc: 'Every allocation comes with a human-readable explanation. Dispatchers can understand, appeal, or override any AI decision — full transparency.',
    badge: '100% explained',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 5v2M12 17v2M5 12H3M21 12h-2M7.05 7.05l-1.41-1.41M17.37 17.37l-1.41-1.41M7.05 16.95l-1.41 1.41M17.37 6.63l-1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#ec4899',
    colorBg: 'rgba(236,72,153,0.1)',
    title: 'Night Safety Routing',
    desc: 'Flag routes as night-safety sensitive and automatically filter assignments based on driver preferences and safety policies.',
    badge: 'Driver-first',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#06b6d4',
    colorBg: 'rgba(6,182,212,0.1)',
    title: 'Drop-in Integration',
    desc: 'One API key, one endpoint, consistent JSON response envelope. No SDKs required — works with any language or logistics stack in minutes.',
    badge: 'REST · JSON',
  },
]

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <div className="tag">Features</div>
          <h2 className="section-title">Everything your routing brain needs</h2>
          <p className="section-sub">
            Built for logistics teams that want fairness, transparency, and driver wellbeing —
            without the ML team.
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
