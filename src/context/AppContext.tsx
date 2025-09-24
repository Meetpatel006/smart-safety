import type React from "react"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import geofenceService from '../geoFence/geofenceService'
import { appendTransition } from '../geoFence/transitionStore'
import { syncTransitions } from '../geoFence/syncTransitions'
import { Alert } from 'react-native'
import { showToast } from '../utils/toast'
import { triggerHighRiskAlert, startProgressiveAlert, stopProgressiveAlert, acknowledgeHighRisk as ackHighRisk } from '../utils/alertHelpers'
import STORAGE_KEYS from '../constants/storageKeys'
import { readJSON, writeJSON, remove } from '../utils/storage'
import { drainSOSQueue, clearSOSQueue } from '../utils/offlineQueue'
import { MOCK_CONTACTS, MOCK_GROUP, MOCK_ITINERARY } from "../utils/mockData"
import type { Lang } from "./translations"
import { login as apiLogin, register as apiRegister, getTouristData, tripsToItinerary, itineraryToTrips } from "../utils/api"
import * as Location from 'expo-location';

type User = {
  touristId: string
  name: string
  email: string
  phone: string
  itinerary: string[]
  emergencyContact: { name: string; phone: string }
  language: string
  safetyScore: number
  consent: { tracking: boolean; dataRetention: boolean }
  createdAt: string
  expiresAt: string
  audit: { regHash: string; regTxHash: string; eventId: string }
} | null

type Contact = { id: string; name: string; phone: string }
type Trip = { id: string; title: string; date: string; notes?: string }
type Geofence = { id: string; name: string; risk: "Low" | "Medium" | "High" | string }
type GroupMember = { id: string; name: string; lastCheckIn: string; lat: number; lng: number }

type AppState = {
  user: User
  token: string | null
  contacts: Contact[]
  trips: Trip[]
  geofences: Geofence[]
  group: GroupMember[]
  shareLocation: boolean
  offline: boolean
  language: Lang
  currentPrimary?: { id: string; name: string; risk?: string } | null
  currentLocation: Location.LocationObject | null
  currentAddress: string | null
}

type AppContextValue = {
  state: AppState
  netInfoAvailable?: boolean | null
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>
  register: (params: {
    name: string
    govId: string
    phone: string
    email: string
    password: string
    itinerary: string[]
    emergencyContact: { name: string; phone: string }
    language: string
    tripEndDate: string
  }) => Promise<{ ok: boolean; message: string; regTxHash?: string }>
  logout: () => Promise<void>
  updateProfile: (patch: Partial<NonNullable<User>>) => Promise<void>
  addContact: (c: Omit<Contact, "id">) => void
  updateContact: (id: string, patch: Partial<Contact>) => void
  removeContact: (id: string) => void
  addTrip: (t: Omit<Trip, "id">) => Promise<void>
  updateTrip: (id: string, patch: Partial<Trip>) => Promise<void>
  removeTrip: (id: string) => Promise<void>
  toggleShareLocation: () => void
  setOffline: (v: boolean) => void
  setLanguage: (lang: Lang) => void
  wipeMockData: () => Promise<void>
  acknowledgeHighRisk: (minutes: number) => Promise<void>
  setCurrentLocation: (location: Location.LocationObject | null) => void
  setCurrentAddress: (address: string | null) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const STORAGE_KEY = STORAGE_KEYS.APP_STATE

const defaultState: AppState = {
  user: null,
  token: null,
  contacts: MOCK_CONTACTS,
  trips: [],
  geofences: [],
  group: MOCK_GROUP,
  shareLocation: false,
  offline: false,
  language: "en",
  currentLocation: null,
  currentAddress: null,
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)
  const [hydrated, setHydrated] = useState(false)
  const [netInfoAvailable, setNetInfoAvailable] = useState<boolean | null>(null)
  // Drain queued SOS items when app becomes hydrated and online, or when offline->online transition occurs.
  const drainingRef = useRef(false)
  const prevOfflineRef = useRef<boolean | null>(null)
  const tokenRef = useRef<string | null>(null)
  const stateRef = useRef<AppState>(state)

  // keep refs updated with latest state/token to avoid stale closures in listeners
  useEffect(() => { tokenRef.current = state.token }, [state.token])
  useEffect(() => { stateRef.current = state }, [state])

  // Centralized offline setter so both UI toggle and NetInfo use same logic
  const handleSetOffline = (v: boolean) => {
    try { console.log('handleSetOffline called, offline=', v) } catch (e) { }
    setState(s => ({ ...s, offline: v }))
    // if switching to online, attempt to drain queued SOS items
    if (!v) {
      if (drainingRef.current) return
      drainingRef.current = true
      ;(async () => {
        try {
          const tokenNow = tokenRef.current
          if (tokenNow) {
            try { console.log('drainSOSQueue starting (setOffline false)') } catch (e) { }
            const res = await drainSOSQueue(tokenNow)
            try { console.log('drainSOSQueue result (setOffline false)', res) } catch (e) { }
            if (res && Array.isArray(res.failed) && res.failed.length === 0 && Array.isArray(res.success) && res.success.length > 0) {
              try { await clearSOSQueue(); try { console.log('clearSOSQueue called after successful drain') } catch (e) { } } catch (e) { }
            }
          } else {
            try { console.log('drainSOSQueue skipped: no token') } catch (e) { }
          }
        } catch (e) {
          console.warn('drainSOSQueue on setOffline(false) error', e)
        } finally {
          drainingRef.current = false
        }
      })()
    }
  }
  // Automatic connectivity listener (dynamic import so app still runs if NetInfo missing)
  useEffect(() => {
    let unsub: any = null
    let mounted = true
    ;(async () => {
      try {
        const mod: any = await import('@react-native-community/netinfo')
        const NetInfo = mod && (mod.default || mod)
        if (!NetInfo) {
          try { console.log('NetInfo import resolved but no default export') } catch (e) { }
          setNetInfoAvailable(false)
          return
        }
        setNetInfoAvailable(true)
        try { console.log('NetInfo available - fetching initial state') } catch (e) { }
        try {
          const st = await NetInfo.fetch()
          const online = !!st.isConnected && (typeof st.isInternetReachable === 'undefined' ? true : !!st.isInternetReachable)
          try { console.log('NetInfo initial fetch isConnected=', st.isConnected, 'isInternetReachable=', st.isInternetReachable, '=> online=', online) } catch (e) { }
          // update offline flag using centralized handler
          handleSetOffline(!online)
        } catch (e) {
          try { console.warn('NetInfo initial fetch failed', e) } catch (ee) { }
        }

        unsub = NetInfo.addEventListener((st: any) => {
          const online = !!st.isConnected && (typeof st.isInternetReachable === 'undefined' ? true : !!st.isInternetReachable)
          try { console.log('NetInfo event, isConnected=', st.isConnected, 'isInternetReachable=', st.isInternetReachable, '=> online=', online) } catch (e) { }
          // update offline flag using centralized handler
          handleSetOffline(!online)
        })
      } catch (e) {
        try { console.log('NetInfo not available; automatic connectivity detection disabled') } catch (ee) { }
        setNetInfoAvailable(false)
      }
    })()
    return () => {
      mounted = false
      try { if (unsub) unsub() } catch (e) { }
    }
  }, [])
  // load persisted app state once on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const parsed = await readJSON<typeof defaultState>(STORAGE_KEY, undefined)
        if (parsed && mounted) {
          // restore persisted state (including token). We'll avoid overwriting trips so that
          // server-sourced itineraries can be refreshed below if needed.
          setState((prev) => ({ ...defaultState, ...prev, ...parsed }))
          // If the persisted state contains a token but trips are empty, fetch /me now
          try {
            if (parsed.token && (!Array.isArray(parsed.trips) || parsed.trips.length === 0)) {
              console.log('Hydration: token present in storage but no trips — fetching /me')
              const userRes = await getTouristData(parsed.token)
              const userData = Array.isArray(userRes) ? (userRes.length ? userRes[0] : null) : userRes
              if (userData && mounted) {
                const itinerary = Array.isArray(userData.itinerary) ? userData.itinerary : []
                const trips = itineraryToTrips(itinerary)
                setState((s) => ({ ...s, user: userData, token: parsed.token, trips }))
                try { console.log('Hydration fetched itinerary:', { count: itinerary.length }) } catch (e) { }
              }
            }
          } catch (e) {
            console.warn('Hydration: failed to refresh /me', e)
          }
        }
      } catch (error) {
        console.warn('Error loading app state:', error)
      } finally {
        if (mounted) setHydrated(true)
      }
    })()
    return () => { mounted = false }
  }, [])

  // start geofence monitoring and periodic sync after hydration
  useEffect(() => {
    if (!hydrated) return
    let mounted = true

    ;(async () => {
      try {
  await geofenceService.loadFences()
  // start geofence monitoring; transitions will be logged on enter/exit
  await geofenceService.startMonitoring({ intervalMs: 30000 })

    geofenceService.on('enter', ({ fence, location }) => {
          try { showToast(`Entered: ${fence.name} (${fence.category || 'zone'})`) } catch (e) { try { Alert.alert('Geo-fence entered', `${fence.name} (${fence.category || 'zone'})`) } catch (ee) { console.log('enter alert failed', ee) } }
          try {
            const rl = (fence.riskLevel || '').toString().toLowerCase()
            if (rl.includes('high')) {
      // Start progressive alert escalation for sustained presence
      try { startProgressiveAlert(`High risk area: ${fence.name}`, fence.category || 'High risk zone') } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
          try { appendTransition({ id: `t${Date.now()}`, fenceId: fence.id, fenceName: fence.name, type: 'enter', at: Date.now(), coords: { latitude: location.latitude, longitude: location.longitude } }) } catch (e) { /* ignore */ }
        })

        geofenceService.on('exit', ({ fence, location }) => {
          try { showToast(`Exited: ${fence.name} (${fence.category || 'zone'})`) } catch (e) { try { Alert.alert('Geo-fence exited', `${fence.name} (${fence.category || 'zone'})`) } catch (ee) { console.log('exit alert failed', ee) } }
          try { stopProgressiveAlert() } catch (e) { /* ignore */ }
          try { appendTransition({ id: `t${Date.now()}`, fenceId: fence.id, fenceName: fence.name, type: 'exit', at: Date.now(), coords: { latitude: location.latitude, longitude: location.longitude } }) } catch (e) { /* ignore */ }
        })

        geofenceService.on('primary', ({ primary }) => {
          try {
            if (!primary) setState(s => ({ ...s, currentPrimary: null }))
            else setState(s => ({ ...s, currentPrimary: { id: primary.id, name: primary.name, risk: primary.riskLevel } }))
          } catch (e) { /* ignore */ }
          try {
            const rl = (primary?.riskLevel || '').toString().toLowerCase()
            if (!rl.includes('high')) stopProgressiveAlert()
          } catch (e) { /* ignore */ }
        })
      } catch (e) {
        console.warn('geofence monitor failed to start', e)
      }
    })()

    let syncInterval: any = null
    try {
      // keep a safety net sync for transitions every 15 minutes (batch uploads handle samples)
      syncInterval = setInterval(async () => { try { if (!state.offline) await syncTransitions() } catch (e) {} }, 15 * 60 * 1000)
    } catch (e) { /* ignore */ }

  const saveState = async () => { try { await writeJSON(STORAGE_KEY, state) } catch (error) { console.warn('Error saving app state:', error) } }
  saveState()

    // removed automatic drain from this broad state effect to avoid repeated attempts

    return () => {
      mounted = false
  try { geofenceService.off('enter', () => {}); geofenceService.off('exit', () => {}); geofenceService.off('primary', () => {}) } catch (e) {}
  try { if (syncInterval) clearInterval(syncInterval) } catch (e) {}
    }
  }, [state, hydrated])

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      netInfoAvailable: netInfoAvailable,
      async login(email, password) {
        try {
          const data = await apiLogin(email, password)
          // getTouristData may return an object or an array (API docs show object but some endpoints return arrays)
          const userRes = await getTouristData(data.token)
          let userData: any = null
          if (Array.isArray(userRes)) {
            userData = userRes.length ? userRes[0] : null
          } else {
            userData = userRes
          }

          if (!userData) throw new Error('Failed to fetch user data')

          // Log login response and fetched user data for debugging
          try {
            console.log('Login successful - token:', data.token, 'touristId:', data.touristId, 'user:', userData)
          } catch (e) {
            // ignore logging errors
          }

          // Build trips from userData.itinerary. The API may provide an array of strings or objects.
          const itinerary = Array.isArray(userData.itinerary) ? userData.itinerary : []
          const trips = itineraryToTrips(itinerary)

          // Map emergency contact from API (if present) to app contacts so UI shows real contact(s)
          let contactsFromApi: { id: string; name: string; phone: string }[] | null = null
          try {
            if (userData.emergencyContact) {
              const ec = userData.emergencyContact
              const resolved = Array.isArray(ec) ? ec : [ec]
              const now = Date.now()
              contactsFromApi = resolved.map((c: any, i: number) => ({ id: `ec${now}_${i}`, name: c.name || c.title || 'Emergency', phone: c.phone || c.mobile || c.number || '' }))
            }
          } catch (e) {
            // keep contactsFromApi null on error
            contactsFromApi = null
          }

          setState((s) => ({ ...s, user: userData, token: data.token, trips, contacts: contactsFromApi || s.contacts }))
          try { console.log('Built trips from API:', { count: trips.length, trips }) } catch (e) { }
          return { ok: true, message: "Login successful" }
        } catch (error: any) {
          return { ok: false, message: error.message || "An error occurred" }
        }
      },
      async register(params) {
          try {
          const data = await apiRegister(params)
          return { ok: true, message: "Registration successful", regTxHash: data.audit.regTxHash }
        } catch (error: any) {
          return { ok: false, message: error.message || "An error occurred" }
        }
      },
      async logout() {
        await remove(STORAGE_KEY);
        setState(defaultState);
      },
      async updateProfile(patch) {
        setState((s) => ({ ...s, user: s.user ? { ...s.user, ...patch } : null }))
        // In real app: call backend to update profile
      },
      addContact(c) {
        setState((s) => ({ ...s, contacts: [...s.contacts, { ...c, id: `c${Date.now()}` }] }))
      },
      updateContact(id, patch) {
        setState((s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
      },
      removeContact(id) {
        setState((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) }))
      },
      addTrip: async (t) => {
        const newTrip = { ...t, id: `t${Date.now()}` }
        const updatedTrips = [...state.trips, newTrip]
        const itinerary = tripsToItinerary(updatedTrips)
        try {
          if (state.token) {
            await getTouristData(state.token, 'PATCH', { itinerary })
          }
          setState((s) => ({ ...s, trips: updatedTrips }))
        } catch (error) {
          console.error('Failed to sync trip addition with API:', error)
          // Still update local state for offline functionality
          setState((s) => ({ ...s, trips: updatedTrips }))
        }
      },
      updateTrip: async (id, patch) => {
        const updatedTrips = state.trips.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr))
        const itinerary = tripsToItinerary(updatedTrips)
        try {
          if (state.token) {
            await getTouristData(state.token, 'PATCH', { itinerary })
          }
          setState((s) => ({ ...s, trips: updatedTrips }))
        } catch (error) {
          console.error('Failed to sync trip update with API:', error)
          // Still update local state for offline functionality
          setState((s) => ({ ...s, trips: updatedTrips }))
        }
      },
      removeTrip: async (id) => {
        const updatedTrips = state.trips.filter((tr) => tr.id !== id)
        const itinerary = tripsToItinerary(updatedTrips)
        try {
          if (state.token) {
            await getTouristData(state.token, 'PATCH', { itinerary })
          }
          setState((s) => ({ ...s, trips: updatedTrips }))
        } catch (error) {
          console.error('Failed to sync trip removal with API:', error)
          // Still update local state for offline functionality
          setState((s) => ({ ...s, trips: updatedTrips }))
        }
      },
      toggleShareLocation() {
        setState((s) => ({ ...s, shareLocation: !s.shareLocation }))
      },
      setOffline(v) {
        handleSetOffline(v)
      },
      setLanguage(lang) {
        setState((s) => ({ ...s, language: lang }))
      },
      async wipeMockData() {
        await remove(STORAGE_KEY)
        setState(defaultState)
      },
      async acknowledgeHighRisk(minutes: number) {
        try { await ackHighRisk(minutes) } catch (e) { /* ignore */ }
      },
      setCurrentLocation(location) {
        setState((s) => ({ ...s, currentLocation: location }))
      },
      setCurrentAddress(address) {
        setState((s) => ({ ...s, currentAddress: address }))
      },
    }),
    [state, hydrated],
  )

  if (!hydrated) {
    return null // Return null instead of undefined to prevent rendering issues
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
