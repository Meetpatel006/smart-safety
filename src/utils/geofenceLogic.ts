// Geo-fencing data types and basic utilities

export type GeoFenceType = 'point' | 'circle' | 'polygon' | 'area'

export type GeoFence = {
  id: string
  name: string
  type: GeoFenceType
  coords: number[] | number[][] // [lat, lon] for point/circle center, or array of [lat, lon] for polygon
  radiusKm?: number
  category?: string
  state?: string
  riskLevel?: string
  source?: string
  metadata?: Record<string, any>
  version?: string
}

// Haversine distance in kilometers between two coordinates
export function haversineKm([lat1, lon1]: number[], [lat2, lon2]: number[]): number {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371 // Earth radius km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Point-in-circle check
export function pointInCircle(point: number[], center: number[], radiusKm: number): boolean {
  return haversineKm(point, center) <= radiusKm
}

// Simple ray-casting point-in-polygon algorithm
export function pointInPolygon(point: number[], polygon: number[][]): boolean {
  const x = point[1] // lon
  const y = point[0] // lat
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0]
    const xj = polygon[j][1], yj = polygon[j][0]

    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Basic CSV row mappers for the provided datasets
export function mapDisasterRowToGeoFence(row: Record<string, string>, idx: number): GeoFence {
  const id = `disaster-${idx}`
  const lat = parseFloat(row.Latitude || row.Lat || '0')
  const lon = parseFloat(row.Longitude || row.Lon || '0')
  // Many records are area/region points; treat as circle with small radius by default
  return {
    id,
    name: row.Name || 'unnamed',
    type: 'circle',
    coords: [lat, lon],
    radiusKm: 5,
    category: row.Category,
    state: row.State,
    riskLevel: (row.Additional_Info || '').replace('Risk Level: ', '').trim() || undefined,
    source: row.Source,
    metadata: row
  }
}

export function mapSecurityRowToGeoFence(row: Record<string, string>, idx: number): GeoFence {
  const id = `security-${row.ID || idx}`
  const lat = parseFloat(row.Latitude || '0')
  const lon = parseFloat(row.Longitude || '0')
  const bufferKm = parseFloat(row.Buffer_Zone_Km || '0') || 0
  return {
    id,
    name: row.Name || 'unnamed',
    type: bufferKm > 0 ? 'circle' : 'point',
    coords: [lat, lon],
    radiusKm: bufferKm > 0 ? bufferKm : undefined,
    category: row.Category,
    state: row.State,
    riskLevel: row.Security_Level,
    source: row.Source,
    metadata: row
  }
}

export function mapWildlifeRowToGeoFence(row: Record<string, string>, idx: number): GeoFence {
  const id = `wildlife-${idx}`
  const lat = parseFloat(row.Latitude || '0')
  const lon = parseFloat(row.Longitude || '0')
  return {
    id,
    name: row.Name || 'unnamed',
    type: 'point',
    coords: [lat, lon],
    category: row.Category,
    state: row.State,
    source: row.Source,
    metadata: row
  }
}
