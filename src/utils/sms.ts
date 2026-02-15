import * as SMS from 'expo-sms'
import { NativeModules, PermissionsAndroid, Platform } from 'react-native'

export type SmsPayload = {
  recipients: string[]
  message: string
}

async function requestAndroidSendPermission() {
  if (Platform.OS !== 'android') return true
  const permission = PermissionsAndroid.PERMISSIONS.SEND_SMS
  const hasPermission = await PermissionsAndroid.check(permission)
  if (hasPermission) return true

  const result = await PermissionsAndroid.request(permission)
  return result === PermissionsAndroid.RESULTS.GRANTED
}

type DirectSmsModuleType = {
  sendSms: (recipients: string[], message: string) => Promise<any>
}

// Attempt to send SMS. On Android, send directly without opening the SMS app.
// On other platforms, fall back to expo-sms which may open the composer.
export async function sendSMS(payload: SmsPayload): Promise<{ ok: boolean; result?: any }> {
  try {
    if (!Array.isArray(payload.recipients) || payload.recipients.length === 0) {
      console.log('[sms] No recipients provided, skipping send')
      return { ok: false }
    }

    if (Platform.OS === 'android') {
      const permitted = await requestAndroidSendPermission()
      if (!permitted) {
        console.log('[sms] SEND_SMS permission denied')
        return { ok: false }
      }

      console.log('[sms] Android direct send starting', {
        recipients: payload.recipients.length,
      })

      const directSmsModule = NativeModules.DirectSmsModule as DirectSmsModuleType | undefined
      if (!directSmsModule?.sendSms) {
        console.warn('[sms] DirectSmsModule unavailable. Rebuild Android app (expo run:android) to enable auto-send.')
        return { ok: false, result: { reason: 'direct_module_unavailable' } }
      }

      try {
        const result = await directSmsModule.sendSms(payload.recipients, payload.message)
        console.log('[sms] Android native direct send result', result)
        return { ok: true, result }
      } catch (err) {
        console.warn('[sms] Android native direct send failed', err)
        return { ok: false, result: { reason: 'direct_send_failed' } }
      }
    }

    if (Platform.OS === 'web') {
      console.log('[sms] Web platform, SMS not supported')
      return { ok: false }
    }
    const isAvailable = await SMS.isAvailableAsync()
    if (!isAvailable) {
      console.log('[sms] expo-sms not available on device')
      return { ok: false }
    }
    const res = await SMS.sendSMSAsync(payload.recipients, payload.message)
    console.log('[sms] Expo send result', res)
    return { ok: true, result: { channel: 'expo-fallback', ...res } }
  } catch (e) {
    console.warn('sendSMS failed', e)
    return { ok: false }
  }
}

export default { sendSMS }
