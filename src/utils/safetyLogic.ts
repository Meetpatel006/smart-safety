import { MOCK_WEATHER, MOCK_INCIDENTS } from "./mockData"

export type SafetyInput = {
  weatherCode: string // 'clear' | 'rain' | 'storm' | 'heat'
  areaRisk: number // 0-1
}

export function computeSafetyScore(input: SafetyInput) {
  const weatherRisk = MOCK_WEATHER.find((w) => w.code === input.weatherCode)?.risk ?? 0.2
  // Incidents base: average mock incident risk
  const incidentRisk = MOCK_INCIDENTS.reduce((acc, cur) => acc + cur.risk, 0) / Math.max(1, MOCK_INCIDENTS.length)
  // Weighted: weather 40%, area 40%, incidents 20%
  const risk = weatherRisk * 0.4 + input.areaRisk * 0.4 + incidentRisk * 0.2
  const score = Math.max(0, Math.min(100, Math.round((1 - risk) * 100)))
  let status: "Low" | "Moderate" | "High" = "Low"
  if (score < 70) status = "Moderate"
  if (score < 40) status = "High"
  return { score, status }
}
