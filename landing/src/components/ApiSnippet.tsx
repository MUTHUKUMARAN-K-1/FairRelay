import './ApiSnippet.css'

const tabs = [
  { label: 'cURL', lang: 'bash' },
  { label: 'Python', lang: 'python' },
  { label: 'Node.js', lang: 'js' },
]

const code: Record<string, string> = {
  bash: `curl -X POST https://api.fairrelay.io/v1/allocate \\
  -H "x-api-key: fr_live_sk_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "drivers": [
      {
        "id": "drv_001",
        "name": "Rajesh Kumar",
        "hours_today": 4.5,
        "hours_since_rest": 2.1,
        "is_ill": false,
        "gender": "M"
      }
    ],
    "routes": [
      {
        "id": "rt_mumbai_pune",
        "distance_km": 148,
        "difficulty": "medium",
        "is_night_route": false,
        "cargo_weight_kg": 2400
      }
    ]
  }'`,
  python: `import requests

response = requests.post(
    "https://api.fairrelay.io/v1/allocate",
    headers={
        "x-api-key": "fr_live_sk_xxxx",
        "Content-Type": "application/json"
    },
    json={
        "drivers": [{
            "id": "drv_001",
            "hours_today": 4.5,
            "is_ill": False
        }],
        "routes": [{
            "id": "rt_mumbai_pune",
            "distance_km": 148,
            "difficulty": "medium"
        }]
    }
)

result = response.json()
print(result["meta"]["gini_index"])   # 0.12
print(result["meta"]["fairness_grade"])  # "A"`,
  js: `const response = await fetch(
  "https://api.fairrelay.io/v1/allocate",
  {
    method: "POST",
    headers: {
      "x-api-key": "fr_live_sk_xxxx",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      drivers: [{
        id: "drv_001",
        hours_today: 4.5,
        is_ill: false
      }],
      routes: [{
        id: "rt_mumbai_pune",
        distance_km: 148,
        difficulty: "medium"
      }]
    })
  }
)

const { data, meta } = await response.json()
console.log(meta.gini_index)     // 0.12
console.log(meta.explanation)    // "drv_001 matched to..."`,
}

import { useState } from 'react'

export default function ApiSnippet() {
  const [active, setActive] = useState('bash')

  return (
    <section className="api-snippet" id="api">
      <div className="container api-snippet__inner">
        <div className="api-snippet__left">
          <div className="tag">API Reference</div>
          <h2 className="section-title" style={{ textAlign: 'left' }}>
            One endpoint.
            <br />
            <span className="gradient-text">Infinite fairness.</span>
          </h2>
          <p className="section-sub" style={{ textAlign: 'left' }}>
            Five clean REST endpoints. Consistent JSON envelope. Works with any language.
            No SDKs, no vendor lock-in.
          </p>

          <div className="api-snippet__endpoints">
            {[
              { method: 'POST', path: '/v1/allocate', desc: 'Run fair allocation' },
              { method: 'GET',  path: '/v1/allocate/:id', desc: 'Fetch past result' },
              { method: 'POST', path: '/v1/wellness', desc: 'Check driver wellness' },
              { method: 'POST', path: '/v1/carbon', desc: 'Estimate CO₂' },
              { method: 'GET',  path: '/v1/health', desc: 'API status' },
            ].map(e => (
              <div key={e.path} className="api-snippet__endpoint">
                <span className={`api-snippet__method api-snippet__method--${e.method.toLowerCase()}`}>
                  {e.method}
                </span>
                <code className="api-snippet__path">{e.path}</code>
                <span className="api-snippet__edesc">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="api-snippet__right">
          <div className="api-snippet__window">
            <div className="api-snippet__tabs">
              {tabs.map(t => (
                <button
                  key={t.lang}
                  className={`api-snippet__tab ${active === t.lang ? 'api-snippet__tab--active' : ''}`}
                  onClick={() => setActive(t.lang)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="api-snippet__code">
              <pre><code>{code[active]}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
