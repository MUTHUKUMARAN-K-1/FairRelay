import { useState, useEffect } from 'react'
import './Footer.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://fairrelay-backend.onrender.com'

export default function Footer() {
  const [status, setStatus] = useState<'checking' | 'operational' | 'degraded' | 'down'>('checking')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          const data = await res.json()
          setStatus(data.status === 'healthy' ? 'operational' : 'degraded')
        } else {
          setStatus('degraded')
        }
      } catch {
        setStatus('down')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 60000) // Poll every 60s
    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    checking: { color: '#3b82f6', text: 'Checking status…', pulse: true },
    operational: { color: '#10b981', text: 'All systems operational', pulse: false },
    degraded: { color: '#f59e0b', text: 'Degraded performance', pulse: true },
    down: { color: '#ef4444', text: 'Service warming up', pulse: true },
  }

  const s = statusConfig[status]

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" fill="url(#footer-logo-grad)"/>
              <path d="M8 14L12 18L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="footer-logo-grad" x1="2" y1="2" x2="26" y2="26">
                  <stop offset="0%" stopColor="#f97316"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
              </defs>
            </svg>
            FairRelay
          </div>
          <p>Fair routes. Happy drivers. Explainable by default.</p>
          <div className="footer__status">
            <span className="footer__status-dot" style={{ background: s.color, boxShadow: s.pulse ? `0 0 8px ${s.color}` : 'none', animation: s.pulse ? 'pulse 2s infinite' : 'none' }} />
            {s.text}
          </div>
        </div>

        <div className="footer__links">
          <div className="footer__col">
            <div className="footer__col-title">Product</div>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href={`${API_URL}/docs`} target="_blank" rel="noopener">API Reference ↗</a>
            <a href="#demo">Live Demo</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Developers</div>
            <a href={`${API_URL}/docs`} target="_blank" rel="noopener">Getting Started ↗</a>
            <a href={`${API_URL}/redoc`} target="_blank" rel="noopener">Endpoint Reference ↗</a>
            <a href="https://github.com/MUTHUKUMARAN-K-1/FairRelay" target="_blank" rel="noopener">GitHub ↗</a>
            <a href={`${API_URL}/health`} target="_blank" rel="noopener">Status Page ↗</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Company</div>
            <a href="https://logisticsnow.in" target="_blank" rel="noopener">LogisticsNow ↗</a>
            <a href="https://company.lorri.in" target="_blank" rel="noopener">LoRRI Platform ↗</a>
            <a href="mailto:muthukumaran@logisticsnow.in">Contact</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <span>© 2026 FairRelay by LogisticsNow Pvt. Ltd. Built for fair logistics.</span>
          <span>Integrated with <a href="https://logisticsnow.in" target="_blank" rel="noopener" style={{ color: '#f97316' }}>LoRRI</a> · Made with 💜 for 15M+ drivers</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </footer>
  )
}
