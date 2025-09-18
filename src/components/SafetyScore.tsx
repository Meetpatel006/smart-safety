
import { useState, useEffect } from "react"
import { View, StyleSheet, Text } from "react-native"
import { computeSafetyScore, SafetyScoreResult } from "../utils/safetyLogic"
import { t } from "../context/translations"
import { useApp } from "../context/AppContext"
import * as Location from 'expo-location'

export default function SafetyScore() {
  const { state, setCurrentLocation } = useApp()
  const [combinedResult, setCombinedResult] = useState<SafetyScoreResult | null>(null)
  const [combinedLoading, setCombinedLoading] = useState(false)
  const [combinedError, setCombinedError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true)
      console.log('Requesting location permissions...')

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Location permission denied')
      }

      console.log('Getting current position...')
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      console.log('Location obtained:', location.coords.latitude, location.coords.longitude)
      setCurrentLocation(location)
      return location
    } catch (error: any) {
      console.error('Failed to get location:', error)
      setCombinedError(`Location error: ${error.message}`)
      return null
    } finally {
      setLocationLoading(false)
    }
  }

  // Fetch combined safety score using real API predictions
  useEffect(() => {
    let mounted = true
    const loc = state.currentLocation

    console.log('SafetyScore useEffect triggered, location:', loc)

    const fetchSafetyScore = async () => {
      if (!loc || !loc.coords) {
        console.log('No location available, attempting to get current location...')
        // Try to get current location
        const newLocation = await getCurrentLocation()
        if (!newLocation || !mounted) return

        // Use the newly obtained location
        console.log('Using newly obtained location:', newLocation.coords.latitude, newLocation.coords.longitude)
        await performSafetyScoreFetch(newLocation, mounted)
      } else {
        console.log('Location available, fetching safety score:', loc.coords.latitude, loc.coords.longitude)
        await performSafetyScoreFetch(loc, mounted)
      }
    }

    const performSafetyScoreFetch = async (location: Location.LocationObject, isMounted: boolean) => {
      setCombinedLoading(true)
      setCombinedError(null)
      try {
        console.log('Calling computeSafetyScore with:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        })
        const result = await computeSafetyScore({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        })
        console.log('Safety score result:', result)
        if (isMounted) setCombinedResult(result)
      } catch (error: any) {
        console.warn('Failed to compute safety score:', error)
        if (isMounted) setCombinedError(error?.message || 'Failed to fetch safety score')
      } finally {
        if (isMounted) setCombinedLoading(false)
      }
    }

    fetchSafetyScore()
    return () => { mounted = false }
  }, [state.currentLocation])

  const displayScore = combinedResult?.score
  const displayLabel = combinedResult?.status
  const isLoading = locationLoading || combinedLoading

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>
          Your safety score
          {locationLoading && " (Getting location...)"}
          {combinedLoading && !locationLoading && " (Calculating...)"}
        </Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>
            {isLoading ? "--" : (displayScore ?? "--")}
          </Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <Text style={styles.scoreStatus}>
          {isLoading ? "Loading..." : (displayLabel ?? "")}
        </Text>
      </View>

      {combinedError && (
        <Text style={styles.errorText}>{combinedError}</Text>
      )}

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
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
})
