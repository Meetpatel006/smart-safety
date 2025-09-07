import { TileServerConfig } from './types';

export const generateMapHTML = (tileConfig: TileServerConfig): string => {
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

                  // Create a dedicated pane for geofences so they render above other layers
                  try {
                    if (!map.getPane('geofences')) {
                      map.createPane('geofences');
                      map.getPane('geofences').style.zIndex = 650; // above overlay panes
                      map.getPane('geofences').style.pointerEvents = 'none';
                    }
                  } catch (e) { /* ignore if panes unsupported */ }
                  
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
                  // Determine color by riskLevel (support multiple textual forms)
                  let color = '#9e9e9e'; // default: standard gray
                  if (f.riskLevel) {
                    const rl = String(f.riskLevel).toLowerCase();
                    if (rl.includes('very')) color = '#d32f2f'; // very high -> red
                    else if (rl.includes('high')) color = '#ff9800';  // high -> orange
                    else if (rl.includes('medium') || rl.includes('med')) color = '#ffeb3b'; // medium -> yellow
                    else if (rl.includes('standard') || rl.includes('low')) color = '#9e9e9e'; // standard/low -> gray
                  }
                  const circle = L.circle(latlng, { radius, color, fillColor: color, fillOpacity: 0.25, weight: 2, opacity: 0.9, pane: 'geofences' }).bindPopup('<b>' + escapeHtml(f.name||'') + '</b><br/>' + escapeHtml(f.category||''));
                  geoFenceLayerGroup.addLayer(circle);
                  try { circle.bringToFront(); } catch (e) {}
                  renderedCount++;
                  
                  // If it's a custom fence, automatically zoom to it
                  if (f.id && f.id.startsWith('custom')) {
                    console.log('Zooming to custom fence:', f.name);
                    map.setView(latlng, 14); // Zoom to level 14 to see the circle
                  }
                } else if (f.type === 'point' && Array.isArray(f.coords)) {
                  const latlng = L.latLng(f.coords[0], f.coords[1]);
                  const marker = L.circleMarker(latlng, { radius: 6, color: '#1976d2', fillColor: '#1976d2', fillOpacity: 1, pane: 'geofences' }).bindPopup('<b>' + escapeHtml(f.name||'') + '</b><br/>' + escapeHtml(f.category||''));
                  geoFenceLayerGroup.addLayer(marker);
                  renderedCount++;
                } else if (f.type === 'polygon' && Array.isArray(f.coords)) {
                  const latlngs = f.coords.map(c => [c[0], c[1]]);
                  const poly = L.polygon(latlngs, { color: '#8e24aa', fillColor: '#8e24aa', fillOpacity: 0.12, pane: 'geofences' }).bindPopup('<b>' + escapeHtml(f.name||'') + '</b><br/>' + escapeHtml(f.category||''));
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
