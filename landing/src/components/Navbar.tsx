import { useState, useEffect } from 'react'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
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
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#api">API</a>
          <a href="#pricing">Pricing</a>
          <a href="#docs" className="navbar__link-docs">Docs</a>
        </div>

        <div className="navbar__actions">
          <a href="#pricing" className="btn btn--ghost">Sign in</a>
          <a href="#pricing" className="btn btn--primary">Get API Key</a>
        </div>

        <button className="navbar__hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
