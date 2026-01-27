import { ScrollView, View, StyleSheet } from "react-native"
import { Text, IconButton } from "react-native-paper"
import { useApp } from "../../../context/AppContext"
import { useLocation } from "../../../context/LocationContext"
import SafetyScore from "../components/SafetyScore"
import SafetyRecommendations from "../../emergency/components/SafetyRecommendations"
import PanicActions from "../../emergency/components/PanicActions"
import Weather from "../components/Weather"
import EmergencyServicesCard from "../../emergency/components/EmergencyServicesCard"
import { useEffect, useState } from "react"
import { getGroupDashboard } from "../../../utils/api"
import GroupStatusCard from "../../trip/components/GroupStatusCard"

export default function DashboardScreen({ navigation }: any) {
  const { state } = useApp()
  const { currentAddress } = useLocation()
  const [groupData, setGroupData] = useState<any>(null)

  const isTourAdmin = state.user?.role === 'tour-admin'

  useEffect(() => {
    const fetchGroupData = async () => {
      if (state.user && state.user.role !== 'solo' && state.token) {
        try {
          const data = await getGroupDashboard(state.token)
          // The API might return { group: {...}, itinerary: ... } or just the group object
          // Let's assume the response structure matches what we need
          if (data && data.group) {
              setGroupData(data.group);
          } else if (data && data.groupName) {
              // Direct group object
              setGroupData(data);
          } else if (data && data.data) {
              // Response wrapped in data
              setGroupData(data.data);
          }
        } catch (e) {
          console.log("Failed to fetch group dashboard", e)
        }
      }
    }
    
    fetchGroupData()
  }, [state.user, state.token])

  const handleEditItinerary = () => {
    // Calculate trip duration from group data
    if (groupData) {
      const startDate = groupData.startDate || new Date().toISOString()
      const endDate = groupData.endDate || new Date().toISOString()
      const start = new Date(startDate)
      const end = new Date(endDate)
      const tripDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 7

      navigation.navigate('BuildItinerary', {
        tripDuration,
        startDate,
        returnDate: endDate,
        touristId: state.user?.touristId || 'unknown',
      })
    }
  }

  // Extract city/region from address or use default
  const getLocationDisplay = () => {
    if (currentAddress) {
      const parts = currentAddress.split(',')
      if (parts.length >= 2) {
        return parts.slice(-2).map(s => s.trim()).join(', ')
      }
      return currentAddress
    }
    return "Getting location..."
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back, Explorer!</Text>
            <Text style={styles.location}>{getLocationDisplay()}</Text>
          </View>
          <IconButton
            icon="bell-outline"
            iconColor="#1F2937"
            size={24}
            onPress={() => navigation.navigate('Settings')}
            style={styles.notificationBtn}
          />
        </View>

        {/* SOS Button Section */}
        <View style={styles.sosSection}>
          <PanicActions />
        </View>

        {/* Group Status Card (Only if groupData exists) */}
        {groupData && (
          <View style={styles.section}>
            <GroupStatusCard 
              groupName={groupData.groupName || groupData.name || "My Group"} 
              accessCode={groupData.accessCode || "Unknown"}
              memberCount={groupData.members ? groupData.members.length : 1}
              isTourAdmin={isTourAdmin}
              onEditItinerary={handleEditItinerary}
            />
          </View>
        )}

        {/* Safety Score Card */}
        <View style={styles.section}>
          <SafetyScore />
        </View>

        {/* Emergency Services */}
        <View style={styles.section}>
          <EmergencyServicesCard />
        </View>

        {/* Weather Info */}
        <View style={styles.section}>
          <Weather />
        </View>

        {/* Safety Recommendations */}
        <View style={styles.section}>
          <SafetyRecommendations />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 110,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  notificationBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sosSection: {
    alignItems: 'center',
  },
  section: {
    width: '100%',
  },
})
