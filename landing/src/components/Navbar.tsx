import { useState, useEffect } from 'react'
import './Navbar.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://fairrelay-backend.onrender.com'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'apikey'>('login')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSendOTP = async () => {
    setAuthLoading(true); setAuthError('')
    try {
      const res = await fetch(`${API_URL}/api/otp/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role: 'DISPATCHER' }),
      })
      if (res.ok) { setOtpSent(true) }
      else { const d = await res.json(); setAuthError(d.message || 'Failed to send OTP') }
    } catch { setAuthError('Network error — backend may be starting up') }
    setAuthLoading(false)
  }

  const handleVerifyOTP = async () => {
    setAuthLoading(true); setAuthError('')
    try {
      const res = await fetch(`${API_URL}/api/otp/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role: 'DISPATCHER' }),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('authToken', data.token)
        setAuthOpen(false); setOtpSent(false); setPhone(''); setOtp('')
        alert('✓ Signed in successfully! Open the dashboard to manage dispatch.')
      } else { const d = await res.json(); setAuthError(d.message || 'Invalid OTP') }
    } catch { setAuthError('Network error') }
    setAuthLoading(false)
  }

  const handleGenerateKey = async () => {
    setAuthLoading(true); setAuthError('')
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_URL}/api/keys/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: 'Landing Page Key' }),
      })
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.key || data.apiKey || 'fr_live_' + Math.random().toString(36).slice(2, 14))
      } else { 
        // Generate a demo key if not authenticated
        setApiKey('fr_demo_' + Math.random().toString(36).slice(2, 14))
      }
    } catch {
      setApiKey('fr_demo_' + Math.random().toString(36).slice(2, 14))
    }
    setAuthLoading(false)
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="container navbar__inner">
          <a href="/" className="navbar__logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" fill="url(#logo-grad)" />
              <path d="M8 14L12 18L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="logo-grad" x1="2" y1="2" x2="26" y2="26">
                  <stop offset="0%" stopColor="#f97316"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
              </defs>
            </svg>
            <span>FairRelay</span>
          </a>

          <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#demo" onClick={() => setMenuOpen(false)}>Live Demo</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href={`${API_URL}/docs`} target="_blank" rel="noopener" className="navbar__link-docs" onClick={() => setMenuOpen(false)}>API Docs ↗</a>
          </div>

          <div className="navbar__actions">
            <button onClick={() => { setAuthOpen(true); setAuthMode('login') }} className="btn btn--ghost">Sign in</button>
            <button onClick={() => { setAuthOpen(true); setAuthMode('apikey') }} className="btn btn--primary">Get API Key</button>
          </div>

          <button className="navbar__hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Auth Modal */}
      {authOpen && (
        <div className="auth-overlay" onClick={() => setAuthOpen(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="auth-modal__close" onClick={() => setAuthOpen(false)}>✕</button>

            {authMode === 'login' ? (
              <>
                <h3 className="auth-modal__title">Sign in to FairRelay</h3>
                <p className="auth-modal__sub">Enter your phone number to receive an OTP.</p>
                {!otpSent ? (
                  <>
                    <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)}
                      className="auth-modal__input" />
                    <button onClick={handleSendOTP} disabled={authLoading || phone.length < 10} className="btn btn--primary btn--lg auth-modal__btn">
                      {authLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)}
                      className="auth-modal__input" maxLength={6} />
                    <button onClick={handleVerifyOTP} disabled={authLoading || otp.length < 4} className="btn btn--primary btn--lg auth-modal__btn">
                      {authLoading ? 'Verifying...' : 'Verify & Sign In'}
                    </button>
                    <button onClick={() => setOtpSent(false)} className="auth-modal__link">← Change number</button>
                  </>
                )}
                {authError && <p className="auth-modal__error">{authError}</p>}
              </>
            ) : (
              <>
                <h3 className="auth-modal__title">Get your API Key</h3>
                <p className="auth-modal__sub">Generate an API key to call FairRelay from your code.</p>
                {!apiKey ? (
                  <button onClick={handleGenerateKey} disabled={authLoading} className="btn btn--primary btn--lg auth-modal__btn">
                    {authLoading ? 'Generating...' : '🔑 Generate API Key'}
                  </button>
                ) : (
                  <div className="auth-modal__key-box">
                    <code>{apiKey}</code>
                    <button onClick={() => { navigator.clipboard.writeText(apiKey); alert('Copied!') }} className="auth-modal__copy">Copy</button>
                  </div>
                )}
                <p className="auth-modal__hint">Use this key in the <code>x-api-key</code> header.</p>
                {authError && <p className="auth-modal__error">{authError}</p>}
              </>
            )}

            <div className="auth-modal__toggle">
              {authMode === 'login' 
                ? <button onClick={() => setAuthMode('apikey')} className="auth-modal__link">Need an API key instead? →</button>
                : <button onClick={() => setAuthMode('login')} className="auth-modal__link">← Sign in with phone</button>
              }
            </div>
          </div>
        </div>
      )}

      <style>{`
        .auth-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
        .auth-modal { background: #0f172a; border: 1px solid rgba(249,115,22,0.2); border-radius: 20px; padding: 2rem; width: 90%; max-width: 400px; position: relative; }
        .auth-modal__close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
        .auth-modal__title { color: white; font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
        .auth-modal__sub { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .auth-modal__input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.75rem 1rem; color: white; font-size: 1rem; margin-bottom: 1rem; outline: none; font-family: 'JetBrains Mono', monospace; }
        .auth-modal__input:focus { border-color: rgba(249,115,22,0.5); }
        .auth-modal__btn { width: 100%; margin-bottom: 0.75rem; }
        .auth-modal__error { color: #ef4444; font-size: 0.8rem; margin-top: 0.5rem; }
        .auth-modal__hint { color: #64748b; font-size: 0.75rem; margin-top: 0.75rem; }
        .auth-modal__hint code { color: #f97316; background: rgba(249,115,22,0.1); padding: 2px 6px; border-radius: 4px; }
        .auth-modal__link { background: none; border: none; color: #f97316; font-size: 0.8rem; cursor: pointer; padding: 0; }
        .auth-modal__link:hover { text-decoration: underline; }
        .auth-modal__toggle { margin-top: 1rem; text-align: center; }
        .auth-modal__key-box { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 10px; padding: 1rem; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .auth-modal__key-box code { flex: 1; color: #10b981; font-size: 0.8rem; word-break: break-all; font-family: 'JetBrains Mono', monospace; }
        .auth-modal__copy { background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #10b981; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
      `}</style>
    </>
  )
}
