
import React, { useEffect, useRef } from "react"
import { View, StyleSheet, Animated, Easing, Text, TouchableOpacity } from "react-native"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import { triggerSOS } from "../utils/api";

export default function PanicActions() {
  const { state } = useApp()
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
    if (state.offline) {
      setSnack({ visible: true, msg: "Offline: queued mock alert " + label })
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
      setSnack({ visible: true, msg: "Sent alert: " + label })
    } catch (error: any) {
      setSnack({ visible: true, msg: error.message || "Failed to send alert." });
    } finally {
      setLoading(false);
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
          <TouchableOpacity
            onPress={handleSOSPress}
            disabled={loading}
            style={styles.sosButton}
            accessibilityLabel="SOS Button"
            accessibilityHint="Triggers emergency SOS alert"
          >
            <Text style={styles.sosLabel}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>
  </View>
  </View>

  <Animated.Text style={[styles.instructionText, { opacity: textOpacityAnim }]}>
        Click <Text style={styles.sosTextHighlight}>SOS button</Text> to call the help.
      </Animated.Text>

      {snack.visible && (
        <View style={{ position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#333', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>{snack.msg}</Text>
        </View>
      )}
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
    backgroundColor: '#D11A2A',
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
