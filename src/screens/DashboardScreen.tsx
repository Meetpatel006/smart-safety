import { ScrollView, View, StyleSheet, Image } from "react-native"
import { Appbar, Button, Text, IconButton } from "react-native-paper"
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
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Panic actions at the top (large SOS button area) */}
        <View style={styles.centerZone}>
          <PanicActions />
        </View>

        {/* Emergency contacts rendered in compact/rounded style */}
        <View style={styles.contactsZone}>
          <EmergencyContacts compact />
        </View>

        {/* Safety score centered */}
        <View style={styles.safetyScoreContainer}>
          <SafetyScore />
        </View>

        {/* Weather shown after safety score */}
        <View style={styles.weatherContainer}>
          <Weather />
        </View>

        {/* Recommendations at the end */}
        <View style={{ width: '100%' }}>
          <SafetyRecommendations />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingBottom: 110,
    gap: 12,
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    alignItems: 'center',
  },
  weatherContainer: {
    width: '100%',
    alignItems: 'center',
  },
  safetyScoreContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatar: { width: 64, height: 64, borderRadius: 8 },
  centerZone: { width: '100%', alignItems: 'center', gap: 8 },
  scoreWrap: { marginTop: 12 },
  actionsRow: { flexDirection: 'row', width: '60%', justifyContent: 'space-between', marginTop: 8 },
  iconAction: { alignItems: 'center' },
  contactsZone: { width: '100%' }
})
