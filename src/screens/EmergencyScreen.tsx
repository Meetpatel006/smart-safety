import React, { useEffect, useState } from 'react'
import IncidentReportModal from '../components/IncidentReportModal'
import { View, StyleSheet, Dimensions, Alert, StatusBar } from 'react-native'
import * as Location from 'expo-location'
import { WebView } from 'react-native-webview'
import { GeoFence, haversineKm } from '../utils/geofenceLogic'
import { useApp } from '../context/AppContext'
import { reverseGeocode } from '../components/MapboxMap/geoUtils'
import { loadFences } from '../geoFence/geofenceService'

// Import map components
import MapContainer from '../components/MapboxMap/MapContainer'
import StyleSelector from '../components/MapboxMap/StyleSelector'
import { WebViewMessage } from '../components/MapboxMap/types'

// Import overlay UI components
import {
  TopLocationCard,
  WarningBanner,
  RightActionButtons,
  MapBottomSheet
} from '../components/MapboxMap/ui'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

export default function EmergencyScreen() {
  const { state, setCurrentLocation, setCurrentAddress } = useApp()

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
  const [showStyleSelector, setShowStyleSelector] = useState(false)

  // Geofences
  const [geoFences, setGeoFences] = useState<GeoFence[]>([])

  const webViewRef = React.useRef<WebView>(null)

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

  const getCurrentLocation = async () => {
    setLoadingLocation(true)
    try {
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
    } catch (err) {
      console.error('Location error:', err)
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
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err)
    }
  }

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style)
    setShowStyleSelector(false)

    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setStyle',
        style: style,
      }))
    }
  }

  const handleShareLocation = () => {
    if (!state.currentLocation) {
      Alert.alert('No Location', 'Location not available yet')
      return
    }

    const { latitude, longitude } = state.currentLocation.coords
    const message = `My location: https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`
    Alert.alert('Share Location', message)
  }

  const handleSOS = () => {
    setShowIncidentModal(true)
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

      {/* Top Location Card */}
      <TopLocationCard />

      {/* Warning Banner (if applicable) */}
      {showWarningBanner && (
        <WarningBanner onDismiss={() => setShowWarningBanner(false)} />
      )}

      {/* Right Side Action Buttons */}
      <RightActionButtons
        onCompassPress={getCurrentLocation}
        onDangerFlagPress={() => Alert.alert('Report', 'Report a dangerous location')}
        onLayersPress={() => setShowStyleSelector(!showStyleSelector)}
        onSOSPress={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
      />

      {/* Style Selector Popup */}
      {showStyleSelector && (
        <View style={styles.styleSelectorOverlay}>
          <StyleSelector
            selectedStyle={selectedStyle}
            onSelectStyle={handleStyleChange}
          />
        </View>
      )}

      {/* Bottom Sheet */}
      <MapBottomSheet
        isExpanded={isBottomSheetExpanded}
        onToggle={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
        onShareLive={handleShareLocation}
        onSOS={handleSOS}
      />

      {/* Incident Report Modal */}
      <IncidentReportModal
        visible={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        latitude={state.currentLocation?.coords?.latitude ?? 0}
        longitude={state.currentLocation?.coords?.longitude ?? 0}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  styleSelectorOverlay: {
    position: 'absolute',
    right: 70,
    top: '35%',
    zIndex: 95,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
})
