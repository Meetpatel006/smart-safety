import { Platform, PermissionsAndroid, Alert } from 'react-native'
import SendSMS from 'react-native-sms'
import STORAGE_KEYS from '../constants/storageKeys'
import { pushToList, readJSON, writeJSON } from '../utils/storage'

export type SmsEntry = {
  id: string
  timestamp: number
  recipients: string[]
  body: string
  attempts?: number
}

const QUEUE_KEY = STORAGE_KEYS.SMS_QUEUE

async function checkSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS doesn't need explicit SMS permission
  }

  try {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    console.log('SMS Permission Check:', granted);
    return granted;
  } catch (err) {
    console.warn('SMS Permission check error:', err);
    return false;
  }
}

async function requestSMSPermissionDirect(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS doesn't need explicit SMS permission
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      {
        title: "Emergency SMS Access",
        message: "This app needs SMS permission to send emergency alerts to your contacts and authorities when you're in danger.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel", 
        buttonPositive: "Allow"
      }
    );
    
    console.log('SMS Permission Request Result:', granted);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('SMS Permission request error:', err);
    return false;
  }
}

// On web, SMS is not available
export async function sendSms(recipients: string[], body: string) {
  if (Platform.OS === 'web') {
    console.warn('sendSms: SMS not supported on web')
    return { result: 'unsupported' }
  }

  console.log('=== SENDING SMS ===');
  console.log('Recipients:', recipients);
  console.log('Body:', body);

  // Check permission first
  const hasPermission = await checkSMSPermission();
  console.log('Has SMS Permission:', hasPermission);

  if (!hasPermission) {
    console.log('No SMS permission - attempting to request...');
    const permissionGranted = await requestSMSPermissionDirect();
    
    if (!permissionGranted) {
      console.warn('SMS permission denied - queuing message instead');
      await queueSms(recipients, body);
      return { result: 'queued_no_permission' }
    }
  }

  return new Promise<{ result: string }>((resolve, reject) => {
    console.log('Sending SMS with react-native-sms...');
    
    try {
      SendSMS.send({
        body: body,
        recipients: recipients,
        successTypes: ['sent', 'completed'] as any,
        allowAndroidSendWithoutReadPermission: true, // Allow send without READ_SMS
      }, (completed, cancelled, error) => {
        console.log('SMS Send Result:', { 
          completed, 
          cancelled, 
          error,
          recipients: recipients.length 
        });

        if (completed) {
          console.log('✅ SMS sent successfully to all recipients');
          resolve({ result: 'sent' });
        } else if (cancelled) {
          console.log('📱 SMS sending was cancelled by user');
          resolve({ result: 'cancelled' });
        } else if (error) {
          console.error('❌ SMS sending failed:', error);
          // Try to queue for retry
          queueSms(recipients, body).catch(e => 
            console.warn('Failed to queue SMS after send error:', e)
          );
          reject(new Error(`SMS send failed: ${error}`));
        } else {
          console.log('📱 SMS sending completed with unknown state');
          resolve({ result: 'unknown' });
        }
      });
    } catch (error) {
      console.error('❌ SMS sending exception:', error);
      // Try to queue for retry
      queueSms(recipients, body).catch(e => 
        console.warn('Failed to queue SMS after exception:', e)
      );
      reject(error);
    }
  });
}

// Send SMS to multiple recipients with better error handling
export async function sendSmsToMultiple(recipients: string[], body: string) {
  const results = {
    success: [] as string[],
    failed: [] as { recipient: string, error: string }[],
    queued: [] as string[]
  };

  console.log(`=== SENDING SMS TO ${recipients.length} RECIPIENTS ===`);

  for (const recipient of recipients) {
    console.log(`Sending SMS to: ${recipient}`);
    
    try {
      const result = await sendSms([recipient], body);
      
      if (result.result === 'sent') {
        results.success.push(recipient);
      } else if (result.result === 'queued_no_permission') {
        results.queued.push(recipient);
      } else {
        results.failed.push({ recipient, error: `Send result: ${result.result}` });
      }
      
      // Small delay between sends to avoid device throttling
      if (recipients.indexOf(recipient) < recipients.length - 1) {
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (error) {
      console.warn(`Failed to send SMS to ${recipient}:`, error);
      results.failed.push({ recipient, error: error?.toString() || 'Unknown error' });
      
      // Try to queue the failed message
      try {
        await queueSms([recipient], body);
        results.queued.push(recipient);
      } catch (queueError) {
        console.warn(`Failed to queue SMS for ${recipient}:`, queueError);
      }
    }
  }

  console.log('SMS batch send results:', results);
  return results;
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
  sendSmsToMultiple,
  queueSms,
  drainSmsQueue,
  formatTouristInfo,
}
