// Load environment variables from .env during config evaluation
// This runs in Node when Expo/Metro reads the config, so it's safe to use dotenv here.
const fs = require('fs');
const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (e) {
  // dotenv might not be installed in some environments; silently ignore.
}

module.exports = ({ config }) => {
  // Ensure extra exists
  config.extra = config.extra || {};

  // Prefer process.env (loaded by dotenv above) but fall back to any existing value
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    config.extra.MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  }
  if (process.env.MAPBOX_DOWNLOADS_TOKEN) {
    config.extra.MAPBOX_DOWNLOADS_TOKEN = process.env.MAPBOX_DOWNLOADS_TOKEN;
  }
    // Gemini LLM config - allow injecting endpoint and key from environment/.env
  if (process.env.GEMINI_API_URL) {
    config.extra.GEMINI_API_URL = process.env.GEMINI_API_URL;
  }
  if (process.env.GEMINI_API_KEY) {
    config.extra.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  }

  return config;
};
