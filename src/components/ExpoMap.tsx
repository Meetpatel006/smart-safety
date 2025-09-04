import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Card, Button } from 'react-native-paper';
import * as Location from 'expo-location';

// Conditionally import expo-maps
let AppleMaps: any = null;
let GoogleMaps: any = null;

try {
  const expoMaps = require('expo-maps');
  AppleMaps = expoMaps.AppleMaps;
  GoogleMaps = expoMaps.GoogleMaps;
} catch (error) {
  console.log('expo-maps not available, using fallback');
}

interface ExpoMapProps {
  onLocationSelect?: (location: { latitude: number; longitude: number }) => void;
  showCurrentLocation?: boolean;
  style?: any;
}

const ExpoMap: React.FC<ExpoMapProps> = ({ 
  onLocationSelect, 
  showCurrentLocation = true,
  style 
}) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (showCurrentLocation) {
      getCurrentLocation();
    }
  }, [showCurrentLocation]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      if (onLocationSelect) {
        onLocationSelect({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        });
      }
    } catch (error) {
      setErrorMsg('Error getting location');
      console.error('Location error:', error);
    }
  };

  const renderMap = () => {
    // Check if expo-maps is available
    if (!AppleMaps || !GoogleMaps) {
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>📍 Location Service</Text>
          {location ? (
            <View>
              <Text style={styles.locationText}>
                Current Location:
              </Text>
              <Text style={styles.coordinatesText}>
                Lat: {location.coords.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                Lng: {location.coords.longitude.toFixed(6)}
              </Text>
              <Text style={styles.accuracyText}>
                Accuracy: ±{location.coords.accuracy?.toFixed(0)}m
              </Text>
            </View>
          ) : (
            <Text style={styles.locationText}>
              Getting your location...
            </Text>
          )}
          <Text style={styles.fallbackNote}>
            📱 Map view available in development build
          </Text>
        </View>
      );
    }

    const cameraPosition = {
      coordinates: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : {
        latitude: 28.6139, // Default to Delhi
        longitude: 77.2090,
      },
      zoom: 14,
    };

    if (Platform.OS === 'ios') {
      return (
        <AppleMaps.View 
          style={styles.mapView}
          cameraPosition={cameraPosition}
        />
      );
    } else if (Platform.OS === 'android') {
      return (
        <GoogleMaps.View 
          style={styles.mapView}
          cameraPosition={cameraPosition}
        />
      );
    } else {
      return (
        <Text style={styles.unsupportedText}>
          Maps are only available on Android and iOS
        </Text>
      );
    }
  };

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <Text style={styles.title}>Location Map</Text>
        <View style={styles.mapContainer}>
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            renderMap()
          )}
        </View>
        <Text style={styles.note}>
          Interactive map showing your current location and nearby safety resources
        </Text>
        {showCurrentLocation && (
          <Button 
            mode="outlined" 
            onPress={getCurrentLocation}
            style={styles.refreshButton}
          >
            Refresh Location
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapView: {
    flex: 1,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  unsupportedText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  refreshButton: {
    marginTop: 8,
  },
  fallbackContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackNote: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
});

export default ExpoMap;
