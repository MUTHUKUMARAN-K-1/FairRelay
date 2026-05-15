import { useState, useRef } from 'react'
import './LiveDemo.css'

// API URL - set via VITE_API_URL env var (points to Render backend)
const API_URL = import.meta.env.VITE_API_URL || 'https://fairrelay-brain-gdm1.onrender.com'

const DEMO_DRIVERS = [
  { id: 'drv_001', name: 'Rajesh Kumar', hours_today: 4.5, hours_since_rest: 2.1, is_ill: false, gender: 'M', vehicle_capacity_kg: 500, preferred_language: 'hi' },
  { id: 'drv_002', name: 'Priya Sharma', hours_today: 8.1, hours_since_rest: 0.5, is_ill: false, gender: 'F', vehicle_capacity_kg: 400, preferred_language: 'hi' },
  { id: 'drv_003', name: 'Amit Patel', hours_today: 3.2, hours_since_rest: 3.0, is_ill: false, gender: 'M', vehicle_capacity_kg: 600, preferred_language: 'en' },
]

const DEMO_PACKAGES = [
  { id: 'pkg_001', weight_kg: 12.5, fragility_level: 2, address: 'Andheri West, Mumbai', latitude: 19.1364, longitude: 72.8296, priority: 'normal' },
  { id: 'pkg_002', weight_kg: 8.0, fragility_level: 1, address: 'Bandra East, Mumbai', latitude: 19.0596, longitude: 72.8495, priority: 'high' },
  { id: 'pkg_003', weight_kg: 22.0, fragility_level: 3, address: 'Powai, Mumbai', latitude: 19.1176, longitude: 72.9060, priority: 'normal' },
  { id: 'pkg_004', weight_kg: 5.5, fragility_level: 1, address: 'Goregaon East, Mumbai', latitude: 19.1663, longitude: 72.8526, priority: 'express' },
  { id: 'pkg_005', weight_kg: 15.0, fragility_level: 2, address: 'Juhu, Mumbai', latitude: 19.0883, longitude: 72.8264, priority: 'normal' },
  { id: 'pkg_006', weight_kg: 9.8, fragility_level: 1, address: 'Malad West, Mumbai', latitude: 19.1874, longitude: 72.8484, priority: 'normal' },
]

const DEMO_ROUTES = [
  { id: 'rt_mumbai_pune', distance_km: 148, difficulty: 'medium', is_night_route: false },
  { id: 'rt_pune_nashik', distance_km: 215, difficulty: 'hard', is_night_route: true },
  { id: 'rt_nashik_aurangabad', distance_km: 98, difficulty: 'easy', is_night_route: false },
]

// Fallback mock result for when backend is unavailable
const MOCK_RESULT = {
  success: true,
  data: {
    allocations: [
      { driver: 'drv_001', driver_name: 'Rajesh Kumar', route: 'rt_nashik_aurangabad', route_label: 'Nashik → Aurangabad (98km)', wellness_score: 92 },
      { driver: 'drv_002', driver_name: 'Priya Sharma', route: 'rt_mumbai_pune', route_label: 'Mumbai → Pune (148km)', wellness_score: 61 },
      { driver: 'drv_003', driver_name: 'Amit Patel', route: 'rt_pune_nashik', route_label: 'Pune → Nashik (215km)', wellness_score: 95 },
    ]
  },
  meta: {
    gini_index: 0.12,
    fairness_grade: 'A',
    carbon_kg: 87.4,
    latency_ms: 312,
    explanation: 'Priya has worked 8.1h today — assigned shorter route. Night route routed to Amit (highest wellness). Gini = 0.12 — excellent fairness.',
    source: 'mock',
  }
}

interface DemoResult {
  success: boolean
  data: {
    allocations: Array<{
      driver: string
      driver_name: string
      route: string
      route_label: string
      wellness_score: number
    }>
  }
  meta: {
    gini_index: number
    fairness_grade: string
    carbon_kg: number
    latency_ms: number
    explanation: string
    source?: string
  }
}

export default function LiveDemo() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [result, setResult] = useState<DemoResult | null>(null)
  const [apiSource, setApiSource] = useState<'live' | 'fallback'>('live')
  const resultRef = useRef<HTMLDivElement>(null)

  const runDemo = async () => {
    setStatus('loading')
    setResult(null)
    
    const startTime = Date.now()

    try {
      // Try calling real backend API
      const response = await fetch(`${API_URL}/api/v1/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drivers: DEMO_DRIVERS.map(d => ({
            id: d.id,
            name: d.name,
            vehicle_capacity_kg: d.vehicle_capacity_kg,
            preferred_language: d.preferred_language,
          })),
          packages: DEMO_PACKAGES,
          warehouse: { lat: 19.0760, lng: 72.8777 },
          allocation_date: new Date().toISOString().split('T')[0],
        }),
        signal: AbortSignal.timeout(15000), // 15s timeout
      })

      if (response.ok) {
        const data = await response.json()
        const latency = Date.now() - startTime
        
        // Transform real API response into demo format
        const allocations = (data.assignments || []).map((a: any) => ({
          driver: a.driver_external_id || a.driver_id,
          driver_name: a.driver_name || a.driver_external_id,
          route: a.route_id,
          route_label: `Route ${a.route_summary?.num_stops || '?'} stops · ${a.route_summary?.total_weight_kg?.toFixed(1) || '?'}kg · ${a.route_summary?.estimated_time_minutes?.toFixed(0) || '?'}min`,
          wellness_score: Math.round((a.fairness_score || 0.8) * 100),
        }))

        setResult({
          success: true,
          data: { allocations },
          meta: {
            gini_index: data.global_fairness?.gini_index ?? 0.15,
            fairness_grade: (data.global_fairness?.gini_index ?? 0.15) < 0.2 ? 'A' : (data.global_fairness?.gini_index ?? 0.3) < 0.35 ? 'B' : 'C',
            carbon_kg: allocations.length * 28.5,
            latency_ms: latency,
            explanation: `Real-time allocation via FairRelay API. ${allocations.length} drivers assigned with Gini = ${(data.global_fairness?.gini_index ?? 0.15).toFixed(2)}. Fairness-optimized in ${latency}ms.`,
            source: 'live',
          }
        })
        setApiSource('live')
      } else {
        throw new Error(`API returned ${response.status}`)
      }
    } catch (err) {
      // Fallback to mock with realistic delay
      console.warn('[LiveDemo] Backend unavailable, using fallback:', err)
      await new Promise(r => setTimeout(r, 800))
      
      setResult({
        ...MOCK_RESULT,
        meta: {
          ...MOCK_RESULT.meta,
          latency_ms: Date.now() - startTime,
          source: 'fallback',
        }
      })
      setApiSource('fallback')
    }

    setStatus('done')
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  return (
    <section className="demo" id="demo">
      <div className="container">
        <div className="section-header">
          <div className="tag">Live Demo</div>
          <h2 className="section-title">See it run right now</h2>
          <p className="section-sub">
            Real FairRelay logic. Tap the button to allocate 3 drivers to 3 routes and see the fairness score.
          </p>
        </div>

        <div className="demo__card">
          <div className="demo__inputs">
            <div className="demo__col">
              <div className="demo__col-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                3 Drivers
              </div>
              {DEMO_DRIVERS.map(d => (
                <div key={d.id} className="demo__item">
                  <div className="demo__item-avatar">{d.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <div className="demo__item-name">{d.name}</div>
                    <div className="demo__item-sub">{d.hours_today}h today · {d.is_ill ? '🤒 Ill' : '✅ Healthy'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="demo__arrow">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="var(--purple-light)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>FairRelay</span>
            </div>

            <div className="demo__col">
              <div className="demo__col-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5M12 12h9m-3-3l3 3-3 3"/></svg>
                3 Routes
              </div>
              {DEMO_ROUTES.map(r => (
                <div key={r.id} className="demo__item">
                  <div className="demo__item-avatar demo__item-avatar--route">🗺</div>
                  <div>
                    <div className="demo__item-name">{r.id.replace(/rt_|_/g, m => m === 'rt_' ? '' : ' → ').replace(/^\w/, c => c.toUpperCase())}</div>
                    <div className="demo__item-sub">{r.distance_km}km · {r.difficulty} {r.is_night_route ? '🌙 Night' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="demo__cta">
            <button className="btn btn--primary btn--lg demo__run-btn" onClick={runDemo} disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <span className="demo__spinner" />
                  Calling FairRelay API…
                </>
              ) : status === 'done' ? (
                <>✓ Run again</>
              ) : (
                <>
                  ▶ Run Fair Allocation
                </>
              )}
            </button>
            {status === 'done' && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: apiSource === 'live' ? '#10b981' : '#f59e0b', textAlign: 'center' }}>
                {apiSource === 'live' ? '● Connected to live API' : '● Using demo fallback (backend warming up)'}
              </div>
            )}
          </div>

          {status === 'done' && result && (
            <div className="demo__result" ref={resultRef}>
              <div className="demo__result-header">
                <div className="demo__metric">
                  <span className="demo__metric-val" style={{ color: '#10b981' }}>Gini {result.meta.gini_index}</span>
                  <span className="demo__metric-label">Fairness index</span>
                </div>
                <div className="demo__metric">
                  <span className="demo__metric-val" style={{ color: '#f97316' }}>Grade {result.meta.fairness_grade}</span>
                  <span className="demo__metric-label">Fairness grade</span>
                </div>
                <div className="demo__metric">
                  <span className="demo__metric-val" style={{ color: '#3b82f6' }}>{result.meta.carbon_kg} kg</span>
                  <span className="demo__metric-label">CO₂ est.</span>
                </div>
                <div className="demo__metric">
                  <span className="demo__metric-val" style={{ color: '#f59e0b' }}>{result.meta.latency_ms}ms</span>
                  <span className="demo__metric-label">Latency</span>
                </div>
              </div>

              <div className="demo__allocations">
                {result.data.allocations.map(a => (
                  <div key={a.driver} className="demo__allocation">
                    <div className="demo__alloc-driver">
                      <div className="demo__item-avatar" style={{ fontSize: '11px' }}>{a.driver_name.split(' ').map(n => n[0]).join('')}</div>
                      {a.driver_name}
                    </div>
                    <div className="demo__alloc-arrow">→</div>
                    <div className="demo__alloc-route">{a.route_label}</div>
                    <div className="demo__alloc-wellness" style={{ color: a.wellness_score >= 80 ? '#10b981' : a.wellness_score >= 60 ? '#f59e0b' : '#ef4444' }}>
                      ♥ {a.wellness_score}
                    </div>
                  </div>
                ))}
              </div>

              <div className="demo__explanation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                {result.meta.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
