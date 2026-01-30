import { ScrollView, View, StyleSheet, Alert } from "react-native"
import { Text, Avatar } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as Location from 'expo-location'
import { useApp } from "../../../context/AppContext"
import { useLocation } from "../../../context/LocationContext"
import { reverseGeocode } from '../../map/components/MapboxMap/geoUtils'
import SafetyScore from "../components/SafetyScore"
import PanicActions from "../../emergency/components/PanicActions"
import Weather from "../components/Weather"
import { useEffect, useState } from "react"
import { getGroupDashboard } from "../../../utils/api"
import GroupStatusCard from "../../trip/components/GroupStatusCard"

export default function DashboardScreen({ navigation }: any) {
  const { state } = useApp()
  const { currentAddress, setCurrentLocation, setCurrentAddress } = useLocation()
  const [groupData, setGroupData] = useState<any>(null)

  const isTourAdmin = state.user?.role === 'tour-admin'

  useEffect(() => {
    const fetchGroupData = async () => {
      if (state.user && state.user.role !== 'solo' && state.token) {
        try {
          const data = await getGroupDashboard(state.token)
          if (data && data.group) {
              setGroupData(data.group);
          } else if (data && data.groupName) {
              setGroupData(data);
          } else if (data && data.data) {
              setGroupData(data.data);
          }
        } catch (e) {
          console.log("Failed to fetch group dashboard", e)
        }
      }
    }
    
    fetchGroupData()
  }, [state.user, state.token])

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          console.log('Location permission denied')
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        setCurrentLocation(location)

        const address = await reverseGeocode(
          location.coords.latitude,
          location.coords.longitude
        )
        if (address) {
          setCurrentAddress(address)
        }
      } catch (err: any) {
        console.error('Dashboard location error:', err)
      }
    }

    fetchLocation()
  }, [])

  const handleEditItinerary = () => {
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getUserName = () => {
    if (state.user?.name) {
      return state.user.name.split(' ')[0]
    }
    return "Explorer"
  }

  const getUserInitials = () => {
    if (state.user?.name) {
      const names = state.user.name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    return "E"
  }

  const getAvatarColor = () => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
    const name = state.user?.name || 'Explorer'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar.Text 
            size={48} 
            label={getUserInitials()} 
            style={[styles.avatar, { backgroundColor: getAvatarColor() }]}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.headerContent}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{getUserName()}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#EF4444" />
              <Text style={styles.location} numberOfLines={1}>
                {getLocationDisplay()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sosSection}>
          <PanicActions />
        </View>

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

        <View style={styles.section}>
          <SafetyScore />
        </View>

        <View style={styles.section}>
          <Weather />
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
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  avatar: {
    marginRight: 14,
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  sosSection: {
    alignItems: 'center',
  },
  section: {
    width: '100%',
  },
})
