import { useState } from 'react'
import Home from './screens/Home.jsx'
import Navigate from './screens/Navigate.jsx'
import Arrival from './screens/Arrival.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [destination, setDestination] = useState(null)

  function handleNavigate(dest) {
    setDestination(dest)
    setScreen('navigate')
  }

  function handleArrived() { setScreen('arrival') }
  function handleDismiss() { setDestination(null); setScreen('home') }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {screen === 'home'     && <Home onNavigate={handleNavigate} />}
      {screen === 'navigate' && <Navigate destination={destination} onArrived={handleArrived} />}
      {screen === 'arrival'  && <Arrival onDismiss={handleDismiss} />}
    </div>
  )
}
