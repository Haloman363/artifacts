import { useState, useEffect, useRef } from 'react'
import MapView from '../components/MapView.jsx'
import HUD from '../components/HUD.jsx'
import { useNavigation } from '../hooks/useNavigation.js'
import { useVoice } from '../hooks/useVoice.js'
import { useSounds } from '../hooks/useSounds.js'

const STEP_ANNOUNCE_METERS = 90 // ~300 feet

function distanceMeters(a, b) {
  const R = 6371000
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export default function Navigate({ destination, onArrived }) {
  const [userLocation, setUserLocation] = useState(null)
  const mapRef = useRef(null)
  const announcedStepRef = useRef(-1)
  const { routeGeoJSON, steps, currentStepIdx, eta, isArrived, recalculate } = useNavigation(destination, userLocation)
  const { speakStep, speakArrived, speakRecalc } = useVoice()
  const { playChimeSoft, playGraceDiscovered, playRecalc } = useSounds()

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Arrival
  useEffect(() => {
    if (!isArrived) return
    playGraceDiscovered()
    speakArrived()
    const t = setTimeout(onArrived, 1200)
    return () => clearTimeout(t)
  }, [isArrived])

  // Step announcement
  useEffect(() => {
    if (!userLocation || !steps.length) return
    const step = steps[currentStepIdx]
    if (!step || announcedStepRef.current === currentStepIdx) return
    const stepEnd = { lng: step.maneuver.location[0], lat: step.maneuver.location[1] }
    const dist = distanceMeters(userLocation, stepEnd)
    if (dist < STEP_ANNOUNCE_METERS) {
      announcedStepRef.current = currentStepIdx
      playChimeSoft()
      speakStep(step)
    }
  }, [userLocation, currentStepIdx])

  // Recalc detection: if user is far off route (simple heuristic: > 200m from current step)
  const lastRecalcRef = useRef(0)
  useEffect(() => {
    if (!userLocation || !steps.length) return
    const step = steps[currentStepIdx]
    if (!step) return
    const stepStart = { lng: step.maneuver.location[0], lat: step.maneuver.location[1] }
    const dist = distanceMeters(userLocation, stepStart)
    const now = Date.now()
    if (dist > 200 && now - lastRecalcRef.current > 30000) {
      lastRecalcRef.current = now
      playRecalc()
      speakRecalc()
      recalculate()
    }
  }, [userLocation])

  function handleRecenter() {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 15 })
    }
  }

  const currentStep = steps[currentStepIdx] || null

  // Format step distance for display
  const stepDisplay = currentStep ? {
    ...currentStep,
    distance: currentStep.distance
      ? currentStep.distance > 1000
        ? `${(currentStep.distance / 1000).toFixed(1)} km`
        : `${Math.round(currentStep.distance)} m`
      : null,
  } : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView
        onMapReady={(map) => { mapRef.current = map }}
        userLocation={userLocation}
        destination={destination}
        routeGeoJSON={routeGeoJSON}
      />
      <HUD step={stepDisplay} eta={eta} onRecenter={handleRecenter} />
    </div>
  )
}
