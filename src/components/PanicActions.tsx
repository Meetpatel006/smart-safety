
import React from "react"
import { View } from "react-native"
import { Button, Card, Snackbar } from "react-native-paper"
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
          locationName: 'Current Location'
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
    <Card>
      <Card.Title title={t(state.language, "emergencySystem")} />
      <Card.Content>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button mode="contained-tonal" onPress={() => trigger(t(state.language, "help"))} disabled={loading}>
            {t(state.language, "help")}
          </Button>
          <Button mode="contained" onPress={() => trigger(t(state.language, "urgentHelp"))} disabled={loading}>
            {t(state.language, "urgentHelp")}
          </Button>
          <Button mode="contained" buttonColor="#D11A2A" onPress={() => trigger(t(state.language, "sos"))} disabled={loading}>
            {t(state.language, "sos")}
          </Button>
          <Button mode="outlined" onPress={() => trigger(t(state.language, "fakeCall"))} disabled={loading}>
            {t(state.language, "fakeCall")}
          </Button>
          <Button mode="outlined" onPress={() => trigger(t(state.language, "silentAlert"))} disabled={loading}>
            {t(state.language, "silentAlert")}
          </Button>
        </View>
      </Card.Content>
      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, msg: "" })} duration={2000}>
        {snack.msg}
      </Snackbar>
    </Card>
  )
}
