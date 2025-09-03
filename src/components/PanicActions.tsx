
import React from "react"
import { View } from "react-native"
import { Button, Card, Snackbar } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function PanicActions() {
  const { state } = useApp()
  const [snack, setSnack] = React.useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" })

  const trigger = (label: string) => {
    if (state.offline) {
      setSnack({ visible: true, msg: "Offline: queued mock alert " + label })
    } else {
      setSnack({ visible: true, msg: "Sent mock alert: " + label })
    }
  }

  return (
    <Card>
      <Card.Title title={t(state.language, "emergencySystem")} />
      <Card.Content>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button mode="contained-tonal" onPress={() => trigger(t(state.language, "help"))}>
            {t(state.language, "help")}
          </Button>
          <Button mode="contained" onPress={() => trigger(t(state.language, "urgentHelp"))}>
            {t(state.language, "urgentHelp")}
          </Button>
          <Button mode="contained" buttonColor="#D11A2A" onPress={() => trigger(t(state.language, "sos"))}>
            {t(state.language, "sos")}
          </Button>
          <Button mode="outlined" onPress={() => trigger(t(state.language, "fakeCall"))}>
            {t(state.language, "fakeCall")}
          </Button>
          <Button mode="outlined" onPress={() => trigger(t(state.language, "silentAlert"))}>
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
