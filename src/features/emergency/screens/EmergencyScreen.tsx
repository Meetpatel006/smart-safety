import React, { useEffect, useState } from 'react'
import IncidentReportModal from '../../report/components/IncidentReportModal'
import { View, StyleSheet, Dimensions, Alert, StatusBar, Text, Platform } from 'react-native'
import * as Location from 'expo-location'
import { WebView } from 'react-native-webview'
import { GeoFence, haversineKm } from '../../../utils/geofenceLogic'
import { useApp } from '../../../context/AppContext'
import { useLocation } from '../../../context/LocationContext'
import { usePathDeviation } from '../../../context/PathDeviationContext'
import { reverseGeocode } from '../../map/components/MapboxMap/geoUtils'
import { loadFences } from '../../map/services/geofenceService'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Route, RoutingProfile } from '../../map/services/mapboxDirectionsService'

// Import map components
import MapContainer from '../../map/components/MapboxMap/MapContainer'
import { WebViewMessage } from '../../map/components/MapboxMap/types'

// Import overlay UI components
import {
  TopLocationCard,
  WarningBanner,
  RightActionButtons,
  MapBottomSheet,
  StyleBottomSheet,
  DirectionsBottomSheet
} from '../../map/components/MapboxMap/ui'
import DirectionsTopPanel from '../../map/components/MapboxMap/ui/DirectionsTopPanel'
import NavigationView from '../../../components/NavigationView'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

// Configuration for auto-refresh
const REFRESH_INTERVAL_MS = 60000 // 60 seconds

export default function EmergencyScreen({ navigation }: any) {
  const { state } = useApp()
  const { currentLocation, setCurrentLocation, setCurrentAddress } = useLocation()
  const { isTracking, setMapRef } = usePathDeviation()

  // Map state
  const [mapReady, setMapReady] = useState(false)
  const [webViewKey, setWebViewKey] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('streets')
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [loadingGeofences, setLoadingGeofences] = useState(false)

  // UI state
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false)
  const [showWarningBanner, setShowWarningBanner] = useState(true)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [isStyleSheetExpanded, setIsStyleSheetExpanded] = useState(false)
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false)

  // Directions Mode State
  const [directionsMode, setDirectionsMode] = useState(false)
  const [allRoutes, setAllRoutes] = useState<Route[]>([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [currentProfile, setCurrentProfile] = useState<RoutingProfile>('driving')
  const [isDirectionsSheetVisible, setIsDirectionsSheetVisible] = useState(false)

  const currentRoute = allRoutes[selectedRouteIndex] || null

  // Geofences
  const [geoFences, setGeoFences] = useState<GeoFence[]>([])

  const webViewRef = React.useRef<WebView>(null)

  // Set map reference for path deviation tracking AFTER map is ready
  useEffect(() => {
    if (mapReady && webViewRef.current) {
      console.log('[EmergencyScreen] Setting map ref for path deviation tracking')
      setMapRef(webViewRef)
    }
    return () => {
      setMapRef(null)
    }
  }, [setMapRef, mapReady])

  // Load geofences on mount using service (tries server first, then bundled)
  useEffect(() => {
    const loadGeoFencesFromService = async () => {
      setLoadingGeofences(true)
      try {
        const fences = await loadFences()
        setGeoFences(fences)
        console.log('Loaded geofences:', fences.length)
      } catch (err) {
        console.warn('Failed to load geofences:', err)
        setGeoFences([])
      } finally {
        setLoadingGeofences(false)
      }
    }
    loadGeoFencesFromService()
  }, [])

  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for the map.')
        return
      }
    })()
  }, [])

  // Get current location when map is ready
  useEffect(() => {
    if (mapReady) {
      getCurrentLocation()
    }
  }, [mapReady])

  // Send geofences to WebView when ready
  useEffect(() => {
    if (!webViewRef.current || !mapReady || !geoFences.length) return

    try {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setGeoFences',
        fences: geoFences
      }))
    } catch (e) {
      console.warn('Failed to send geofences to WebView', e)
    }
  }, [mapReady, geoFences])

  // Update map when routes change
  useEffect(() => {
    if (webViewRef.current && mapReady) {
      if (allRoutes.length > 0) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setRoute',
          routes: allRoutes,
          selectedIndex: selectedRouteIndex,
          profile: currentProfile
        }))
      } else {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'clearRoute'
        }))
      }
    }
  }, [allRoutes, selectedRouteIndex, currentProfile, mapReady])

  // Refresh geofences function
  const refreshGeofences = async () => {
    try {
      setIsBackgroundRefreshing(true)
      const userLat = currentLocation?.coords.latitude
      const userLng = currentLocation?.coords.longitude

      const fences = await loadFences(userLat, userLng)
      setGeoFences(fences)

      console.log(`[Auto-Refresh] Refreshed ${fences.length} geofences`)
    } catch (err) {
      console.warn('Failed to refresh geofences:', err)
      // Don't show error to user - fail silently for background refresh
    } finally {
      setIsBackgroundRefreshing(false)
    }
  }

  // Set up auto-refresh polling
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('[Auto-Refresh] Timer triggered')
      refreshGeofences()
    }, REFRESH_INTERVAL_MS)

    // Cleanup interval on unmount
    return () => {
      console.log('[Auto-Refresh] Stopping polling')
      clearInterval(intervalId)
    }
  }, [currentLocation]) // Re-create interval if location changes

  const getCurrentLocation = async () => {
    setLoadingLocation(true)
    try {
      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use this feature',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Settings',
              onPress: async () => {
                await Location.requestForegroundPermissionsAsync()
              }
            }
          ]
        )
        setLoadingLocation(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      setCurrentLocation(location)

      // Reverse geocode
      const address = await reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      )
      if (address) {
        setCurrentAddress(address)
      }

      // Send to WebView
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setLocation',
          location: location.coords,
        }))
      }
    } catch (err: any) {
      console.error('Location error:', err)
      Alert.alert('Location Error', err.message || 'Failed to get current location')
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleWebViewMessage = (event: any) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data)

      switch (message.type) {
        case 'mapReady':
          setMapReady(true)
          break
        case 'mapClick':
          // Could handle map clicks here
          break
        case 'error':
          console.error('Map error:', message.message)
          break
        case 'routeSelected':
          if (message.index !== undefined) {
            setSelectedRouteIndex(message.index)
          }
          break
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err)
    }
  }

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style)
    setIsStyleSheetExpanded(false)

    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setStyle',
        style: style,
      }))
    }
  }

  const handleShareLocation = () => {
    if (!currentLocation) {
      Alert.alert('No Location', 'Location not available yet')
      return
    }

    const { latitude, longitude } = currentLocation.coords
    const message = `My location: https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`
    Alert.alert('Share Location', message)
  }

  const handleSOS = () => {
    setShowIncidentModal(true)
  }

  const handleIncidentSubmitted = () => {
    console.log('[Incident] Submitted, refreshing map immediately')
    refreshGeofences()
  }

  const handleDirectionsPress = () => {
    // Enable Directions Mode
    setDirectionsMode(true)

    // Close other sheets
    setIsBottomSheetExpanded(false)
    setIsStyleSheetExpanded(false)
    setShowWarningBanner(false)
  }

  const handleExitDirections = () => {
    setDirectionsMode(false)
    setAllRoutes([])
    setSelectedRouteIndex(0)
    setShowWarningBanner(true)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Full-screen Map */}
      <MapContainer
        webViewKey={webViewKey}
        height={SCREEN_HEIGHT}
        onWebViewMessage={handleWebViewMessage}
        webViewRef={webViewRef}
        isFullScreen={true}
      />

      {/* Conditional Top UI - Hide when navigation is active */}
      {!isTracking && directionsMode ? (
        <DirectionsTopPanel
          onBack={handleExitDirections}
          onRoutesCalculated={(routes, profile) => {
            setAllRoutes(routes)
            setSelectedRouteIndex(0)
            setCurrentProfile(profile)
          }}
          onClearRoute={() => {
            setAllRoutes([])
            setSelectedRouteIndex(0)
          }}
        />
      ) : !isTracking ? (
        <TopLocationCard />
      ) : null}

      {/* Warning Banner (if applicable and not in directions mode) */}
      {showWarningBanner && !directionsMode && (
        <WarningBanner onDismiss={() => setShowWarningBanner(false)} />
      )}

      {/* Background Refresh Indicator */}
      {isBackgroundRefreshing && (
        <View style={styles.refreshIndicator}>
          <View style={styles.refreshContent}>
            <MaterialCommunityIcons name="reload" size={16} color="#3B82F6" />
            <Text style={styles.refreshText}>Updating map...</Text>
          </View>
        </View>
      )}

      {/* Right Side Action Buttons - Hide when navigation is active or directions sheet is visible */}
      {!isTracking && (
        <RightActionButtons
          onCompassPress={getCurrentLocation}
          onDirectionsPress={handleDirectionsPress}
          onLayersPress={() => {
            setIsStyleSheetExpanded(prev => !prev)
            setIsBottomSheetExpanded(false)
          }}
          onSOSPress={() => {
            setIsStyleSheetExpanded(false)
            setIsBottomSheetExpanded(prev => !prev)
          }}
          hideDirectionsButton={directionsMode}
          visible={!isDirectionsSheetVisible}
        />
      )}

      <StyleBottomSheet
        isExpanded={isStyleSheetExpanded}
        onToggle={() => setIsStyleSheetExpanded(prev => !prev)}
        selectedStyle={selectedStyle}
        onSelectStyle={handleStyleChange}
      />

      {/* Directions Bottom Sheet (Summary) - Only visible when route exists */}
      <DirectionsBottomSheet
        route={currentRoute}
        profile={currentProfile}
        onClearRoute={() => {
          setAllRoutes([])
          setSelectedRouteIndex(0)
        }}
        onVisibilityChange={setIsDirectionsSheetVisible}
      />

      {/* Navigation View - Shows when tracking is active */}
      <NavigationView 
        onLayersPress={() => {
          setIsStyleSheetExpanded(prev => !prev)
          setIsBottomSheetExpanded(false)
        }}
        onSOSPress={handleSOS}
      />

      {/* Bottom Sheet */}
      <MapBottomSheet
        isExpanded={isBottomSheetExpanded && !directionsMode}
        onToggle={() => setIsBottomSheetExpanded(prev => !prev)}
        onShareLive={handleShareLocation}
        onSOS={handleSOS}
      />

      {/* Incident Report Modal */}
      <IncidentReportModal
        visible={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onIncidentSubmitted={handleIncidentSubmitted}
        latitude={currentLocation?.coords?.latitude ?? 0}
        longitude={currentLocation?.coords?.longitude ?? 0}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  refreshIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    alignSelf: 'center',
    zIndex: 100,
  },
  refreshContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
})