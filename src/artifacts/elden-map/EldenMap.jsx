import { useState } from 'react'
import Home from './screens/Home.jsx'
import Navigate from './screens/Navigate.jsx'
import Arrival from './screens/Arrival.jsx'
import './elden-map.css'

const HAS_TOKEN = Boolean(import.meta.env.VITE_MAPBOX_TOKEN)

// Without a token mapbox-gl throws on construction, so show why instead of a blank map.
function MissingToken() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: '0 32px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.5rem', color: 'var(--color-gold-bright)' }}>✦</div>
      <h2 style={{
        fontSize: '1rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'var(--color-gold-bright)',
      }}>
        No Mapbox token
      </h2>
      <p style={{
        fontSize: '0.72rem', letterSpacing: '0.08em', lineHeight: 1.7,
        color: 'var(--color-gold-burnt)', maxWidth: 420,
      }}>
        This build has no <code>VITE_MAPBOX_TOKEN</code>. Add a public (pk.) token as the
        <code> MAPBOX_TOKEN </code> repository secret, or put one in <code>.env</code> for
        local development.
      </p>
    </div>
  )
}

export default function EldenMap() {
  const [screen, setScreen] = useState('home')
  const [destination, setDestination] = useState(null)

  function handleNavigate(dest) {
    setDestination(dest)
    setScreen('navigate')
  }

  function handleArrived() { setScreen('arrival') }
  function handleDismiss() { setDestination(null); setScreen('home') }

  return (
    <div className="elden-map-root">
      {!HAS_TOKEN && <MissingToken />}
      {HAS_TOKEN && screen === 'home'     && <Home onNavigate={handleNavigate} />}
      {HAS_TOKEN && screen === 'navigate' && <Navigate destination={destination} onArrived={handleArrived} />}
      {HAS_TOKEN && screen === 'arrival'  && <Arrival onDismiss={handleDismiss} />}
    </div>
  )
}
