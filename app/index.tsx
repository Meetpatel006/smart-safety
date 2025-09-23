import React from 'react'
import { Redirect, useRouter } from 'expo-router'
import { useApp } from '../src/context/AppContext'

export default function Index() {
  const { state } = useApp()
  // If user is not signed in, send to auth; otherwise to tabs
  if (!state.user) return <Redirect href='/(auth)/login' />
  return <Redirect href='/(tabs)/dashboard' />
}
