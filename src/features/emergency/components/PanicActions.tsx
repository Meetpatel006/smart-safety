
import React, { useEffect, useRef } from "react"
import { View, StyleSheet, Animated, Easing, Pressable } from "react-native"
import { Snackbar, Text } from "react-native-paper"
import { useApp } from "../../../context/AppContext"
import { t } from "../../../context/translations"
import { triggerSOS } from "../../../utils/api";
import { queueSOS } from "../../../utils/offlineQueue";
import { sendSMS } from "../../../utils/sms";
import { queueSMS } from "../../../utils/smsQueue";

interface PanicActionsProps {
  onSOSTriggered?: () => void;
}

export default function PanicActions({ onSOSTriggered }: PanicActionsProps = {}) {
  const { state } = useApp()
  const [snack, setSnack] = React.useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" })
  const [loading, setLoading] = React.useState<boolean>(false);

  const scaleAnim = useRef(new Animated.Value(0.9)).current

  // Pulse ring animations
  const pulse1 = useRef(new Animated.Value(0)).current
  const pulse2 = useRef(new Animated.Value(0)).current
  const pulse3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start()

    // Create staggered pulse animations
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    }

    const p1 = createPulse(pulse1, 0)
    const p2 = createPulse(pulse2, 666)
    const p3 = createPulse(pulse3, 1333)

    p1.start()
    p2.start()
    p3.start()

    return () => {
      p1.stop()
      p2.stop()
      p3.stop()
    }
  }, [])

  const handleSOSPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    trigger(t(state.language, "sos"))
  }

  const trigger = async (label: string) => {
    let queuedThisPress = false
    const currentToken = state.token

    if (!currentToken) {
      setSnack({ visible: true, msg: "You must be logged in to trigger an alert." });
      return;
    }

    if (state.offline) {
      const sosData = {
        location: {
          coordinates: [state.currentLocation?.coords.longitude || 0, state.currentLocation?.coords.latitude || 0],
          locationName: state.currentAddress || 'Current Location'
        },
        safetyScore: state.user?.safetyScore || 100,
        sosReason: { reason: label, weatherInfo: 'N/A', extra: 'queued-offline' }
      };
      try {
        await queueSOS({ token: currentToken, sosData })
        setSnack({ visible: true, msg: "Offline: queued alert " + label })
        queuedThisPress = true
      } catch (e) {
        setSnack({ visible: true, msg: "Failed to queue alert locally." })
      }
      try {
        const recipients = [state.authorityPhone, ...state.contacts.map(c => c.phone)].filter(Boolean)
        if (recipients.length) await queueSMS({ payload: { recipients, message: buildSmsMessage(label) } })
      } catch (e) { }
      return;
    }
    if (!state.currentLocation) {
      setSnack({ visible: true, msg: "Location not available." });
      return;
    }

    setLoading(true);
    try {
      const sosData = {
        location: {
          coordinates: [state.currentLocation.coords.longitude, state.currentLocation.coords.latitude],
          locationName: state.currentAddress || 'Current Location'
        },
        safetyScore: state.user?.safetyScore || 100,
        sosReason: { reason: label, weatherInfo: 'N/A', extra: 'N/A' }
      };
      await triggerSOS(currentToken, sosData);
      try {
        const recipients = [state.authorityPhone, ...state.contacts.map(c => c.phone)].filter(Boolean)
        if (recipients.length) {
          const smsRes = await sendSMS({ recipients, message: buildSmsMessage(label) })
          if (!smsRes.ok) await queueSMS({ payload: { recipients, message: buildSmsMessage(label) } })
        }
      } catch (e) { }
      setSnack({ visible: true, msg: "Sent alert: " + label })
      
      // Trigger callback if provided
      if (onSOSTriggered) {
        onSOSTriggered();
      }
    } catch (error: any) {
      try {
        if (!queuedThisPress) {
          await queueSOS({ token: currentToken, sosData: { location: { coordinates: [state.currentLocation?.coords.longitude || 0, state.currentLocation?.coords.latitude || 0], locationName: state.currentAddress || 'Current Location' }, safetyScore: state.user?.safetyScore || 100, sosReason: { reason: label, weatherInfo: 'N/A', extra: 'retry-on-fail' } } })
        }
        setSnack({ visible: true, msg: "Network issue: alert queued for retry" })
      } catch (qe) {
        setSnack({ visible: true, msg: error.message || "Failed to send or queue alert." })
      }
    } finally {
      setLoading(false);
    }
  }

  const buildSmsMessage = (label: string) => {
    const loc = state.currentLocation
    const coords = loc && loc.coords ? `${loc.coords.latitude.toFixed(6)},${loc.coords.longitude.toFixed(6)}` : null
    const name = state.user?.name || 'Unknown Tourist'
    const phone = state.user?.phone || ''
    const addr = state.currentAddress || ''
    const score = (typeof state.computedSafetyScore === 'number') ? state.computedSafetyScore : (typeof state.user?.safetyScore === 'number' ? state.user!.safetyScore : null)
    const mapLink = coords ? `https://maps.google.com/?q=${coords}` : null

    const parts = [] as string[]
    parts.push(`SOS Alert: ${label}`)
    parts.push(`Name: ${name}`)
    if (phone) parts.push(`Phone: ${phone}`)
    if (addr) {
      parts.push(`Location: ${addr}${mapLink ? ` — Map: ${mapLink}` : ''}`)
    } else if (coords) {
      parts.push(`Location: ${coords}${mapLink ? ` — Map: ${mapLink}` : ''}`)
    } else {
      parts.push(`Location: unavailable`)
    }
    if (score !== null && score !== undefined) parts.push(`SafetyScore: ${score}`)
    return parts.join('\n')
  }

  // Pulse interpolations - more diffused/blurred effect
  const createPulseStyle = (anim: Animated.Value) => ({
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.6],
      })
    }],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.35, 0.15, 0],
    }),
  })

  return (
    <View style={styles.container}>
      <View style={styles.sosWrapper}>
        {/* Animated pulse rings */}
        <Animated.View style={[styles.pulseRing, createPulseStyle(pulse1)]} />
        <Animated.View style={[styles.pulseRing, createPulseStyle(pulse2)]} />
        <Animated.View style={[styles.pulseRing, createPulseStyle(pulse3)]} />

        {/* Main SOS Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Pressable
            onPress={handleSOSPress}
            disabled={loading}
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.sosButtonPressed,
            ]}
          >
            <Text style={styles.sosText}>SOS</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Text style={styles.instructionText}>Hold for 3 seconds</Text>

      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, msg: "" })} duration={2000}>
        {snack.msg}
      </Snackbar>
    </View>
  )
}

const BUTTON_SIZE = 200

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  sosWrapper: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#DC2626',
  },
  buttonContainer: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 25,
  },
  sosButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonPressed: {
    backgroundColor: '#B91C1C',
  },
  sosText: {
    fontSize: 56,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 6,
  },
  instructionText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
})
