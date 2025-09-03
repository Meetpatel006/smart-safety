const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Clear cache more aggressively to prevent update issues
config.resetCache = true;

module.exports = config;
