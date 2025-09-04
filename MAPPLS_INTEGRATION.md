# Mappls Map SDK Integration Guide

## Overview
This document explains the integration of Mappls Map SDK for location sharing functionality in the SIH Smart Safety app.

## Features Implemented
- ✅ Real-time location sharing
- ✅ Location permission handling
- ✅ Share location via multiple channels (Share dialog, clipboard)
- ✅ Open location in Google Maps and Mappls Maps
- ✅ Copy coordinates to clipboard
- ✅ Visual map preview with mock map interface
- ✅ Emergency location sharing in Emergency tab

## Dependencies Added
```json
{
  "mappls-map-react-native": "^2.0.0",
  "expo-location": "latest",
  "@react-native-clipboard/clipboard": "latest",
  "expo-sharing": "latest"
}
```

## File Structure
```
src/
├── components/
│   └── MapplsMap.tsx           # Main map component with location sharing
├── config/
│   └── mappls.ts              # Mappls configuration (API keys)
├── screens/
│   └── EmergencyScreen.tsx    # Updated to use MapplsMap component
```

## Features

### 1. Location Sharing Component (`MapplsMap.tsx`)
- **Location Permission**: Automatically requests location permission
- **Real-time Location**: Gets current GPS coordinates
- **Visual Map Preview**: Shows a mock map with current location marker
- **Multiple Share Options**:
  - Share dialog with Google Maps and Mappls links
  - Copy coordinates to clipboard
  - Open location in external map apps

### 2. Emergency Screen Integration
- Replaced `MockMap` component with `MapplsMap`
- Location sharing is prominently featured in the Emergency tab
- Integrates with existing app context for share location toggle

## Configuration Setup

### Android Configuration

1. **Repository Setup** (Already configured in `android/settings.gradle`)
```gradle
dependencyResolutionManagement {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://maven.mappls.com/repository/mappls/' }
  }
}
```

2. **Permissions** (Already added to `android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

3. **Mappls Configuration Files** (Required)
You need to download these files from Mappls Console and place them in `android/app/`:
- `<appId>.a.olf`
- `<appId>.a.conf`

### iOS Configuration (Expo Managed)

1. **Location Permission** (Already configured in `app.json`)
```json
{
  "plugins": [
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "This app needs access to location to share your current location in emergency situations."
      }
    ]
  ]
}
```

## Getting Mappls API Keys

1. Visit [Mappls Dashboard](https://about.mappls.com/api/signup)
2. Create an account and verify your email
3. Create a new project in the dashboard
4. Generate API keys for your project
5. Create separate apps for Android and iOS
6. Download configuration files:
   - For Android: `<appId>.a.olf` and `<appId>.a.conf`
   - For iOS: `<appId>.i.olf` and `<appId>.i.conf`

## Usage

### In Emergency Screen
```tsx
import MapplsMap from '../components/MapplsMap';

// In your component
<MapplsMap />
```

### Location Sharing Flow
1. User opens Emergency tab
2. Taps "Share My Location" button
3. App requests location permission (if not granted)
4. Gets current GPS coordinates
5. Shows location on mock map interface
6. Provides multiple sharing options:
   - Share via system share dialog
   - Copy coordinates
   - Open in external maps

## Error Handling
- **Permission Denied**: Shows error message with retry option
- **Location Unavailable**: Displays helpful error message
- **Network Issues**: Graceful fallback to clipboard sharing
- **Share API Unavailable**: Automatically falls back to clipboard

## Mock Map Interface
Since full Mappls integration requires API keys and configuration files, the current implementation includes:
- Visual map preview with mock roads and markers
- Real location coordinates display
- Full sharing functionality with both Google Maps and Mappls links
- Interactive buttons for all location sharing features

## Next Steps for Full Mappls Integration

1. **Get Mappls API Keys**: Sign up at Mappls Dashboard
2. **Add Configuration Files**: 
   - Place Android config files in `android/app/`
   - Add iOS config files to iOS bundle (when ejected)
3. **Update Configuration**: Replace placeholder values in `src/config/mappls.ts`
4. **Replace Mock Map**: Uncomment the actual MapplsGL components in `MapplsMap.tsx`

## Security Notes
- Never commit API keys to version control
- Use environment variables for production builds
- Implement proper API key rotation
- Follow Mappls terms of service for API usage

## Testing
1. **Permission Testing**: Test on devices with location disabled
2. **Network Testing**: Test offline scenarios
3. **Share Testing**: Test sharing on different platforms
4. **Location Accuracy**: Test in different environments (indoor/outdoor)

## Troubleshooting

### Common Issues
1. **Location Permission**: Check Android/iOS permission settings
2. **Share Dialog**: Ensure device has compatible sharing apps
3. **Clipboard**: Verify clipboard permissions on iOS
4. **Map Loading**: Check network connectivity and API keys

### Debug Steps
1. Check console logs for error messages
2. Verify location permission status
3. Test location sharing in different apps
4. Check device location services settings
