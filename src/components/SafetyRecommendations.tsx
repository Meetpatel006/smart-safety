import { Card, Text } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { MOCK_INCIDENTS } from "../utils/mockData"
import { View } from "react-native"
import { t } from "../context/translations"

export default function SafetyRecommendations() {
  const { state } = useApp()
  const recs = [
    "Avoid carrying valuables openly in crowded areas.",
    "Stay with your group after dark.",
    "Keep emergency contacts pinned.",
    "Use official taxis near stations.",
    "Check weather before outdoor plans.",
  ]

  return (
    <Card>
      <Card.Title title={t(state.language, "safetyRecommendations")} />
      <Card.Content>
        <View style={{ gap: 6 }}>
          {MOCK_INCIDENTS.map((inc) => (
            <Text key={inc.id}>
              • {inc.area}: {inc.type} risk {Math.round(inc.risk * 100)}%
            </Text>
          ))}
          {recs.map((r, i) => (
            <Text key={`r${i}`}>• {r}</Text>
          ))}
        </View>
      </Card.Content>
    </Card>
  )
}
