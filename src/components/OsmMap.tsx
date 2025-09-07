import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Platform, Alert, Dimensions } from "react-native";
import { Card } from "react-native-paper";
import { WebView } from 'react-native-webview';
import * as Location from "expo-location";

// Import sub-components
import MapHeader from './OsmMap/MapHeader';
import ErrorMessage from './OsmMap/ErrorMessage';
import MapContainer from './OsmMap/MapContainer';
import LocationInfo from './OsmMap/LocationInfo';
import TileProviderSelector from './OsmMap/TileProviderSelector';
import MapActionButtons from './OsmMap/MapActionButtons';

// Import types, constants and utilities
import { OsmMapProps, LocationData, TileProvider } from './OsmMap/types';
import { TILE_SERVERS } from './OsmMap/constants';
import { reverseGeocode } from './OsmMap/geoUtils';

/*
  Enhanced OsmMap: OpenStreetMap integration with Leaflet
  
  Features:
  - Interactive Leaflet map with OpenStreetMap tiles
  - Location services with Expo Location
  - Nominatim reverse and forward geocoding
  - Multiple map tile providers
  - Marker management and click events
  - Location sharing and external map opening
  - Error handling and retry mechanisms
*/

export default function OsmMap({
  showCurrentLocation = true,
  onLocationSelect,
  onLocationChange,
  style,
  zoomLevel = 15,
  mapWidth = Dimensions.get('window').width - 32,
  mapHeight = 300,
  geoFences,
  isFullScreen,
  onToggleFullScreen
}: OsmMapProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [tileProvider, setTileProvider] = useState<TileProvider>('openstreetmap');
  const [mapReady, setMapReady] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (showCurrentLocation) {
      getCurrentLocation();
    }
  }, [showCurrentLocation]);

  useEffect(() => {
    if (location && mapReady) {
      updateMapLocation();
    }
  }, [location, mapReady, tileProvider]);

  // Send geo-fences to the WebView when map is ready or when geoFences prop changes
  useEffect(() => {
    if (!webViewRef.current || !mapReady) return;
    if (!Array.isArray(geoFences)) return;

    try {
      console.log(`Sending ${geoFences.length} geofences to WebView, including custom fences:`, 
        geoFences.filter(f => f.id && f.id.startsWith('custom')).map(f => f.name));
      webViewRef.current.postMessage(JSON.stringify({ type: 'setGeoFences', fences: geoFences }));
    } catch (e) {
      console.warn('failed to post geoFences to webview', e);
    }
  }, [mapReady, geoFences]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset map ready state when component unmounts
      setMapReady(false);
    };
  }, []);

  const getCurrentLocation = async (highAccuracy: boolean = true) => {
    try {
      setLoadingLocation(true);
      setErrorMsg(null);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission denied. Please enable location access in settings.");
        return;
      }

      // Get current position
      const locationOptions: Location.LocationOptions = {
        accuracy: highAccuracy ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval: 1,
      };

      const currentLocation = await Location.getCurrentPositionAsync(locationOptions);
      setLocation(currentLocation);

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || undefined,
        timestamp: currentLocation.timestamp,
      };

      if (onLocationChange) {
        onLocationChange(locationData);
      }

      if (onLocationSelect) {
        onLocationSelect(locationData);
      }

      // Get address for current location
      setLoadingAddress(true);
      const addressResult = await reverseGeocode(
        currentLocation.coords.latitude, 
        currentLocation.coords.longitude
      );
      
      if (addressResult) {
        setAddress(addressResult);
      } else {
        setAddress("Address lookup failed");
      }
      setLoadingAddress(false);

    } catch (err: any) {
      console.error("Location error:", err);
      setErrorMsg(`Failed to get location: ${err.message}`);
      
      // Try with lower accuracy if high accuracy failed
      if (highAccuracy) {
        setTimeout(() => getCurrentLocation(false), 1000);
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const updateMapLocation = () => {
    if (!location || !webViewRef.current) return;

    const { latitude, longitude } = location.coords;
    const accuracy = location.coords.accuracy || 0;
    
    webViewRef.current.postMessage(JSON.stringify({
      type: 'updateLocation',
      latitude,
      longitude,
      accuracy,
      zoomLevel
    }));
  };

  const changeTileProvider = (provider: TileProvider) => {
    setTileProvider(provider);
    setMapReady(false); // Reset map ready state
    setWebViewKey(prev => prev + 1); // Force WebView remount
    
    // Send message to existing map instance if available
    if (webViewRef.current && mapReady) {
      const tileConfig = TILE_SERVERS[provider];
      webViewRef.current.postMessage(JSON.stringify({
        type: 'changeTileProvider',
        url: tileConfig.url,
        attribution: tileConfig.attribution
      }));
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapReady':
          setMapReady(true);
          break;
          
        case 'mapClick':
          const { lat, lng } = data;
          // Handle map click - you can add custom logic here
          const clickedLocation: LocationData = {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now(),
          };
          
          if (onLocationSelect) {
            onLocationSelect(clickedLocation);
          }
          
          // Start loading address indicator
          setLoadingAddress(true);
          
          // Reverse geocode the clicked location
          reverseGeocode(lat, lng)
            .then(result => {
              if (result) {
                setAddress(result);
              } else {
                setAddress("Address lookup failed");
              }
            })
            .finally(() => {
              setLoadingAddress(false);
            });
          break;
          
        case 'error':
          console.error('Map error:', data.message);
          setErrorMsg(data.message);
          break;
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  };

  const openExternalMap = () => {
    if (!location) return;

    const { latitude, longitude } = location.coords;
    
    const urls = {
      openstreetmap: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
      googlemaps: `https://www.google.com/maps?q=${latitude},${longitude}`,
      applemaps: `https://maps.apple.com/?q=${latitude},${longitude}`,
    };

    Alert.alert(
      "Open in External Map",
      "Choose a map application:",
      [
        { text: "OpenStreetMap", onPress: () => console.log("Open:", urls.openstreetmap) },
        { text: "Google Maps", onPress: () => console.log("Open:", urls.googlemaps) },
        ...(Platform.OS === 'ios' ? [{ text: "Apple Maps", onPress: () => console.log("Open:", urls.applemaps) }] : []),
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const shareLocation = () => {
    if (!location) return;
    
    const { latitude, longitude } = location.coords;
    const message = `My location: https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
    
    console.log("Share location:", message);
    // You can integrate with Expo Sharing API here
  };

  return (
  <Card style={[styles.container, isFullScreen ? styles.fullscreenContainer : undefined, style]}>
      <Card.Content>
        {/* Header Component */}
        <MapHeader
          title="Map"
          loading={loadingLocation}
          onRefresh={getCurrentLocation}
        />

        {/* Error Message Component */}
        <ErrorMessage 
          errorMsg={errorMsg}
          onRetry={getCurrentLocation}
        />

        {/* Map Container */}
        <MapContainer
          webViewKey={webViewKey}
          height={mapHeight}
          tileConfig={TILE_SERVERS[tileProvider]}
          onWebViewMessage={handleWebViewMessage}
          webViewRef={webViewRef}
          isFullScreen={!!isFullScreen}
        />

        {/* Location Information */}
        <LocationInfo
          location={location}
          address={address}
          loadingAddress={loadingAddress}
        />

        {/* Tile Provider Selection */}
        <TileProviderSelector
          tileProvider={tileProvider}
          onChangeTileProvider={changeTileProvider}
          providers={Object.keys(TILE_SERVERS)}
        />

        {/* Action Buttons */}
        <MapActionButtons
          locationAvailable={!!location}
          loadingLocation={loadingLocation}
          onGetCurrentLocation={getCurrentLocation}
          onOpenExternalMap={openExternalMap}
          onShareLocation={shareLocation}
          onToggleFullScreen={onToggleFullScreen ? () => onToggleFullScreen(!isFullScreen) : undefined}
          isFullScreen={!!isFullScreen}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullscreenContainer: {
    margin: 0,
    borderRadius: 0,
  }
});
