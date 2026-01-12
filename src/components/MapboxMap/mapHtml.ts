
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

              // Click handler for grid center points
              map.on('click', 'geofence-points', function (e) {
                  const feature = e.features[0];
                  const popupContent = createPopupContent(feature.properties);
                  new mapboxgl.Popup()
                      .setLngLat(e.lngLat)
                      .setHTML(popupContent)
                      .addTo(map);
              });

              // Change cursor on hover
              map.on('mouseenter', 'geofence-fill', function () { map.getCanvas().style.cursor = 'pointer'; });
              map.on('mouseleave', 'geofence-fill', function () { map.getCanvas().style.cursor = ''; });
              map.on('mouseenter', 'geofence-points', function () { map.getCanvas().style.cursor = 'pointer'; });
              map.on('mouseleave', 'geofence-points', function () { map.getCanvas().style.cursor = ''; });
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
                                      'fill-color': '#22C55E',
                                      'fill-opacity': 0.15
                                  }
                              });
                              // outline
                              map.addLayer({
                                  id: lineLayerId,
                                  type: 'line',
                                  source: srcId,
                                  paint: {
                                      'line-color': '#16A34A',
                                      'line-width': 2,
                                      'line-opacity': 0.8
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

          // --- CLUSTERING LOGIC ---
          function clusterFeatures(fences, distanceThresholdKm) {
              const clusters = [];
              const visited = new Set();

              for (let i = 0; i < fences.length; i++) {
                  if (visited.has(i)) continue;

                  const cluster = [fences[i]];
                  visited.add(i);

                  const queue = [fences[i]];

                  while (queue.length > 0) {
                      const current = queue.pop();
                      const currentCoords = current.coords || [];

                      for (let j = 0; j < fences.length; j++) {
                          if (visited.has(j)) continue;

                          const neighbor = fences[j];
                          const neighborCoords = neighbor.coords || [];
                          
                          // Calculate distance using Turf.js
                          const from = turf.point([currentCoords[1], currentCoords[0]]); // [lng, lat]
                          const to = turf.point([neighborCoords[1], neighborCoords[0]]);
                          const distance = turf.distance(from, to, { units: 'kilometers' });

                          if (distance <= distanceThresholdKm) {
                              visited.add(j);
                              cluster.push(neighbor);
                              queue.push(neighbor);
                          }
                      }
                  }
                  clusters.push(cluster);
              }
              return clusters;
          }

          function getRiskPriority(level) {
              const l = String(level || '').toLowerCase();
              if (l.includes('very') && l.includes('high')) return 4;
              if (l.includes('high')) return 3;
              if (l.includes('medium')) return 2;
              return 1;
          }

          function renderGeoFences(fences) {
              // Only cluster dynamic risk zones (from server)
              const dynamicFences = fences.filter(f => f.source === 'server' || f.category === 'Dynamic Risk Zone');
              const staticFences = fences.filter(f => f.source !== 'server' && f.category !== 'Dynamic Risk Zone');

              const features = [];

              // 1. Cluster dynamic fences (threshold = 600m for 500m grids)
              const clusters = clusterFeatures(dynamicFences, 0.6);

              clusters.forEach(cluster => {
                  if (cluster.length === 0) return;

                  // Calculate Centroid and Max Risk
                  let sumLat = 0, sumLng = 0, maxRiskScore = 0, maxRiskLevel = 'Low';

                  cluster.forEach(f => {
                      const [lat, lng] = f.coords || [0, 0];
                      sumLat += lat;
                      sumLng += lng;

                      const score = f.metadata?.riskScore || 0;
                      if (score > maxRiskScore) {
                          maxRiskScore = score;
                          maxRiskLevel = f.riskLevel || 'Low';
                      } else if (getRiskPriority(f.riskLevel) > getRiskPriority(maxRiskLevel)) {
                          maxRiskLevel = f.riskLevel;
                      }
                  });

                  const centroidLat = sumLat / cluster.length;
                  const centroidLng = sumLng / cluster.length;

                  // Calculate Radius: Distance to furthest grid center + grid radius (250m for 500m grids)
                  let requiredRadiusKm = 0.25;

                  if (cluster.length > 1) {
                      let maxDist = 0;
                      const centroidPoint = turf.point([centroidLng, centroidLat]);
                      
                      cluster.forEach(f => {
                          const [lat, lng] = f.coords || [0, 0];
                          const gridPoint = turf.point([lng, lat]);
                          const dist = turf.distance(centroidPoint, gridPoint, { units: 'kilometers' });
                          if (dist > maxDist) maxDist = dist;
                      });
                      requiredRadiusKm = maxDist + 0.25;
                  }

                  // Create cluster zone circle
                  const clusterStyle = getGeofenceStyle({ riskLevel: maxRiskLevel, category: 'cluster' });
                  const clusterCircle = turf.circle([centroidLng, centroidLat], requiredRadiusKm, { steps: 64, units: 'kilometers' });

                  features.push({
                      type: 'Feature',
                      geometry: clusterCircle.geometry,
                      properties: {
                          name: maxRiskLevel + ' Risk Cluster',
                          riskLevel: maxRiskLevel,
                          category: 'Merged Risk Zone',
                          clusterSize: cluster.length,
                          maxRiskScore: maxRiskScore.toFixed(2),
                          isCluster: true,
                          color: clusterStyle.color,
                          fillOpacity: 0.35,
                          weight: 2
                      }
                  });

                  // Add arrow markers for individual grid centers
                  cluster.forEach(f => {
                      const [lat, lng] = f.coords || [0, 0];
                      const gridStyle = getGeofenceStyle(f);
                      const gridName = f.metadata?.gridName || f.name || 'Unknown Zone';

                      features.push({
                          type: 'Feature',
                          geometry: { type: 'Point', coordinates: [lng, lat] },
                          properties: {
                              name: gridName,
                              riskLevel: f.riskLevel,
                              riskScore: f.metadata?.riskScore?.toFixed(2) || 'N/A',
                              gridId: f.id,
                              gridName: gridName,
                              lastUpdated: f.metadata?.lastUpdated || 'N/A',
                              isGridCenter: true,
                              color: gridStyle.color,
                              fillOpacity: 1,
                              weight: 0
                          }
                      });
                  });
              });

              // 2. Render static fences normally (bundled data)
              staticFences.forEach(fence => {
                  let geometry;
                  if (fence.type === 'circle' && fence.coords && fence.radiusKm) {
                      const center = [fence.coords[1], fence.coords[0]];
                      geometry = turf.circle(center, fence.radiusKm, { steps: 64, units: 'kilometers' }).geometry;
                  } else if (fence.type === 'polygon' && fence.coords) {
                      geometry = { type: 'Polygon', coordinates: [fence.coords.map(c => [c[1], c[0]])] };
                  } else if (fence.type === 'point' && fence.coords) {
                      geometry = { type: 'Point', coordinates: [fence.coords[1], fence.coords[0]] };
                  } else {
                      return;
                  }

                  const style = getGeofenceStyle(fence);

                  features.push({
                      type: 'Feature',
                      geometry,
                      properties: { ...fence, ...style }
                  });
              });

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
              let markerType = 'zone'; // zone, police, hospital, danger

              // Category-based styling for help locations
              const category = (fence.category || '').toLowerCase();
              if (category.includes('police') || category.includes('security')) {
                  color = '#6366F1'; // Indigo for police
                  markerType = 'police';
                  fillOpacity = 0.3;
              } else if (category.includes('hospital') || category.includes('medical')) {
                  color = '#EF4444'; // Red for hospitals
                  markerType = 'hospital';
                  fillOpacity = 0.3;
              } else if (fence.riskLevel) {
                  // Risk-based styling
                  const rl = String(fence.riskLevel).toLowerCase();
                  if (rl.includes('very') && rl.includes('high')) {
                      color = '#d32f2f';
                      markerType = 'danger';
                  }
                  else if (rl.includes('high')) {
                      color = '#ff9800';
                      markerType = 'danger';
                  }
                  else if (rl.includes('medium')) color = '#ffeb3b';
                  else if (rl.includes('standard') || rl.includes('low')) color = '#22C55E'; // Green for safe
              }

              return { color, fillOpacity, weight, markerType };
          }

          function createPopupContent(properties) {
              // Cluster popup
              if (properties.isCluster) {
                  return '<div style="text-align:center; min-width: 160px;">' +
                      '<h3 style="margin:0 0 8px 0; color:' + (properties.color || '#333') + '">' + (properties.riskLevel || 'Unknown') + ' Risk Cluster</h3>' +
                      '<hr style="margin: 5px 0; border: 0; border-top: 1px solid #ccc;">' +
                      '<p style="margin:5px 0"><strong>Merged:</strong> ' + (properties.clusterSize || 1) + ' Danger Zones</p>' +
                      '<p style="margin:5px 0"><strong>Max Risk Score:</strong> ' + (properties.maxRiskScore || 'N/A') + '</p>' +
                      '</div>';
              }

              // Individual grid center popup
              if (properties.isGridCenter) {
                  const lastUpdated = properties.lastUpdated && properties.lastUpdated !== 'N/A' 
                      ? new Date(properties.lastUpdated).toLocaleTimeString() 
                      : 'N/A';
                  const gridName = properties.gridName || properties.name || 'Unknown Zone';
                  return '<div style="text-align:center; min-width: 150px;">' +
                      '<h4 style="margin:0; color:' + (properties.color || '#333') + '">' + (properties.riskLevel || 'Unknown') + ' Risk Zone</h4>' +
                      '<p style="margin:5px 0; font-weight:bold;">' + gridName + '</p>' +
                      '<hr style="margin: 5px 0; border: 0; border-top: 1px solid #ccc;">' +
                      '<p style="margin:5px 0"><strong>Score:</strong> ' + (properties.riskScore || 'N/A') + ' / 1.0</p>' +
                      '<p style="margin:5px 0"><strong>Grid ID:</strong> ' + (properties.gridId || 'N/A') + '</p>' +
                      '<p style="margin:5px 0; font-size: 0.85em; color: #666;">Last Updated: ' + lastUpdated + '</p>' +
                      '</div>';
              }

              // Default popup for static fences
              let content = '<strong>' + (properties.name || 'Unnamed Geofence') + '</strong>';
              if (properties.category) content += '<br/>Category: ' + properties.category;
              if (properties.riskLevel) content += '<br/>Risk: ' + properties.riskLevel;
              if (properties.distanceToUser !== undefined && properties.distanceToUser !== null) {
                  content += '<br/><span style="color: #666;">Distance: ' + properties.distanceToUser + ' km</span>';
              }
              if (properties.radiusKm) content += '<br/>Radius: ' + properties.radiusKm + ' km';
              return content;
          }

      </script>
  </body>
  </html>
  `;
};
