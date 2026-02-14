import * as SMS from 'expo-sms'
import SendSMS from 'react-native-sms'
import { PermissionsAndroid, Platform } from 'react-native'

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

      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('sendSMS timed out after 8s'))
        }, 8000)

        try {
          SendSMS.send(
            {
              body: payload.message,
              recipients: payload.recipients,
              successTypes: ['sent', 'queued'],
              allowAndroidSendWithoutPrompt: true,
            },
            (completed, cancelled, error) => {
              clearTimeout(timeout)
              if (error) return reject(new Error(`sendSMS failed: ${String(error)}`))
              if (cancelled) return reject(new Error('sendSMS cancelled'))
              return resolve({ completed, cancelled })
            },
          )
        } catch (err) {
          clearTimeout(timeout)
          reject(err)
        }
      }).catch((err) => {
        console.warn('[sms] Android direct send error', err)
        return Promise.reject(err)
      })

      console.log('[sms] Android send result', result)
      return { ok: true, result: { channel: 'android-direct', ...result } }
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
