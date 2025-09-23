import React from 'react'
import LoginScreen from '../../src/screens/auth/LoginScreen'
import { useRouter } from 'expo-router'

// Adapter to provide a minimal navigation prop for screens that expect `navigation.navigate`.
function useNavAdapter() {
  const router = useRouter()
  return {
    navigate: (name: string, params?: any) => {
      // convert stack-style names to file-based route paths
      const path = name === 'Register' ? '/(auth)/register' : `/${name.toLowerCase()}`
      router.push(path)
    },
    goBack: () => router.back(),
    // include push/pop for compatibility
    push: (path: string) => router.push(path),
  }
}

export default function LoginRoute() {
  const nav = useNavAdapter()
  // render the existing LoginScreen and inject the adapted navigation prop
  return <LoginScreen navigation={nav as any} />
}
