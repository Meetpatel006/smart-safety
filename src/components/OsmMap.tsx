import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Card, Text, Button, ActivityIndicator } from "react-native-paper";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";

/*
  Leaflet + OpenStreetMap integration with React Native WebView

  Features:
  - Interactive map using Leaflet.js
  - Current location marker
  - Zoom and pan support
  - No static image, fully interactive OSM map
*/

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface OsmLeafletMapProps {
  showCurrentLocation?: boolean;
  zoomLevel?: number;
  mapHeight?: number;
}

export default function OsmLeafletMap({
  showCurrentLocation = true,
  zoomLevel = 15,
  mapHeight = 400,
}: OsmLeafletMapProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (showCurrentLocation) {
      getCurrentLocation();
    }
  }, [showCurrentLocation]);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      setErrorMsg(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission denied.");
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
    } catch (err: any) {
      setErrorMsg(`Failed to get location: ${err.message}`);
    } finally {
      setLoadingLocation(false);
    }
  };

  const leafletHTML = (lat: number, lon: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <script>
        var map = L.map('map').setView([${lat}, ${lon}], ${zoomLevel});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);
        L.marker([${lat}, ${lon}]).addTo(map).bindPopup("You are here").openPopup();
      </script>
    </body>
    </html>
  `;

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Leaflet Map (OpenStreetMap)</Text>
          <Button
            mode="outlined"
            onPress={getCurrentLocation}
            disabled={loadingLocation}
            compact
            icon="refresh"
          >
            {loadingLocation ? "Locating..." : "Refresh"}
          </Button>
        </View>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        {loadingLocation && !location ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text>Getting your location...</Text>
          </View>
        ) : location ? (
          <WebView
            originWhitelist={["*"]}
            source={{ html: leafletHTML(location.coords.latitude, location.coords.longitude) }}
            style={{ height: mapHeight }}
          />
        ) : (
          <View style={styles.noLocationContainer}>
            <Text>📍 No location available</Text>
            <Button mode="outlined" onPress={getCurrentLocation} compact>
              Get Location
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976D2",
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 8,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noLocationContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
});