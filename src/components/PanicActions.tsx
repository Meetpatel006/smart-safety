
import React, { useEffect, useRef } from "react"
import { View, StyleSheet, Animated, Easing } from "react-native"
import { Button, Snackbar, Text, IconButton, useTheme } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import { triggerSOS } from "../utils/api";
import { queueSOS } from "../utils/offlineQueue";
import { sendSMS } from "../utils/sms";
import { queueSMS } from "../utils/smsQueue";

export default function PanicActions() {
  const { state } = useApp()
  const theme = useTheme()
  const [snack, setSnack] = React.useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" })
  const [loading, setLoading] = React.useState<boolean>(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowOpacityAnim = useRef(new Animated.Value(0)).current
  const glowScaleAnim = useRef(new Animated.Value(1)).current
  const containerOpacityAnim = useRef(new Animated.Value(0)).current
  const textOpacityAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Container fade in animation on mount
    Animated.timing(containerOpacityAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // opacity cannot use native driver
    }).start()

    // Text fade in animation on mount
    Animated.timing(textOpacityAnim, {
      toValue: 1,
      duration: 1000,
      delay: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // opacity cannot use native driver
    }).start()

    // Scale up animation on mount
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start()

    // Continuous pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    )

    // Continuous glow animation - separate opacity and scale
    const glowOpacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacityAnim, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false, // opacity can't use native driver
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: 0.1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    )

    const glowScaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScaleAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowScaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    )

    pulseAnimation.start()
    glowOpacityAnimation.start()
    glowScaleAnimation.start()

    return () => {
      pulseAnimation.stop()
      glowOpacityAnimation.stop()
      glowScaleAnimation.stop()
    }
  }, [])

  const handleSOSPress = () => {
    // Add press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start()

    trigger(t(state.language, "sos"))
  }

  const trigger = async (label: string) => {
    let queuedThisPress = false
    if (state.offline) {
      // create sos payload and queue it
      const sosData = {
        location: {
          coordinates: [state.currentLocation?.coords.longitude || 0, state.currentLocation?.coords.latitude || 0],
          locationName: state.currentAddress || 'Current Location'
        },
        safetyScore: state.user?.safetyScore || 100,
        sosReason: {
          reason: label,
          weatherInfo: 'N/A',
          extra: 'queued-offline'
        }
      };
      try {
        const en = await queueSOS({ token: state.token, sosData })
        try { console.log('PanicActions: queued SOS while offline', { label, queuedId: en?.id }) } catch (e) { }
        setSnack({ visible: true, msg: "Offline: queued alert " + label })
        queuedThisPress = true
      } catch (e) {
        setSnack({ visible: true, msg: "Failed to queue alert locally." })
      }
      // Also queue SMS so contacts/authority can be notified when connectivity restored
      try {
  const recipients = [state.authorityPhone, ...state.contacts.map(c => c.phone)].filter(Boolean)
        if (recipients.length) {
          await queueSMS({ payload: { recipients, message: buildSmsMessage(label) } })
        }
      } catch (e) { console.warn('Failed to queue SMS while offline', e) }
      return;
    }
    if (!state.token) {
      setSnack({ visible: true, msg: "You must be logged in to trigger an alert." });
      return;
    }

    // Check if we have a current location from context
    if (!state.currentLocation) {
      setSnack({ visible: true, msg: "Location not available. Please ensure location services are enabled and try again." });
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
        sosReason: {
          reason: label,
          weatherInfo: 'N/A',
          extra: 'N/A'
        }
      };

      await triggerSOS(state.token, sosData);
      // Try to send SMS notifications (best-effort)
      try {
  const recipients = [state.authorityPhone, ...state.contacts.map(c => c.phone)].filter(Boolean)
        if (recipients.length) {
          const smsRes = await sendSMS({ recipients, message: buildSmsMessage(label) })
          if (!smsRes.ok) {
            // queue SMS for retry
            try { await queueSMS({ payload: { recipients, message: buildSmsMessage(label) } }) } catch (e) { console.warn('queueSMS failed after sendSMS not available', e) }
          }
        }
      } catch (e) {
        console.warn('sendSMS failed after SOS', e)
      }
      setSnack({ visible: true, msg: "Sent alert: " + label })
    } catch (error: any) {
      // On network or server failure, queue for retry (but avoid double-queueing during same press)
      try {
        if (!queuedThisPress) {
          const en = await queueSOS({ token: state.token, sosData: { location: { coordinates: [state.currentLocation?.coords.longitude || 0, state.currentLocation?.coords.latitude || 0], locationName: state.currentAddress || 'Current Location' }, safetyScore: state.user?.safetyScore || 100, sosReason: { reason: label, weatherInfo: 'N/A', extra: 'retry-on-fail' } } })
          try { console.log('PanicActions: send failed, queued for retry', { label, queuedId: en?.id }) } catch (e) { }
        } else {
          try { console.log('PanicActions: already queued during this press, skipping duplicate queue') } catch (e) { }
        }
        setSnack({ visible: true, msg: "Network issue: alert queued for retry" })
          // queue SMS if send failed
          try {
            const recipients = [state.authorityPhone, ...state.contacts.map(c => c.phone)].filter(Boolean)
            if (recipients.length) await queueSMS({ payload: { recipients, message: buildSmsMessage(label) } })
          } catch (e) { console.warn('Failed to queue SMS after send error', e) }
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
    // Prefer the dashboard-computed safety score if available, otherwise fall back to profile score
    const score = (typeof state.computedSafetyScore === 'number') ? state.computedSafetyScore : (typeof state.user?.safetyScore === 'number' ? state.user!.safetyScore : null)
    const mapLink = coords ? `https://maps.google.com/?q=${coords}` : null

    // Build message lines conditionally to avoid sending 'Unknown'/'N/A' placeholders
    const parts = [] as string[]
    parts.push(`SOS Alert: ${label}`)
    parts.push(`Name: ${name}`)
    if (phone) parts.push(`Phone: ${phone}`)

    // Always include a Location line: prefer human-readable address, otherwise fallback to coords
      // Always include a Location line: prefer human-readable address, otherwise fallback to coords.
      // When an address is present, include the map link inline (no separate Map/Coords lines).
      if (addr) {
        const inline = mapLink ? `${addr} — Map: ${mapLink}` : addr
        parts.push(`Location: ${inline}`)
      } else if (coords) {
        const inline = mapLink ? `${coords} — Map: ${mapLink}` : coords
        parts.push(`Location: ${inline}`)
      } else {
        parts.push(`Location: unavailable`)
      }
    
      // map/link already included inline when address/coords exist; no separate Map line needed
    
    if (score !== null && score !== undefined) parts.push(`SafetyScore: ${score}`)
    return parts.join('\n')
  }

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacityAnim }]}>
      <Animated.Text style={[styles.helpText, { transform: [{ scale: scaleAnim }] }]}>
        Help is just a click away!
      </Animated.Text>
      
      <View style={styles.sosWrapper}>
        <View style={styles.sosCenter}>
          {/* Animated glow background (centered behind SOS) */}
          <Animated.View
            style={[
              styles.glowBackground,
              {
                opacity: glowOpacityAnim,
                top: -25,
                left: -25,
                transform: [{ scale: glowScaleAnim }]
              }
            ]}
          />

          <Animated.View
            style={[
              styles.sosButtonContainer,
              {
                transform: [{ scale: Animated.multiply(pulseAnim, scaleAnim) }]
              }
            ]}
          >
          <Button
            mode="contained"
            buttonColor="#D11A2A"
            onPress={handleSOSPress}
            disabled={loading}
            style={styles.sosButton}
            labelStyle={styles.sosLabel}
            accessibilityLabel="SOS Button"
            accessibilityHint="Triggers emergency SOS alert"
          >
            SOS
          </Button>
        </Animated.View>
  </View>
  </View>

  <Animated.Text style={[styles.instructionText, { opacity: textOpacityAnim }]}>
        Click <Text style={styles.sosTextHighlight}>SOS button</Text> to call the help.
      </Animated.Text>

      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, msg: "" })} duration={2000}>
        {snack.msg}
      </Snackbar>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  sosWrapper: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    position: 'relative',
    minHeight: 320,
    justifyContent: 'center',
  },
  glowBackground: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#D11A2A',
    opacity: 0.2,
    zIndex: 0,
  },
  sosButtonContainer: {
    // Create the layered shadow effect similar to the image
    shadowColor: '#D11A2A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 1,
  },
  sosCenter: {
    width: 200,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#D11A2A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosLabel: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#555',
    marginTop: 8,
  },
  sosTextHighlight: {
    fontWeight: '700',
    color: '#D11A2A',
  },
})
