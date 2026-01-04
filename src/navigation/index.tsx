import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import DashboardScreen from "../screens/DashboardScreen"
import ItineraryScreen from "../screens/ItineraryScreen"
import EmergencyScreen from "../screens/EmergencyScreen"
import SettingsScreen from "../screens/SettingsScreen"
import AuthorityDashboardScreen from "../screens/AuthorityDashboardScreen"
import { useApp } from "../context/AppContext"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "react-native-paper"
import DashboardLogo from "../components/Icons/DashboardLogo"
import { View, Text, StyleSheet } from "react-native"
import EmergencyMapLogo from "../components/Icons/EmergencyMapLogo"
import SettingsIcon from "../components/Icons/SettingsIcon"
import ItineraryIcon from "../components/Icons/ItineraryIcon"

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Authority: undefined
  GeoFenceDebug: undefined
  // Transitions: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function TabBarBackground() {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 30,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.6)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 15,
      }}
    />
  )
}

function MainTabs() {
  const theme = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: {
          position: "absolute",
          bottom: 25,
          left: 40,
          right: 40,
          elevation: 0,
          backgroundColor: "transparent",
          borderRadius: 30,
          height: 60,
          borderTopWidth: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarItemStyle: {
          paddingVertical: 0,
          paddingHorizontal: 0,
          margin: 0,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
              <View
                style={{
                  backgroundColor: focused ? "rgba(33, 150, 243, 0.12)" : "transparent",
                  borderRadius: 12,
                  padding: 2,
                }}
              >
                <DashboardLogo color={color} size={22} />
              </View>
              {focused && (
                <>
                  <Text style={{ color: color, fontSize: 9, marginTop: 2, fontWeight: "600" }}>
                    Dashboard
                  </Text>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: color,
                      marginTop: 1,
                    }}
                  />
                </>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
              <View
                style={{
                  backgroundColor: focused ? "rgba(33, 150, 243, 0.12)" : "transparent",
                  borderRadius: 12,
                  padding: 2,
                }}
              >
                <EmergencyMapLogo color={color} size={22} />
              </View>
              {focused && (
                <>
                  <Text style={{ color: color, fontSize: 9, marginTop: 2, fontWeight: "600" }}>
                    Emergency
                  </Text>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: color,
                      marginTop: 1,
                    }}
                  />
                </>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Itinerary"
        component={ItineraryScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
              <View
                style={{
                  backgroundColor: focused ? "rgba(33, 150, 243, 0.12)" : "transparent",
                  borderRadius: 12,
                  padding: 2,
                }}
              >
                <ItineraryIcon color={color} size={22} />
              </View>
              {focused && (
                <>
                  <Text style={{ color: color, fontSize: 9, marginTop: 2, fontWeight: "600" }}>
                    Itinerary
                  </Text>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: color,
                      marginTop: 1,
                    }}
                  />
                </>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
              <View
                style={{
                  backgroundColor: focused ? "rgba(33, 150, 243, 0.12)" : "transparent",
                  borderRadius: 12,
                  padding: 2,
                }}
              >
                <SettingsIcon color={color} size={22} />
              </View>
              {focused && (
                <>
                  <Text style={{ color: color, fontSize: 9, marginTop: 2, fontWeight: "600" }}>
                    Settings
                  </Text>
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: color,
                      marginTop: 1,
                    }}
                  />
                </>
              )}
            </View>
          ),
        }}
      />
      {/* <Tab.Screen
        name="Transitions"
        component={TransitionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="history" color={color} size={size} />,
        }}
      /> */}
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
          {/* <Stack.Screen
            name="GeoFenceDebug"
            component={GeoFenceDebugScreen}
            options={{ title: 'GeoFence Debug' }}
          /> */}
          {/* <Stack.Screen
            name="Transitions"
            component={TransitionsScreen}
            options={{ title: 'Transition History' }}
          /> */}
        </>
      )}
    </Stack.Navigator>
  )
}
