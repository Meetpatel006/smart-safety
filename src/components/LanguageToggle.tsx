import { View, TouchableOpacity, Text } from "react-native"
import { useApp } from "../context/AppContext"
import { useAppTheme } from '../context/ThemeContext'

export default function LanguageToggle() {
  const { state, setLanguage } = useApp()
  const theme = useAppTheme()
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2 }}>
      <TouchableOpacity
        onPress={() => setLanguage("en")}
        style={{
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 6,
          backgroundColor: state.language === "en" ? theme.colors.primary : 'transparent',
          alignItems: 'center'
        }}
      >
  <Text style={{ color: state.language === "en" ? '#fff' : '#333', fontWeight: '600' }}>EN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setLanguage("hi")}
        style={{
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 6,
          backgroundColor: state.language === "hi" ? theme.colors.primary : 'transparent',
          alignItems: 'center'
        }}
      >
        <Text style={{ color: state.language === "hi" ? '#fff' : '#333', fontWeight: '600' }}>हिं</Text>
      </TouchableOpacity>
    </View>
  )
}
