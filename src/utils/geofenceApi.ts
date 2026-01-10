/**
 * API functions for fetching dynamic geofences from server
 */
import { SERVER_URL } from '../config'
import type { GeoFence } from './geofenceLogic'

// Grid size in km (matches server GRID_SIZE_DEG ≈ 0.0045° ≈ 500m)
const GRID_RADIUS_KM = 0.25

export interface DynamicGeofenceFeature {
    type: 'Feature'
    properties: {
        gridId: string
        riskScore: number
        riskLevel: string
        gridName?: string  // Added: human-readable name for the grid
        lastUpdated: string
    }
    geometry: {
        type: 'Point'
        coordinates: [number, number] // [lng, lat]
    }
}

export interface DynamicGeofenceResponse {
    type: 'FeatureCollection'
    features: DynamicGeofenceFeature[]
}

/**
 * Convert risk score (0-1) to risk level string
 */
function riskScoreToLevel(score: number): string {
    if (score >= 0.75) return 'Very High'
    if (score >= 0.5) return 'High'
    if (score >= 0.25) return 'Medium'
    return 'Low'
}

/**
 * Convert server GeoJSON feature to app GeoFence format
 */
function featureToGeoFence(feature: DynamicGeofenceFeature): GeoFence {
    const { properties, geometry } = feature
    const [lng, lat] = geometry.coordinates
    const riskLevel = properties.riskLevel || riskScoreToLevel(properties.riskScore)

    // Use gridName if available, otherwise fallback to generic name
    const name = properties.gridName
        ? properties.gridName
        : `Risk Zone (${riskLevel})`

    return {
        id: properties.gridId || `dynamic-${lat}-${lng}`,
        name: name,
        type: 'circle',
        coords: [lat, lng], // App uses [lat, lng] order
        radiusKm: GRID_RADIUS_KM,
        riskLevel: riskLevel,
        category: 'Dynamic Risk Zone',
        source: 'server',
        metadata: {
            riskScore: properties.riskScore,
            lastUpdated: properties.lastUpdated,
            gridName: properties.gridName
        }
    }
}

/**
 * Fetch dynamic risk zones from server
 * @param lat Optional latitude for location-based filtering
 * @param lng Optional longitude for location-based filtering
 * @param radius Optional radius in meters (default: 5000)
 * @returns Array of GeoFence objects
 */
export async function fetchDynamicGeofences(
    lat?: number,
    lng?: number,
    radius: number = 5000
): Promise<GeoFence[]> {
    try {
        // Build URL with optional query params
        let url = `${SERVER_URL}/api/geofence/dynamic`
        const params: string[] = []

        if (lat !== undefined && lng !== undefined) {
            params.push(`lat=${lat}`)
            params.push(`lng=${lng}`)
            params.push(`radius=${radius}`)
        }

        if (params.length > 0) {
            url += `?${params.join('&')}`
        }

        console.log('Fetching dynamic geofences from:', url)

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`)
        }

        const data: DynamicGeofenceResponse = await response.json()

        if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
            console.warn('Invalid GeoJSON response from server')
            return []
        }

        const geofences = data.features
            .filter(f => f.geometry?.type === 'Point' && f.geometry?.coordinates)
            .map(featureToGeoFence)

        console.log(`Loaded ${geofences.length} dynamic geofences from server`)
        return geofences
    } catch (error: any) {
        console.error('Failed to fetch dynamic geofences:', error?.message || error)
        throw error
    }
}

export default { fetchDynamicGeofences }
