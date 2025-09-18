
import { useEffect, useMemo, useState } from "react"
import { Text, TouchableOpacity, View, Modal, ScrollView } from "react-native"
import { useAppTheme } from '../context/ThemeContext'
import { useApp } from "../context/AppContext"
import { t } from "../context/translations"
import { getAlerts } from "../utils/api";

type Incident = { id: string; title: string; status: "Open" | "Resolved"; area: string; time: string }

const mockTourists = [
  { id: "u1", name: "Alex Traveler", lat: 28.61, lng: 77.21 },
  { id: "u2", name: "Priya", lat: 28.62, lng: 77.2 },
  { id: "u3", name: "Rahul", lat: 28.63, lng: 77.19 },
]

export default function AuthorityDashboardScreen() {
  const { state } = useApp()
  const theme = useAppTheme()
  const [filter, setFilter] = useState<"All" | "Open" | "Resolved">("All")
  const [selected, setSelected] = useState<(typeof mockTourists)[0] | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!state.token) return;
      setLoading(true);
      try {
        const response = await getAlerts(state.token);
        const formattedIncidents = response.alerts.map((alert: any) => ({
          id: alert._id || alert.id,
          title: alert.sosReason.reason,
          status: alert.status === 'new' ? 'Open' : 'Resolved',
          area: alert.location.locationName,
          time: new Date(alert.timestamp).toLocaleTimeString(),
        }));
        setIncidents(formattedIncidents);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [state.token]);

  const filteredIncidents = useMemo(() => {
    if (filter === "All") return incidents
    return incidents.filter((i) => i.status === filter)
  }, [filter, incidents])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{t(state.language, "authority")}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Tourists (Mock)</Text>
          </View>
          <View style={{ padding: 16 }}>
            {mockTourists.map((tour) => (
              <View key={tour.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                <Text style={{ flex: 1, fontSize: 16, color: '#333' }}>{tour.name} — ({tour.lat.toFixed(2)}, {tour.lng.toFixed(2)})</Text>
                <TouchableOpacity onPress={() => setSelected(tour)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 20 }}>ℹ️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Incidents / Alerts</Text>
              <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2 }}>
                {['All', 'Open', 'Resolved'].map((value) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setFilter(value as any)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                      backgroundColor: filter === value ? theme.colors.primary : 'transparent',
                    }}
                  >
                    <Text style={{ color: filter === value ? '#fff' : '#333', fontWeight: '600', fontSize: 12 }}>
                      {value === 'All' ? t(state.language, "all") : value === 'Open' ? t(state.language, "open") : t(state.language, "resolved")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={{ padding: 16 }}>
            {loading ? <Text>Loading...</Text> : filteredIncidents.map((inc) => (
              <View key={inc.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>{inc.status === "Open" ? "⚠️" : "✅"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>{inc.title} — {inc.area}</Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>Time: {inc.time} | Status: {inc.status}</Text>
                </View>
                <View style={{ backgroundColor: inc.status === "Open" ? '#FF5722' : '#4CAF50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{inc.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Safety Analytics (Mock)</Text>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>Alerts by Area</Text>
            <View style={{ height: 8 }} />
            {["Market", "Station", "Fort"].map((area, idx) => {
              const width = [80, 50, 30][idx]
              return (
                <View key={area} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>{area}</Text>
                  <View style={{ height: 10, backgroundColor: "#eee", borderRadius: 5 }}>
                    <View style={{ width: `${width}%`, height: 10, backgroundColor: theme.colors.primary, borderRadius: 5 }} />
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Reporting (Mock)</Text>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>- Daily Summary: 12 alerts, 9 resolved, 3 open</Text>
            <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>- Top Risk Areas: Market, Station</Text>
            <Text style={{ fontSize: 14, color: '#333' }}>- Response Avg Time: 7m</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!selected} transparent={true} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8, width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>Tourist Detail</Text>
            <Text style={{ fontSize: 16, marginBottom: 8, color: '#333' }}>{selected?.name}</Text>
            <Text style={{ fontSize: 16, marginBottom: 8, color: '#333' }}>
              Location: {selected?.lat.toFixed(3)}, {selected?.lng.toFixed(3)} (mock)
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 16, color: '#333' }}>Sharing: {state.shareLocation ? "Yes" : "No"}</Text>
            <TouchableOpacity onPress={() => setSelected(null)} style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, alignSelf: 'flex-end' }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
