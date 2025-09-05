import React, { useEffect, useState } from "react";
import { View, Linking, StyleSheet } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import * as Location from "expo-location";

interface OsmMapProps {
  showCurrentLocation?: boolean;
  onLocationSelect?: (loc: { latitude: number; longitude: number }) => void;
  style?: any;
}

export default function OsmMap({
  showCurrentLocation = true,
  onLocationSelect,
  style,
}: OsmMapProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (showCurrentLocation) getCurrentLocation();
  }, [showCurrentLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setErrorMsg(null);

      if (onLocationSelect) {
        onLocationSelect({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }

      // Reverse geocode using Nominatim
      reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (err) {
      setErrorMsg("Error getting location");
      console.error(err);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      setLoadingAddress(true);
      setAddress(null);
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "sih-smart-safety/1.0 (your-email@example.com)",
        },
      });
      if (!resp.ok) {
        throw new Error("Reverse geocode failed");
      }
      const data = await resp.json();
      setAddress(data.display_name || null);
    } catch (err) {
      console.error("Reverse geocode error", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  const openInOSM = () => {
    if (!location) return;
    const { latitude, longitude } = location.coords;
    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
    Linking.openURL(url).catch((e) => console.error("Link open error", e));
  };

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <Text style={styles.title}>OpenStreetMap Location</Text>
        <View style={styles.mapPlaceholder}>
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : location ? (
            <View style={{ width: "100%" }}>
              <View>
                <Text>Lat: {location.coords.latitude.toFixed(6)}</Text>
                <Text>Lng: {location.coords.longitude.toFixed(6)}</Text>
                <Text>Accuracy: ±{location.coords.accuracy?.toFixed(0)}m</Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text>Lat: {location.coords.latitude.toFixed(6)}</Text>
                <Text>Lng: {location.coords.longitude.toFixed(6)}</Text>
                <Text>Accuracy: ±{location.coords.accuracy?.toFixed(0)}m</Text>
                {loadingAddress ? (
                  <Text>Resolving address...</Text>
                ) : address ? (
                  <Text style={styles.addressText}>{address}</Text>
                ) : (
                  <Text style={styles.noteText}>Address not available</Text>
                )}
              </View>
            </View>
          ) : (
            <Text>Getting your location...</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Button mode="outlined" onPress={getCurrentLocation} compact>
            Refresh
          </Button>
          <Button mode="contained" onPress={openInOSM} disabled={!location}>
            Open in OpenStreetMap
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { margin: 8 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  mapPlaceholder: { minHeight: 160, justifyContent: "center", alignItems: "center" },
  addressText: { fontSize: 12, color: "#333", marginTop: 8, textAlign: "center" },
  noteText: { fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 8 },
  errorText: { color: "red" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
});
