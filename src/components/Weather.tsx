import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { fetchOpenMeteoCurrentHour } from '../utils/api';
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

        const { compact } = await fetchOpenMeteoCurrentHour(latitude, longitude);
        setCurrentData(compact as any);
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
