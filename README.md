# SIH Smart Tourist Safety (Mock-Only)

This is**For Expo Go Development:**
Add to `app.json` under `extra` (locally, don't commit):
```json
{
  "expo": {
    "extra": {
      "MAPBOX_ACCESS_TOKEN": "your_token_here"
    }
  }
}
```

## GitHub Actions & CI/CD

### Android Release Build

The project includes automated Android release builds via GitHub Actions. To set up:

1. **Add Repository Secrets** (Required for Mapbox dependencies):
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add `MAPBOX_ACCESS_TOKEN` with your Mapbox access token
   - Optionally add `MAPBOX_USERNAME` and `MAPBOX_PASSWORD` for premium accounts

2. **Trigger Release Build**:
   - Push a tag starting with `v` (e.g., `v1.0.0`)
   - Or manually trigger via GitHub Actions tab

3. **Build Artifacts**:
   - APK files will be automatically uploaded as artifacts
   - A GitHub release will be created with the APK attached

### Troubleshooting CI/CD

If the Android build fails with Mapbox authentication errors:
- Verify your `MAPBOX_ACCESS_TOKEN` is valid and not expired
- Ensure the token has necessary permissions
- Check `.github/workflows/README.md` for detailed setup instructions

## Project Structureve Expo app implementing the mock UI flows for SIH25002 "Smart Tourist Safety Monitoring Incident Response System".

Important:
- No real APIs, Aadhaar, phone, or blockchain are used; all flows are simulated.
- Replace the mock functions in src/context/AppContext.tsx and add API wiring where commented when moving to production.

## Setup

1. Install dependencies: `npm install` (or pnpm/yarn)
2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your actual API keys and URLs in `.env`
   - **Important**: Never commit `.env` to version control
3. **For Android builds**: Run the setup script:
   - Linux/Mac: `./scripts/setup-android-build.sh`
   - Windows: `scripts\setup-android-build.bat`
4. Start Expo: `npm run start`
5. Open on a device with Expo Go or run on a simulator.

## Environment Variables

The app requires the following environment variables:

### Required
- `MAPBOX_ACCESS_TOKEN`: Get from [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)

### Optional (with defaults)
- `SERVER_URL`: Backend API URL (default: production URL)
- `GEO_MODEL_URL`: Geo safety model API URL
- `WEATHER_MODEL_URL`: Weather safety model API URL

### Setting up Environment Variables

**For Development:**
1. Copy `.env.example` to `.env`
2. Fill in your actual values

**For Production (EAS Build):**
Use EAS Build environment variables:
```bash
# Set environment variables for build
eas secret:create --name MAPBOX_ACCESS_TOKEN --value your_token_here
eas build --platform android --profile production
```

Or override during build:
```bash
eas build --platform android --env MAPBOX_ACCESS_TOKEN=your_production_token
```

**For Expo Go Development:**
Add to `app.json` under `extra` (but don't commit this):
```json
{
  "expo": {
    "extra": {
      "MAPBOX_ACCESS_TOKEN": "your_token_here"
    }
  }
}
```

## Project Structure

- src/screens: Auth, Dashboard, Itinerary, Emergency, Settings, Authority
- src/components: UI sections (Profile, Safety Score, Contacts, Map, Panic, Geofences, Group, Language/Offline)
- src/context: Global mock state with AsyncStorage persistence, translations (EN/HI)
- src/utils: mock data and safety score logic
- src/navigation: React Navigation stacks and tabs

Where to add real backend later:
- src/context/AppContext.tsx (login, register, profile update, data fetching)
- Replace MockMap with real map provider
- Authority dashboard lists/incidents can connect to your backend once available
