import { View, ScrollView } from "react-native"
import { Appbar } from "react-native-paper"
import PanicActions from "../components/PanicActions"

import OsmMap from "../components/OsmMap"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function EmergencyScreen() {
  const { state } = useApp()
  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, "emergencySystem")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <PanicActions />
        <OsmMap />
      </ScrollView>
    </View>
  )
}
