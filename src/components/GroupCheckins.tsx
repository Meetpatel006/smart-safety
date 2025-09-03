
import React from "react"
import { Button, Card, List, Snackbar, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function GroupCheckins() {
  const { state } = useApp()
  const [snack, setSnack] = React.useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" })

  const ping = (name: string) => setSnack({ visible: true, msg: `Sent mock buddy ping to ${name}` })

  return (
    <Card>
      <Card.Title title={`${t(state.language, "groupSafety")} / ${t(state.language, "buddySystem")}`} />
      <Card.Content>
        <List.Section>
          {state.group.map((m) => (
            <List.Item
              key={m.id}
              title={`${m.name} — last check-in ${m.lastCheckIn}`}
              description={() => (
                <Text>
                  Lat: {m.lat.toFixed(2)} Lng: {m.lng.toFixed(2)} (mock)
                </Text>
              )}
              right={() => <Button onPress={() => ping(m.name)}>Ping</Button>}
            />
          ))}
        </List.Section>
      </Card.Content>
      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, msg: "" })} duration={2000}>
        {snack.msg}
      </Snackbar>
    </Card>
  )
}
