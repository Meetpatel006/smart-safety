import * as Notifications from 'expo-notifications'
import * as Haptics from 'expo-haptics'
import { Platform, Vibration } from 'react-native'
import STORAGE_KEYS from '../constants/storageKeys'
import { readJSON, writeJSON, remove } from './storage'

type EscalationState = {
  startedAt: number // ms epoch when user entered a high-risk state
  lastTier?: 0 | 1 | 2 | 3 // 0=none, 1=5m, 2=15m, 3=30m+
  lastNotifiedAt?: number // ms epoch for throttle
  suppressionUntil?: number // ms epoch until which notifications are paused
  globalMute?: boolean // when true, no alerts/vibration at all
}

const COOLDOWN_MS = 60_000 // avoid spam even if logic checks very frequently
const TIER_1_MS = 5 * 60 * 1000
const TIER_2_MS = 15 * 60 * 1000
const TIER_3_MS = 30 * 60 * 1000
let escalationTimer: any = null

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync()
    if (settings.granted) return true
    const req = await Notifications.requestPermissionsAsync()
    return !!req.granted
  } catch (e) {
    console.warn('notification permission check failed', e)
    return false
  }
}

// Send a single local notification and optionally vibrate for N ms
async function notifyOnce(title: string, body: string | undefined, vibrateMs: number = 0) {
  try {
    // Haptic cue (light)
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) } catch (e) { /* ignore */ }
    // Custom vibration length (Android/iOS respects duration array best)
    try {
      if (vibrateMs > 0 && (Platform.OS === 'android' || Platform.OS === 'ios')) {
        Vibration.vibrate([0, vibrateMs])
      }
    } catch (e) { /* ignore */ }

    const ok = await ensureNotificationPermission()
    if (ok) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body: body || '', sound: true },
        trigger: null,
      })
    }
  } catch (e) {
    console.warn('notifyOnce failed', e)
  }
}

export async function triggerHighRiskAlert(title: string, body?: string) {
  // Backward compatible one-off alert (no continuous escalation)
  await notifyOnce(title, body, 500)
}

export async function startProgressiveAlert(title: string, baseBody?: string) {
  // Begin or resume escalation from storage; fire according to elapsed time.
  try {
    const now = Date.now()
    let state = await readJSON<EscalationState>(STORAGE_KEYS.ALERT_ESCALATION)
    if (!state?.startedAt) {
      state = { startedAt: now, lastTier: 0, lastNotifiedAt: 0 }
      await writeJSON(STORAGE_KEYS.ALERT_ESCALATION, state)
    }
    // Immediate entry alert with 5s vibration (default), respecting mute/suppression/cooldown
    try {
      const s = state
      const suppressed = !!(s.suppressionUntil && now < s.suppressionUntil)
      const cooledDown = !(s.lastNotifiedAt && now - s.lastNotifiedAt < COOLDOWN_MS)
      if (!s.globalMute && !suppressed && cooledDown) {
        await notifyOnce(title, baseBody || 'High-risk area detected.', 5000)
        const updated: EscalationState = { ...s, lastNotifiedAt: now }
        await writeJSON(STORAGE_KEYS.ALERT_ESCALATION, updated)
        state = updated
      }
    } catch (e) { /* ignore */ }
    // Kick an immediate evaluation, then schedule periodic checks
    await evaluateAndNotify(state, title, baseBody)
    if (escalationTimer) clearInterval(escalationTimer)
    escalationTimer = setInterval(async () => {
      try {
        const s = await readJSON<EscalationState>(STORAGE_KEYS.ALERT_ESCALATION)
        if (!s?.startedAt) return // nothing to do
        await evaluateAndNotify(s, title, baseBody)
      } catch (e) { /* ignore */ }
    }, 30_000) // check every 30s; notifications throttled by COOLDOWN_MS
  } catch (e) {
    console.warn('startProgressiveAlert failed', e)
  }
}

export async function stopProgressiveAlert() {
  try {
    if (escalationTimer) { clearInterval(escalationTimer); escalationTimer = null }
    await remove(STORAGE_KEYS.ALERT_ESCALATION)
    try { Vibration.cancel() } catch (e) { /* ignore */ }
  } catch (e) {
    console.warn('stopProgressiveAlert failed', e)
  }
}

async function evaluateAndNotify(state: EscalationState, title: string, baseBody?: string) {
  const now = Date.now()
  const elapsed = now - state.startedAt
  // global mute
  if (state.globalMute) return
  // cooldown
  if (state.lastNotifiedAt && now - state.lastNotifiedAt < COOLDOWN_MS) return
  // suppression window active
  if (state.suppressionUntil && now < state.suppressionUntil) return

  let tier: 1 | 2 | 3 | null = null
  if (elapsed >= TIER_3_MS) tier = 3
  else if (elapsed >= TIER_2_MS) tier = 2
  else if (elapsed >= TIER_1_MS) tier = 1

  if (!tier) return // not time yet
  if ((state.lastTier || 0) >= tier) return // already handled this tier or higher

  // Decide vibration by tier
  const vibMs = tier === 1 ? 0 : tier === 2 ? 3000 : 5000
  const body =
    tier === 1
      ? `${baseBody || ''}`.trim() || 'You are in a high-risk area.'
      : tier === 2
      ? `${baseBody || 'High-risk area persists.'} Escalation: 15 minutes.`
      : `${baseBody || 'High-risk area persists.'} Escalation: 30+ minutes.`

  await notifyOnce(title, body, vibMs)
  const updated: EscalationState = { ...state, lastTier: tier, lastNotifiedAt: now }
  await writeJSON(STORAGE_KEYS.ALERT_ESCALATION, updated)
}

export async function acknowledgeHighRisk(minutes: number) {
  try {
    const now = Date.now()
    const s = (await readJSON<EscalationState>(STORAGE_KEYS.ALERT_ESCALATION)) || {
      startedAt: now,
      lastTier: 0,
      lastNotifiedAt: 0,
    }
    const suppressionUntil = now + Math.max(1, Math.floor(minutes)) * 60 * 1000
    const updated: EscalationState = { ...s, suppressionUntil }
    await writeJSON(STORAGE_KEYS.ALERT_ESCALATION, updated)
    try { Vibration.cancel() } catch (e) { /* ignore */ }
  } catch (e) {
    console.warn('acknowledgeHighRisk failed', e)
  }
}

export async function setGlobalMute(mute: boolean) {
  try {
    const now = Date.now()
    const s = (await readJSON<EscalationState>(STORAGE_KEYS.ALERT_ESCALATION)) || {
      startedAt: now,
      lastTier: 0,
      lastNotifiedAt: 0,
    }
    const updated: EscalationState = { ...s, globalMute: !!mute }
    await writeJSON(STORAGE_KEYS.ALERT_ESCALATION, updated)
    if (mute) { try { Vibration.cancel() } catch (e) { /* ignore */ } }
  } catch (e) {
    console.warn('setGlobalMute failed', e)
  }
}

export async function getAlertState(): Promise<{ muted: boolean; suppressionUntil?: number } | null> {
  try {
    const s = await readJSON<EscalationState>(STORAGE_KEYS.ALERT_ESCALATION)
    if (!s) return null
    return { muted: !!s.globalMute, suppressionUntil: s.suppressionUntil }
  } catch (e) {
    return null
  }
}
