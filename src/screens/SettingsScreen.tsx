import { View, ScrollView } from "react-native"
import { Appbar, List, Text, Switch, TextInput, Button } from "react-native-paper"
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
        <View style={{ backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>High‑risk alerts</Text>
          <Text style={{ color: '#666', marginBottom: 16 }}>Acknowledge and suppress notifications</Text>
          <View style={{ gap: 12 }}>
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
          </View>
        </View>
        <View style={{ backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{t(state.language, "dataPrivacy")}</Text>
          <Text>This demo uses only mock/local data. No personal data is collected or sent to any server.</Text>
        </View>

        <View style={{ backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{t(state.language, "multilingual")}</Text>
          <LanguageToggle />
        </View>

        <View style={{ backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{t(state.language, "offlineMode")}</Text>
          <OfflineBadge />
        </View>

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
