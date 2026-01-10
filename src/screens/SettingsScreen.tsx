import { View, ScrollView, StyleSheet } from "react-native"
import { Appbar, List, Text, TextInput, Button, Card, Divider, Avatar, useTheme } from "react-native-paper"
import { useApp } from "../context/AppContext"
import LanguageToggle from "../components/LanguageToggle"
import OfflineBadge from "../components/OfflineBadge"
import ProfileCard from "../components/ProfileCard"
import SafetyScoreCard from "../components/SafetyScoreCard"
import QuickAccessSection from "../components/QuickAccessSection"
import AccountPreferencesSection from "../components/AccountPreferencesSection"
import { t } from "../context/translations"
import { useEffect, useState } from "react"

export default function SettingsScreen() {
  const { state, wipeMockData, logout, setAuthorityPhone } = useApp()
  const theme = useTheme()
  const [authorityPhoneLocal, setAuthorityPhoneLocal] = useState<string>(state.authorityPhone || '')

  useEffect(() => {
    // keep local authority phone in sync when screen mounts
    setAuthorityPhoneLocal(state.authorityPhone || '')
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.section}>
          <ProfileCard />
          <SafetyScoreCard />
          <QuickAccessSection />
          <AccountPreferencesSection />
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
    paddingTop: 50,
    paddingBottom: 150,
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
