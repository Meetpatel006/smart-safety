
import React from "react"
import { View } from "react-native"
import { Button, Snackbar, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import { triggerSOS } from "../utils/api";

export default function PanicActions() {
  const { state } = useApp()
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
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>{t(state.language, "emergencySystem")}</Text>
      
      {/* SOS Button - Made larger and more prominent */}
      <View style={{ marginBottom: 16, alignItems: 'center' }}>
        <Button 
          mode="contained" 
          buttonColor="#D11A2A" 
          onPress={() => trigger(t(state.language, "sos"))} 
          disabled={loading}
          style={{ 
            width: 100, 
            height: 100, 
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 100,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          {t(state.language, "sos")}
        </Button>
      </View>
      
      {/* Other action buttons */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button mode="contained-tonal" onPress={() => trigger(t(state.language, "help"))} disabled={loading}>
          {t(state.language, "help")}
        </Button>
        <Button mode="contained" onPress={() => trigger(t(state.language, "urgentHelp"))} disabled={loading}>
          {t(state.language, "urgentHelp")}
        </Button>
        <Button mode="outlined" onPress={() => trigger(t(state.language, "fakeCall"))} disabled={loading}>
          {t(state.language, "fakeCall")}
        </Button>
        <Button mode="outlined" onPress={() => trigger(t(state.language, "silentAlert"))} disabled={loading}>
          {t(state.language, "silentAlert")}
        </Button>
      </View>
      
      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, msg: "" })} duration={2000}>
        {snack.msg}
      </Snackbar>
    </View>
  )
}
