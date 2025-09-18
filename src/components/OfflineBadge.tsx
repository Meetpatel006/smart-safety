import { View } from "react-native"
import { Text, Switch } from "react-native"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function OfflineBadge() {
  const { state, setOffline } = useApp()
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Switch value={state.offline} onValueChange={setOffline} />
        <Text style={{ fontSize: 16, fontWeight: '500' }}>{t(state.language, "offlineMode")}</Text>
      </View>
      {state.offline && <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{t(state.language, "offlineInfo")}</Text>}
    </View>
  )
}
