import './Pricing.css'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'For developers evaluating FairRelay.',
    color: '#475569',
    features: [
      '100 allocation calls/month',
      '3 API keys',
      'Gini index + explanations',
      'Wellness & carbon scoring',
      'Community support',
    ],
    cta: 'Get started free',
    ctaStyle: 'outline',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    desc: 'For growing logistics SaaS and 3PLs.',
    color: '#f97316',
    features: [
      '10,000 allocation calls/month',
      'Unlimited API keys',
      'Full explainability (SHAP-level)',
      'Night safety routing',
      'Credit economy module',
      'Priority support (24h SLA)',
    ],
    cta: 'Start free trial',
    ctaStyle: 'primary',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For fleets and platforms at scale.',
    color: '#3b82f6',
    features: [
      'Unlimited calls',
      'Dedicated cloud deployment',
      'Custom fairness rules',
      'SLA guarantee',
      'White-label option',
      'Dedicated engineer',
    ],
    cta: 'Talk to us',
    ctaStyle: 'outline',
    popular: false,
  },
]

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="section-header">
          <div className="tag">Pricing</div>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-sub">
            Start free. Scale when it makes sense. No surprises.
          </p>
        </div>

        <div className="pricing__grid">
          {plans.map(p => (
            <div key={p.name} className={`pricing__card ${p.popular ? 'pricing__card--popular' : ''}`}>
              {p.popular && <div className="pricing__badge">Most popular</div>}
              <div className="pricing__name" style={{ color: p.color }}>{p.name}</div>
              <div className="pricing__price">
                <span className="pricing__amount">{p.price}</span>
                <span className="pricing__period">{p.period}</span>
              </div>
              <p className="pricing__desc">{p.desc}</p>
              <ul className="pricing__features">
                {p.features.map(f => (
                  <li key={f}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke={p.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#" className={`btn btn--lg btn--${p.ctaStyle}`} style={p.popular ? {} : {}}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
