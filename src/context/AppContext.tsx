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
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const STORAGE_KEY = STORAGE_KEYS.APP_STATE

const defaultState: AppState = {
  user: null,
  token: null,
  contacts: MOCK_CONTACTS,
  trips: MOCK_ITINERARY,
  geofences: [],
  group: MOCK_GROUP,
  shareLocation: false,
  offline: false,
  language: "en",
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
        if (parsed && mounted) setState({ ...defaultState, ...parsed })
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
          const userData = await getTouristData(data.touristId, data.token)
          setState((s) => ({ ...s, user: userData, token: data.token }))
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
        setState((s) => ({ ...s, user: null, token: null }))
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
