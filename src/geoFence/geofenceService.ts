import * as Location from 'expo-location'
import { GeoFence, pointInCircle, pointInPolygon, haversineKm } from '../utils/geofenceLogic'

// Simple geofence service: loads geofences from bundled assets/geofences-output.json
// and watches user location; emits 'enter' and 'exit' events with { fence, location }

// Small in-file EventEmitter replacement (avoids Node 'events' dependency)
const listeners: Record<string, Set<(payload: any) => void>> = {}
const emitter = {
  on(event: string, cb: (payload: any) => void) {
    if (!listeners[event]) listeners[event] = new Set()
    listeners[event].add(cb)
  },
  off(event: string, cb: (payload: any) => void) {
    listeners[event]?.delete(cb)
  },
  emit(event: string, payload: any) {
    const set = listeners[event]
    if (!set) return
    for (const cb of Array.from(set)) {
      try {
        cb(payload)
      } catch (e) {
        console.warn('emitter callback error', e)
      }
    }
  }
}
let watcher: Location.LocationSubscription | null = null
let fences: GeoFence[] = []
let states: Record<string, 'inside' | 'outside' | 'approaching'> = {}

export async function loadFences(): Promise<GeoFence[]> {
  try {
  // Load bundled JSON directly via require (Metro supports bundling JSON)
  // Avoid using Asset.fromModule for JSON — it expects a module id for binary assets.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require('../../assets/geofences-output.json')
  fences = data
    // initialize states
    states = {}
    fences.forEach(f => { states[f.id] = 'outside' })
    return fences
  } catch (e) {
  console.error('failed to load bundled geofences-output.json', e)
  fences = []
  states = {}
  return []
  }
}

function computeFenceState(f: GeoFence, location: Location.LocationObjectCoords): 'inside' | 'outside' | 'approaching' {
  const pt: [number, number] = [location.latitude, location.longitude]
  if (f.type === 'circle' && Array.isArray(f.coords)) {
    const center = f.coords as number[]
    const radiusKm = f.radiusKm || 1
    const d = haversineKm(pt, center)
    if (d <= radiusKm) return 'inside'
    if (d <= radiusKm + 0.5) return 'approaching'
    return 'outside'
  }

  if (f.type === 'point' && Array.isArray(f.coords)) {
    const center = f.coords as number[]
    const d = haversineKm(pt, center)
    if (d <= 0.2) return 'inside'
    if (d <= 1) return 'approaching'
    return 'outside'
  }

  if (f.type === 'polygon' && Array.isArray(f.coords)) {
    const inside = pointInPolygon(pt, f.coords as number[][])
    return inside ? 'inside' : 'outside'
  }

  return 'outside'
}

export function on(event: 'enter' | 'exit' | 'state', cb: (payload: any) => void) {
  emitter.on(event, cb)
}

export function off(event: 'enter' | 'exit' | 'state', cb: (payload: any) => void) {
  emitter.off(event, cb)
}

export async function startMonitoring(options?: { accuracy?: Location.LocationAccuracy, intervalMs?: number, distance?: number }) {
  const accuracy = options?.accuracy || Location.Accuracy.Balanced
  const interval = options?.intervalMs || 30000
  const distance = options?.distance || 0

  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Location permission denied')
  }

  if (!fences || fences.length === 0) {
    await loadFences()
  }

  if (watcher) {
    watcher.remove()
    watcher = null
  }

  watcher = await Location.watchPositionAsync({ accuracy, timeInterval: interval, distanceInterval: distance }, (loc) => {
    // evaluate all fences
    fences.forEach(f => {
      try {
        const newState = computeFenceState(f, loc.coords)
        const prev = states[f.id] || 'outside'
        if (newState !== prev) {
          states[f.id] = newState
          emitter.emit('state', { fence: f, prev, current: newState, location: loc.coords })
          if (prev !== 'inside' && newState === 'inside') emitter.emit('enter', { fence: f, location: loc.coords })
          if (prev === 'inside' && newState !== 'inside') emitter.emit('exit', { fence: f, location: loc.coords })
        }
      } catch (e) {
        console.warn('fence eval error', e)
      }
    })
  })

  return watcher
}

export function stopMonitoring() {
  if (watcher) {
    watcher.remove()
    watcher = null
  }
}

export function getFences() {
  return fences
}

export default { loadFences, startMonitoring, stopMonitoring, on, off, getFences }
