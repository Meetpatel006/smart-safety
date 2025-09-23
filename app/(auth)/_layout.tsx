import React from 'react'
import { Slot } from 'expo-router'

export default function AuthLayout() {
  // simple stack-like layout for auth flows; Slot will render child routes
  return <Slot />
}
