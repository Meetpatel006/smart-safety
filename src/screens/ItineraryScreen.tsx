import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import ItineraryList from "../components/ItineraryList"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"
import { useRef } from "react"

export default function ItineraryScreen() {
  const { state } = useApp()
  const itineraryListRef = useRef<{ openNew: () => void } | null>(null)

  const handleAddTrip = () => {
    if (itineraryListRef.current) {
      itineraryListRef.current.openNew()
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={{ backgroundColor: '#0077CC', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{t(state.language, "itinerary")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Trip Management Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#0077CC', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: 'white', fontSize: 20 }}>🗺️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Trip Planning</Text>
                <Text style={styles.cardSubtitle}>Manage your travel itinerary and trip details</Text>
              </View>
              <TouchableOpacity
                onPress={handleAddTrip}
                style={[styles.addButton, { backgroundColor: '#FF7A00', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }]}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{t(state.language, "addTrip")}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <ItineraryList ref={itineraryListRef} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    marginRight: 8,
  },
})
