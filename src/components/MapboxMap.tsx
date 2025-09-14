import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Platform, Alert, Dimensions, View } from 'react-native';
import { Card } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

// Import sub-components
import MapHeader from './MapboxMap/MapHeader';
import ErrorMessage from './MapboxMap/ErrorMessage';
import MapContainer from './MapboxMap/MapContainer';
import LocationInfo from './MapboxMap/LocationInfo';
import MapActionButtons from './MapboxMap/MapActionButtons';
import StyleSelector from './MapboxMap/StyleSelector';

// Import types, constants and utilities
import { WebViewMessage } from './MapboxMap/types';
import { reverseGeocode } from './MapboxMap/geoUtils';
import { GeoFence } from '../utils/geofenceLogic';

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

  const webViewRef = useRef<WebView>(null);

  // Request location permissions on mount
  useEffect(() => {
    (async () => {
      if (showCurrentLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }
      }
    })();
  }, [showCurrentLocation]);

  // Load geo-fences on mount
  useEffect(() => {
    const loadGeoFences = async () => {
      try {
        // Load bundled JSON directly via require (Metro supports bundling JSON)
        const data = require('../../assets/geofences-output.json');
        setLoadedGeoFences(data);
        console.log('Loaded geo-fences for Mapbox:', data.length);
      } catch (err) {
        console.warn('Failed to load geo-fences for Mapbox:', err);
        setLoadedGeoFences([]);
      }
    };

    loadGeoFences();
  }, []);

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
        const message = JSON.stringify({
          type: 'setLocation',
          location: locationResult.coords,
        });
        webViewRef.current.injectJavaScript(`window.postMessage(${message}, '*');`);
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
      const message = JSON.stringify({
        type: 'setStyle',
        style: style,
      });
      webViewRef.current.injectJavaScript(`window.postMessage(${message}, '*');`);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Card style={[styles.card, isFullScreen && styles.cardFullScreen]}>
        <MapHeader
          title="Mapbox Map"
          loading={loadingLocation}
          onRefresh={getCurrentLocation}
        />

        <MapContainer
          webViewKey={webViewKey}
          height={isFullScreen ? Dimensions.get('window').height - 100 : mapHeight}
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
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  card: {
    elevation: 4,
  },
  cardFullScreen: {
    margin: 0,
    borderRadius: 0,
    height: Dimensions.get('window').height,
  },
});