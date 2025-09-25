
import React, { useEffect, useRef } from "react"
import { View, StyleSheet, Animated, Easing } from "react-native"
import { Button, Snackbar, Text, IconButton, useTheme } from "react-native-paper"
import { useApp } from "../context/AppContext"; // Ensure this import is not duplicated
import { t } from "../context/translations"
import { triggerSOS } from "../utils/api";
import { queueSOS } from "../utils/offlineQueue";
import smsService from "../services/smsService";

export default function PanicActions() {
  const { state, requestSMSPermission } = useApp()
  const theme = useTheme()
  const [snack, setSnack] = React.useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" })
  const [loading, setLoading] = React.useState<boolean>(false);
  const [sosTriggered, setSosTriggered] = React.useState<boolean>(false);

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
    if (sosTriggered) {
      return; // Prevent multiple triggers
    }

    console.log('SOS Button Pressed');
    console.log('Current State:', {
      isOffline: state.offline,
      hasToken: !!state.token,
      hasLocation: !!state.currentLocation,
      emergencyContacts: state.contacts,
      authorityPhone: state.authorityPhone,
      userPhone: state.user?.phone,
      emergencyContactPhone: state.user?.emergencyContact?.phone
    });

    setSosTriggered(true); // Set the triggered state

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

    trigger(t(state.language, "sos"));
  }

  const trigger = async (label: string) => {
    // Add detailed console logs for debugging
    console.log('\n=== SOS TRIGGER START ===');
    console.log('Label:', label);
    console.log('User:', state.user?.name);
    console.log('Location:', {
      lat: state.currentLocation?.coords.latitude,
      lng: state.currentLocation?.coords.longitude,
      address: state.currentAddress
    });

    let queuedThisPress = false
    let hasSMSPermission = state.permissions?.sms.granted || false
    let queuedSMS = false
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
      // Build recipients and queue SMS to emergency contacts when offline
      try {
        const buildRecipients = (s: any) => {
          const set = new Set<string>()
          if (s.authorityPhone) set.add(`${s.authorityPhone}`)
          const userPhone = s.user?.emergencyContact?.phone || s.user?.phone
          if (userPhone) set.add(`${userPhone}`)
          // add all app contacts as fallback
          ;(s.contacts || []).forEach((c: any) => { if (c?.phone) set.add(`${c.phone}`) })
          return Array.from(set)
        }
        const recipients = buildRecipients(state)
        if (recipients.length) {
          const body = `EMERGENCY ALERT: ${label}\n` + smsService.formatTouristInfo(state)
          await smsService.queueSms(recipients, body)
          
          // Attempt to drain queue in background
          setTimeout(async () => {
            try {
              console.log('Attempting to drain SMS queue...');
              const result = await smsService.drainSmsQueue();
              console.log('SMS queue drain result:', result);
            } catch (e) {
              console.warn('Failed to drain SMS queue:', e);
            }
          }, 1000);
        }
      } catch (e) { console.warn('PanicActions: failed to queue SMS', e) }
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
      
      // Also attempt to send SMS to emergency contacts when online
      try {
        // Send SMS first to authority, then to emergency contacts/others
        console.log('\n=== SMS PREPARATION ===');
        
        const authorityPhone = state.authorityPhone ? [`${state.authorityPhone}`] : [];
        console.log('Authority Phone:', authorityPhone);
        
        const emergencyContacts = new Set<string>();
        const userPhone = state.user?.emergencyContact?.phone || state.user?.phone;
        if (userPhone) emergencyContacts.add(`${userPhone}`);
        (state.contacts || []).forEach((c: any) => { 
          console.log('Processing contact:', c);
          if (c?.phone) emergencyContacts.add(`${c.phone}`); 
        });
        
        // Remove authority from emergency contacts if present
        if (authorityPhone.length) emergencyContacts.delete(authorityPhone[0]);

        console.log('\n=== SMS DETAILS ===');
        console.log('Final Recipients:', {
          authorityPhone,
          emergencyContacts: Array.from(emergencyContacts)
        });

        const body = `EMERGENCY ALERT: ${label}\n` + smsService.formatTouristInfo(state);
        console.log('\nMessage Content:');
        console.log(body);

        // First, check if we have SMS permission - if not, request it
        console.log('🚨 Preparing to send emergency SMS...');

        // 1. Send to authority
        if (authorityPhone.length) {
          try {
            console.log('📞 Sending SMS to authority:', authorityPhone);
            const result = await smsService.sendSms(authorityPhone, body);
            console.log('Authority SMS result:', result);
          } catch (e) {
            console.warn('Failed to send SMS to authority, will be queued:', e);
          }
        }

        // 2. Send to emergency contacts/others
        const emergencyList = Array.from(emergencyContacts);
        if (emergencyList.length) {
          try {
            console.log('👥 Sending SMS to emergency contacts:', emergencyList);
            const results = await smsService.sendSmsToMultiple(emergencyList, body);
            console.log('Emergency contacts SMS results:', results);
            
            if (results.success.length > 0) {
              console.log(`✅ Successfully sent SMS to ${results.success.length} contacts`);
            }
            if (results.queued.length > 0) {
              console.log(`📝 Queued SMS for ${results.queued.length} contacts (will retry when permission available)`);
              queuedSMS = true;
            }
            if (results.failed.length > 0) {
              console.log(`❌ Failed to send SMS to ${results.failed.length} contacts`);
            }
          } catch (e) {
            console.warn('Failed to send SMS to emergency contacts:', e);
            // Fallback to queuing all contacts
            try { 
              await smsService.queueSms(emergencyList, body);
              queuedSMS = true;
            } catch (qe) { 
              console.warn('PanicActions: failed to queue SMS to contacts', qe); 
            }
          }
        }

        // If any SMS were queued, attempt to drain the queue in background
        if (queuedSMS) {
          setTimeout(async () => {
            try {
              console.log('Attempting to drain SMS queue after failed sends...');
              const result = await smsService.drainSmsQueue();
              console.log('SMS queue drain result:', result);
            } catch (e) {
              console.warn('Failed to drain SMS queue:', e);
            }
          }, 1000);
        }
      } catch (e) { console.warn('PanicActions: SMS notify failed', e) }
      
      // Show success message after SMS handling
      const smsStatus = (hasSMSPermission && !queuedSMS) ? "SMS sent" : "SMS queued";
      setSnack({ visible: true, msg: `Alert sent: ${label} • ${smsStatus}` })
      
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
      } catch (qe) {
        setSnack({ visible: true, msg: error.message || "Failed to send or queue alert." })
        // Reset button state on complete failure
        setSosTriggered(false);
      }
    } finally {
      setLoading(false);
      // Keep button disabled (grey) only if we successfully queued or sent the SOS
      if (!queuedThisPress && !state.offline) {
        setSosTriggered(false);
      }
    }
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
            buttonColor={sosTriggered ? "#808080" : "#D11A2A"}
            onPress={handleSOSPress}
            disabled={loading || sosTriggered}
            style={[
              styles.sosButton,
              sosTriggered && { opacity: 0.8 }
            ]}
            labelStyle={[
              styles.sosLabel,
              sosTriggered && { color: '#FFFFFF' }
            ]}
            accessibilityLabel="SOS Button"
            accessibilityHint="Triggers emergency SOS alert"
          >
            {sosTriggered ? "SOS SENT" : "SOS"}
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
