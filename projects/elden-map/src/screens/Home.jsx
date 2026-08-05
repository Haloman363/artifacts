import { useState } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import { useSounds } from '../hooks/useSounds.js'

const RECENT_KEY = 'elden-map-recent'
const MAX_RECENT = 5

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function saveRecent(dest) {
  const prev = getRecent().filter((d) => d.name !== dest.name)
  const next = [dest, ...prev].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

export default function Home({ onNavigate }) {
  const [selected, setSelected] = useState(null)
  const [recent, setRecent] = useState(getRecent)
  const { playMenuSelect } = useSounds()

  function handleSelect(dest) { setSelected(dest) }

  function handleBegin() {
    if (!selected) return
    playMenuSelect()
    saveRecent(selected)
    setRecent(getRecent())
    onNavigate(selected)
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at center, #27170d 0%, #040200 70%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: '0 24px',
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-main)',
          fontSize: 'clamp(2rem, 10vw, 4rem)',
          fontWeight: 900,
          letterSpacing: '0.25em',
          color: 'var(--color-gold-bright)',
          textShadow: '0 0 30px rgba(249,192,67,0.4), 0 2px 4px rgba(0,0,0,0.8)',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Elden Map
        </h1>
        <p style={{
          fontFamily: 'var(--font-main)',
          fontSize: '0.7rem',
          letterSpacing: '0.3em',
          color: 'var(--color-gold-burnt)',
          marginTop: 8,
          textTransform: 'uppercase',
        }}>
          Navigate the Lands Between
        </p>
      </div>

      {/* Search */}
      <SearchBar onSelect={handleSelect} />

      {/* Begin Journey */}
      <button
        onClick={handleBegin}
        disabled={!selected}
        style={{
          fontFamily: 'var(--font-main)',
          fontSize: '0.85rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          padding: '14px 40px',
          background: selected ? 'rgba(189,103,7,0.15)' : 'rgba(4,2,0,0.3)',
          border: `1px solid ${selected ? 'var(--color-gold-burnt)' : '#3a2510'}`,
          color: selected ? 'var(--color-gold-bright)' : '#3a2510',
          cursor: selected ? 'pointer' : 'default',
          borderRadius: 2,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (selected) e.currentTarget.style.background = 'rgba(189,103,7,0.3)'
        }}
        onMouseLeave={(e) => {
          if (selected) e.currentTarget.style.background = 'rgba(189,103,7,0.15)'
        }}
      >
        Begin Journey
      </button>

      {/* Recent destinations */}
      {recent.length > 0 && (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{
            fontFamily: 'var(--font-main)',
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            color: 'var(--color-gold-burnt)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Recent Journeys
          </div>
          {recent.map((dest) => (
            <div
              key={dest.name}
              onClick={() => { setSelected(dest) }}
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid rgba(189,103,7,0.2)',
                cursor: 'pointer',
                fontFamily: 'var(--font-main)',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                color: 'var(--color-gold-bright)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(189,103,7,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ✦ {dest.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
