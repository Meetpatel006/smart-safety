import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import geofenceService from '../geoFence/geofenceService'
import { appendTransition } from '../geoFence/transitionStore'
import { syncTransitions } from '../geoFence/syncTransitions'
import { Alert } from 'react-native'
import { showToast } from '../utils/toast'
import { triggerHighRiskAlert } from '../utils/alertHelpers'
import STORAGE_KEYS from '../constants/storageKeys'
import { readJSON, writeJSON, remove } from '../utils/storage'
import { MOCK_CONTACTS, MOCK_GROUP, MOCK_ITINERARY, MOCK_USER } from "../utils/mockData"
import type { Lang } from "./translations"

type User = {
  id: string
  name: string
  email: string
  aadhaar?: string // mock only
  blockchainId?: string // mock only
} | null

type Contact = { id: string; name: string; phone: string }
type Trip = { id: string; title: string; date: string; notes?: string }
type Geofence = { id: string; name: string; risk: "Low" | "Medium" | "High" | string }
type GroupMember = { id: string; name: string; lastCheckIn: string; lat: number; lng: number }

type AppState = {
  user: User
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
    email: string
    password: string
    aadhaar?: string
    blockchainId?: string
  }) => Promise<{ ok: boolean; message: string }>
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
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const STORAGE_KEY = STORAGE_KEYS.APP_STATE

const defaultState: AppState = {
  user: null,
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
        await geofenceService.startMonitoring({ intervalMs: 30000 })

        geofenceService.on('enter', ({ fence, location }) => {
          try { showToast(`Entered: ${fence.name} (${fence.category || 'zone'})`) } catch (e) { try { Alert.alert('Geo-fence entered', `${fence.name} (${fence.category || 'zone'})`) } catch (ee) { console.log('enter alert failed', ee) } }
          try {
            const rl = (fence.riskLevel || '').toString().toLowerCase()
            if (rl.includes('high')) {
              // fire sound/vibration/haptic and local notification for high risk
              try { triggerHighRiskAlert(`High risk area: ${fence.name}`, fence.category || 'High risk zone') } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
          try { appendTransition({ id: `t${Date.now()}`, fenceId: fence.id, fenceName: fence.name, type: 'enter', at: Date.now(), coords: { latitude: location.latitude, longitude: location.longitude } }) } catch (e) { /* ignore */ }
        })

        geofenceService.on('exit', ({ fence, location }) => {
          try { showToast(`Exited: ${fence.name} (${fence.category || 'zone'})`) } catch (e) { try { Alert.alert('Geo-fence exited', `${fence.name} (${fence.category || 'zone'})`) } catch (ee) { console.log('exit alert failed', ee) } }
          try { appendTransition({ id: `t${Date.now()}`, fenceId: fence.id, fenceName: fence.name, type: 'exit', at: Date.now(), coords: { latitude: location.latitude, longitude: location.longitude } }) } catch (e) { /* ignore */ }
        })

        geofenceService.on('primary', ({ primary }) => {
          try {
            if (!primary) setState(s => ({ ...s, currentPrimary: null }))
            else setState(s => ({ ...s, currentPrimary: { id: primary.id, name: primary.name, risk: primary.riskLevel } }))
          } catch (e) { /* ignore */ }
        })
      } catch (e) {
        console.warn('geofence monitor failed to start', e)
      }
    })()

    let syncInterval: any = null
    try {
      syncInterval = setInterval(async () => { try { if (!state.offline) await syncTransitions() } catch (e) {} }, 60 * 1000)
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
      // NOTE: The following login/register simulate backend. Replace with real API in future.
      async login(email, password) {
        await delay(700)
        if (!email || !password) return { ok: false, message: "Missing credentials (mock)." }
        const ok = Math.random() > 0.1
        if (ok) setState((s) => ({ ...s, user: { ...MOCK_USER, email } }))
        return ok ? { ok, message: "Login success (mock)." } : { ok, message: "Invalid credentials (mock)." }
      },
      async register(params) {
        await delay(900)
        // Do NOT validate Aadhaar/Blockchain; just simulate success
        const ok = Math.random() > 0.05
        if (ok)
          setState((s) => ({
            ...s,
            user: {
              id: "user_new",
              name: params.name,
              email: params.email,
              aadhaar: "XXXX-XXXX-0000",
              blockchainId: "mock-xyz",
            },
          }))
        return ok ? { ok, message: "Registration success (mock)." } : { ok, message: "Registration failed (mock)." }
      },
      async logout() {
        setState((s) => ({ ...s, user: null }))
      },
      async updateProfile(patch) {
        setState((s) => ({ ...s, user: { ...(s.user || MOCK_USER), ...patch } }))
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

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
