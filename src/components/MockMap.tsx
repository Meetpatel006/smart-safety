import { View, Text, TouchableOpacity } from "react-native"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function MockMap() {
  const { state, toggleShareLocation } = useApp()

  return (
    <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12 }}>
      <View
        style={{
          height: 160,
          backgroundColor: "#eef6ff",
          borderRadius: 6,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Fake markers */}
        <View
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#0077CC',
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 70,
            left: 120,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#FF7A00",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 110,
            left: 200,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#FF7A00",
          }}
        />
        <Text>Mock Map (no real location)</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Text>{state.shareLocation ? t(state.language, "stopShare") : t(state.language, "shareLocation")}</Text>
        <TouchableOpacity onPress={toggleShareLocation} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e3f2fd', borderRadius: 4 }}>
          <Text style={{ color: '#1976d2' }}>{state.shareLocation ? t(state.language, "stopShare") : t(state.language, "shareLocation")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
