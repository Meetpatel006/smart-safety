
import React from "react"
import { View, StyleSheet } from "react-native"
import { Button, Snackbar, Text, IconButton, useTheme } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import { triggerSOS } from "../utils/api";

export default function PanicActions() {
  const { state } = useApp()
  const theme = useTheme()
  const [snack, setSnack] = React.useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" })
  const [loading, setLoading] = React.useState<boolean>(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>{t(state.language, "emergencySystem")}</Text>

      <View style={styles.sosWrapper}>
        <Button
          mode="contained"
          buttonColor="#D11A2A"
          onPress={() => trigger(t(state.language, "sos"))}
          disabled={loading}
          style={styles.sosButton}
          labelStyle={styles.sosLabel}
          accessibilityLabel="SOS Button"
          accessibilityHint="Triggers emergency SOS alert"
        >
          {t(state.language, "sos")}
        </Button>

        <View style={styles.actionRow}>
          <Button
            mode="contained"
            icon="phone"
            onPress={() => trigger("Code Call")}
            buttonColor={theme.colors.primary}
            style={styles.actionButton}
            accessibilityLabel="Code Call"
            accessibilityHint="Place a code call to your emergency contacts"
            disabled={loading}
          >
            Code Call
          </Button>

          <Button
            mode="contained-tonal"
            icon="map-marker"
            onPress={async () => {
              // For now reuse trigger to send location-only SOS or perform location share
              await trigger(t(state.language, "location"))
            }}
            style={styles.actionButton}
            accessibilityLabel="Location"
            accessibilityHint="Share your current location"
            disabled={loading}
          >
            Location
          </Button>
        </View>
      </View>

      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, msg: "" })} duration={2000}>
        {snack.msg}
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sosWrapper: {
    alignItems: 'center',
    width: '100%'
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 180,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  sosLabel: {
    fontSize: 22,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
  }
})
