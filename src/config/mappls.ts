// Mappls Configuration
export const MAPPLS_CONFIG = {
  // You need to replace these with your actual Mappls API keys
  // Get them from: https://about.mappls.com/api/signup
  API_KEY: 'YOUR_MAPPLS_API_KEY_HERE',
  CLIENT_ID: 'YOUR_MAPPLS_CLIENT_ID_HERE',
  CLIENT_SECRET: 'YOUR_MAPPLS_CLIENT_SECRET_HERE',
  
  // Default map center (Delhi)
  DEFAULT_CENTER: {
    latitude: 28.6139,
    longitude: 77.2090,
  },
  
  // Map styles
  STYLES: {
    STANDARD: 'mapbox://styles/mapbox/streets-v11',
    SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
    DARK: 'mapbox://styles/mapbox/dark-v10',
  },
};

// Note: To get Mappls API keys:
// 1. Visit https://about.mappls.com/api/signup
// 2. Create an account and verify your email
// 3. Create a new project in the dashboard
// 4. Generate API keys for your project
// 5. Download the configuration files for Android (.a.olf and .a.conf)
// 6. Place these files in android/app/ directory
