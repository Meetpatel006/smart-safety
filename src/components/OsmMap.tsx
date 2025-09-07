import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Platform, Alert, Dimensions } from "react-native";
import { Card, Text, Button, ActivityIndicator, Chip } from "react-native-paper";
import { WebView } from 'react-native-webview';
import * as Location from "expo-location";

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

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp?: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface OsmMapProps {
  showCurrentLocation?: boolean;
  onLocationSelect?: (location: LocationData) => void;
  onLocationChange?: (location: LocationData) => void;
  style?: any;
  zoomLevel?: number;
  mapWidth?: number;
  mapHeight?: number;
  geoFences?: any[]; // array of geo-fence objects: { id, type, coords, radiusKm, riskLevel, name }
}

type TileProvider = 'openstreetmap' | 'cartodb' | 'stamen';

export default function OsmMap({
  showCurrentLocation = true,
  onLocationSelect,
  onLocationChange,
  style,
  zoomLevel = 15,
  mapWidth = Dimensions.get('window').width - 32,
  mapHeight = 300,
  geoFences
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

  // Tile server configurations
  const tileServers = {
    openstreetmap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    cartodb: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '© OpenStreetMap contributors © CARTO'
    },
    stamen: {
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
      attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors'
    }
  };

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
    if (!webViewRef.current || !mapReady) return
    if (!Array.isArray(geoFences)) return

    try {
      console.log(`Sending ${geoFences.length} geofences to WebView, including custom fences:`, 
        geoFences.filter(f => f.id && f.id.startsWith('custom')).map(f => f.name))
      webViewRef.current.postMessage(JSON.stringify({ type: 'setGeoFences', fences: geoFences }))
    } catch (e) {
      console.warn('failed to post geoFences to webview', e)
    }
  }, [mapReady, geoFences])

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
      await reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude);

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

  const reverseGeocode = async (lat: number, lon: number, retryCount: number = 0) => {
    try {
      setLoadingAddress(true);
      
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en&addressdetails=1&zoom=18`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "sih-smart-safety/2.0 (contact@smartsafety.app)",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const formattedAddress = data.display_name || "Address not found";
      setAddress(formattedAddress);
      
      return formattedAddress;
    } catch (err: any) {
      console.error("Reverse geocoding error:", err);
      
      // Retry logic for network errors
      if (retryCount < 2) {
        setTimeout(() => reverseGeocode(lat, lon, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setAddress("Address lookup failed");
    } finally {
      setLoadingAddress(false);
    }
  };

  const updateMapLocation = () => {
    if (!location || !webViewRef.current) return;

    const { latitude, longitude } = location.coords;
    const accuracy = location.coords.accuracy || 0;
    
    const jsCode = `
      if (typeof updateLocation === 'function') {
        updateLocation(${latitude}, ${longitude}, ${accuracy}, ${zoomLevel});
      }
    `;
    
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
      const tileConfig = tileServers[provider];
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
          
          // Optionally reverse geocode the clicked location
          reverseGeocode(lat, lng);
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

  const generateMapHTML = () => {
    const tileConfig = tileServers[tileProvider];
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .accuracy-circle { 
                fill: rgba(70, 130, 180, 0.2);
                stroke: rgba(70, 130, 180, 0.8);
                stroke-width: 2;
            }
            .location-marker {
                background: #4285f4;
                width: 20px;
                height: 20px;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            let map;
            let locationMarker;
            let accuracyCircle;
            let tileLayer;
            let mapInitialized = false;
            
            // Initialize map with proper checks
            function initMap() {
                try {
                    // Check if map is already initialized
                    if (mapInitialized && map) {
                        console.log('Map already initialized, skipping...');
                        return;
                    }
                    
                    // Check if map container exists
                    const mapContainer = document.getElementById('map');
                    if (!mapContainer) {
                        console.error('Map container not found');
                        return;
                    }
                    
                    // Check if Leaflet is loaded
                    if (typeof L === 'undefined') {
                        console.error('Leaflet library not loaded');
                        setTimeout(initMap, 100); // Retry after 100ms
                        return;
                    }
                    
                    // Clean up existing map if it exists
                    if (map) {
                        cleanupMap();
                    }
                    
                    // Clear the map container
                    mapContainer.innerHTML = '';
                    
                    map = L.map('map', {
                        center: [20.5937, 78.9629], // Default to India center
                        zoom: 5,
                        zoomControl: true,
                        scrollWheelZoom: true,
                        doubleClickZoom: true,
                        touchZoom: true
                    });
                    
                    // Add initial tile layer
                    tileLayer = L.tileLayer('${tileConfig.url}', {
                        attribution: '${tileConfig.attribution}',
                        maxZoom: 18,
                        subdomains: 'abc'
                    }).addTo(map);
                    
                    // Map click handler
                    map.on('click', function(e) {
                        const { lat, lng } = e.latlng;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'mapClick',
                            lat: lat,
                            lng: lng
                        }));
                    });

          // Geo-fence layer group and renderer (declared in outer scope so message handlers can call it)
          // Will be initialized when map is created.
          let geoFenceLayerGroup = null;

          function renderGeoFences(fences) {
            try {
              if (!map) {
                // store fences for later if needed
                console.log('Map not ready, storing fences for later rendering');
                window._pendingFences = fences;
                return;
              }

              if (!geoFenceLayerGroup) {
                console.log('Creating geofence layer group');
                geoFenceLayerGroup = L.layerGroup().addTo(map);
              }

              // Clear existing
              geoFenceLayerGroup.clearLayers();
              if (!Array.isArray(fences)) {
                console.warn('Fences is not an array:', fences);
                return;
              }
              
              console.log('Rendering ' + fences.length + ' geofences on map');
              let renderedCount = 0;

              fences.forEach(f => {
                try {
                  // Debug output for custom fences
                  if (f.id && f.id.startsWith('custom')) {
                    console.log('Processing custom fence:', f.name, f.coords, f.type, f.radiusKm);
                  }

                  if (f.type === 'circle' && Array.isArray(f.coords)) {
                    const latlng = L.latLng(f.coords[0], f.coords[1]);
                    const radius = (f.radiusKm || 1) * 1000; // km -> m
                    const color = f.riskLevel && String(f.riskLevel).toLowerCase().includes('very') ? '#d32f2f' : (f.riskLevel && String(f.riskLevel).toLowerCase().includes('high') ? '#ff9800' : '#4caf50');
                    const circle = L.circle(latlng, { radius, color, fillOpacity: 0.25, weight: 2 }).bindPopup('<b>' + escapeHtml(f.name||'') + '</b><br/>' + escapeHtml(f.category||''));
                    geoFenceLayerGroup.addLayer(circle);
                    renderedCount++;
                    
                    // If it's a custom fence, automatically zoom to it
                    if (f.id && f.id.startsWith('custom')) {
                      console.log('Zooming to custom fence:', f.name);
                      map.setView(latlng, 14); // Zoom to level 14 to see the circle
                    }
                  } else if (f.type === 'point' && Array.isArray(f.coords)) {
                    const latlng = L.latLng(f.coords[0], f.coords[1]);
                    const marker = L.circleMarker(latlng, { radius: 6, color: '#1976d2' }).bindPopup('<b>' + escapeHtml(f.name||'') + '</b><br/>' + escapeHtml(f.category||''));
                    geoFenceLayerGroup.addLayer(marker);
                    renderedCount++;
                  } else if (f.type === 'polygon' && Array.isArray(f.coords)) {
                    const latlngs = f.coords.map(c => [c[0], c[1]]);
                    const poly = L.polygon(latlngs, { color: '#8e24aa', fillOpacity: 0.12 }).bindPopup('<b>' + escapeHtml(f.name||'') + '</b><br/>' + escapeHtml(f.category||''));
                    geoFenceLayerGroup.addLayer(poly);
                    renderedCount++;
                  }
                } catch (inner) { 
                  console.warn('Failed to render fence', f.id, inner);
                }
              });
              
              console.log('Successfully rendered ' + renderedCount + ' out of ' + fences.length + ' geofences');
              
              // Send message back to React Native about geofence rendering status
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'geoFencesRendered',
                count: renderedCount
              }));
              
            } catch (e) { 
              console.error('renderGeoFences error', e);
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'error',
                message: 'Failed to render geofences: ' + e.message
              }));
            }
          }

          function escapeHtml(s) {
            if (!s) return '';
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          }
                    
                    // Mark as initialized
                    mapInitialized = true;

                    // If any fences were sent before initialization, render them now
                    try {
                      if (window._pendingFences) {
                        renderGeoFences(window._pendingFences);
                        window._pendingFences = null;
                      }
                    } catch (e) { /* ignore */ }

                    // Notify that map is ready
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'mapReady'
                    }));
                    
                } catch (error) {
                    console.error('Map initialization error:', error);
                    mapInitialized = false;
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'error',
                        message: 'Map initialization failed: ' + error.message
                    }));
                }
            }
            
            // Cleanup existing map
            function cleanupMap() {
                try {
                    if (map) {
                        // Remove layers
                        if (locationMarker) {
                            map.removeLayer(locationMarker);
                            locationMarker = null;
                        }
                        if (accuracyCircle) {
                            map.removeLayer(accuracyCircle);
                            accuracyCircle = null;
                        }
                        if (tileLayer) {
                            map.removeLayer(tileLayer);
                            tileLayer = null;
                        }
                        
                        // Remove the map instance
                        map.remove();
                        map = null;
                    }
                    mapInitialized = false;
                } catch (error) {
                    console.error('Error cleaning up map:', error);
                }
            }
            
            // Update location marker
            function updateLocation(lat, lng, accuracy, zoom) {
                try {
                    // Check if map is initialized
                    if (!map || !mapInitialized) {
                        console.warn('Map not initialized, cannot update location');
                        return;
                    }
                    
                    const latlng = L.latLng(lat, lng);
                    
                    // Remove existing markers
                    if (locationMarker) {
                        map.removeLayer(locationMarker);
                        locationMarker = null;
                    }
                    if (accuracyCircle) {
                        map.removeLayer(accuracyCircle);
                        accuracyCircle = null;
                    }
                    
                    // Add accuracy circle if accuracy is available
                    if (accuracy > 0) {
                        accuracyCircle = L.circle(latlng, {
                            radius: accuracy,
                            className: 'accuracy-circle'
                        }).addTo(map);
                    }
                    
                    // Add location marker
                    const customIcon = L.divIcon({
                        html: '<div class="location-marker"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                        className: ''
                    });
                    
                    locationMarker = L.marker(latlng, { icon: customIcon }).addTo(map);
                    
                    // Center map on location
                    map.setView(latlng, zoom);
                    
                } catch (error) {
                    console.error('Error updating location:', error);
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'error',
                        message: 'Failed to update location: ' + error.message
                    }));
                }
            }
            
            // Change tile provider
            function changeTileProvider(url, attribution) {
                try {
                    // Check if map is initialized
                    if (!map || !mapInitialized) {
                        console.warn('Map not initialized, cannot change tile provider');
                        return;
                    }
                    
                    if (tileLayer) {
                        map.removeLayer(tileLayer);
                        tileLayer = null;
                    }
                    
                    tileLayer = L.tileLayer(url, {
                        attribution: attribution,
                        maxZoom: 18,
                        subdomains: 'abc'
                    }).addTo(map);
                    
                } catch (error) {
                    console.error('Error changing tile provider:', error);
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'error',
                        message: 'Failed to change tile provider: ' + error.message
                    }));
                }
            }
            
      // Unified message handler for messages from React Native (support both Android and iOS)
      function handleMessageEvent(event) {
        try {
          const payload = event && event.data ? event.data : event;
          const data = typeof payload === 'string' ? JSON.parse(payload) : (payload && payload.data ? JSON.parse(payload.data) : payload);

          switch (data.type) {
            case 'updateLocation':
              updateLocation(data.latitude, data.longitude, data.accuracy, data.zoomLevel);
              break;
            case 'changeTileProvider':
              changeTileProvider(data.url, data.attribution);
              break;
            case 'setGeoFences':
              renderGeoFences(data.fences);
              break;
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }

      // Attach handler for both document (Android) and window (iOS)
      document.addEventListener && document.addEventListener('message', handleMessageEvent);
      window.addEventListener && window.addEventListener('message', handleMessageEvent);
            
            // Single initialization call with proper order
            let initAttempts = 0;
            const maxInitAttempts = 10;
            
            function tryInitMap() {
                if (mapInitialized) {
                    return;
                }
                
                if (typeof L !== 'undefined' && document.getElementById('map')) {
                    initMap();
                } else if (initAttempts < maxInitAttempts) {
                    initAttempts++;
                    setTimeout(tryInitMap, 100);
                } else {
                    console.error('Failed to initialize map after maximum attempts');
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'error',
                        message: 'Map initialization timeout'
                    }));
                }
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', tryInitMap);
            } else {
                tryInitMap();
            }
            
            // Cleanup on page unload
            window.addEventListener('beforeunload', function() {
                cleanupMap();
            });
        </script>
    </body>
    </html>
    `;
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

  const formatCoordinates = (lat: number, lon: number) => {
    return {
      latitude: lat.toFixed(6),
      longitude: lon.toFixed(6),
      dms: {
        lat: convertToDMS(lat, 'lat'),
        lon: convertToDMS(lon, 'lon'),
      }
    };
  };

  const convertToDMS = (decimal: number, type: 'lat' | 'lon') => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = ((minutesFloat - minutes) * 60).toFixed(2);
    
    const direction = type === 'lat' 
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W');
    
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Map</Text>
          <Button
            mode="outlined"
            onPress={() => getCurrentLocation()}
            disabled={loadingLocation}
            compact
            icon="refresh"
          >
            {loadingLocation ? "Locating..." : "Refresh"}
          </Button>
        </View>

        {/* Error Display */}
        {errorMsg && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Button mode="outlined" onPress={() => getCurrentLocation()} compact>
              Retry
            </Button>
          </View>
        )}

        {/* Leaflet Map */}
        <View style={[styles.mapContainer, { height: mapHeight }]}>
          <WebView
            key={webViewKey} // Force remount when key changes
            ref={webViewRef}
            source={{ html: generateMapHTML() }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text>Loading interactive map...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              setErrorMsg(`Failed to load map: ${nativeEvent.description}`);
              setMapReady(false);
            }}
            onLoadStart={() => {
              setMapReady(false);
              setErrorMsg(null); // Clear any previous errors
            }}
            onLoadEnd={() => {
              console.log('WebView loaded successfully');
              // Don't set mapReady here, wait for the 'mapReady' message from the HTML
            }}
            // Disable zoom controls to prevent conflicts
            scalesPageToFit={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            // Allow mixed content for map tiles
            mixedContentMode="compatibility"
            // Additional WebView optimizations
            cacheEnabled={true}
            bounces={false}
          />
        </View>

        {/* Location Information */}
        {location && (
          <View style={styles.locationInfo}>
            <View style={styles.coordinates}>
              <Text style={styles.coordText}>
                Lat: {location.coords.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordText}>
                Lng: {location.coords.longitude.toFixed(6)}
              </Text>
              {location.coords.accuracy && (
                <Text style={styles.coordText}>
                  ±{location.coords.accuracy.toFixed(0)}m
                </Text>
              )}
            </View>

            {/* DMS Coordinates */}
            <View style={styles.dmsContainer}>
              <Text style={styles.dmsText}>
                {formatCoordinates(location.coords.latitude, location.coords.longitude).dms.lat}
              </Text>
              <Text style={styles.dmsText}>
                {formatCoordinates(location.coords.latitude, location.coords.longitude).dms.lon}
              </Text>
            </View>

            {/* Address */}
            {loadingAddress ? (
              <View style={styles.addressLoading}>
                <ActivityIndicator size="small" />
                <Text>Resolving address...</Text>
              </View>
            ) : address ? (
              <Text style={styles.addressText}>{address}</Text>
            ) : (
              <Text style={styles.noteText}>Address not available</Text>
            )}
          </View>
        )}

        {/* Tile Provider Selection */}
        <View style={styles.providerContainer}>
          <Text style={styles.providerLabel}>Map Tile Provider:</Text>
          <View style={styles.providerChips}>
            {Object.keys(tileServers).map((provider) => (
              <Chip
                key={provider}
                selected={tileProvider === provider}
                onPress={() => changeTileProvider(provider as TileProvider)}
                compact
                style={styles.chip}
              >
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </Chip>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            mode="outlined"
            onPress={() => getCurrentLocation()}
            disabled={loadingLocation}
            compact
            icon="crosshairs-gps"
          >
            My Location
          </Button>
          
          <Button
            mode="contained"
            onPress={openExternalMap}
            disabled={!location}
            compact
            icon="open-in-new"
          >
            Open Map
          </Button>
          
          <Button
            mode="outlined"
            onPress={shareLocation}
            disabled={!location}
            compact
            icon="share"
          >
            Share
          </Button>
        </View>

        {/* Additional Info */}
        {location && (
          <View style={styles.infoContainer}>
            <Text style={styles.timestamp}>
              Last updated: {new Date(location.timestamp).toLocaleTimeString()}
            </Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#d32f2f",
    flex: 1,
    marginRight: 8,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  locationInfo: {
    marginBottom: 16,
  },
  coordinates: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
  coordText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  dmsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    backgroundColor: "#fff3e0",
    padding: 8,
    borderRadius: 6,
  },
  dmsText: {
    fontSize: 11,
    color: "#e65100",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addressLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
  },
  addressText: {
    fontSize: 13,
    color: "#2e7d32",
    textAlign: "center",
    backgroundColor: "#e8f5e8",
    padding: 12,
    borderRadius: 8,
    lineHeight: 18,
  },
  noteText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    padding: 8,
  },
  providerContainer: {
    marginBottom: 16,
  },
  providerLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  providerChips: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
  },
  timestamp: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  provider: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
});