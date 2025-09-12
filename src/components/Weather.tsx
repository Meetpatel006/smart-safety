import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Text, ActivityIndicator, Card } from 'react-native-paper';

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
  // keep only the compact data object requested by the user
  const [currentData, setCurrentData] = useState<{
    temperature: number | null;
    apparent_temperature: number | null;
    humidity: number | null;
    wind_speed: number | null;
    wind_bearing: number | null;
    visibility: number | null;
    cloud_cover: number | null;
    pressure: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

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

        // Build the compact object with the exact keys the user requested.
        const makeData = (obj: any) => ({
          temperature: obj.temperature ?? null,
          apparent_temperature: obj.apparent_temperature ?? obj.apparentTemperature ?? null,
          humidity: obj.humidity ?? obj.relativehumidity_2m ?? null,
          wind_speed: obj.wind_speed ?? obj.windspeed_10m ?? null,
          wind_bearing: obj.wind_bearing ?? obj.winddirection_10m ?? null,
          visibility: obj.visibility ?? null,
          cloud_cover: obj.cloud_cover ?? obj.cloudcover ?? null,
          pressure: obj.pressure ?? obj.pressure_msl ?? null,
        });

        if (data) {
          if (data.current_weather) {
            setCurrentData(makeData(data.current_weather));
          } else if (data.hourly) {
            const times: string[] = data.hourly.time || [];
            const now = new Date();
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

            const h = data.hourly as HourlyWeather;
            setCurrentData({
              temperature: h.temperature_2m?.[idx] ?? null,
              apparent_temperature: h.apparent_temperature?.[idx] ?? null,
              humidity: h.relativehumidity_2m?.[idx] ?? null,
              wind_speed: h.windspeed_10m?.[idx] ?? null,
              wind_bearing: h.winddirection_10m?.[idx] ?? null,
              visibility: h.visibility?.[idx] ?? null,
              cloud_cover: null,
              pressure: h.pressure_msl?.[idx] ?? null,
            });
          } else {
            setCurrentData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);


  if (loading) return <ActivityIndicator style={{ marginRight: 16 }} />;

  // Render a compact Card with labeled fields instead of a raw JSON string.
  if (!currentData) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text selectable>No weather data</Text>
        </Card.Content>
      </Card>
    );
  }

  const fmt = (v: number | null, suffix = '') => (v == null ? '—' : `${v}${suffix}`);

  return (
    <Card style={styles.card}>
      <Card.Title title="Weather" />
      <Card.Content>
        <View style={styles.row}>
          <Text selectable style={styles.tempText}>
            {fmt(currentData.temperature, '°C')}
          </Text>
        </View>

        <Text selectable>Feels like: {fmt(currentData.apparent_temperature, '°C')}</Text>
        <Text selectable>Humidity: {fmt(currentData.humidity, '%')}</Text>
        <Text selectable>
          Wind: {fmt(currentData.wind_speed, ' m/s')}
        </Text>
        <Text selectable>Visibility: {fmt(currentData.visibility, ' m')}</Text>
        <Text selectable>Pressure: {fmt(currentData.pressure, ' hPa')}</Text>
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
