import React, { useEffect, useState } from "react";
import { View, Linking, StyleSheet } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import * as Location from "expo-location";

/*
  OsmMap: renders an interactive native MapView when available (react-native-maps) and
  falls back to a simple coordinate/address card in environments where the native
  map module is not installed (e.g. Expo Go without a custom dev client).

  To enable the interactive native map:
  1. In an Expo-managed project you'll need a custom dev client or an EAS build.
     - Run: `npx expo install react-native-maps` to install the correct version for
       your Expo SDK.
     - Create a dev client / build with EAS: https://docs.expo.dev/development/introduction/
  2. For bare React Native, follow react-native-maps install docs and add the
     necessary native configuration (Android API key, CocoaPods install for iOS).

  This component loads `react-native-maps` at runtime (try/catch). If the native
  module isn't available the component will gracefully fall back to the text UI.
*/

// Runtime load react-native-maps to avoid bundler/native errors in Expo Go.
let NativeMap: any = null;
let NativeMarker: any = null;
let NativeUrlTile: any = null;
try {
  // Use require so Metro/TS won't eagerly fail when module is absent
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps: any = require("react-native-maps");
  NativeMap = maps.default || maps.MapView || maps;
  NativeMarker = maps.Marker || maps.MapMarker || null;
  NativeUrlTile = maps.UrlTile || maps.TileOverlay || null;
} catch (e) {
  // react-native-maps not available at runtime — fall back to non-interactive UI
  NativeMap = null;
  NativeMarker = null;
  NativeUrlTile = null;
}

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
            NativeMap ? (
              // Native interactive map (only available after installing react-native-maps and using a native build / custom dev client)
              <View style={{ width: "100%" }}>
                {/* Render native MapView if available */}
                <NativeMap
                  style={{ height: 220 }}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  {NativeUrlTile ? (
                    <NativeUrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
                  ) : null}
                  {NativeMarker ? (
                    <NativeMarker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="You are here" description={address || undefined} />
                  ) : null}
                </NativeMap>

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
              // Non-interactive fallback for Expo Go or when native module not present
              <View style={{ width: "100%" }}>
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
            )
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
