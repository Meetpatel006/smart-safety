import { ScrollView, View } from "react-native"
import { Appbar, Button, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import SafetyScore from "../components/SafetyScore"
import EmergencyContacts from "../components/EmergencyContacts"
import ItineraryList from "../components/ItineraryList"
import SafetyRecommendations from "../components/SafetyRecommendations"
import OsmMap from "../components/OsmMap"
import PanicActions from "../components/PanicActions"
import GroupCheckins from "../components/GroupCheckins"

export default function DashboardScreen({ navigation }: any) {
  const { state } = useApp()

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, "dashboard")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        {/* Profile and language controls moved to Settings */}
        <SafetyScore />
        <EmergencyContacts />
        <ItineraryList />
        <SafetyRecommendations />
        <OsmMap />
        <PanicActions />
        <GroupCheckins />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Button mode="contained" onPress={() => navigation.navigate("Authority")}>
            {t(state.language, "authorityOpen")}
          </Button>
        </View>

        <Text style={{ textAlign: "center", marginTop: 16 }}>
          Note: All data and flows are mock-only. No real APIs are called.
        </Text>
      </ScrollView>
    </View>
  )
}
