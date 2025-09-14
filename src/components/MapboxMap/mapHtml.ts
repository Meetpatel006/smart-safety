
import { MAPBOX_ACCESS_TOKEN } from '../../config';

export const generateMapHTML = (accessToken?: string): string => {
  // Use provided token or fallback to config
  const token = accessToken || MAPBOX_ACCESS_TOKEN;

  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8" />
      <title>Mapbox Map</title>
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.css" rel="stylesheet" />
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.js"></script>
      <script src="https://npmcdn.com/@turf/turf/turf.min.js"></script>
      <style>
          body { margin: 0; padding: 0; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; }
          .mapboxgl-popup-content { font-family: sans-serif; }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <script>
          if (!'${token}'.startsWith('pk.')) {
            alert('Mapbox access token is not set. Please add MAPBOX_ACCESS_TOKEN to your environment variables or config.');
          }
          mapboxgl.accessToken = '${token}';
          const map = new mapboxgl.Map({
              container: 'map',
              style: 'mapbox://styles/mapbox/streets-v11',
              center: [78.9629, 20.5937], // Default to India center
              zoom: 4
          });

          let userMarker = null;

          map.on('load', function () {
              window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'mapReady' }));

              // Add an empty source for geofences
              map.addSource('geofences', {
                  type: 'geojson',
                  data: {
                      type: 'FeatureCollection',
                      features: []
                  }
              });

              // Add layers for geofences
              map.addLayer({
                  id: 'geofence-fill',
                  type: 'fill',
                  source: 'geofences',
                  paint: {
                      'fill-color': ['get', 'color'],
                      'fill-opacity': ['get', 'fillOpacity']
                  }
              });
              map.addLayer({
                  id: 'geofence-line',
                  type: 'line',
                  source: 'geofences',
                  paint: {
                      'line-color': ['get', 'color'],
                      'line-width': ['get', 'weight']
                  }
              });

              // Add a layer for points
              map.addLayer({
                id: 'geofence-points',
                type: 'circle',
                source: 'geofences',
                paint: {
                  'circle-radius': 8,
                  'circle-color': ['get', 'color']
                },
                filter: ['==', '$type', 'Point']
              });

              map.on('click', 'geofence-fill', function (e) {
                  const feature = e.features[0];
                  const popupContent = createPopupContent(feature.properties);
                  new mapboxgl.Popup()
                      .setLngLat(e.lngLat)
                      .setHTML(popupContent)
                      .addTo(map);
              });
          });

          map.on('click', function (e) {
              const { lng, lat } = e.lngLat;
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'mapClick',
                  lng: lng,
                  lat: lat
              }));
          });

          // Unified message handler
          function handleMessageEvent(event) {
              const data = JSON.parse(event.data);
              switch (data.type) {
                  case 'updateLocation':
                      updateLocation(data.longitude, data.latitude, data.accuracy || 0, data.zoomLevel);
                      break;
                  case 'setLocation':
                      if (data.location) {
                          updateLocation(data.location.longitude, data.location.latitude, data.location.accuracy || 0, 14);
                      }
                      break;
                  case 'setGeoFences':
                      renderGeoFences(data.fences || []);
                      break;
                  case 'clearGeoFences':
                      clearAllGeoFences();
                      break;
                  case 'setStyle':
                      if (data.style) {
                          const styleUrl = getStyleUrl(data.style);
                          map.setStyle(styleUrl);
                      }
                      break;
                  case 'changeStyle':
                      map.setStyle(data.style);
                      break;
              }
          }

          function getStyleUrl(styleKey) {
              const styles = {
                  'streets': 'mapbox://styles/mapbox/streets-v11',
                  'outdoors': 'mapbox://styles/mapbox/outdoors-v11',
                  'light': 'mapbox://styles/mapbox/light-v10',
                  'dark': 'mapbox://styles/mapbox/dark-v10',
                  'satellite': 'mapbox://styles/mapbox/satellite-v9',
                  'satelliteStreets': 'mapbox://styles/mapbox/satellite-streets-v11'
              };
              return styles[styleKey] || styles['streets'];
          }

          document.addEventListener('message', handleMessageEvent);
          window.addEventListener('message', handleMessageEvent);

          function updateLocation(lng, lat, zoom) {
              try {
                  // Ensure map is initialized
                  if (!map) return;

                  // Accept either (lng, lat, zoom) or (lng, lat, accuracy, zoom)
                  let accuracy = 0;
                  let targetZoom = 14;
                  if (arguments.length === 3) {
                      // updateLocation(lng, lat, zoom)
                      targetZoom = arguments[2] || 14;
                  } else if (arguments.length >= 4) {
                      // updateLocation(lng, lat, accuracy, zoom)
                      accuracy = arguments[2] || 0;
                      targetZoom = arguments[3] || 14;
                  }

                  // Update or create user marker (blue dot)
                  if (userMarker) {
                      userMarker.setLngLat([lng, lat]);
                  } else {
                      // Try color option first; fallback to element
                      try {
                          userMarker = new mapboxgl.Marker({ color: '#1976d2' }).setLngLat([lng, lat]).addTo(map);
                      } catch (e) {
                          const el = document.createElement('div');
                          el.style.width = '14px';
                          el.style.height = '14px';
                          el.style.borderRadius = '50%';
                          el.style.background = '#1976d2';
                          el.style.border = '3px solid white';
                          userMarker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
                      }
                  }

                  // Handle accuracy circle using Turf.js (accuracy in meters -> km)
                  const srcId = 'user-accuracy-source';
                  const fillLayerId = 'user-accuracy-fill';
                  const lineLayerId = 'user-accuracy-line';

                  // Default to 1 km radius when accuracy is not provided or zero
                  const radiusKm = (accuracy && accuracy > 0) ? (accuracy / 1000) : 1;

                  if (radiusKm > 0) {
                      try {
                          const center = [lng, lat];
                          const turfCircle = turf.circle(center, radiusKm, { steps: 64, units: 'kilometers' });

                          const geojson = {
                              type: 'FeatureCollection',
                              features: [turfCircle]
                          };

                          if (map.getSource(srcId)) {
                              map.getSource(srcId).setData(geojson);
                          } else {
                              map.addSource(srcId, { type: 'geojson', data: geojson });
                              // fill
                              map.addLayer({
                                  id: fillLayerId,
                                  type: 'fill',
                                  source: srcId,
                                  paint: {
                                      'fill-color': '#ff5252',
                                      'fill-opacity': 0.12
                                  }
                              });
                              // outline
                              map.addLayer({
                                  id: lineLayerId,
                                  type: 'line',
                                  source: srcId,
                                  paint: {
                                      'line-color': '#ff1744',
                                      'line-width': 2,
                                      'line-opacity': 0.9
                                  }
                              });
                          }
                      } catch (err) {
                          console.error('Failed to create accuracy circle:', err);
                      }
                  }

                  map.flyTo({ center: [lng, lat], zoom: targetZoom });
              } catch (err) {
                  console.error('updateLocation error:', err);
              }
          }

          function renderGeoFences(fences) {
              const features = fences.map(fence => {
                  let geometry;
                  if (fence.type === 'circle' && fence.coords && fence.radiusKm) {
                      const center = [fence.coords[1], fence.coords[0]];
                      const radius = fence.radiusKm;
                      const options = { steps: 64, units: 'kilometers', properties: fence };
                      geometry = turf.circle(center, radius, options).geometry;
                  } else if (fence.type === 'polygon' && fence.coords) {
                      geometry = { type: 'Polygon', coordinates: [fence.coords.map(c => [c[1], c[0]])] };
                  } else if (fence.type === 'point' && fence.coords) {
                      geometry = { type: 'Point', coordinates: [fence.coords[1], fence.coords[0]] };
                  } else {
                      return null;
                  }

                  const style = getGeofenceStyle(fence);

                  return {
                      type: 'Feature',
                      geometry,
                      properties: { ...fence, ...style }
                  };
              }).filter(Boolean);

              const geojson = {
                  type: 'FeatureCollection',
                  features: features
              };

              const source = map.getSource('geofences');
              if (source) {
                  source.setData(geojson);
              }
          }

          function clearAllGeoFences() {
            const source = map.getSource('geofences');
            if (source) {
              source.setData({
                type: 'FeatureCollection',
                features: []
              });
            }
          }

          function getGeofenceStyle(fence) {
              let color = '#9e9e9e'; // default: standard gray
              let fillOpacity = 0.25;
              let weight = 2;

              if (fence.riskLevel) {
                  const rl = String(fence.riskLevel).toLowerCase();
                  if (rl.includes('very') && rl.includes('high')) color = '#d32f2f';
                  else if (rl.includes('high')) color = '#ff9800';
                  else if (rl.includes('medium')) color = '#ffeb3b';
                  else if (rl.includes('standard') || rl.includes('low')) color = '#9e9e9e';
              }

              return { color, fillOpacity, weight };
          }

          function createPopupContent(properties) {
              let content = '<strong>' + (properties.name || 'Unnamed Geofence') + '</strong>';
              if (properties.category) content += '<br/>Category: ' + properties.category;
              if (properties.riskLevel) content += '<br/>Risk: ' + properties.riskLevel;
              if (properties.radiusKm) content += '<br/>Radius: ' + properties.radiusKm + ' km';
              return content;
          }

      </script>
  </body>
  </html>
  `;
};
