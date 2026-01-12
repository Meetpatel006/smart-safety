import { TileServerConfig } from './types';

export const generateMapHTML = (tileConfig: TileServerConfig): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
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
          /* Enhanced geofence styles */
          .geofence-popup {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          .geofence-popup .title {
              font-weight: bold;
              font-size: 14px;
              color: #333;
              margin-bottom: 4px;
          }
          .geofence-popup .category {
              font-size: 12px;
              color: #666;
              margin-bottom: 2px;
          }
          .geofence-popup .risk-level {
              font-size: 12px;
              padding: 2px 6px;
              border-radius: 3px;
              display: inline-block;
          }
          .geofence-popup .risk-very-high {
              background-color: #ffebee;
              color: #c62828;
          }
          .geofence-popup .risk-high {
              background-color: #fff3e0;
              color: #ef6c00;
          }
          .geofence-popup .risk-medium {
              background-color: #fffde7;
              color: #f57f17;
          }
          .geofence-popup .risk-low, .geofence-popup .risk-standard {
              background-color: #f3e5f5;
              color: #7b1fa2;
          }
      </style>
  </head>
  <body>
      <div id="map"></div>
      
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
      <!-- Import Turf.js for geospatial operations -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Turf.js/7.2.0/turf.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@turf/turf@7.2.0/turf.min.js"></script>
      <script>
          let map;
          let locationMarker;
          let accuracyCircle;
          let tileLayer;
          let mapInitialized = false;
          
          // Dictionary to store geofence layers by ID for easy management
          let geoFenceLayers = {};
          let geoFenceLayerGroup = null;
          
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
                      setTimeout(initMap, 200); // Retry after 200ms
                      return;
                  }
                  
                  // Check if Turf.js is loaded
                  if (typeof turf === 'undefined') {
                      console.error('Turf.js library not loaded');
                      setTimeout(initMap, 200); // Retry after 200ms
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

                  // Create dedicated panes for different layer types
                  try {
                      if (!map.getPane('geofences')) {
                          map.createPane('geofences');
                          map.getPane('geofences').style.zIndex = 650; // above overlay panes
                      }
                      if (!map.getPane('geofenceLabels')) {
                          map.createPane('geofenceLabels');
                          map.getPane('geofenceLabels').style.zIndex = 660; // above geofences
                      }
                  } catch (e) { 
                      console.log('Panes not supported, using default rendering'); 
                  }
                  
                  // Initialize geofence layer group
                  geoFenceLayerGroup = L.layerGroup().addTo(map);
                  geoFenceLayers = {};
                  
                  // Map click handler
                  map.on('click', function(e) {
                      const { lat, lng } = e.latlng;
                      window.ReactNativeWebView?.postMessage(JSON.stringify({
                          type: 'mapClick',
                          lat: lat,
                          lng: lng
                      }));
                  });
                  
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
          
          // Enhanced geofence rendering with @turf/circle integration
          function renderGeoFences(fences) {
              try {
                  if (!map || !mapInitialized) {
                      console.log('Map not ready, storing fences for later rendering');
                      window._pendingFences = fences;
                      return;
                  }

                  if (!geoFenceLayerGroup) {
                      console.log('Creating geofence layer group');
                      geoFenceLayerGroup = L.layerGroup().addTo(map);
                  }

                  // Clear existing geofence layers
                  clearAllGeoFences();

                  if (!Array.isArray(fences)) {
                      console.warn('Fences is not an array:', fences);
                      return;
                  }
                  
                  console.log('Rendering ' + fences.length + ' geofences on map using Turf.js');
                  let renderedCount = 0;

                  fences.forEach(fence => {
                      try {
                          if (!fence.id) {
                              console.warn('Fence missing ID, skipping:', fence);
                              return;
                          }

                          let layer = null;
                          const popupContent = createPopupContent(fence);
                          
                          // Handle circle geofences using @turf/circle
                          if (fence.type === 'circle' && Array.isArray(fence.coords) && fence.radiusKm) {
                              layer = createTurfCircleLayer(fence, popupContent);
                          }
                          // Handle point geofences
                          else if (fence.type === 'point' && Array.isArray(fence.coords)) {
                              layer = createPointLayer(fence, popupContent);
                          }
                          // Handle polygon geofences
                          else if (fence.type === 'polygon' && Array.isArray(fence.coords)) {
                              layer = createPolygonLayer(fence, popupContent);
                          }
                          else {
                              console.warn('Unknown or invalid geofence type:', fence.type, fence);
                              return;
                          }

                          if (layer) {
                              // Store layer reference for later management
                              geoFenceLayers[fence.id] = layer;
                              geoFenceLayerGroup.addLayer(layer);
                              renderedCount++;
                              
                              // Auto-zoom to custom fences
                              if (fence.id && fence.id.startsWith('custom')) {
                                  console.log('Zooming to custom fence:', fence.name);
                                  const coords = fence.coords;
                                  map.setView([coords[0], coords[1]], 14);
                              }
                          }
                          
                      } catch (innerError) { 
                          console.warn('Failed to render fence', fence.id, innerError);
                      }
                  });
                  
                  console.log('Successfully rendered ' + renderedCount + ' out of ' + fences.length + ' geofences');
                  
                  // Send message back to React Native about geofence rendering status
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'geoFencesRendered',
                      count: renderedCount,
                      total: fences.length
                  }));
                  
              } catch (error) { 
                  console.error('renderGeoFences error:', error);
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'error',
                      message: 'Failed to render geofences: ' + error.message
                  }));
              }
          }

          /**
           * Create a circle geofence layer using @turf/circle for accurate GeoJSON polygons
           */
          function createTurfCircleLayer(fence, popupContent) {
              try {
                  const [lat, lon] = fence.coords;
                  const radiusKm = fence.radiusKm || 1;
                  
                  // Create center point for Turf (note: Turf uses [longitude, latitude] order)
                  const center = [lon, lat];
                  
                  // Configure Turf circle options
                  const options = {
                      steps: 64, // Higher number = smoother circle
                      units: 'kilometers'
                  };
                  
                  // Generate GeoJSON circle polygon using Turf.js
                  const turfCircle = turf.circle(center, radiusKm, options);
                  
                  // Determine styling based on risk level
                  const style = getGeofenceStyle(fence);
                  
                  // Create Leaflet GeoJSON layer from Turf circle
                  const layer = L.geoJSON(turfCircle, {
                      style: style,
                      pane: 'geofences'
                  });
                  
                  // Bind popup to the layer
                  layer.bindPopup(popupContent, {
                      maxWidth: 300,
                      className: 'geofence-popup'
                  });
                  
                  console.log('Created Turf circle for:', fence.name, 'with radius:', radiusKm + 'km');
                  return layer;
                  
              } catch (error) {
                  console.error('Error creating Turf circle layer:', error);
                  // Fallback to simple Leaflet circle
                  return createFallbackCircleLayer(fence, popupContent);
              }
          }

          /**
           * Fallback to Leaflet's built-in circle if Turf fails
           */
          function createFallbackCircleLayer(fence, popupContent) {
              try {
                  const [lat, lon] = fence.coords;
                  const radiusKm = fence.radiusKm || 1;
                  const radiusM = radiusKm * 1000; // Convert km to meters
                  
                  const style = getGeofenceStyle(fence);
                  
                  const circle = L.circle([lat, lon], {
                      radius: radiusM,
                      ...style,
                      pane: 'geofences'
                  });
                  
                  circle.bindPopup(popupContent, {
                      maxWidth: 300,
                      className: 'geofence-popup'
                  });
                  
                  console.log('Created fallback Leaflet circle for:', fence.name);
                  return circle;
                  
              } catch (error) {
                  console.error('Error creating fallback circle:', error);
                  return null;
              }
          }

          /**
           * Create a point geofence layer
           */
          function createPointLayer(fence, popupContent) {
              try {
                  const [lat, lon] = fence.coords;
                  const style = getGeofenceStyle(fence);
                  
                  const marker = L.circleMarker([lat, lon], {
                      radius: 8,
                      color: style.color,
                      fillColor: style.fillColor || style.color,
                      fillOpacity: 0.8,
                      weight: 2,
                      pane: 'geofences'
                  });
                  
                  marker.bindPopup(popupContent, {
                      maxWidth: 300,
                      className: 'geofence-popup'
                  });
                  
                  return marker;
                  
              } catch (error) {
                  console.error('Error creating point layer:', error);
                  return null;
              }
          }

          /**
           * Create a polygon geofence layer
           */
          function createPolygonLayer(fence, popupContent) {
              try {
                  // Convert coordinates to Leaflet format [lat, lon]
                  const latlngs = fence.coords.map(coord => [coord[0], coord[1]]);
                  const style = getGeofenceStyle(fence);
                  
                  const polygon = L.polygon(latlngs, {
                      ...style,
                      pane: 'geofences'
                  });
                  
                  polygon.bindPopup(popupContent, {
                      maxWidth: 300,
                      className: 'geofence-popup'
                  });
                  
                  return polygon;
                  
              } catch (error) {
                  console.error('Error creating polygon layer:', error);
                  return null;
              }
          }

          /**
           * Determine styling based on geofence properties
           */
          function getGeofenceStyle(fence) {
              let color = '#9e9e9e'; // default: standard gray
              let fillOpacity = 0.25;
              let weight = 2;
              let opacity = 0.9;
              
              // Determine color by riskLevel
              if (fence.riskLevel) {
                  const rl = String(fence.riskLevel).toLowerCase();
                  if (rl.includes('very') && rl.includes('high')) {
                      color = '#d32f2f'; // very high -> red
                      fillOpacity = 0.3;
                  } else if (rl.includes('high')) {
                      color = '#ff9800';  // high -> orange
                      fillOpacity = 0.28;
                  } else if (rl.includes('medium') || rl.includes('med')) {
                      color = '#ffeb3b'; // medium -> yellow
                      fillOpacity = 0.25;
                  } else if (rl.includes('standard') || rl.includes('low')) {
                      color = '#9e9e9e'; // standard/low -> gray
                      fillOpacity = 0.2;
                  }
              }
              
              // Adjust styling based on category
              if (fence.category) {
                  const cat = String(fence.category).toLowerCase();
                  if (cat.includes('nuclear')) {
                      color = '#e91e63'; // pink for nuclear
                      weight = 3;
                  } else if (cat.includes('military') || cat.includes('strategic')) {
                      color = '#3f51b5'; // indigo for military
                      weight = 3;
                  } else if (cat.includes('border')) {
                      color = '#795548'; // brown for borders
                      weight = 2;
                  } else if (cat.includes('disaster')) {
                      // Keep risk level colors for disaster areas
                  } else if (cat.includes('conflict') || cat.includes('naxal')) {
                      color = '#f44336'; // red for conflict zones
                      fillOpacity = 0.2;
                  }
              }
              
              return {
                  color: color,
                  fillColor: color,
                  fillOpacity: fillOpacity,
                  weight: weight,
                  opacity: opacity
              };
          }

/**
           * Create enhanced popup content for geofences
           */
          function createPopupContent(fence) {
              const title = escapeHtml(fence.name || 'Unnamed Geofence');
              const category = escapeHtml(fence.category || 'Unknown Category');
              const riskLevel = fence.riskLevel ? escapeHtml(fence.riskLevel) : null;
              const state = fence.state ? escapeHtml(fence.state) : null;
              const source = fence.source ? escapeHtml(fence.source) : null;
              
              let content = '<div class="geofence-popup">';
              content += '<div class="title">' + title + '</div>';
              content += '<div class="category">' + category + '</div>';
              
              if (state) {
                  content += '<div class="category">State: ' + state + '</div>';
              }
              
              if (riskLevel) {
                  const riskClass = 'risk-' + riskLevel.toLowerCase().replace(/\s+/g, '-');
                  content += '<div class="risk-level ' + riskClass + '">Risk: ' + riskLevel + '</div>';
              }
              
              if (fence.distanceToUser !== undefined && fence.distanceToUser !== null) {
                  content += '<div class="category" style="color: #666;">Distance: ' + fence.distanceToUser + ' km</div>';
              }
              
              if (fence.radiusKm) {
                  content += '<div class="category">Radius: ' + fence.radiusKm + ' km</div>';
              }
              
              if (source) {
                  content += '<div class="category" style="font-size: 10px; color: #999; margin-top: 6px;">Source: ' + source + '</div>';
              }
              
              content += '</div>';
              return content;
          }

          /**
           * Clear all geofence layers
           */
          function clearAllGeoFences() {
              try {
                  if (geoFenceLayerGroup) {
                      geoFenceLayerGroup.clearLayers();
                  }
                  geoFenceLayers = {};
                  console.log('Cleared all geofence layers');
              } catch (error) {
                  console.error('Error clearing geofences:', error);
              }
          }

          /**
           * Remove a specific geofence by ID
           */
          function removeGeoFence(fenceId) {
              try {
                  if (geoFenceLayers[fenceId]) {
                      geoFenceLayerGroup.removeLayer(geoFenceLayers[fenceId]);
                      delete geoFenceLayers[fenceId];
                      console.log('Removed geofence:', fenceId);
                  }
              } catch (error) {
                  console.error('Error removing geofence:', fenceId, error);
              }
          }

          function escapeHtml(str) {
              if (!str) return '';
              return String(str).replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&#039;');
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
                      if (geoFenceLayerGroup) {
                          map.removeLayer(geoFenceLayerGroup);
                          geoFenceLayerGroup = null;
                      }
                      
                      // Clear geofence references
                      geoFenceLayers = {};
                      
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
                      case 'updateGeoFences': // Handle both message types
                          console.log('Received geofences update:', data.fences ? data.fences.length : 0, 'items');
                          renderGeoFences(data.fences || []);
                          break;
                      case 'clearGeoFences':
                          clearAllGeoFences();
                          break;
                      case 'removeGeoFence':
                          if (data.fenceId) {
                              removeGeoFence(data.fenceId);
                          }
                          break;
                      default:
                          console.log('Unknown message type:', data.type);
                  }
              } catch (error) {
                  console.error('Error handling message:', error);
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'error',
                      message: 'Message handling error: ' + error.message
                  }));
              }
          }

          // Attach handler for both document (Android) and window (iOS)
          document.addEventListener && document.addEventListener('message', handleMessageEvent);
          window.addEventListener && window.addEventListener('message', handleMessageEvent);
          
          // Single initialization call with proper order
          let initAttempts = 0;
          const maxInitAttempts = 30; // Increased timeout for better network handling
          
          function tryInitMap() {
              if (mapInitialized) {
                  return;
              }
              
              if (typeof L !== 'undefined' && typeof turf !== 'undefined' && document.getElementById('map')) {
                  initMap();
              } else if (initAttempts < maxInitAttempts) {
                  initAttempts++;
                  setTimeout(tryInitMap, 200); // Increased interval for slower networks
                  
                  // Log what's missing for debugging
                  if (initAttempts % 5 === 0) {
                      const missing = [];
                      if (typeof L === 'undefined') missing.push('Leaflet');
                      if (typeof turf === 'undefined') missing.push('Turf.js');
                      if (!document.getElementById('map')) missing.push('DOM element');
                      console.log('Waiting for:', missing.join(', '), '- Attempt', initAttempts, '/', maxInitAttempts);
                  }
              } else {
                  console.error('Failed to initialize map after maximum attempts. Missing dependencies or DOM element.');
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'error',
                      message: 'Map initialization timeout - check network connection and try again'
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