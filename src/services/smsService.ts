import { Platform, PermissionsAndroid } from 'react-native'
import SendSMS from 'react-native-sms'
import STORAGE_KEYS from '../constants/storageKeys'
import { pushToList, readJSON, writeJSON } from '../utils/storage'

async function requestSMSPermission() {
  try {
    // First check if we already have permission
    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    if (hasPermission) {
      console.log('SMS Permission: Already granted');
      return true;
    }

    // If not, request permission
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      {
        title: "SMS Permission",
        message: "This app needs access to send SMS messages " +
                "for emergency alerts.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK"
      }
    );
    console.log('SMS Permission:', granted);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('SMS Permission error:', err);
    return false;
  }
}

export type SmsEntry = {
  id: string
  timestamp: number

  recipients: string[]
  body: string
  attempts?: number
}

const QUEUE_KEY = STORAGE_KEYS.SMS_QUEUE


// On web, expo-sms is not available
export async function sendSms(recipients: string[], body: string) {
  if (Platform.OS === 'web') {
    console.warn('sendSms: SMS not supported on web')
    return { result: 'unsupported' }
  }

  // Request SMS permission if needed
  const hasPermission = await requestSMSPermission();
  if (!hasPermission) {
    console.error('SMS permission denied');
    throw new Error('SMS permission denied');
  }

  return new Promise<{ result: string }>(async (resolve, reject) => {
    // Log the SMS attempt
    console.log('Attempting to send SMS:', {
      recipients: recipients,
      body: body
    });

    try {
      // Send SMS sequentially to avoid device restrictions
      for (const recipient of recipients) {
        console.log(`Sending SMS to ${recipient}...`);
        await new Promise<void>((innerResolve, innerReject) => {
          SendSMS.send({
            body: body,
            recipients: [recipient], // Send to one recipient at a time
            successTypes: ['sent', 'completed'] as any,
            allowAndroidSendWithoutReadPermission: false,
          }, (completed, cancelled, error) => {
            console.log(`SMS to ${recipient}:`, { completed, cancelled, error });
            if (completed) {
              innerResolve();
            } else if (cancelled) {
              innerReject(new Error('SMS cancelled'));
            } else if (error) {
              innerReject(error);
            }
          });
        });
        // Add a small delay between sends to prevent device throttling
        await new Promise(r => setTimeout(r, 500));
      }
      console.log('All SMS sent successfully');
      resolve({ result: 'sent' });
    } catch (error) {
      console.error('SMS sending failed:', error);
      reject(error);
    }
  });
  }

export async function queueSms(recipients: string[], body: string) {
  try {
    const entry: SmsEntry = {
      id: `sms_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      recipients,
      body,
      attempts: 0,
    }
    await pushToList(QUEUE_KEY, entry, 500)
    return entry
  } catch (e) {
    console.warn('queueSms failed', e)
    throw e
  }
}

export async function getSmsQueue(): Promise<SmsEntry[]> {
  try {
    const arr = (await readJSON<SmsEntry[]>(QUEUE_KEY, [])) || []
    return arr
  } catch (e) {
    console.warn('getSmsQueue failed', e)
    return []
  }
}

export async function drainSmsQueue() {
  try {
    const queue = await getSmsQueue()
    if (!queue || queue.length === 0) return { success: [], failed: [] }

    const items = [...queue].reverse()
    const remaining: SmsEntry[] = []
    const results = { success: [] as string[], failed: [] as { id: string; reason: any }[] }

    for (const it of items) {
      try {
        await sendSms(it.recipients, it.body)
        results.success.push(it.id)
      } catch (e) {
        const attempts = (it.attempts || 0) + 1
        if (attempts >= 3) {
          results.failed.push({ id: it.id, reason: e })
        } else {
          remaining.push({ ...it, attempts })
        }
      }
    }

    await writeJSON(QUEUE_KEY, remaining.reverse())
    return results
  } catch (e) {
    console.warn('drainSmsQueue failed', e)
    return { success: [], failed: [] }
  }
}

export function formatTouristInfo(state: any) {
  // Minimal safe formatter - includes name, location, coords, safety score
  const parts: string[] = []
  try {
    console.log('\n=== Formatting Tourist Info ===');
    console.log('State data:', {
      userName: state.user?.name,
      address: state.currentAddress,
      coords: state.currentLocation?.coords,
      safetyScore: state.user?.safetyScore
    });

    if (state.user?.name) parts.push(`Name: ${state.user.name}`)
    if (state.currentAddress) parts.push(`Location: ${state.currentAddress}`)
    if (state.currentLocation?.coords) {
      const lat = state.currentLocation.coords.latitude.toFixed(7);
      const lng = state.currentLocation.coords.longitude.toFixed(7);
      parts.push(`Coords: ${lat}, ${lng}`);
    }
    if (typeof state.user?.safetyScore !== 'undefined') parts.push(`Safety score: ${state.user.safetyScore}`)
    if (state.itinerary && state.itinerary.length) parts.push(`Itinerary: ${state.itinerary.map((i: any) => i.name || i.place).join(' > ')}`)
    
    console.log('Formatted parts:', parts);
  } catch (e) { 
    console.error('Error formatting tourist info:', e);
  }
  const result = parts.join('\n');
  console.log('Final formatted message:', result);
  return result;
}

export default {
  sendSms,
  queueSms,
  drainSmsQueue,
  formatTouristInfo,
}
