import { View, ScrollView } from "react-native"
import { Appbar, Card, List, Text, Switch, TextInput, Button } from "react-native-paper"
import { useApp } from "../context/AppContext"
import LanguageToggle from "../components/LanguageToggle"
import OfflineBadge from "../components/OfflineBadge"
import ProfileCard from "../components/ProfileCard"
import { t } from "../context/translations"
import { useEffect, useState } from "react"
import { getAlertState } from "../utils/alertHelpers"

export default function SettingsScreen() {
  const { state, wipeMockData, logout, acknowledgeHighRisk } = useApp()
  const [muted, setMuted] = useState(false)
  const [minutes, setMinutes] = useState<string>("15")
  useEffect(() => {
    (async () => {
      const s = await getAlertState()
      if (s?.suppressionUntil && s.suppressionUntil > Date.now()) {
        const remaining = Math.ceil((s.suppressionUntil - Date.now()) / 60000)
        setMinutes(String(Math.max(1, remaining)))
      }
      setMuted(!!s?.muted)
    })()
  }, [])
  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, "settings")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <ProfileCard />
        <Card>
          <Card.Title title="High‑risk alerts" subtitle="Acknowledge and suppress notifications" />
          <Card.Content style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text>Mute all high‑risk alerts</Text>
              <Switch value={muted} onValueChange={async (v) => {
                setMuted(v)
                const { setGlobalMute } = await import('../utils/alertHelpers')
                await setGlobalMute(v)
              }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text>Suppress for</Text>
              <TextInput
                style={{ flex: 0, minWidth: 80 }}
                mode="outlined"
                keyboardType="numeric"
                value={minutes}
                onChangeText={setMinutes}
                right={<TextInput.Affix text="min" />}
              />
              <Button mode="contained" onPress={async () => {
                const m = Math.max(1, parseInt(minutes || '0', 10) || 0)
                await acknowledgeHighRisk(m)
              }}>Acknowledge now</Button>
            </View>
            <Text style={{ color: '#555' }}>If you don’t acknowledge, alerts will escalate at 5/15/30+ minutes by default.</Text>
          </Card.Content>
        </Card>
        <Card>
          <Card.Title title={t(state.language, "dataPrivacy")} />
          <Card.Content>
            <Text>This demo uses only mock/local data. No personal data is collected or sent to any server.</Text>
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title={t(state.language, "multilingual")} />
          <Card.Content>
            <LanguageToggle />
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title={t(state.language, "offlineMode")} />
          <Card.Content>
            <OfflineBadge />
          </Card.Content>
        </Card>

        <List.Section>
          <List.Item
            title={t(state.language, "wipeData")}
            onPress={wipeMockData}
            left={(props) => <List.Icon {...props} icon="delete" />}
          />
          <List.Item
            title={t(state.language, "logout")}
            onPress={logout}
            left={(props) => <List.Icon {...props} icon="logout" />}
          />
        </List.Section>
      </ScrollView>
    </View>
  )
}
