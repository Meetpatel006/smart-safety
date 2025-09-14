import { ScrollView, View } from "react-native"
import { Appbar, Button, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import SafetyScore from "../components/SafetyScore"
import EmergencyContacts from "../components/EmergencyContacts"
import SafetyRecommendations from "../components/SafetyRecommendations"
import PanicActions from "../components/PanicActions"
import Weather from "../components/Weather"
import { useState } from "react"

export default function DashboardScreen({ navigation }: any) {
  const { state, acknowledgeHighRisk } = useApp()
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showWeather, setShowWeather] = useState(false)

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, "dashboard")} />
        {state.currentPrimary ? (
          <Appbar.Content
            title={state.currentPrimary.name}
            subtitle={state.currentPrimary.risk ? `Risk: ${state.currentPrimary.risk}` : undefined}
            style={{ alignItems: 'flex-end', marginRight: 8 }}
          />
        ) : null}
        <Appbar.Action icon="weather-cloudy" onPress={() => setShowWeather(!showWeather)} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        {showWeather && <Weather />}
        {/* Profile and language controls moved to Settings */}
        <SafetyScore />
        <PanicActions />
        <EmergencyContacts />
        <SafetyRecommendations />
        {/* <OsmMap 
          isFullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
        /> */}

        {/* <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
          <Button mode="contained" onPress={() => navigation.navigate("Authority")}>
            {t(state.language, "authorityOpen")}
          </Button>
        </View>

        <Text style={{ textAlign: "center", marginTop: 16 }}>
          Note: All data and flows are mock-only. No real APIs are called.
        </Text> */}
      </ScrollView>
    </View>
  )
}
