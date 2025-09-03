import { ScrollView, View } from "react-native"
import { Appbar, Button, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import LanguageToggle from "../components/LanguageToggle"
import OfflineBadge from "../components/OfflineBadge"
import ProfileCard from "../components/ProfileCard"
import SafetyScore from "../components/SafetyScore"
import EmergencyContacts from "../components/EmergencyContacts"
import ItineraryList from "../components/ItineraryList"
import SafetyRecommendations from "../components/SafetyRecommendations"
import MockMap from "../components/MockMap"
import PanicActions from "../components/PanicActions"
import GeoFenceList from "../components/GeoFenceList"
import GroupCheckins from "../components/GroupCheckins"

export default function DashboardScreen({ navigation }: any) {
  const { state } = useApp()

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, "dashboard")} />
        <LanguageToggle />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <OfflineBadge />
        <ProfileCard />
        <SafetyScore />
        <EmergencyContacts />
        <ItineraryList />
        <SafetyRecommendations />
        <MockMap />
        <PanicActions />
        <GeoFenceList />
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
