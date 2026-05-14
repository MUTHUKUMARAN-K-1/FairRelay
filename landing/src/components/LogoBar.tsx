import './LogoBar.css'

const logos = [
  { name: 'TruckFlow', icon: '🚛' },
  { name: 'LogiSoft', icon: '📦' },
  { name: 'RouteMax', icon: '🗺️' },
  { name: 'FleetIQ', icon: '📊' },
  { name: 'CargoAI', icon: '🤖' },
  { name: 'DispatchPro', icon: '⚡' },
]

export default function LogoBar() {
  return (
    <section className="logobar">
      <div className="container">
        <p className="logobar__label">Trusted by logistics teams using</p>
        <div className="logobar__logos">
          {logos.map(l => (
            <div key={l.name} className="logobar__logo">
              <span>{l.icon}</span>
              <span>{l.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
