
import { Coordinates } from './types';

// IMPORTANT: Replace with your Mapbox access token
const MAPBOX_ACCESS_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN';

// Convert decimal coordinates to DMS (Degrees, Minutes, Seconds)
export const convertToDMS = (decimal: number, type: 'lat' | 'lon'): string => {
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

// Format coordinates to display both decimal and DMS formats
export const formatCoordinates = (lat: number, lon: number): Coordinates => {
  return {
    latitude: lat.toFixed(6),
    longitude: lon.toFixed(6),
    dms: {
      lat: convertToDMS(lat, 'lat'),
      lon: convertToDMS(lon, 'lon'),
    }
  };
};

// Reverse geocode to get address from coordinates using Mapbox Geocoding API
export const reverseGeocode = async (lat: number, lon: number, retryCount: number = 0): Promise<string | null> => {
  if (!MAPBOX_ACCESS_TOKEN.startsWith('pk.')) {
    console.error('Mapbox access token is not set in geoUtils.ts');
    return 'Mapbox token not configured';
  }
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name || "Address not found";
    }

    return "Address not found";
  } catch (err: any) {
    console.error("Mapbox reverse geocoding error:", err);
    
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return reverseGeocode(lat, lon, retryCount + 1);
    }
    
    return null;
  }
};
