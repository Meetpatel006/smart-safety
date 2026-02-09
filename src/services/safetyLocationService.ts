import Constants from "expo-constants";

const DEFAULT_SAFETY_API_BASE = "https://path-deviation.onrender.com/api";

const SAFETY_API_BASE =
  Constants.expoConfig?.extra?.PATH_DEVIATION_API_URL ||
  process.env.PATH_DEVIATION_API_URL ||
  DEFAULT_SAFETY_API_BASE;

export interface SafetyLocationPayload {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  safetyScore: number;
}

export interface SafetyEvent {
  zoneKey: string;
  zoneId: string;
  zoneType: "geofence" | "risk_grid" | "danger_zone";
  zoneName: string;
  state: "approaching" | "entering" | "staying" | "leaving";
  thresholdMeters?: number | null;
  message: string;
  occurredAt: string;
}

export interface SafetyLocationResponse {
  status: string;
  userId: string;
  locationStoredAt: string;
  events: SafetyEvent[];
}

export async function sendSafetyLocationUpdate(
  payload: SafetyLocationPayload,
): Promise<SafetyLocationResponse | null> {
  try {
    const response = await fetch(`${SAFETY_API_BASE}/safety/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(
        "[SafetyTracking] Location update failed:",
        response.status,
        body,
      );
      return null;
    }

    return (await response.json()) as SafetyLocationResponse;
  } catch (error) {
    console.warn("[SafetyTracking] Location update error:", error);
    return null;
  }
}

