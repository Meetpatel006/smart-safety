import React, {useEffect, useState} from 'react'
import {View, Text, ScrollView, StyleSheet} from 'react-native'
import {GeoFence, pointInCircle, pointInPolygon, haversineKm} from '../utils/geofenceLogic'
import * as FileSystem from 'expo-file-system'
import OsmMap from '../components/OsmMap'

// Simple debug screen to load pre-bundled JSON geo-fences (created by importer script)
export default function GeoFenceDebugScreen() {
  const [zones, setZones] = useState<GeoFence[]>([])
  const [samplePoint] = useState<number[]>([26.9124, 75.7873]) // default sample lat/lon

  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Load generated output from assets
        try {
          const bundled = require('../../assets/geofences-output.json')
          setZones(bundled as any)
          setLoadError(null)
          return
        } catch (err) {
          console.warn('geofences-output.json not found in assets', err)
          setZones([])
          setLoadError('No generated geo-fence JSON found in assets. Run the converter to generate `assets/geofences-output.json`.')
        }
      } catch (e) {
        console.warn('error reading geofences', e)
        setZones([])
        setLoadError('Failed to load geo-fence data.')
      }
    }
    load()
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>GeoFence Debug</Text>
      <Text style={styles.subtitle}>Loaded zones: {zones.length}</Text>
      <View style={{height: 300}}>
        <OsmMap geoFences={zones} mapHeight={300} />
      </View>
      {zones.map(z => (
        <View key={z.id} style={styles.zone}>
          <Text style={styles.zoneTitle}>{z.name} ({z.category})</Text>
          <Text>Type: {z.type} {z.radiusKm ? `- radius ${z.radiusKm} km` : ''}</Text>
          <Text>Distance to sample point: {z.coords && z.type !== 'polygon' ? `${haversineKm(z.coords as number[], samplePoint).toFixed(2)} km` : 'n/a'}</Text>
        </View>
      ))}
      {loadError ? (
        <View style={styles.note}>
          <Text>{loadError}</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16},
  title: {fontSize: 20, fontWeight: '700', marginBottom: 8},
  subtitle: {fontSize: 14, marginBottom: 12},
  zone: {padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginBottom: 8},
  zoneTitle: {fontWeight: '700'},
  note: {marginTop: 12}
})
