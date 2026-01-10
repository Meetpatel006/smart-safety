import { View, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from "react-native"
import { Text, useTheme, FAB } from "react-native-paper"
import ItineraryList from "../components/ItineraryList"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"
import { useRef, useState } from "react"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"

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

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "view-grid" },
    { key: "upcoming", label: "Upcoming", icon: "clock-outline" },
    { key: "completed", label: "Completed", icon: "check-circle-outline" },
  ]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Section */}
      <View style={styles.headerSection}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.greeting}>Your Adventures</Text>
            <Text style={styles.pageTitle}>My Trips</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <MaterialCommunityIcons name="magnify" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[
                styles.filterPill,
                activeFilter === filter.key && styles.filterPillActive,
              ]}
            >
              <MaterialCommunityIcons
                name={filter.icon as any}
                size={16}
                color={activeFilter === filter.key ? "#FFFFFF" : "#64748B"}
              />
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
      </View>

      {/* Trip List */}
      <View style={styles.listContainer}>
        <ItineraryList ref={itineraryListRef} filter={activeFilter} />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTrip}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerSection: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  filterPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 110,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
})
