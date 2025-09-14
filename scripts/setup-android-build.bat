@echo off
REM Android Build Helper Script for Windows
REM This script helps with local Android builds by setting up Mapbox credentials

echo 🔧 Setting up Android build environment...

REM Check if MAPBOX_ACCESS_TOKEN is set
if "%MAPBOX_ACCESS_TOKEN%"=="" (
    echo ⚠️  MAPBOX_ACCESS_TOKEN environment variable is not set!
    echo Please set it with: set MAPBOX_ACCESS_TOKEN=your_token_here
    echo Get your token from: https://account.mapbox.com/access-tokens/
    pause
    exit /b 1
)

REM Create gradle.properties if it doesn't exist
if not exist "android\gradle.properties" (
    echo 📝 Creating android\gradle.properties...
    type nul > android\gradle.properties
)

REM Add Mapbox credentials to gradle.properties
echo 🔑 Adding Mapbox credentials to gradle.properties...
echo MAPBOX_ACCESS_TOKEN=%MAPBOX_ACCESS_TOKEN% >> android\gradle.properties

echo ✅ Android build environment configured!
echo You can now run: npx expo run:android --variant release
echo Or: cd android && gradlew assembleRelease
pause