import { View, StyleSheet, TouchableOpacity, StatusBar } from "react-native"
import { Text, useTheme, FAB } from "react-native-paper"
import ItineraryList from "../components/ItineraryList"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"
import { useRef, useState } from "react"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

export type FilterType = "all" | "upcoming" | "completed"

export default function ItineraryScreen() {
  const { state } = useApp()
  const theme = useTheme()
  const itineraryListRef = useRef<{ openNew: () => void } | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const handleAddTrip = () => {
    if (itineraryListRef.current) {
      itineraryListRef.current.openNew()
    }
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Gradient Header */}
      <LinearGradient
        colors={["#1E3A8A", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </View>
          <Text style={styles.headerTitle}>My Trips</Text>
          <View style={styles.headerRight}>
            <MaterialCommunityIcons name="magnify" size={24} color="white" />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Trip List */}
      <View style={styles.listContainer}>
        <ItineraryList ref={itineraryListRef} filter={activeFilter} />
      </View>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        color="white"
        onPress={handleAddTrip}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: "white",
  },
  filterText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#1E3A8A",
  },
  listContainer: {
    flex: 1,
    paddingTop: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 110,
    borderRadius: 16,
  },
})
