import { Text, ActivityIndicator, View } from "react-native"
import { useApp } from "../context/AppContext"
import { MOCK_INCIDENTS } from "../utils/mockData"
// ...existing code...
import { t } from "../context/translations"
import { useEffect, useState } from "react"
import geminiService, { GeminiRecommendation } from "../services/gemini"
import { getGeoPrediction, fetchOpenMeteoCurrentHour, getWeatherPrediction } from "../utils/api"
import * as Location from 'expo-location'
import { GEMINI_API_URL, GEMINI_API_KEY } from '../config'

export default function SafetyRecommendations() {
  const { state, setCurrentLocation } = useApp()
  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState<GeminiRecommendation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true)
      console.log('SafetyRecommendations: Requesting location permissions...')

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Location permission denied')
      }

      console.log('SafetyRecommendations: Getting current position...')
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      console.log('SafetyRecommendations: Location obtained:', location.coords.latitude, location.coords.longitude)
      setCurrentLocation(location)
      return location
    } catch (error: any) {
      console.error('SafetyRecommendations: Failed to get location:', error)
      setError(`Location error: ${error.message}`)
      return null
    } finally {
      setLocationLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const loc = state.currentLocation

    console.log('SafetyRecommendations useEffect triggered, location:', loc)

    const fetchRecommendations = async () => {
      if (!loc || !loc.coords) {
        console.log('SafetyRecommendations: No location available, attempting to get current location...')
        // Try to get current location
        const newLocation = await getCurrentLocation()
        if (!newLocation || !mounted) return

        // Use the newly obtained location
        console.log('SafetyRecommendations: Using newly obtained location:', newLocation.coords.latitude, newLocation.coords.longitude)
        await performRecommendationFetch(newLocation, mounted)
      } else {
        console.log('SafetyRecommendations: Location available, fetching recommendations:', loc.coords.latitude, loc.coords.longitude)
        await performRecommendationFetch(loc, mounted)
      }
    }

    const performRecommendationFetch = async (location: Location.LocationObject, isMounted: boolean) => {
      setLoading(true)
      setError(null)
      try {
        // Gather model-based scores when we have a location
        let geoScore: number | null = null
        let weatherScore: number | null = null
        let areaRisk = 0.3
        let weatherCode: "clear" | "rain" | "storm" | "heat" = "clear"
        let weatherCompact: any = null
        let weatherModelFeatures: any = null
        let weatherModelCategory: string | null = null

        let geoResponse: any = null
        let weatherModelResponse: any = null

        console.log('SafetyRecommendations: Fetching geo prediction...')
        try {
          const g = await getGeoPrediction(location.coords.latitude, location.coords.longitude)
          geoResponse = g
          // Expecting safety_score_100 or predicted_safety_score
          geoScore = g.safety_score_100 ?? g.predicted_safety_score ?? null
          console.log('SafetyRecommendations: Geo prediction result:', geoScore)
        } catch (e) {
          console.warn('SafetyRecommendations: Failed to fetch geo prediction:', e)
          // ignore geo model error
        }

        console.log('SafetyRecommendations: Fetching weather data...')
        try {
          const { compact, modelFeatures } = await fetchOpenMeteoCurrentHour(location.coords.latitude, location.coords.longitude)
          weatherCompact = compact
          weatherModelFeatures = modelFeatures
          if (modelFeatures && modelFeatures.temperature != null) {
            console.log('SafetyRecommendations: Fetching weather prediction...')
            const wm = await getWeatherPrediction(modelFeatures as any)
            weatherModelResponse = wm
            weatherScore = wm.safety_score_100 ?? wm.safety_score ?? null
            weatherModelCategory = wm.safety_category ?? null
            console.log('SafetyRecommendations: Weather prediction result:', weatherScore, weatherModelCategory)

            if (wm.safety_category && typeof wm.safety_category === 'string') {
              // map categories to simplified weatherCode when possible
              const c = String(wm.safety_category).toLowerCase()
              if (c.includes('storm') || c.includes('rain')) weatherCode = 'rain'
              else if (c.includes('heat')) weatherCode = 'heat'
              else weatherCode = 'clear'
            }
          }
        } catch (e) {
          console.warn('SafetyRecommendations: Failed to fetch weather prediction:', e)
          // ignore weather model error
        }

        const address = state.currentAddress ?? 'Unknown address'
        const coords = `${location.coords.latitude},${location.coords.longitude}`

        const timestamp = new Date().toISOString()
        const dataVerified = Boolean(geoResponse || weatherModelResponse)

        console.log('SafetyRecommendations: Building Gemini prompt...')
        const systemPrompt = `System: You are a concise safety assistant that provides JSON responses only.
DATA_METADATA: {"timestamp":"${timestamp}", "dataVerified": ${dataVerified} }
User location: ${address} (coords: ${coords}).
Nearby incidents: ${JSON.stringify(MOCK_INCIDENTS)}
Raw geo model response: ${JSON.stringify(geoResponse ?? {})}
Local weather (compact): ${JSON.stringify(weatherCompact ?? {})}
Weather model features: ${JSON.stringify(weatherModelFeatures ?? {})}
Raw weather model response: ${JSON.stringify(weatherModelResponse ?? {})}
Weather model category: ${String(weatherModelCategory ?? '')}

IMPORTANT: Return ONLY a valid JSON array of objects with 'text' and optional 'confidence' fields. Do not include any markdown formatting, code blocks, or additional text. Example: [{"text": "Stay aware of surroundings"}, {"text": "Keep valuables secure"}]`

        console.log('SafetyRecommendations: Calling Gemini API...')
        console.log('SafetyRecommendations: Gemini API URL configured:', !!GEMINI_API_URL)
        console.log('SafetyRecommendations: Gemini API Key configured:', !!GEMINI_API_KEY)
        const r = await geminiService.fetchGeminiRecommendations(systemPrompt, 5)
        console.log('SafetyRecommendations: Gemini response:', r)

        if (isMounted) setRecs(r)
      } catch (err: any) {
        console.warn('SafetyRecommendations: Failed to fetch recommendations', err)
        if (isMounted) setError(String(err?.message ?? err))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchRecommendations()
    return () => {
      mounted = false
    }
  }, [state.language, state.currentLocation])

  const fallback = [
    { text: "Avoid carrying valuables openly in crowded areas." },
    { text: "Stay with your group after dark." },
    { text: "Keep emergency contacts pinned." },
  ]

  const shown = recs.length > 0 ? recs : fallback
  const isLoading = locationLoading || loading

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>{t(state.language, "safetyRecommendations")}</Text>
      <View>
        <View style={{ gap: 6 }}>
          {MOCK_INCIDENTS.map((inc) => (
            <Text key={inc.id}>
               {inc.area}: {inc.type} risk {Math.round(inc.risk * 100)}%
            </Text>
          ))}

          {isLoading ? (
            <View style={{ paddingVertical: 8, alignItems: 'center' }}>
              <ActivityIndicator animating size={20} />
              <Text style={{ marginTop: 8, fontSize: 12, color: 'gray' }}>
                {locationLoading ? "Getting location..." : "Generating personalized recommendations..."}
              </Text>
            </View>
          ) : (
            <View>
              {recs.length === 0 && !error && (
                <Text style={{ fontSize: 12, color: 'orange', marginBottom: 8 }}>
                  Using general safety guidelines (AI recommendations unavailable)
                </Text>
              )}
              {shown.map((r, i) => (
                <Text key={`r${i}`} style={{ marginBottom: 4 }}>
                   • {r.text}
                </Text>
              ))}
            </View>
          )}

          {error ? <Text style={{ color: 'red', fontSize: 12 }}>Error: {error}</Text> : null}
        </View>
      </View>
    </View>
  )
}
