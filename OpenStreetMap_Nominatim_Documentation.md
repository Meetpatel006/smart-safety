# OpenStreetMap (OSM) + Nominatim Integration

## Overview
This document provides an overview and setup guide for integrating OpenStreetMap (OSM) and Nominatim into your application. These tools enable map rendering, geocoding, and reverse geocoding functionalities.

---

## OpenStreetMap (OSM)

### Overview
OpenStreetMap is a collaborative project to create a free, editable map of the world. It provides tools and libraries for integrating maps into applications.

### Key Features
- Map rendering using libraries like `osmdroid`.
- Offline tile caching and management.
- Custom tile sources and overlays for markers, lines, and polygons.
- Integration with external tile sources like Bing Maps.

### React Native Integration

There is no official OpenStreetMap React Native library, but you can use:
- [`react-native-maps`](https://github.com/react-native-maps/react-native-maps) with custom tile overlays for OSM tiles.
- [`react-native-geocoder-osm`](https://github.com/ranggadarmajati/react-native-geocoder-osm) for geocoding and reverse geocoding using OSM/Nominatim.
- [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) to render OSM maps via Leaflet.js in a WebView.
- [`MapLibre`](https://github.com/maplibre/maplibre-react-native) for open-source vector tile rendering (OSM-based).

#### Example: Using OSM Tiles in `react-native-maps`
```jsx
<MapView
  style={{ flex: 1 }}
  provider={PROVIDER_DEFAULT}
  region={{
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}>
  <UrlTile
    urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    maximumZ={19}
  />
</MapView>
```

#### Example: Geocoding/Reverse Geocoding with `react-native-geocoder-osm`
```js
import GeocoderOsm from 'react-native-geocoder-osm';
// Reverse geocoding
GeocoderOsm.getGeoCodePosition(lat, lng).then((res) => {
  console.log('getGeoCodePosition', res);
});
// Geocoding
GeocoderOsm.getGeoAddress('address string').then((res) => {
  console.log('getGeoAddress', res);
});
```

#### Geocoding Object Format
```json
{
  "place_id": 14298080,
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
  "osm_type": "node",
  "osm_id": 1308657314,
  "boundingbox": ["-7.0383774", "-6.9983774", "107.6105706", "107.6505706"],
  "lat": "-7.0183774",
  "lon": "107.6305706",
  "display_name": "Baleendah, Jawa Barat, 40375, Indonesia",
  "address": {
    "village": "Baleendah",
    "state": "Jawa Barat",
    "postcode": "40375",
    "country": "Indonesia",
    "country_code": "id"
  }
}
```

---

## Nominatim

### Overview
Nominatim is a geocoding tool that uses OpenStreetMap data. It supports both forward geocoding (address to coordinates) and reverse geocoding (coordinates to address).

### Key Features
- Search for places by name or address.
- Reverse geocoding to generate synthetic addresses.
- Localization support for multiple languages.

### Nominatim API Usage

#### Geocoding (Address to Coordinates)
```
https://nominatim.openstreetmap.org/search?q=ADDRESS&format=json
```
Example:
```
https://nominatim.openstreetmap.org/search?q=999+Canada+Place,+Vancouver,+BC&format=json
```
Returns latitude/longitude for the address.

#### Reverse Geocoding (Coordinates to Address)
```
https://nominatim.openstreetmap.org/reverse?lat=LATITUDE&lon=LONGITUDE&format=json
```
Example:
```
https://nominatim.openstreetmap.org/reverse?lat=49.288&lon=-123.112&format=json
```
Returns the nearest address for the coordinates.

#### API Parameters
- `format`: Output format (`json`, `xml`, `geojson`, `geocodejson`)
- `addressdetails`: Include address breakdown (1/0)
- `accept-language`: Preferred language for results
- `zoom`: Level of detail (country, state, city, street, building, etc.)
- `extratags`, `namedetails`, `entrances`: Additional info

#### Example Response
```json
{
  "place_id": "134140761",
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
  "osm_type": "way",
  "osm_id": "280940520",
  "lat": "-34.4391708",
  "lon": "-58.7064573",
  "display_name": "Autopista Pedro Eugenio Aramburu, El Triángulo, Partido de Malvinas Argentinas, Buenos Aires, 1.619, Argentina",
  "address": {
    "road": "Autopista Pedro Eugenio Aramburu",
    "village": "El Triángulo",
    "state_district": "Partido de Malvinas Argentinas",
    "state": "Buenos Aires",
    "postcode": "1.619",
    "country": "Argentina",
    "country_code": "ar"
  }
}
```

#### Best Practices
- For production, consider self-hosting Nominatim to avoid rate limits and ensure privacy.
- Always follow the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).
- Use the `addressdetails=1` parameter for structured address output.
- For large-scale or commercial use, set up your own Nominatim server (see Docker instructions in [this tutorial](https://peshmerge.io/how-to-create-your-own-reverse-geocoding-api-using-openstreetmap-docker-osimium-and-nominatim/)).

#### Setting Up Your Own Nominatim Server (Docker Example)
```sh
docker run -it --rm --shm-size=80g -e PBF_PATH=/nominatim/flatnode/iceland-latest.osm.pbf -p 8080:8080 -v ~/Downloads:/nominatim/flatnode --name nominatim mediagis/nominatim:4.0
```
See [Nominatim Docker documentation](https://github.com/mediagis/nominatim-docker/tree/master/4.0#docker-compose) for more options.

---

## Additional Resources
- [OpenStreetMap Documentation](https://www.openstreetmap.org/)
- [Nominatim Documentation](https://nominatim.org/)
- [osmdroid GitHub Repository](https://github.com/osmdroid/osmdroid)
- [Nominatim GitHub Repository](https://github.com/osm-search/nominatim)
- [react-native-geocoder-osm](https://github.com/ranggadarmajati/react-native-geocoder-osm)
- [Nominatim API Reverse Geocoding](https://nominatim.org/release-docs/develop/api/Reverse/)
- [OpenStreetMap OSM Nominatim API tutorial](https://blog.afi.io/blog/openstreetmap-osm-nominatim-api-tutorial/)
- [How to create your own reverse geocoding API using OpenStreetMap Docker, Osimium and Nominatim](https://peshmerge.io/how-to-create-your-own-reverse-geocoding-api-using-openstreetmap-docker-osimium-and-nominatim/)

---

This document serves as a starting point for integrating OpenStreetMap and Nominatim into your application. For detailed examples and advanced configurations, refer to the official documentation and repositories.
