import { View, ScrollView } from "react-native"
import { Appbar } from "react-native-paper"
import ItineraryList from "../components/ItineraryList"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"

export default function ItineraryScreen() {
  const { state } = useApp()
  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, "itinerary")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <ItineraryList />
      </ScrollView>
    </View>
  )
}
