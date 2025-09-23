import React, { useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { ThemeProvider } from '../src/context/ThemeContext'
import { AppProvider } from '../src/context/AppContext'
import ToastListener from '../src/components/ToastListener'
import '../global.css'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { View, Text, ActivityIndicator } from 'react-native'

// Prevent the splash screen from auto-hiding (ignore any promise rejection)
SplashScreen.preventAutoHideAsync().catch(() => {})

// Notification handler: allow sound for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function Layout() {
  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise((resolve) => setTimeout(resolve, 800))
      } catch (e) {
        console.warn('App layout init error', e)
      } finally {
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [appIsReady])

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 20, fontSize: 16 }}>Loading...</Text>
      </View>
    )
  }

  return (
    <ThemeProvider>
      <AppProvider>
        <ToastListener />
        <StatusBar style="auto" />
        <Slot />
      </AppProvider>
    </ThemeProvider>
  )
}
