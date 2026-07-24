import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import eldenStyle from '../style/mapbox-style.json'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const SITE_OF_GRACE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
  <polygon points="16,2 30,38 16,30 2,38" fill="#f9c043" stroke="#bd6707" stroke-width="2"/>
</svg>
`

export default function MapView({ onMapReady, userLocation, destination, routeGeoJSON }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: eldenStyle,
      center: userLocation ? [userLocation.lng, userLocation.lat] : [-74.006, 40.7128],
      zoom: 14,
      attributionControl: false,
    })
    mapRef.current = map

    // Fog-reveal startup animation
    map.on('load', () => {
      map.setFog({
        color: '#040200',
        'high-color': '#27170d',
        'horizon-blend': 0.1,
        'space-color': '#040200',
      })
      onMapReady(map)
    })

    return () => map.remove()
  }, []) // ponytail: intentionally empty — map init runs once

  // Update user position marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return
    if (!userMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'user-marker'
      userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current)
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat])
    }
  }, [userLocation])

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current) return
    if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null }
    if (!destination) return
    const el = document.createElement('div')
    el.className = 'dest-marker'
    el.innerHTML = SITE_OF_GRACE_SVG
    destMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([destination.lng, destination.lat])
      .addTo(mapRef.current)
  }, [destination])

  // Draw / update route line
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (map.getLayer('route-glow')) map.removeLayer('route-glow')
    if (map.getLayer('route-line')) map.removeLayer('route-line')
    if (map.getSource('route')) map.removeSource('route')
    if (!routeGeoJSON) return
    map.addSource('route', { type: 'geojson', data: routeGeoJSON })
    map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#f9c043', 'line-width': 10, 'line-opacity': 0.25, 'line-blur': 4 },
    })
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#ed8a09', 'line-width': 4, 'line-opacity': 0.9 },
    })
  }, [routeGeoJSON])

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <style>{`
        .user-marker {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle, #f9c043 30%, #bd6707 70%, transparent 100%);
          box-shadow: 0 0 12px 6px rgba(249,192,67,0.5);
          animation: grace-pulse 2s ease-in-out infinite;
        }
        @keyframes grace-pulse {
          0%, 100% { box-shadow: 0 0 12px 6px rgba(249,192,67,0.5); }
          50% { box-shadow: 0 0 24px 12px rgba(249,192,67,0.8); }
        }
        .dest-marker svg { filter: drop-shadow(0 0 6px #f9c043); }
      `}</style>
    </>
  )
}
