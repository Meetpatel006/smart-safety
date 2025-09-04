import React, { useEffect, useState, useRef } from 'react';
import { View, Alert, Platform, Linking } from 'react-native';
import { Text, Button, useTheme, Card } from 'react-native-paper';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import Clipboard from '@react-native-clipboard/clipboard';
import MapplsGL, { initializeMappls, MAPPLS_CONFIG } from '../config/mapplsConfig';
import { useApp } from '../context/AppContext';
import { t } from '../context/translations';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function MapplsMap() {
  const { state, toggleShareLocation } = useApp();
  const theme = useTheme();
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Mappls SDK
    const initMap = async () => {
      const initialized = initializeMappls();
      setMapReady(initialized);
    };
    
    initMap();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (state.shareLocation && locationPermission) {
      getCurrentLocation();
    }
  }, [state.shareLocation, locationPermission]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to share your location.',
          [{ text: 'OK' }]
        );
        return;
      }
      setLocationPermission(true);
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) {
      await requestLocationPermission();
      return;
    }

    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(coords);
      
      // Move camera to current location if map is available
      if (mapRef.current && mapReady) {
        mapRef.current.setCamera({
          centerCoordinate: [coords.longitude, coords.latitude],
          zoomLevel: MAPPLS_CONFIG.USER_LOCATION_ZOOM,
          animationDuration: 1000,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareLocationLink = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available. Please enable location sharing first.');
      return;
    }

    const googleMapsUrl = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
    const mapplsUrl = `https://maps.mappls.com/directions?destination=${currentLocation.latitude},${currentLocation.longitude}`;
    const message = `📍 My Current Location:\n\nGoogle Maps: ${googleMapsUrl}\nMappls: ${mapplsUrl}\n\nCoordinates: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(message, {
          mimeType: 'text/plain',
          dialogTitle: 'Share My Location',
        });
      } else {
        // Fallback to clipboard
        Clipboard.setString(message);
        Alert.alert('Location Copied', 'Location details have been copied to clipboard.');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      // Fallback to clipboard
      Clipboard.setString(message);
      Alert.alert('Location Copied', 'Location details have been copied to clipboard.');
    }
  };

  const openInMaps = () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available.');
      return;
    }

    Alert.alert(
      'Open in Maps',
      'Choose which map service to use:',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
            Linking.openURL(url);
          },
        },
        {
          text: 'Mappls Maps',
          onPress: () => {
            const url = `https://maps.mappls.com/directions?destination=${currentLocation.latitude},${currentLocation.longitude}`;
            Linking.openURL(url);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const copyLocationToClipboard = () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available.');
      return;
    }

    const locationText = `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
    Clipboard.setString(locationText);
    Alert.alert('Copied', 'Location coordinates copied to clipboard.');
  };

  const centerMapOnLocation = () => {
    if (!currentLocation || !mapRef.current || !mapReady) {
      getCurrentLocation();
      return;
    }

    mapRef.current.setCamera({
      centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
      zoomLevel: MAPPLS_CONFIG.USER_LOCATION_ZOOM,
      animationDuration: 1000,
    });
  };

  return (
    <Card style={{ marginVertical: 8 }}>
      <Card.Content>
        {/* Mappls Map */}
        <View style={{ 
          height: 250, 
          borderRadius: 8, 
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceVariant,
        }}>
          {mapReady ? (
            <MapplsGL.MapView
              ref={mapRef}
              style={{ flex: 1 }}
            >
              <MapplsGL.Camera
                zoomLevel={currentLocation ? MAPPLS_CONFIG.USER_LOCATION_ZOOM : MAPPLS_CONFIG.DEFAULT_ZOOM}
                centerCoordinate={currentLocation ? [currentLocation.longitude, currentLocation.latitude] : MAPPLS_CONFIG.DEFAULT_CENTER}
                animationDuration={1000}
              />
              
              {/* User location marker */}
              {currentLocation && state.shareLocation && (
                <MapplsGL.PointAnnotation
                  id="user-location"
                  coordinate={[currentLocation.longitude, currentLocation.latitude]}
                >
                  <View
                    style={{
                      width: MAPPLS_CONFIG.MARKER.SIZE,
                      height: MAPPLS_CONFIG.MARKER.SIZE,
                      borderRadius: MAPPLS_CONFIG.MARKER.SIZE / 2,
                      backgroundColor: theme.colors.primary,
                      borderWidth: MAPPLS_CONFIG.MARKER.BORDER_WIDTH,
                      borderColor: MAPPLS_CONFIG.MARKER.BORDER_COLOR,
                      elevation: 4,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                    }}
                  />
                  <MapplsGL.Callout title="Your Location" />
                </MapplsGL.PointAnnotation>
              )}
            </MapplsGL.MapView>
          ) : (
            // Fallback loading view
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#e8f4f8',
            }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                🗺️ Loading Mappls Map...
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Initializing map services
              </Text>
            </View>
          )}
          
          {/* Overlay text for status */}
          <View style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 8,
            padding: 8,
            alignItems: 'center',
          }}>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {state.shareLocation ? '📍 Location Active' : '🗺️ Mappls Map'}
            </Text>
            {currentLocation && state.shareLocation && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          {/* Main toggle button */}
          <Button
            mode={state.shareLocation ? "contained" : "contained-tonal"}
            onPress={toggleShareLocation}
            loading={isLoading}
            disabled={!locationPermission || !mapReady}
            icon={state.shareLocation ? "map-marker" : "map-marker-outline"}
          >
            {state.shareLocation ? 'Stop Sharing Location' : 'Share My Location'}
          </Button>

          {/* Location sharing is active */}
          {state.shareLocation && currentLocation && (
            <View style={{ gap: 8 }}>
              <Text variant="bodySmall" style={{ 
                color: theme.colors.primary, 
                textAlign: 'center',
                fontWeight: '500'
              }}>
                ✅ Location sharing is active
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  mode="outlined"
                  icon="share"
                  onPress={shareLocationLink}
                  style={{ flex: 1 }}
                >
                  Share
                </Button>
                <Button
                  mode="outlined"
                  icon="map"
                  onPress={openInMaps}
                  style={{ flex: 1 }}
                >
                  Open
                </Button>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  mode="text"
                  icon="content-copy"
                  onPress={copyLocationToClipboard}
                  style={{ flex: 1 }}
                >
                  Copy Coordinates
                </Button>
                <Button
                  mode="text"
                  icon="crosshairs-gps"
                  onPress={centerMapOnLocation}
                  loading={isLoading}
                  style={{ flex: 1 }}
                >
                  Center Map
                </Button>
              </View>

              <Button
                mode="text"
                icon="refresh"
                onPress={getCurrentLocation}
                loading={isLoading}
              >
                Refresh Location
              </Button>
            </View>
          )}

          {/* Permission required */}
          {!locationPermission && (
            <View style={{ 
              padding: 16, 
              backgroundColor: theme.colors.errorContainer, 
              borderRadius: 12,
              alignItems: 'center',
              gap: 8
            }}>
              <Text style={{ 
                color: theme.colors.onErrorContainer, 
                textAlign: 'center',
                fontWeight: '500'
              }}>
                📍 Location Permission Required
              </Text>
              <Text style={{ 
                color: theme.colors.onErrorContainer, 
                textAlign: 'center',
                opacity: 0.8
              }}>
                Allow location access to share your location in emergencies
              </Text>
              <Button 
                mode="contained" 
                onPress={requestLocationPermission} 
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
              >
                Grant Permission
              </Button>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}
