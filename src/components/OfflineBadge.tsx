import { View } from "react-native"
import { HelperText, Switch, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function OfflineBadge() {
  const { state, setOffline } = useApp()
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Switch value={state.offline} onValueChange={setOffline} />
        <Text variant="labelLarge">{t(state.language, "offlineMode")}</Text>
      </View>
      {state.offline && <HelperText type="info">{t(state.language, "offlineInfo")}</HelperText>}
    </View>
  )
}
