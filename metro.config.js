const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Clear cache more aggressively to prevent update issues
config.resetCache = true;

module.exports = withNativeWind(config, { input: './global.css' });
