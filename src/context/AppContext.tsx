import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import geofenceService from '../geoFence/geofenceService'
import { appendTransition } from '../geoFence/transitionStore'
import { syncTransitions } from '../geoFence/syncTransitions'
import { Alert } from 'react-native'
import { showToast } from '../utils/toast'
import { triggerHighRiskAlert, startProgressiveAlert, stopProgressiveAlert, acknowledgeHighRisk as ackHighRisk } from '../utils/alertHelpers'
import STORAGE_KEYS from '../constants/storageKeys'
import { readJSON, writeJSON, remove } from '../utils/storage'
import { MOCK_CONTACTS, MOCK_GROUP, MOCK_ITINERARY } from "../utils/mockData"
import type { Lang } from "./translations"
import { login as apiLogin, register as apiRegister, getTouristData } from "../utils/api"
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
  audit: { regHash: string; regTxHash: string }
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
  addTrip: (t: Omit<Trip, "id">) => void
  updateTrip: (id: string, patch: Partial<Trip>) => void
  removeTrip: (id: string) => void
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
  // load persisted app state once on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const parsed = await readJSON<typeof defaultState>(STORAGE_KEY, undefined)
        if (parsed && mounted) {
          const { trips, ...rest } = parsed;
          setState({ ...defaultState, ...rest, trips: [] });
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

    return () => {
      mounted = false
  try { geofenceService.off('enter', () => {}); geofenceService.off('exit', () => {}); geofenceService.off('primary', () => {}) } catch (e) {}
  try { if (syncInterval) clearInterval(syncInterval) } catch (e) {}
    }
  }, [state, hydrated])

  const value = useMemo<AppContextValue>(
    () => ({
      state,
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
          const baseTs = Date.now()
          const trips = itinerary.map((item: any, index: number) => {
            if (typeof item === 'string') {
              // API provides only strings for itinerary (e.g. ["Hotel ABC", "City Tour"]).
              // Keep date empty so UI shows only the title.
              return { id: `t${baseTs}_${index}`, title: item, date: "" }
            }
            if (item && typeof item === 'object') {
              const title = item.title || item.name || item.locationName || JSON.stringify(item)
              const date = item.date || item.dateTime || item.when || userData.expiresAt || new Date().toISOString()
              const notes = item.notes || item.extra || ''
              return { id: `t${baseTs}_${index}`, title, date, notes }
            }
            return { id: `t${baseTs}_${index}`, title: String(item), date: userData.expiresAt || new Date().toISOString() }
          })

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
      addTrip(t) {
        setState((s) => ({ ...s, trips: [...s.trips, { ...t, id: `t${Date.now()}` }] }))
      },
      updateTrip(id, patch) {
        setState((s) => ({ ...s, trips: s.trips.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)) }))
      },
      removeTrip(id) {
        setState((s) => ({ ...s, trips: s.trips.filter((tr) => tr.id !== id) }))
      },
      toggleShareLocation() {
        setState((s) => ({ ...s, shareLocation: !s.shareLocation }))
      },
      setOffline(v) {
        setState((s) => ({ ...s, offline: v }))
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
