
import React from "react"
import { View } from "react-native"
import { Text, TouchableOpacity, View } from "react-native"
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"

export default function GeoFenceList() {
  const { state } = useApp()
  const [snack, setSnack] = React.useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" })

  const fire = (zone: string, action: "enter" | "exit") => {
    const msg = `${action === "enter" ? "Entered" : "Exited"} ${zone} (mock alert)`
    setSnack({ visible: true, msg })
  }

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{t(state.language, "geofence")}</Text>
      </View>
      <View style={{ padding: 16 }}>
        {state.geofences.map((g) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
            <Text style={{ flex: 1, fontSize: 16, color: '#333' }}>{g.name} — Risk: {g.risk}</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity onPress={() => fire(g.name, "enter")} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#4CAF50', borderRadius: 4 }}>
                <Text style={{ color: 'white', fontSize: 12 }}>{t(state.language, "enter")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => fire(g.name, "exit")} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FF9800', borderRadius: 4 }}>
                <Text style={{ color: 'white', fontSize: 12 }}>{t(state.language, "exit")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      {snack.visible && (
        <View style={{ position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#333', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>{snack.msg}</Text>
        </View>
      )}
    </View>
  )
}
