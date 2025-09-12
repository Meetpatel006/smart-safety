// Central configuration for backend endpoints used during development.
export const SERVER_URL = typeof process !== 'undefined' && process.env.SERVER_URL ? process.env.SERVER_URL : 'https://smart-tourist-safety-backend.onrender.com'

// AI model URLs for getting safety score predictions
export const GEO_MODEL_URL = typeof process !== 'undefined' && process.env.GEO_MODEL_URL ? process.env.GEO_MODEL_URL : 'https://gcet--geofence-safety-api-fastapi-app-dev.modal.run/predict'
export const WEATHER_MODEL_URL = typeof process !== 'undefined' && process.env.WEATHER_MODEL_URL ? process.env.WEATHER_MODEL_URL : 'https://gcet--weather-safety-api-fastapi-app-dev.modal.run/predict'

// If true, transitionStore will attempt to POST single transitions immediately and fall back to local storage.
// For strict 15-minute batching, keep this false.
export const ROLLING_LOG_ENABLED = false

export default { SERVER_URL, GEO_MODEL_URL,WEATHER_MODEL_URL, ROLLING_LOG_ENABLED }
