import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted'

export interface PermissionResult {
  status: PermissionStatus
  canAskAgain?: boolean
  granted: boolean
}

export interface AllPermissionsStatus {
  location: PermissionResult
  backgroundLocation: PermissionResult
  notifications: PermissionResult
  sms: PermissionResult
}

/**
 * Request SMS permission with improved handling for sensitive permissions
 */
export async function requestSMSPermission(): Promise<PermissionResult> {
  if (Platform.OS !== 'android') {
    return { status: 'granted', granted: true }
  }

  try {
    // First check if we already have permission
    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS)
    if (hasPermission) {
      console.log('SMS Permission: Already granted')
      return { status: 'granted', granted: true }
    }

    // Show explanation dialog before requesting permission
    const shouldRequest = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "SMS Permission Required",
        "This app needs SMS permission to send emergency alerts to your emergency contacts when you're in danger.\n\nThis is a safety feature and your privacy is protected - we only send SMS during emergencies.",
        [
          {
            text: "Not Now",
            onPress: () => resolve(false),
            style: "cancel"
          },
          {
            text: "Allow SMS",
            onPress: () => resolve(true),
            style: "default"
          }
        ]
      )
    })

    if (!shouldRequest) {
      console.log('SMS Permission: User declined to grant permission')
      return { status: 'denied', granted: false, canAskAgain: true }
    }

    // Request permission with detailed explanation
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      {
        title: "Emergency SMS Permission",
        message: "Smart Safety needs SMS access to send emergency alerts to your contacts during safety emergencies. This keeps you safe by automatically notifying your trusted contacts if you need help.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "No Thanks",
        buttonPositive: "Allow"
      }
    )

    console.log('SMS Permission result:', granted)
    
    const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED
    const canAskAgain = granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN

    // If permission was permanently denied, offer to open settings
    if (!isGranted && !canAskAgain) {
      Alert.alert(
        "SMS Permission Needed",
        "SMS permission is required for emergency alerts. You can enable it in your device settings.\n\nWould you like to open settings now?",
        [
          {
            text: "Later",
            style: "cancel"
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings()
          }
        ]
      )
    }
    
    return {
      status: isGranted ? 'granted' : 'denied',
      granted: isGranted,
      canAskAgain
    }
  } catch (err) {
    console.warn('SMS Permission error:', err)
    return { status: 'denied', granted: false }
  }
}

/**
 * Request location permission (foreground)
 */
export async function requestLocationPermission(): Promise<PermissionResult> {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync()
    console.log('Location Permission result:', status)
    
    return {
      status: status as PermissionStatus,
      granted: status === 'granted',
      canAskAgain
    }
  } catch (err) {
    console.warn('Location Permission error:', err)
    return { status: 'denied', granted: false }
  }
}

/**
 * Request background location permission (required for geofencing when app is closed)
 */
export async function requestBackgroundLocationPermission(): Promise<PermissionResult> {
  try {
    // First ensure we have foreground permission
    const foregroundResult = await requestLocationPermission()
    if (!foregroundResult.granted) {
      return foregroundResult
    }

    const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync()
    console.log('Background Location Permission result:', status)
    
    return {
      status: status as PermissionStatus,
      granted: status === 'granted',
      canAskAgain
    }
  } catch (err) {
    console.warn('Background Location Permission error:', err)
    return { status: 'denied', granted: false }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  try {
    const settings = await Notifications.getPermissionsAsync()
    if (settings.granted) {
      console.log('Notification Permission: Already granted')
      return { status: 'granted', granted: true }
    }

    const req = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })
    
    console.log('Notification Permission result:', req.status)
    return {
      status: req.status as PermissionStatus,
      granted: req.granted,
      canAskAgain: req.canAskAgain
    }
  } catch (e) {
    console.warn('Notification permission check failed', e)
    return { status: 'denied', granted: false }
  }
}

/**
 * Check all permission statuses without requesting
 */
export async function checkAllPermissions(): Promise<AllPermissionsStatus> {
  const results: AllPermissionsStatus = {
    location: { status: 'undetermined', granted: false },
    backgroundLocation: { status: 'undetermined', granted: false },
    notifications: { status: 'undetermined', granted: false },
    sms: { status: 'undetermined', granted: false }
  }

  try {
    // Check location permission
    const locationStatus = await Location.getForegroundPermissionsAsync()
    results.location = {
      status: locationStatus.status as PermissionStatus,
      granted: locationStatus.granted,
      canAskAgain: locationStatus.canAskAgain
    }

    // Check background location permission
    const backgroundLocationStatus = await Location.getBackgroundPermissionsAsync()
    results.backgroundLocation = {
      status: backgroundLocationStatus.status as PermissionStatus,
      granted: backgroundLocationStatus.granted,
      canAskAgain: backgroundLocationStatus.canAskAgain
    }

    // Check notification permission
    const notificationStatus = await Notifications.getPermissionsAsync()
    results.notifications = {
      status: notificationStatus.status as PermissionStatus,
      granted: notificationStatus.granted,
      canAskAgain: notificationStatus.canAskAgain
    }

    // Check SMS permission (Android only)
    if (Platform.OS === 'android') {
      const hasSmsPerm = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS)
      results.sms = {
        status: hasSmsPerm ? 'granted' : 'denied',
        granted: hasSmsPerm
      }
    } else {
      results.sms = { status: 'granted', granted: true }
    }
  } catch (err) {
    console.warn('Error checking permissions:', err)
  }

  return results
}

/**
 * Request only essential permissions first (non-sensitive ones)
 * SMS will be requested only when actually needed for emergency
 */
export async function requestEssentialPermissions(): Promise<AllPermissionsStatus> {
  console.log('🔐 Requesting essential permissions (excluding SMS)...')
  
  const results: AllPermissionsStatus = {
    location: { status: 'undetermined', granted: false },
    backgroundLocation: { status: 'undetermined', granted: false },
    notifications: { status: 'undetermined', granted: false },
    sms: { status: 'undetermined', granted: false }
  }

  try {
    // Request permissions in logical order (skip SMS for now)
    
    // 1. Request notifications first (low friction)
    console.log('📱 Requesting notification permissions...')
    results.notifications = await requestNotificationPermission()
    
    // 2. Request location permission (core feature)
    console.log('📍 Requesting location permissions...')
    results.location = await requestLocationPermission()
    
    // 3. Request background location if foreground was granted
    if (results.location.granted) {
      console.log('🔄 Requesting background location permissions...')
      results.backgroundLocation = await requestBackgroundLocationPermission()
    } else {
      console.log('⚠️ Skipping background location (foreground not granted)')
      results.backgroundLocation = { status: 'denied', granted: false }
    }

    // 4. Check SMS permission status but don't request it yet
    console.log('📨 Checking SMS permission status...')
    if (Platform.OS === 'android') {
      const hasSmsPerm = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS)
      results.sms = {
        status: hasSmsPerm ? 'granted' : 'denied',
        granted: hasSmsPerm
      }
    } else {
      results.sms = { status: 'granted', granted: true }
    }

    // Log final results
    console.log('🔐 Essential permission results:', {
      location: results.location.granted,
      backgroundLocation: results.backgroundLocation.granted,
      notifications: results.notifications.granted,
      sms: results.sms.granted
    })

  } catch (error) {
    console.error('Error requesting essential permissions:', error)
  }

  return results
}

/**
 * Request SMS permission only when needed (e.g., during emergency)
 */
export async function requestSMSWhenNeeded(): Promise<PermissionResult> {
  console.log('🚨 Requesting SMS permission for emergency use...')
  return await requestSMSPermission()
}

/**
 * Legacy function for backward compatibility
 */
export async function requestAllEssentialPermissions(): Promise<AllPermissionsStatus> {
  return await requestEssentialPermissions()
}

/**
 * Check if core safety features will work
 */
export async function hasCoreSafetyPermissions(): Promise<boolean> {
  const status = await checkAllPermissions()
  return (
    status.location.granted &&
    status.notifications.granted
    // SMS is optional - app can work without it using other alert methods
  )
}

/**
 * Get a human-readable summary of permission status
 */
export function getPermissionSummary(status: AllPermissionsStatus): string {
  const granted = []
  const denied = []

  if (status.location.granted) granted.push('Location')
  else denied.push('Location')

  if (status.backgroundLocation.granted) granted.push('Background Location')
  else denied.push('Background Location')

  if (status.notifications.granted) granted.push('Notifications')
  else denied.push('Notifications')

  if (status.sms.granted) granted.push('SMS')
  else denied.push('SMS')

  return `Granted: ${granted.join(', ') || 'None'} | Denied: ${denied.join(', ') || 'None'}`
}

export default {
  requestSMSPermission,
  requestLocationPermission,
  requestBackgroundLocationPermission,
  requestNotificationPermission,
  checkAllPermissions,
  requestEssentialPermissions,
  requestAllEssentialPermissions,
  requestSMSWhenNeeded,
  hasCoreSafetyPermissions,
  getPermissionSummary
}