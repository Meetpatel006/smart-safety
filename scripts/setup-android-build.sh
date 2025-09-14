#!/bin/bash

# Android Build Helper Script
# This script helps with local Android builds by setting up Mapbox credentials

echo "🔧 Setting up Android build environment..."

# Check if MAPBOX_ACCESS_TOKEN is set
if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "⚠️  MAPBOX_ACCESS_TOKEN environment variable is not set!"
    echo "Please set it with: export MAPBOX_ACCESS_TOKEN=your_token_here"
    echo "Get your token from: https://account.mapbox.com/access-tokens/"
    exit 1
fi

# Create gradle.properties if it doesn't exist
if [ ! -f "android/gradle.properties" ]; then
    echo "📝 Creating android/gradle.properties..."
    touch android/gradle.properties
fi

# Add Mapbox credentials to gradle.properties
echo "🔑 Adding Mapbox credentials to gradle.properties..."
echo "MAPBOX_ACCESS_TOKEN=$MAPBOX_ACCESS_TOKEN" >> android/gradle.properties

# Remove duplicates (keep only the last occurrence)
awk '!seen[$0]++' android/gradle.properties > android/gradle.properties.tmp
mv android/gradle.properties.tmp android/gradle.properties

echo "✅ Android build environment configured!"
echo "You can now run: npx expo run:android --variant release"
echo "Or: cd android && ./gradlew assembleRelease"