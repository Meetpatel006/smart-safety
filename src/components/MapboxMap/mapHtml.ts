
export const generateMapHTML = (): string => {
  // IMPORTANT: Replace with your Mapbox access token
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiaGl0ZXNodGFud2FkYSIsImEiOiJjbHdjZ2ZqY2wwMHdyMmlvNm5ucG9qZ3h3In0.I3i_5_E8Cq6-6_A92-weJA';

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
          if (!'${MAPBOX_ACCESS_TOKEN}'.startsWith('pk.')) {
            alert('Mapbox access token is not set. Please add it to mapHtml.ts');
          }
          mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
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
                      updateLocation(data.longitude, data.latitude, data.zoomLevel);
                      break;
                  case 'setGeoFences':
                      renderGeoFences(data.fences || []);
                      break;
                  case 'clearGeoFences':
                      clearAllGeoFences();
                      break;
                  case 'changeStyle':
                      map.setStyle(data.style);
                      break;
              }
          }

          document.addEventListener('message', handleMessageEvent);
          window.addEventListener('message', handleMessageEvent);

          function updateLocation(lng, lat, zoom) {
              if (userMarker) {
                  userMarker.setLngLat([lng, lat]);
              } else {
                  userMarker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
              }
              map.flyTo({
                  center: [lng, lat],
                  zoom: zoom || 14
              });
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
