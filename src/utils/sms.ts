import * as SMS from 'expo-sms'
import { Platform } from 'react-native'

export type SmsPayload = {
  recipients: string[]
  message: string
}

// Attempt to send SMS using expo-sms. On web or unsupported devices, return false.
export async function sendSMS(payload: SmsPayload): Promise<{ ok: boolean; result?: any }> {
  try {
    if (Platform.OS === 'web') return { ok: false }
    const isAvailable = await SMS.isAvailableAsync()
    if (!isAvailable) return { ok: false }
    // Use sendSMSAsync: opens the native SMS composer. This may require user interaction.
    const res = await SMS.sendSMSAsync(payload.recipients, payload.message)
    return { ok: true, result: res }
  } catch (e) {
    console.warn('sendSMS failed', e)
    return { ok: false }
  }
}

export default { sendSMS }
