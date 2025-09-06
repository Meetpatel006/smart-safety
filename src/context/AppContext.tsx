import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import geofenceService from '../geoFence/geofenceService'
import { Alert } from 'react-native'
import AsyncStorage from "@react-native-async-storage/async-storage"
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

const STORAGE_KEY = "SIH_SMART_SAFETY_STATE_V1"

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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (raw && mounted) {
          const parsed = JSON.parse(raw)
          setState({ ...defaultState, ...parsed })
        }
      } catch (error) {
        console.warn('Error loading app state:', error)
      } finally {
        if (mounted) {
          setHydrated(true)
        }
      }
    })()
    
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    // Start geofence monitoring after hydration
    let mounted = true
    ;(async () => {
      try {
        await geofenceService.loadFences()
        await geofenceService.startMonitoring({ intervalMs: 30000 })
        geofenceService.on('enter', ({ fence, location }) => {
          try {
            Alert.alert('Geo-fence entered', `${fence.name} (${fence.category || 'zone'})`)
          } catch (e) {
            console.log('enter alert failed', e)
          }
        })
        geofenceService.on('exit', ({ fence, location }) => {
          try {
            Alert.alert('Geo-fence exited', `${fence.name} (${fence.category || 'zone'})`)
          } catch (e) {
            console.log('exit alert failed', e)
          }
        })
      } catch (e) {
        console.warn('geofence monitor failed to start', e)
      }
    })()
    
    const saveState = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.warn('Error saving app state:', error)
      }
    }
    
    saveState()
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
        await AsyncStorage.removeItem(STORAGE_KEY)
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
