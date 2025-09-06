// Central configuration for backend endpoints used during development.
export const SERVER_URL = typeof process !== 'undefined' && process.env.SERVER_URL ? process.env.SERVER_URL : 'http://localhost:4000'

// If true, transitionStore will attempt to POST single transitions immediately and fall back to local storage.
export const ROLLING_LOG_ENABLED = true

export default { SERVER_URL, ROLLING_LOG_ENABLED }
