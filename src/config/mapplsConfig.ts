import MapplsGL from 'mappls-map-react-native';

// Mappls SDK Configuration
export const initializeMappls = () => {
  try {
    // Initialize Mappls SDK
    // Note: In production, you need to configure with actual API keys
    // For now, using default configuration
    
    // Set access token (replace with your actual token)
    // MapplsGL.setAccessToken('YOUR_MAPPLS_ACCESS_TOKEN');
    
    console.log('Mappls SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Mappls SDK:', error);
    return false;
  }
};

// Default map configuration
export const MAPPLS_CONFIG = {
  DEFAULT_CENTER: [77.2090, 28.6139], // Delhi coordinates [longitude, latitude]
  DEFAULT_ZOOM: 12,
  USER_LOCATION_ZOOM: 16,
  
  // Map styles available in Mappls
  STYLES: {
    DEFAULT: MapplsGL.StyleURL?.Default || 'mapbox://styles/mapbox/streets-v11',
  },
  
  // Marker configuration
  MARKER: {
    SIZE: 20,
    BORDER_WIDTH: 3,
    BORDER_COLOR: 'white',
  },
};

export default MapplsGL;
