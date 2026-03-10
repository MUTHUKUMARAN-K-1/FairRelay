import './Footer.css'

export default function Footer() {
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
            <span className="footer__status-dot" />
            All systems operational
          </div>
        </div>

        <div className="footer__links">
          <div className="footer__col">
            <div className="footer__col-title">Product</div>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#api">API Reference</a>
            <a href="#demo">Live Demo</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Developers</div>
            <a href="#">Getting Started</a>
            <a href="#">Endpoints</a>
            <a href="#">SDKs</a>
            <a href="#">Changelog</a>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Company</div>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <span>© 2026 FairRelay. Built for fair logistics.</span>
          <span>Made with 💜 for drivers everywhere</span>
        </div>
      </div>
    </footer>
  )
}
