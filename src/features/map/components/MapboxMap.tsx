import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Platform, Alert, Dimensions, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

// Import sub-components
import MapHeader from './MapboxMap/MapHeader';
import ErrorMessage from './MapboxMap/ErrorMessage';
import MapContainer from './MapboxMap/MapContainer';
import LocationInfo from './MapboxMap/LocationInfo';
import MapActionButtons from './MapboxMap/MapActionButtons';
import StyleSelector from './MapboxMap/StyleSelector';

// Import new UI overlay components
import {
  TopLocationCard,
  WarningBanner,
  RightActionButtons,
  MapBottomSheet
} from './MapboxMap/ui';

// Import types, constants and utilities
import { WebViewMessage } from './MapboxMap/types';
import { reverseGeocode } from './MapboxMap/geoUtils';
import { GeoFence, filterFencesByDistance, haversineKm } from '../../../utils/geofenceLogic';

const NEARBY_FENCE_RADIUS_KM = 15;
const LOCATION_REFILTER_THRESHOLD_KM = 5;

interface MapboxMapProps {
  showCurrentLocation?: boolean;
  onLocationSelect?: (location: Location.LocationObject) => void;
  onLocationChange?: (location: Location.LocationObject) => void;
  style?: any;
  zoomLevel?: number;
  mapWidth?: number;
  mapHeight?: number;
  geoFences?: GeoFence[];
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function MapboxMap({
  showCurrentLocation = true,
  onLocationSelect,
  onLocationChange,
  style,
  zoomLevel = 15,
  mapWidth = Dimensions.get('window').width - 32,
  mapHeight = 300,
  geoFences,
  isFullScreen = false,
  onToggleFullScreen
}: MapboxMapProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState('streets');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [loadedGeoFences, setLoadedGeoFences] = useState<GeoFence[]>([]);
  const [allGeoFences, setAllGeoFences] = useState<GeoFence[]>([]);
  const [lastLocationForFilter, setLastLocationForFilter] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(false);

  // New state for overlay UI
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(true);
  const [showStyleSelector, setShowStyleSelector] = useState(false);

  const webViewRef = useRef<WebView>(null);

// Request location permissions on mount and load geofences
  useEffect(() => {
    (async () => {
      if (showCurrentLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        setLocationPermissionGranted(granted);
        
        if (!granted) {
          setError('Location permission denied. Showing all safety zones.');
          loadAllFencesWithoutFiltering();
          return;
        }

        try {
          const locationResult = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = locationResult.coords;
          setLastLocationForFilter({ lat: latitude, lng: longitude });
          await loadAndFilterFences(latitude, longitude);
        } catch (err) {
          console.warn('Failed to get location for filtering:', err);
          loadAllFencesWithoutFiltering();
        }
      } else {
        loadAllFencesWithoutFiltering();
      }
    })();
  }, [showCurrentLocation]);

  const loadAllFencesWithoutFiltering = async () => {
    try {
      const data = require('../../../../assets/geofences-output.json');
      const fencesWithDistance = data.map((f: GeoFence) => ({
        ...f,
        distanceToUser: undefined
      }));
      setAllGeoFences(fencesWithDistance);
      setLoadedGeoFences(fencesWithDistance);
      console.log('Loaded all geo-fences (no location permission):', fencesWithDistance.length);
    } catch (err) {
      console.warn('Failed to load geo-fences:', err);
      setAllGeoFences([]);
      setLoadedGeoFences([]);
    }
  };

  const loadAndFilterFences = async (userLat: number, userLng: number) => {
    try {
      const data = require('../../../../assets/geofences-output.json');
      setAllGeoFences(data);
      const nearby = filterFencesByDistance(data, userLat, userLng, NEARBY_FENCE_RADIUS_KM);
      setLoadedGeoFences(nearby);
      console.log(`Loaded ${data.length} total fences, filtered to ${nearby.length} within ${NEARBY_FENCE_RADIUS_KM}km`);
    } catch (err) {
      console.warn('Failed to load/filter geo-fences:', err);
      setAllGeoFences([]);
      setLoadedGeoFences([]);
    }
  };

  // Re-filter fences when location changes significantly
  const refilterFencesIfNeeded = useCallback((newLat: number, newLng: number) => {
    if (lastLocationForFilter) {
      const distance = haversineKm(
        [newLat, newLng],
        [lastLocationForFilter.lat, lastLocationForFilter.lng]
      );
      
      if (distance >= LOCATION_REFILTER_THRESHOLD_KM) {
        console.log(`User moved ${distance.toFixed(2)}km, re-filtering fences...`);
        setLastLocationForFilter({ lat: newLat, lng: newLng });
        loadAndFilterFences(newLat, newLng);
      }
    } else {
      setLastLocationForFilter({ lat: newLat, lng: newLng });
      loadAndFilterFences(newLat, newLng);
    }
  }, [lastLocationForFilter]);

  // Send geo-fences to the WebView when map is ready or when geoFences prop changes
  useEffect(() => {
    if (!webViewRef.current || !mapReady) return;

    const fencesToSend = geoFences || loadedGeoFences;
    if (!Array.isArray(fencesToSend)) return;

    try {
      console.log(`Sending ${fencesToSend.length} geo-fences to Mapbox WebView, including custom fences:`,
        fencesToSend.filter(f => f.id && f.id.startsWith('custom')).map(f => f.name));
      webViewRef.current.postMessage(JSON.stringify({ type: 'setGeoFences', fences: fencesToSend }));
    } catch (e) {
      console.warn('Failed to post geo-fences to Mapbox WebView', e);
    }
  }, [mapReady, geoFences, loadedGeoFences]);

  // Handle WebView messages
  const handleWebViewMessage = (event: any) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'mapReady':
          console.log('Mapbox map is ready');
          setMapReady(true);
          break;
        case 'locationSelected':
          if (onLocationSelect && message.location) {
            onLocationSelect(message.location);
          }
          break;
        case 'error':
          setError(message.message || 'Map error occurred');
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  };

  // When the webview map is ready, attempt to get and send current location
  useEffect(() => {
    if (mapReady && showCurrentLocation) {
      // Delay slightly to allow WebView handlers to be ready to receive messages
      const t = setTimeout(() => {
        getCurrentLocation();
      }, 250);
      return () => clearTimeout(t);
    }
    return;
  }, [mapReady, showCurrentLocation]);

// Get current location
  const getCurrentLocation = async () => {
    if (!showCurrentLocation) return;

    setLoadingLocation(true);
    setError(null);

    try {
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(locationResult);
      setLocationAvailable(true);

      // Re-filter fences if user moved significantly
      if (locationPermissionGranted) {
        refilterFencesIfNeeded(locationResult.coords.latitude, locationResult.coords.longitude);
      }

      // Reverse geocode to get address
      setLoadingAddress(true);
      try {
        const addressResult = await reverseGeocode(locationResult.coords.latitude, locationResult.coords.longitude);
        setAddress(addressResult);
      } catch (geoError) {
        console.error('Reverse geocoding failed:', geoError);
      } finally {
        setLoadingAddress(false);
      }

      // Notify parent component
      if (onLocationChange) {
        onLocationChange(locationResult);
      }

      // Send location to WebView
      if (webViewRef.current) {
        try {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'setLocation',
            location: locationResult.coords,
          }));
        } catch (postErr) {
          // Fallback for environments where postMessage might not be available
          const message = JSON.stringify({
            type: 'setLocation',
            location: locationResult.coords,
          });
          webViewRef.current.injectJavaScript(`window.postMessage(${message}, '*');`);
        }
      }
    } catch (err) {
      console.error('Location error:', err);
      setError('Failed to get current location');
      setLocationAvailable(false);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Open location in external map app
  const openExternalMap = () => {
    if (!location) return;

    const url = Platform.select({
      ios: `maps:///?ll=${location.coords.latitude},${location.coords.longitude}`,
      android: `geo:${location.coords.latitude},${location.coords.longitude}?q=${location.coords.latitude},${location.coords.longitude}`,
    });

    if (url) {
      // Note: In a real app, you'd use Linking.openURL(url)
      Alert.alert('External Map', `Would open: ${url}`);
    }
  };

  // Share current location
  const shareLocation = () => {
    if (!location) return;

    let message = `My current location: ${location.coords.latitude}, ${location.coords.longitude}`;
    if (address) {
      message += `\nAddress: ${address}`;
    }

    // Note: In a real app, you'd use Share.share({ message })
    Alert.alert('Share Location', message);
  };

  // Handle full screen toggle
  const handleToggleFullScreen = () => {
    if (onToggleFullScreen) {
      onToggleFullScreen();
    }
  };

  // Handle style selection
  const handleSelectStyle = (style: string) => {
    setSelectedStyle(style);
    // Send style change to WebView
    if (webViewRef.current) {
      try {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setStyle',
          style: style,
        }));
      } catch (postErr) {
        const message = JSON.stringify({
          type: 'setStyle',
          style: style,
        });
        webViewRef.current.injectJavaScript(`window.postMessage(${message}, '*');`);
      }
    }
  };

  return (
    <View style={[styles.container, isFullScreen ? styles.containerFullScreen : undefined, style]}>
      {isFullScreen ? (
        // Full-screen: render map with overlay UI components
        <View style={styles.fullScreenContainer}>
          <MapContainer
            webViewKey={webViewKey}
            height={Dimensions.get('window').height}
            onWebViewMessage={handleWebViewMessage}
            webViewRef={webViewRef}
            isFullScreen={isFullScreen}
          />

          {/* Overlay UI Components */}
          <TopLocationCard />

          {showWarningBanner && (
            <WarningBanner onDismiss={() => setShowWarningBanner(false)} />
          )}

          <RightActionButtons
            onCompassPress={getCurrentLocation}
            onDangerFlagPress={() => Alert.alert('Report', 'Report a danger location')}
            onLayersPress={() => setShowStyleSelector(!showStyleSelector)}
            onSOSPress={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          />

          {showStyleSelector && (
            <View style={styles.styleSelectorOverlay}>
              <StyleSelector
                selectedStyle={selectedStyle}
                onSelectStyle={(style) => {
                  handleSelectStyle(style);
                  setShowStyleSelector(false);
                }}
              />
            </View>
          )}

          <MapBottomSheet
            isExpanded={isBottomSheetExpanded}
            onToggle={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
            onShareLive={shareLocation}
            onSOS={() => Alert.alert('SOS', 'Emergency SOS activated!')}
          />
        </View>
      ) : (
        // Normal embedded view
        <>
          <MapHeader
            title="Mapbox Map"
            loading={loadingLocation}
            onRefresh={getCurrentLocation}
          />

          <MapContainer
            webViewKey={webViewKey}
            height={mapHeight}
            onWebViewMessage={handleWebViewMessage}
            webViewRef={webViewRef}
            isFullScreen={isFullScreen}
          />

          {error && <ErrorMessage errorMsg={error} onRetry={getCurrentLocation} />}

          <LocationInfo
            location={location}
            address={address}
            loadingAddress={loadingAddress}
          />

          <MapActionButtons
            locationAvailable={locationAvailable}
            loadingLocation={loadingLocation}
            onGetCurrentLocation={getCurrentLocation}
            onOpenExternalMap={openExternalMap}
            onShareLocation={shareLocation}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={isFullScreen}
          />

          <StyleSelector
            selectedStyle={selectedStyle}
            onSelectStyle={handleSelectStyle}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  containerFullScreen: {
    margin: 0,
    flex: 1,
  },
  fullScreenContainer: {
    flex: 1,
    position: 'relative',
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
  cardFullScreen: {
    margin: 0,
    borderRadius: 0,
    height: Dimensions.get('window').height,
  },
});