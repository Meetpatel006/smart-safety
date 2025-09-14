import { Card, Text, ActivityIndicator } from "react-native-paper"
import { useApp } from "../context/AppContext"
import { MOCK_INCIDENTS } from "../utils/mockData"
import { View } from "react-native"
import { t } from "../context/translations"
import { useEffect, useState } from "react"
import geminiService, { GeminiRecommendation } from "../services/gemini"
import { getGeoPrediction, fetchOpenMeteoCurrentHour, getWeatherPrediction } from "../utils/api"
import { computeSafetyScore } from "../utils/safetyLogic"

export default function SafetyRecommendations() {
  const { state } = useApp()
  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState<GeminiRecommendation[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Gather model-based scores when we have a location
        let geoScore: number | null = null
        let weatherScore: number | null = null
        let areaRisk = 0.3
        let weatherCode: "clear" | "rain" | "storm" | "heat" = "clear"

        const loc = state.currentLocation
        if (loc && loc.coords) {
          try {
            const g = await getGeoPrediction(loc.coords.latitude, loc.coords.longitude)
            // Expecting safety_score_100 or predicted_safety_score
            geoScore = g.safety_score_100 ?? g.predicted_safety_score ?? null
          } catch (e) {
            // ignore geo model error
          }

          try {
            const { compact, modelFeatures } = await fetchOpenMeteoCurrentHour(loc.coords.latitude, loc.coords.longitude)
            if (modelFeatures && modelFeatures.temperature != null) {
              const wm = await getWeatherPrediction(modelFeatures as any)
              weatherScore = wm.safety_score_100 ?? wm.safety_score ?? null
              if (wm.safety_category && typeof wm.safety_category === 'string') {
                // map categories to simplified weatherCode when possible
                const c = String(wm.safety_category).toLowerCase()
                if (c.includes('storm') || c.includes('rain')) weatherCode = 'rain'
                else if (c.includes('heat')) weatherCode = 'heat'
                else weatherCode = 'clear'
              }
            }
          } catch (e) {
            // ignore weather model error
          }
        }

        // Compute a display score preferring geo -> weather -> heuristic
        const heuristic = computeSafetyScore({ weatherCode, areaRisk })
        const displayScore = geoScore ?? weatherScore ?? heuristic.score

        const address = state.currentAddress ?? 'Unknown address'
        const coords = loc && loc.coords ? `${loc.coords.latitude},${loc.coords.longitude}` : 'unknown'

        const systemPrompt = `System: You are a concise safety assistant. The user is at: ${address} (coords: ${coords}). The current safety score is ${displayScore} out of 100. Incidents near the user: ${JSON.stringify(
          MOCK_INCIDENTS
        )}. Provide 5 short prioritized safety recommendations tailored to this situation as a JSON array of objects with 'text' and optional 'confidence' fields.`

        const r = await geminiService.fetchGeminiRecommendations(systemPrompt, 5)
        if (mounted) setRecs(r)
      } catch (err: any) {
        console.warn('Failed to fetch recommendations', err)
        if (mounted) setError(String(err?.message ?? err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [state.language])

  const fallback = [
    { text: "Avoid carrying valuables openly in crowded areas." },
    { text: "Stay with your group after dark." },
    { text: "Keep emergency contacts pinned." },
  ]

  const shown = recs.length > 0 ? recs : fallback

  return (
    <Card>
      <Card.Title title={t(state.language, "safetyRecommendations")} />
      <Card.Content>
        <View style={{ gap: 6 }}>
          {MOCK_INCIDENTS.map((inc) => (
            <Text key={inc.id}>
               {inc.area}: {inc.type} risk {Math.round(inc.risk * 100)}%
            </Text>
          ))}

          {loading ? (
            <View style={{ paddingVertical: 8 }}>
              <ActivityIndicator animating size={20} />
            </View>
          ) : (
            shown.map((r, i) => (
              <Text key={`r${i}`}>
                 {r.text}
              </Text>
            ))
          )}

          {error ? <Text style={{ color: 'red' }}>Error: {error}</Text> : null}
        </View>
      </Card.Content>
    </Card>
  )
}
