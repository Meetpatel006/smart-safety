import { View, ScrollView } from "react-native"
import { Appbar, Card, List, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import LanguageToggle from "../components/LanguageToggle"
import OfflineBadge from "../components/OfflineBadge"
import ProfileCard from "../components/ProfileCard"
import { t } from "../context/translations"

export default function SettingsScreen() {
  const { state, wipeMockData, logout } = useApp()
  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title={t(state.language, "settings")} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <ProfileCard />
        <Card>
          <Card.Title title={t(state.language, "dataPrivacy")} />
          <Card.Content>
            <Text>This demo uses only mock/local data. No personal data is collected or sent to any server.</Text>
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title={t(state.language, "multilingual")} />
          <Card.Content>
            <LanguageToggle />
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title={t(state.language, "offlineMode")} />
          <Card.Content>
            <OfflineBadge />
          </Card.Content>
        </Card>

        <List.Section>
          <List.Item
            title={t(state.language, "wipeData")}
            onPress={wipeMockData}
            left={(props) => <List.Icon {...props} icon="delete" />}
          />
          <List.Item
            title={t(state.language, "logout")}
            onPress={logout}
            left={(props) => <List.Icon {...props} icon="logout" />}
          />
        </List.Section>
      </ScrollView>
    </View>
  )
}
