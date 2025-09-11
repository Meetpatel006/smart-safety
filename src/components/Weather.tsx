import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { fetchWeatherApi } from 'openmeteo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Card, Text, ActivityIndicator } from 'react-native-paper';

const Weather = () => {
  const [weather, setWeather] = useState<any>(null);
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

        const params = {
          latitude,
          longitude,
          current: ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day', 'precipitation', 'weather_code', 'visibility'],
          forecast_days: 1,
        };
        const url = 'https://api.open-meteo.com/v1/forecast';
        const responses = await fetchWeatherApi(url, params);
        const response = responses[0];
        const current = response.current();
        const weatherData = {
          temperature_2m: current.variables(0).value(),
          relative_humidity_2m: current.variables(1).value(),
          apparent_temperature: current.variables(2).value(),
          is_day: current.variables(3).value(),
          precipitation: current.variables(4).value(),
          weather_code: current.variables(5).value(),
          visibility: current.variables(6).value(),
        };

        setWeather(weatherData);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = () => {
    if (!weather) return 'weather-cloudy';
    const isDay = weather.is_day;
    const code = weather.weather_code;
    if (code < 10) return isDay ? 'weather-sunny' : 'weather-night';
    if (code < 40) return 'weather-partly-cloudy';
    if (code < 70) return 'weather-rainy';
    if (code < 80) return 'weather-snowy';
    if (code < 100) return 'weather-lightning';
    return 'weather-cloudy';
  };

  if (loading) return <ActivityIndicator style={{ marginRight: 16 }} />;
  if (!weather) return (
    <View style={{ marginRight: 16 }}>
      <MaterialCommunityIcons name="alert-circle-outline" size={24} color="red" />
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <MaterialCommunityIcons name={getWeatherIcon()} size={28} color="#6200ee" />
        <Text style={styles.tempText}>{`${Math.round(weather.temperature_2m)}°C`}</Text>
      </View>

      <Card.Content style={{ marginTop: 8 }}>
        <Text>Apparent: {`${Math.round(weather.apparent_temperature)}°C`}</Text>
        <Text>Humidity: {`${Math.round(weather.relative_humidity_2m)}%`}</Text>
        <Text>Precipitation: {`${weather.precipitation} mm`}</Text>
        <Text>Visibility: {`${weather.visibility / 1000} km`}</Text>
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
