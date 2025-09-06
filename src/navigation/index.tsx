import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import DashboardScreen from "../screens/DashboardScreen"
import ItineraryScreen from "../screens/ItineraryScreen"
import EmergencyScreen from "../screens/EmergencyScreen"
import SettingsScreen from "../screens/SettingsScreen"
import AuthorityDashboardScreen from "../screens/AuthorityDashboardScreen"
import GeoFenceDebugScreen from "../geoFence/GeoFenceDebugScreen"
import { useApp } from "../context/AppContext"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "react-native-paper"

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Authority: undefined
  GeoFenceDebug: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function MainTabs() {
  const theme = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Itinerary"
        component={ItineraryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="alarm-light" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

function AuthStack() {
  const StackAuth = createNativeStackNavigator()
  return (
    <StackAuth.Navigator>
      <StackAuth.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <StackAuth.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
    </StackAuth.Navigator>
  )
}

export function RootNavigator() {
  const { state } = useApp()
  return (
    <Stack.Navigator>
      {!state.user ? (
        <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Authority"
            component={AuthorityDashboardScreen}
            options={{ title: "Authority Dashboard (Mock)" }}
          />
          <Stack.Screen
            name="GeoFenceDebug"
            component={GeoFenceDebugScreen}
            options={{ title: 'GeoFence Debug' }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}
