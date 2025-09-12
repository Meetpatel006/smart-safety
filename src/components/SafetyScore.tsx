
import { useMemo, useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { Card, Text, SegmentedButtons, ProgressBar, ActivityIndicator } from "react-native-paper"
import { computeSafetyScore } from "../utils/safetyLogic"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"
import { getGeoPrediction, getWeatherPrediction, fetchOpenMeteoCurrentHour } from "../utils/api"

export default function SafetyScore() {
  const { state } = useApp()
  const [weather, setWeather] = useState<"clear" | "rain" | "storm" | "heat">("clear")
  const [areaRisk, setAreaRisk] = useState(0.3)
  const [loading, setLoading] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [predictedScore, setPredictedScore] = useState<number | null>(null)
  const [predictedLabel, setPredictedLabel] = useState<string | null>(null)
  const [weatherModelLoading, setWeatherModelLoading] = useState(false)
  const [weatherModelError, setWeatherModelError] = useState<string | null>(null)
  const [weatherModelScore, setWeatherModelScore] = useState<number | null>(null)
  const [weatherModelCategory, setWeatherModelCategory] = useState<string | null>(null)
  const [weatherModelConfidence, setWeatherModelConfidence] = useState<number | null>(null)
  const result = useMemo(() => computeSafetyScore({ weatherCode: weather, areaRisk }), [weather, areaRisk])

  // Fetch geo model prediction when currentLocation changes
  useEffect(() => {
    let mounted = true
    const loc = state.currentLocation
    if (!loc || !loc.coords) {
      // reset model values when no location
      setPredictedScore(null)
      setPredictedLabel(null)
      setModelError(null)
      setLoading(false)
      return
    }

    const fetchPrediction = async () => {
      setLoading(true)
      setModelError(null)
      try {
        const data = await getGeoPrediction(loc.coords.latitude, loc.coords.longitude)
        if (!mounted) return
        // Expecting fields: predicted_safety_score, predicted_risk_label, safety_score_100
        const score = data.predicted_safety_score ?? data.safety_score_100 ?? null
        const label = data.predicted_risk_label ?? null
        if (typeof score === 'number') setPredictedScore(score)
        else setPredictedScore(null)
        if (label) setPredictedLabel(String(label))
      } catch (e: any) {
        if (!mounted) return
        setModelError(e?.message || 'Failed to fetch geo model')
        setPredictedScore(null)
        setPredictedLabel(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Also fetch weather model prediction for the current hour
    const fetchWeatherModel = async () => {
      setWeatherModelLoading(true)
      setWeatherModelError(null)
      try {
        const { compact, modelFeatures } = await fetchOpenMeteoCurrentHour(loc.coords.latitude, loc.coords.longitude)
        if (!mounted) return
        if (modelFeatures.temperature == null) throw new Error('Weather data missing')

        const wm = await getWeatherPrediction(modelFeatures as any)
        if (!mounted) return
        // Response sample contains safety_score_100, safety_category, confidence
        setWeatherModelScore(wm.safety_score_100 ?? wm.safety_score ?? null)
        setWeatherModelCategory(wm.safety_category ?? null)
        setWeatherModelConfidence(wm.confidence ?? null)
      } catch (e: any) {
        if (!mounted) return
        setWeatherModelError(e?.message || 'Failed to fetch weather model')
        setWeatherModelScore(null)
        setWeatherModelCategory(null)
        setWeatherModelConfidence(null)
      } finally {
        if (mounted) setWeatherModelLoading(false)
      }
    }

    fetchPrediction()
    fetchWeatherModel()
    return () => { mounted = false }
  }, [state.currentLocation])

  return (
    <Card style={styles.card}>
      <Card.Title title={t(state.language, "safetyScore")} />
      <Card.Content>
        <View style={{ gap: 10 }}>
          
          {/* Show model prediction if available, otherwise show computed local score */}
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator animating size={20} />
              <Text>Checking location safety...</Text>
            </View>
          ) : modelError ? (
            <Text style={{ color: 'red' }}>Geo model error: {modelError}</Text>
          ) : predictedScore !== null ? (
            <>
              <Text>Score (geo model): {predictedScore} ({predictedLabel || 'Unknown'})</Text>
              <ProgressBar progress={Math.max(0, Math.min(1, predictedScore / 100))} />
            </>
          ) : (
            <>
              <Text>
                Score: {result.score} ({result.status})
              </Text>
              <ProgressBar progress={result.score / 100} />
            </>
          )}
          {/* Weather model results */}
          {weatherModelLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator animating size={16} />
              <Text>Checking weather safety...</Text>
            </View>
          ) : weatherModelError ? (
            <Text style={{ color: 'red' }}>Weather model error: {weatherModelError}</Text>
          ) : weatherModelScore !== null ? (
            <>
              <Text>Score (weather model): {weatherModelScore} ({weatherModelCategory || 'Unknown'})</Text>
              <Text>Confidence: {weatherModelConfidence !== null ? `${(weatherModelConfidence * 100).toFixed(0)}%` : '--'}</Text>
              <ProgressBar progress={Math.max(0, Math.min(1, (weatherModelScore ?? 0) / 100))} />
            </>
          ) : null}
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
