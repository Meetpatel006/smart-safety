
import { useMemo, useState } from "react"
import { View, StyleSheet } from "react-native"
import { Card, Text, SegmentedButtons, ProgressBar } from "react-native-paper"
import { computeSafetyScore } from "../utils/safetyLogic"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"

export default function SafetyScore() {
  const { state } = useApp()
  const [weather, setWeather] = useState<"clear" | "rain" | "storm" | "heat">("clear")
  const [areaRisk, setAreaRisk] = useState(0.3)
  const result = useMemo(() => computeSafetyScore({ weatherCode: weather, areaRisk }), [weather, areaRisk])

  return (
    <Card style={styles.card}>
      <Card.Title title={t(state.language, "safetyScore")} />
      <Card.Content>
        <View style={{ gap: 10 }}>
          <SegmentedButtons
            value={weather}
            onValueChange={(v: any) => setWeather(v)}
            buttons={[
              { value: "clear", label: "Clear" },
              { value: "rain", label: "Rain" },
              { value: "storm", label: "Storm" },
              { value: "heat", label: "Heat" },
            ]}
          />
          <Text>Area Risk: {(areaRisk * 100).toFixed(0)}%</Text>
          <SegmentedButtons
            value={String(areaRisk)}
            onValueChange={(v: any) => setAreaRisk(Number(v))}
            buttons={[
              { value: "0.1", label: "Low" },
              { value: "0.3", label: "Med" },
              { value: "0.6", label: "High" },
            ]}
          />
          <Text>
            Score: {result.score} ({result.status})
          </Text>
          <ProgressBar progress={result.score / 100} />
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: 6,
    elevation: 1,
    zIndex: 1,
  },
})
