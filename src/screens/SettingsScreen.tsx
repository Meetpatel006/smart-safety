import { View, ScrollView, StyleSheet } from "react-native"
import { Text, Switch, TextInput, TouchableOpacity, View, ScrollView } from "react-native"
import { useApp } from "../context/AppContext"
import LanguageToggle from "../components/LanguageToggle"
import OfflineBadge from "../components/OfflineBadge"
import ProfileCard from "../components/ProfileCard"
import { t } from "../context/translations"
import { useEffect, useState } from "react"
import { getAlertState } from "../utils/alertHelpers"

export default function SettingsScreen() {
  const { state, wipeMockData, logout, acknowledgeHighRisk } = useApp()
  const [muted, setMuted] = useState(false)
  const [minutes, setMinutes] = useState<string>("15")

  useEffect(() => {
    (async () => {
      const s = await getAlertState()
      if (s?.suppressionUntil && s.suppressionUntil > Date.now()) {
        const remaining = Math.ceil((s.suppressionUntil - Date.now()) / 60000)
        setMinutes(String(Math.max(1, remaining)))
      }
      setMuted(!!s?.muted)
    })()
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={{ backgroundColor: '#0077CC', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{t(state.language, "settings")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.section}>
          <ProfileCard />
        </View>

        {/* Safety & Alerts Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#0077CC', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: 'white', fontSize: 20 }}>🛡️</Text>
              </View>
              <Text style={styles.sectionTitle}>Safety & Alerts</Text>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.cardSubtitle}>Manage your safety notifications and emergency settings</Text>

              <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 }} />

              <View style={styles.settingItem}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Mute all high-risk alerts</Text>
                  <Text style={styles.settingDescription}>Temporarily disable all safety notifications</Text>
                </View>
                <Switch
                  value={muted}
                  onValueChange={async (v) => {
                    setMuted(v)
                    const { setGlobalMute } = await import('../utils/alertHelpers')
                    await setGlobalMute(v)
                  }}
                />
              </View>

              <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 }} />

              <View style={styles.settingItem}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Suppress alerts for</Text>
                  <Text style={styles.settingDescription}>Pause notifications for a specific duration</Text>
                </View>
              </View>

              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.timeInput}
                  keyboardType="numeric"
                  value={minutes}
                  onChangeText={setMinutes}
                  placeholder="Minutes"
                />
                <TouchableOpacity
                  onPress={async () => {
                    const m = Math.max(1, parseInt(minutes || '0', 10) || 0)
                    await acknowledgeHighRisk(m)
                  }}
                  style={[styles.acknowledgeButton, { backgroundColor: '#FF7A00' }]}
                >
                  <Text style={{ color: 'white', textAlign: 'center' }}>Acknowledge</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.warningText}>
                If you don't acknowledge, alerts will escalate at 5/15/30+ minutes by default.
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF7A00', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: 'white', fontSize: 20 }}>⚙️</Text>
              </View>
              <Text style={styles.sectionTitle}>Preferences</Text>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.cardSubtitle}>Customize your app experience</Text>

              <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 }} />

              <View style={styles.settingItem}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t(state.language, "multilingual")}</Text>
                  <Text style={styles.settingDescription}>Choose your preferred language</Text>
                </View>
              </View>
              <LanguageToggle />

              <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 }} />

              <View style={styles.settingItem}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t(state.language, "offlineMode")}</Text>
                  <Text style={styles.settingDescription}>Manage offline functionality</Text>
                </View>
              </View>
              <OfflineBadge />
            </View>
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF5722', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: 'white', fontSize: 20 }}>👤</Text>
              </View>
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.cardSubtitle}>Manage your account and data</Text>

              <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 }} />

              <TouchableOpacity onPress={wipeMockData} style={styles.listItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🗑️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingTitle}>{t(state.language, "wipeData")}</Text>
                    <Text style={styles.settingDescription}>Clear all mock data from the app</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 }} />

              <TouchableOpacity onPress={logout} style={styles.listItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🚪</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingTitle}>{t(state.language, "logout")}</Text>
                    <Text style={styles.settingDescription}>Sign out of your account</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  timeInput: {
    flex: 1,
    maxWidth: 100,
  },
  acknowledgeButton: {
    flex: 1,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 12,
    lineHeight: 20,
  },
  privacyInfo: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  privacyText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  listItem: {
    paddingVertical: 8,
  },
})
