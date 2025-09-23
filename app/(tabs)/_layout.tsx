import React from 'react'
import { Slot, Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DashboardScreen from '../../src/screens/DashboardScreen'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          href: '/(tabs)/dashboard',
          title: 'Dashboard',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="map-marker-alert" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: 'Itinerary',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="cog" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
