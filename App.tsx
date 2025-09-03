import { NavigationContainer, DefaultTheme as NavDefaultTheme } from "@react-navigation/native"
import { PaperProvider } from "react-native-paper"
import { AppProvider } from "./src/context/AppContext"
import { RootNavigator } from "./src/navigation"
import { paperTheme } from "./src/theme/paper"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import * as SplashScreen from "expo-splash-screen"
import { View, Text, ActivityIndicator } from "react-native"
import React from "react"

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

const navTheme = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    background: "#FFFFFF",
  },
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#ffffff',
          padding: 20 
        }}>
          <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      )
    }

    return this.props.children
  }
}

function AppContent() {
  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App: Starting initialization...')
        // Pre-load fonts, make any API calls you need to do here
        // Give some time for context to initialize
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('App: Initialization complete')
      } catch (e) {
        console.warn('App: Initialization error:', e)
      } finally {
        // Tell the application to render
        console.log('App: Setting app as ready')
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  useEffect(() => {
    if (appIsReady) {
      // Hide the splash screen after the app is ready
      console.log('App: Hiding splash screen')
      SplashScreen.hideAsync()
    }
  }, [appIsReady])

  if (!appIsReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#ffffff' 
      }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 20, fontSize: 16 }}>Loading...</Text>
      </View>
    )
  }

  return (
    <AppProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AppProvider>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
