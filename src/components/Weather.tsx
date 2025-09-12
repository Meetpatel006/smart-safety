import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Card, Text, ActivityIndicator } from 'react-native-paper';

type HourlyWeather = {
  time: string[];
  temperature_2m: number[];
  relativehumidity_2m: number[]; // note: Open-Meteo uses relativehumidity_2m (no underscore between relative and humidity in earlier code)
  windspeed_10m: number[];
  winddirection_10m: number[];
  pressure_msl: number[];
  precipitation: number[];
  visibility: number[];
  apparent_temperature: number[];
};

const Weather = () => {
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentApparent, setCurrentApparent] = useState<number | null>(null);
  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hourly, setHourly] = useState<HourlyWeather | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Build query params for Open-Meteo hourly fields
        const hourlyParams = [
          'temperature_2m',
          'relativehumidity_2m',
          'windspeed_10m',
          'winddirection_10m',
          'pressure_msl',
          'precipitation',
          'visibility',
          'apparent_temperature',
        ].join(',');

        // Force timezone to Asia/Kolkata for consistent times (URL-encoded as Asia%2FKolkata)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${encodeURIComponent(
          hourlyParams
        )}&timezone=Asia%2FKolkata`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
        const data = await res.json();

        // Set hourly data if available
        if (data && data.hourly) {
          setHourly(data.hourly as HourlyWeather);

          // determine current hour index from hourly.time
          const now = new Date();
          // API returns times in local timezone when timezone=auto as ISO strings
          const times: string[] = data.hourly.time || [];
          let idx = times.findIndex((t: string) => {
            const dt = new Date(t);
            return (
              dt.getFullYear() === now.getFullYear() &&
              dt.getMonth() === now.getMonth() &&
              dt.getDate() === now.getDate() &&
              dt.getHours() === now.getHours()
            );
          });
          if (idx === -1) idx = 0;

          const h: HourlyWeather = data.hourly;
          setCurrentTemp(h.temperature_2m?.[idx] ?? null);
          setCurrentApparent(h.apparent_temperature?.[idx] ?? null);
          setCurrentHumidity(h.relativehumidity_2m?.[idx] ?? null);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = () => {
    if (!currentTemp) return 'weather-cloudy';
    // simplistic mapping based on temperature for fallback
    if (currentTemp > 30) return 'weather-sunny';
    if (currentTemp > 20) return 'weather-partly-cloudy';
    if (currentTemp > 5) return 'weather-cloudy';
    return 'weather-snowy';
  };

  if (loading) return <ActivityIndicator style={{ marginRight: 16 }} />;
  if (!hourly) return (
    <View style={{ marginRight: 16 }}>
      <MaterialCommunityIcons name="alert-circle-outline" size={24} color="red" />
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <MaterialCommunityIcons name={getWeatherIcon()} size={28} color="#6200ee" />
        <Text style={styles.tempText}>{currentTemp !== null ? `${Math.round(currentTemp)}°C` : '--'}</Text>
      </View>

      <Card.Content style={{ marginTop: 8 }}>
        <Text>Apparent: {currentApparent !== null ? `${Math.round(currentApparent)}°C` : '--'}</Text>
        <Text>Humidity: {currentHumidity !== null ? `${Math.round(currentHumidity)}%` : '--'}</Text>
      </Card.Content>
    </Card>
  );
};

export default Weather;

const styles = StyleSheet.create({
  card: {
    marginRight: 16,
    padding: 8,
    elevation: 6,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  tempText: { marginLeft: 10, fontWeight: '600' },
});
