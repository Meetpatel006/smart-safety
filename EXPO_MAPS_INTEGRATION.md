# Expo Maps Integration - Smart Safety App

## Overview

Successfully migrated from MAPPLS map SDK to Expo Maps for better cross-platform compatibility and native performance. The implementation now uses Apple Maps on iOS and Google Maps on Android through the expo-maps package.

## Key Features

- **Native Map Integration**: Uses Apple Maps on iOS and Google Maps on Android
- **Real-time Location**: Automatic location detection and permission handling
- **Cross-platform Compatibility**: Single codebase for both platforms
- **Emergency Integration**: Location services for safety features
- **Permission Management**: Automated permission requests with user-friendly messages

## Architecture

```
src/
├── components/
│   └── ExpoMap.tsx              # Main map component with Expo Maps
└── screens/
    └── EmergencyScreen.tsx      # Updated to use ExpoMap
```

## Implementation Details

### ExpoMap.tsx

**Core Features:**
- Platform-specific map rendering (Apple Maps for iOS, Google Maps for Android)
- Real-time location tracking with permission handling
- Camera positioning based on user location
- Error handling for location services
- Refresh location functionality

**Props:**
- `onLocationSelect?: (location: { latitude: number; longitude: number }) => void`
- `showCurrentLocation?: boolean`
- `style?: any`

### Dependencies

```json
{
  "expo-maps": "~0.11.0",
  "expo-location": "^18.1.6"
}
```

### Permissions Configuration (app.json)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs access to location to share your current location in emergency situations."
        }
      ],
      [
        "expo-maps",
        {
          "requestLocationPermission": true,
          "locationPermission": "Allow $(PRODUCT_NAME) to access your location for emergency services and safety features"
        }
      ]
    ]
  }
}
```

## Platform-Specific Setup

### iOS Setup
- No additional configuration required
- Apple Maps works out of the box
- Location permissions handled through Info.plist

### Android Setup
For production deployment with Google Maps on Android:

1. **Google Cloud Console Setup:**
   - Create/select a Google Cloud project
   - Enable "Maps SDK for Android"
   - Generate API key with Android app restrictions

2. **Get SHA-1 Certificate:**
   - For development: Get from Expo dashboard under Credentials
   - For production: Get from Google Play Console after uploading app

3. **Configure app.json:**
   ```json
   {
     "expo": {
       "android": {
         "config": {
           "googleMaps": {
             "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
           }
         }
       }
     }
   }
   ```

## API Usage

### Basic Implementation

```tsx
import ExpoMap from '../components/ExpoMap';

function EmergencyScreen() {
  return (
    <ExpoMap 
      showCurrentLocation={true}
      onLocationSelect={(location) => {
        console.log('Selected location:', location);
      }}
    />
  );
}
```

### Platform Detection

```tsx
import { Platform } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';

if (Platform.OS === 'ios') {
  // Apple Maps
  return <AppleMaps.View style={{ flex: 1 }} />;
} else if (Platform.OS === 'android') {
  // Google Maps  
  return <GoogleMaps.View style={{ flex: 1 }} />;
}
```

## Location Services

### Permission Handling

```tsx
import * as Location from 'expo-location';

const getCurrentLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    setErrorMsg('Permission to access location was denied');
    return;
  }
  
  let location = await Location.getCurrentPositionAsync({});
  setLocation(location);
};
```

### Camera Positioning

```tsx
const cameraPosition = {
  coordinates: {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  },
  zoom: 14,
};
```

## Migration from MAPPLS

### Changes Made

1. **Removed Files:**
   - `src/config/mapConfig.ts`
   - `MAPPLS_INTEGRATION.md`

2. **Updated Components:**
   - Named  `ExpoMap.tsx`
   - Updated import in `EmergencyScreen.tsx`

3. **Updated Dependencies:**
   - Removed: `mappls-map-react-native`
   - Added: `expo-maps`

4. **Configuration Updates:**
   - Updated `app.json` with expo-maps plugin configuration
   - Added location permission messages

## Building and Testing

### Development Build
```bash
npx expo start
```

### Production Build
```bash
# For Android (requires Google Maps API key)
npx expo build:android

# For iOS (uses Apple Maps)
npx expo build:ios
```

## Security Considerations

- API keys should be stored securely (consider using environment variables)
- Location permissions are requested only when needed
- User location data is not stored permanently
- Maps are used only for emergency and safety features

## Performance Optimizations

- Maps are rendered only when component is active
- Location updates are throttled to prevent excessive battery drain
- Platform-specific optimizations for iOS and Android

## Future Enhancements

- Add marker support for emergency contacts
- Implement geofencing for safety zones
- Add route planning for emergency evacuation
- Integration with emergency services APIs

## Troubleshooting

### Common Issues

1. **Maps not loading on Android:**
   - Check Google Maps API key configuration
   - Verify SHA-1 certificate fingerprint
   - Ensure Maps SDK for Android is enabled

2. **Location permission denied:**
   - Check app.json permission configuration
   - Verify device location services are enabled
   - Ensure permission messages are user-friendly

3. **Build errors:**
   - Clear Metro cache: `npx expo start --clear`
   - Reinstall dependencies: `npm install`
   - Check Expo CLI version: `npx expo --version`

### Debug Commands

```bash
# Check Expo diagnostics
npx expo doctor

# Clear cache and restart
npx expo start --clear

# Check device logs
npx expo logs
```

## Resources

- [Expo Maps Documentation](https://docs.expo.dev/versions/latest/sdk/maps/)
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [Google Maps Setup Guide](https://docs.expo.dev/versions/latest/sdk/maps/#set-up-google-maps-on-android)
- [Apple Maps Guidelines](https://developer.apple.com/maps/)
