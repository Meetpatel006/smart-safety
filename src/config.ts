import Constants from 'expo-constants';

// Central configuration for backend endpoints used during development.
export const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL || process.env.SERVER_URL || 'https://smart-tourist-safety-backend.onrender.com'

// AI model URLs for getting safety score predictions
export const GEO_MODEL_URL = Constants.expoConfig?.extra?.GEO_MODEL_URL || process.env.GEO_MODEL_URL || 'https://of8766175--geofence-safety-api-fastapi-app.modal.run/predict'
export const WEATHER_MODEL_URL = Constants.expoConfig?.extra?.WEATHER_MODEL_URL || process.env.WEATHER_MODEL_URL || 'https://gcet--weather-safety-api-fastapi-app-dev.modal.run/predict'

// Mapbox configuration - prioritize .env over app.json for security
// Prefer value injected into expo.extra (via app.config.js) so it works with Expo/Metro.
export const MAPBOX_ACCESS_TOKEN = Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '';

// Validate required configuration and provide actionable debug info
if (!MAPBOX_ACCESS_TOKEN) {
  const extraVal = Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN;
  const envVal = process.env.MAPBOX_ACCESS_TOKEN;
  console.warn('⚠️  MAPBOX_ACCESS_TOKEN is not configured. Values found:', { extraVal, envVal });
}

// If true, transitionStore will attempt to POST single transitions immediately and fall back to local storage.
// For strict 15-minute batching, keep this false.
export const ROLLING_LOG_ENABLED = false

// Gemini/LLM configuration - provide a simple HTTP endpoint and API key via expo.extra or env
export const GEMINI_API_URL = Constants.expoConfig?.extra?.GEMINI_API_URL || process.env.GEMINI_API_URL || ''
export const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
// Optional model name to send to the LLM endpoint. Default follows the example.
export const GEMINI_MODEL = Constants.expoConfig?.extra?.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// Fallback authority phone number (can be overridden via expo.extra in app config)
export const AUTHORITY_PHONE = Constants.expoConfig?.extra?.AUTHORITY_PHONE || process.env.AUTHORITY_PHONE || ''

if (!GEMINI_API_URL || !GEMINI_API_KEY) {
  console.info('Gemini LLM not fully configured. GEMINI_API_URL or GEMINI_API_KEY missing. Using local fallback recommendations.');
}

export default { SERVER_URL, GEO_MODEL_URL, WEATHER_MODEL_URL, MAPBOX_ACCESS_TOKEN, ROLLING_LOG_ENABLED }
