import React from 'react'
import RegisterScreen from '../../src/screens/auth/RegisterScreen'
import { useRouter } from 'expo-router'

function useNavAdapter() {
  const router = useRouter()
  return {
    navigate: (name: string, params?: any) => {
      const path = `/${name.toLowerCase()}`
      router.push(path)
    },
    goBack: () => router.back(),
    push: (path: string) => router.push(path),
  }
}

export default function RegisterRoute() {
  const nav = useNavAdapter()
  return <RegisterScreen navigation={nav as any} />
}
