import { useState, useEffect, useRef, useCallback } from 'react'

const ARRIVAL_THRESHOLD_METERS = 30
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function distanceMeters(a, b) {
  const R = 6371000
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

async function fetchRoute(from, to) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.routes?.length) throw new Error('No route found')
  return data.routes[0]
}

function formatEta(seconds) {
  const mins = Math.round(seconds / 60)
  return `~${mins} min`
}

export function useNavigation(destination, userLocation) {
  const [routeGeoJSON, setRouteGeoJSON] = useState(null)
  const [steps, setSteps] = useState([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [eta, setEta] = useState(null)
  const [isArrived, setIsArrived] = useState(false)
  const fetchedForRef = useRef(null)

  const fetchAndSet = useCallback(async (from, to) => {
    try {
      const route = await fetchRoute(from, to)
      setRouteGeoJSON({ type: 'Feature', geometry: route.geometry })
      setSteps(route.legs[0].steps)
      setEta(formatEta(route.duration))
      setCurrentStepIdx(0)
      setIsArrived(false)
    } catch (e) {
      console.error('Route fetch failed:', e)
    }
  }, [])

  // Fetch route when destination set
  useEffect(() => {
    if (!destination || !userLocation) return
    const key = `${destination.lng},${destination.lat}`
    if (fetchedForRef.current === key) return
    fetchedForRef.current = key
    fetchAndSet(userLocation, destination)
  }, [destination, userLocation, fetchAndSet])

  // Advance step index as user moves
  useEffect(() => {
    if (!userLocation || !steps.length) return
    if (isArrived) return
    if (distanceMeters(userLocation, destination) < ARRIVAL_THRESHOLD_METERS) {
      setIsArrived(true)
      return
    }
    // Find next step waypoint the user is approaching
    const nextStep = steps[currentStepIdx]
    if (!nextStep) return
    const stepEnd = {
      lng: nextStep.maneuver.location[0],
      lat: nextStep.maneuver.location[1],
    }
    if (distanceMeters(userLocation, stepEnd) < 20 && currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((i) => i + 1)
    }
  }, [userLocation, destination, steps, currentStepIdx, isArrived])

  const recalculate = useCallback(() => {
    if (!destination || !userLocation) return
    fetchedForRef.current = null
    fetchAndSet(userLocation, destination)
  }, [destination, userLocation, fetchAndSet])

  return { routeGeoJSON, steps, currentStepIdx, eta, isArrived, recalculate }
}
