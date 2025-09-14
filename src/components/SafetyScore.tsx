
import { useMemo, useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Text } from "react-native-paper"
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

  const displayScore = predictedScore ?? weatherModelScore ?? result.score
  const displayLabel = predictedLabel ?? weatherModelCategory ?? result.status

  return (
    <View style={styles.container}>
      <View style={styles.card}>
  <Text style={styles.cardSubtitle}>Your safety score</Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{displayScore ?? '--'}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <Text style={styles.scoreStatus}>{displayLabel ?? ''}</Text>
      </View>

      {/* Old detailed score/progress UI removed — visual card above now represents the score */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    elevation: 1,
    zIndex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#33cc88',
    borderRadius: 14,
    padding: 18,
    width: 300,
    minHeight: 140,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: 'white',
    lineHeight: 64,
  },
  scoreMax: {
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
    marginBottom: 8,
  },
  scoreStatus: {
    color: 'rgba(255,255,255,0.95)',
    marginTop: 6,
    fontSize: 14,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLink: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
})
