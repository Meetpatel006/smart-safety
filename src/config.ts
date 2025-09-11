// Central configuration for backend endpoints used during development.
export const SERVER_URL = typeof process !== 'undefined' && process.env.SERVER_URL ? process.env.SERVER_URL : 'https://smart-tourist-safety-backend.onrender.com'

// If true, transitionStore will attempt to POST single transitions immediately and fall back to local storage.
// For strict 15-minute batching, keep this false.
export const ROLLING_LOG_ENABLED = false

export default { SERVER_URL, ROLLING_LOG_ENABLED }
