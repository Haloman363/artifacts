import { useState, useRef } from 'react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

async function geocode(query) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
  const res = await fetch(url)
  const data = await res.json()
  return data.features || []
}

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const debounceRef = useRef(null)

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (val.length < 3) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      const features = await geocode(val)
      setResults(features)
    }, 300)
  }

  function handleSelect(feature) {
    const [lng, lat] = feature.center
    onSelect({ lng, lat, name: feature.place_name })
    setQuery(feature.place_name)
    setResults([])
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="SEEK YOUR DESTINATION..."
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(4,2,0,0.85)',
          border: '1px solid var(--color-gold-burnt)',
          borderRadius: 2,
          color: 'var(--color-gold-bright)',
          fontFamily: 'var(--font-main)',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          outline: 'none',
        }}
        onFocus={(e) => (e.target.style.boxShadow = '0 0 8px 2px rgba(189,103,7,0.6)')}
        onBlur={(e) => (e.target.style.boxShadow = 'none')}
      />
      {results.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#1a0e06', border: '1px solid var(--color-gold-burnt)',
          listStyle: 'none', margin: 0, padding: 0,
        }}>
          {results.map((f) => (
            <li
              key={f.id}
              onClick={() => handleSelect(f)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                color: 'var(--color-gold-bright)',
                fontFamily: 'var(--font-main)',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                borderBottom: '1px solid rgba(189,103,7,0.2)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(189,103,7,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {f.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
