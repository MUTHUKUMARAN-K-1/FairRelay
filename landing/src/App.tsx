import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LogoBar from './components/LogoBar'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import LiveDemo from './components/LiveDemo'
import ApiSnippet from './components/ApiSnippet'
import Pricing from './components/Pricing'
import Footer from './components/Footer'

function App() {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Navbar />
      <Hero />
      <LogoBar />
      <Features />
      <HowItWorks />
      <ApiSnippet />
      <LiveDemo />
      <Pricing />
      <Footer />
    </div>
  )
}

export default App
