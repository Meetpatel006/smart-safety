import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import * as Location from 'expo-location';
import { fetchOpenMeteoCurrentHour } from '../utils/api';

type HourlyWeather = {
  time: string[];
  temperature_2m: number[];
  relativehumidity_2m: number[];
  windspeed_10m: number[];
  winddirection_10m: number[];
  pressure_msl: number[];
  precipitation: number[];
  visibility: number[];
  apparent_temperature: number[];
};

const Weather = () => {
  const theme = useAppTheme()
  const [currentData, setCurrentData] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  

  const fmt = (v: number | null, suffix = '') => (v == null ? '—' : `${v}${suffix}`)

  const fetchWeatherFor = async (lat: number, lon: number) => {
    try {
      setError(null)
      const { compact } = await fetchOpenMeteoCurrentHour(lat, lon)
      setCurrentData(compact)
    } catch (e: any) {
      console.error('fetchWeatherFor error', e?.message || e)
      setError(e?.message || 'Failed to fetch weather')
      setCurrentData(null)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location permission denied — showing default location')
        await fetchWeatherFor(28.6139, 77.2090)
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      await fetchWeatherFor(loc.coords.latitude, loc.coords.longitude)
    } catch (e: any) {
      console.error('refresh error', e?.message || e)
      setError(e?.message || 'Failed to refresh weather')
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  // Determine a simple icon based on cloud cover / precipitation if available
  const weatherIcon = () => {
    const cc = currentData?.cloud_cover
    if (cc == null) return 'weather-partly-cloudy'
    if (cc < 20) return 'weather-sunny'
    if (cc < 60) return 'weather-partly-cloudy'
    return 'weather-cloudy'
  }

  const weatherDetails = [
    { label: 'Humidity', value: currentData?.humidity != null ? `${currentData.humidity}%` : '—', icon: 'water-percent' },
    { label: 'Wind Speed', value: currentData?.wind_speed != null ? `${currentData.wind_speed} m/s` : '—', icon: 'weather-windy' },
    { label: 'Visibility', value: currentData?.visibility != null ? `${currentData.visibility} m` : '—', icon: 'eye' },
    { label: 'Pressure', value: currentData?.pressure != null ? `${currentData.pressure} hPa` : '—', icon: 'gauge' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Weather</Text>
        <View style={styles.refreshContainer}>
          <Text onPress={refresh} style={{ color: '#6B7280', fontWeight: '600' }}>Refresh</Text>
        </View>
      </View>

      <View style={styles.weatherDisplay}>
        <View style={styles.weatherIconContainer}>
          <View style={[styles.weatherIcon, { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: theme.colors.primary, fontSize: 24 }}>⛅</Text>
          </View>
        </View>

        <View style={styles.temperatureSection}>
          <Text style={[styles.temperature, { color: theme.colors.primary }]}>
            {currentData?.temperature == null ? '—' : `${currentData.temperature}°`}
          </Text>
          <Text style={styles.temperatureUnit}>C</Text>
          <Text style={[styles.feelsLike, { color: '#6B7280' }]}> 
            {currentData?.apparent_temperature == null ? '' : `Feels like ${currentData.apparent_temperature}°`}
          </Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorIndicator}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.detailsGrid}>
        {weatherDetails.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
                  <View style={[styles.detailIcon, { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#6B7280' }}>•</Text>
                  </View>
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default Weather

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIconContainer: {
    marginBottom: 16,
  },
  weatherIcon: {
    backgroundColor: '#F0F9FF',
  },
  temperatureSection: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  temperatureUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    position: 'absolute',
    top: 8,
    right: -20,
  },
  feelsLike: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorIndicator: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  detailIconContainer: {
    marginBottom: 8,
  },
  detailIcon: {
    backgroundColor: '#F3F4F6',
  },
  detailTextContainer: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
