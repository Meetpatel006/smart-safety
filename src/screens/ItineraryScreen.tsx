import { View, ScrollView, StyleSheet } from "react-native"
import { Appbar, Card, Avatar, Button, Text, useTheme, Divider } from "react-native-paper"
import ItineraryList from "../components/ItineraryList"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"
import { useRef } from "react"

export default function ItineraryScreen() {
  const { state } = useApp()
  const theme = useTheme()
  const itineraryListRef = useRef<{ openNew: () => void } | null>(null)

  const handleAddTrip = () => {
    if (itineraryListRef.current) {
      itineraryListRef.current.openNew()
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content
          title={t(state.language, "itinerary")}
          titleStyle={{ color: 'white' }}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Trip Management Section */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <Card.Title
              title="Trip Planning"
              titleStyle={styles.sectionTitle}
              subtitle="Manage your travel itinerary and trip details"
              subtitleStyle={styles.cardSubtitle}
              left={(props) => <Avatar.Icon {...props} icon="map-marker-path" size={40} style={{ backgroundColor: theme.colors.primary }} />}
              right={(props) => (
                <Button
                  mode="contained"
                  onPress={handleAddTrip}
                  buttonColor={theme.colors.secondary}
                  style={styles.addButton}
                >
                  {t(state.language, "addTrip")}
                </Button>
              )}
            />
            <Card.Content>
              <ItineraryList ref={itineraryListRef} />
            </Card.Content>
          </Card>
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
