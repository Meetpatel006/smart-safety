import * as Notifications from 'expo-notifications'
import * as Haptics from 'expo-haptics'
import { Platform, Vibration } from 'react-native'

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

export async function triggerHighRiskAlert(title: string, body?: string) {
  try {
    // vibration pattern: strong pulse
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        Vibration.vibrate([0, 500, 200, 500])
      }
    } catch (e) { /* ignore */ }

    // haptic on supported devices
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) } catch (e) { /* ignore */ }

    // ensure permission then show local notification
    const ok = await ensureNotificationPermission()
    if (ok) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body: body || '', sound: true },
        trigger: null,
      })
    }
  } catch (e) {
    console.warn('triggerHighRiskAlert failed', e)
  }
}
