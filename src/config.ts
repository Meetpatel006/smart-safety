import Constants from 'expo-constants';

// Central configuration for backend endpoints used during development.
export const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL || 'https://smart-tourist-safety-backend.onrender.com'

// AI model URLs for getting safety score predictions
export const GEO_MODEL_URL = Constants.expoConfig?.extra?.GEO_MODEL_URL || 'https://gcet--geofence-safety-api-fastapi-app-dev.modal.run/predict'
export const WEATHER_MODEL_URL = Constants.expoConfig?.extra?.WEATHER_MODEL_URL || 'https://gcet--weather-safety-api-fastapi-app-dev.modal.run/predict'

// Mapbox configuration
export const MAPBOX_ACCESS_TOKEN = Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN 

// Validate required configuration
if (!MAPBOX_ACCESS_TOKEN) {
  console.warn('⚠️  MAPBOX_ACCESS_TOKEN is not properly configured. Please set it in your environment variables.');
}

// If true, transitionStore will attempt to POST single transitions immediately and fall back to local storage.
// For strict 15-minute batching, keep this false.
export const ROLLING_LOG_ENABLED = false

export default { SERVER_URL, GEO_MODEL_URL, WEATHER_MODEL_URL, MAPBOX_ACCESS_TOKEN, ROLLING_LOG_ENABLED }
