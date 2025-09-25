import { View, ScrollView, StyleSheet } from "react-native"
import { Appbar, List, Text, Switch, TextInput, Button, Card, Divider, Avatar, useTheme } from "react-native-paper"
import { useApp } from "../context/AppContext"
import LanguageToggle from "../components/LanguageToggle"
import OfflineBadge from "../components/OfflineBadge"
import ProfileCard from "../components/ProfileCard"
import { t } from "../context/translations"
import { useEffect, useState } from "react"
import { Alert } from 'react-native'

import { getAlertState } from "../utils/alertHelpers"

export default function SettingsScreen() {
  const { state, wipeMockData, logout, acknowledgeHighRisk, setAuthorityPhone: setAuthorityPhoneInContext } = useApp()
  const theme = useTheme()
  const [muted, setMuted] = useState(false)
  const [minutes, setMinutes] = useState<string>("15")
  const [authorityPhone, setAuthorityPhone] = useState<string>(state.authorityPhone || '')

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title={t(state.language, "settings")} titleStyle={{ color: 'white' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.section}>
          <ProfileCard />
        </View>

        {/* Safety & Alerts Section */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <Card.Title
              title="Safety & Alerts"
              titleStyle={styles.sectionTitle}
              left={(props) => <Avatar.Icon {...props} icon="shield-alert" size={40} style={{ backgroundColor: theme.colors.primary }} />}
            />
            <Card.Content>
              <Text style={styles.cardSubtitle}>Manage your safety notifications and emergency settings</Text>

              <Divider style={styles.divider} />

              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Authority phone (temporary)</Text>
                <TextInput
                  label="Authority Number"
                  value={authorityPhone}
                  onChangeText={setAuthorityPhone}
                  keyboardType="phone-pad"
                  mode="outlined"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button
                    mode="contained"
                    onPress={async () => {
                        try {
                          setAuthorityPhoneInContext(authorityPhone || null)
                        } catch (e) {
                          console.warn('Failed saving authority phone', e)
                        }
                      }}
                  >
                    Save
                  </Button>
                </View>
              </View>


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
                  color={theme.colors.primary}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Suppress alerts for</Text>
                  <Text style={styles.settingDescription}>Pause notifications for a specific duration</Text>
                </View>
              </View>

              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.timeInput}
                  mode="outlined"
                  keyboardType="numeric"
                  value={minutes}
                  onChangeText={setMinutes}
                  label="Minutes"
                  dense
                />
                <Button
                  mode="contained"
                  onPress={async () => {
                    const m = Math.max(1, parseInt(minutes || '0', 10) || 0)
                    await acknowledgeHighRisk(m)
                  }}
                  style={styles.acknowledgeButton}
                  buttonColor={theme.colors.secondary}
                >
                  Acknowledge
                </Button>
              </View>

              <Text style={styles.warningText}>
                If you don't acknowledge, alerts will escalate at 5/15/30+ minutes by default.
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <Card.Title
              title="Preferences"
              titleStyle={styles.sectionTitle}
              left={(props) => <Avatar.Icon {...props} icon="cog" size={40} style={{ backgroundColor: theme.colors.secondary }} />}
            />
            <Card.Content>
              <Text style={styles.cardSubtitle}>Customize your app experience</Text>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t(state.language, "multilingual")}</Text>
                  <Text style={styles.settingDescription}>Choose your preferred language</Text>
                </View>
              </View>
              <LanguageToggle />

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t(state.language, "offlineMode")}</Text>
                  <Text style={styles.settingDescription}>Manage offline functionality</Text>
                </View>
              </View>
              <OfflineBadge />
            </Card.Content>
          </Card>
        </View>

        

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <Card.Title
              title="Account"
              titleStyle={styles.sectionTitle}
              left={(props) => <Avatar.Icon {...props} icon="account" size={40} style={{ backgroundColor: '#FF5722' }} />}
            />
            <Card.Content>
              <Text style={styles.cardSubtitle}>Manage your account and data</Text>

              <Divider style={styles.divider} />

              <List.Item
                title={t(state.language, "wipeData")}
                description="Clear all mock data from the app"
                onPress={wipeMockData}
                left={(props) => <List.Icon {...props} icon="delete" color="#F44336" />}
                style={styles.listItem}
              />

              <Divider style={styles.divider} />

              <List.Item
                title={t(state.language, "logout")}
                description="Sign out of your account"
                onPress={logout}
                left={(props) => <List.Icon {...props} icon="logout" color="#FF5722" />}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>
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
