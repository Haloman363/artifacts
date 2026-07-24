import { useState } from 'react'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [destination, setDestination] = useState(null)

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontFamily: 'Cinzel, serif', color: '#f9c043', fontSize: '2rem', letterSpacing: '0.2em' }}>
        ELDEN MAP
      </h1>
    </div>
  )
}
