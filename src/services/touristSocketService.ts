import io, { Socket } from "socket.io-client";
import { Platform } from "react-native";
import { Alert } from "react-native";
import { SERVER_URL } from "../config";

// Configuration - Use centralized server URL from config
const SOCKET_URL = SERVER_URL;

export interface TouristAlert {
  alertId: string;
  type: "emergency" | "warning" | "info" | "weather" | "civil_unrest";
  title: string;
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  timestamp: string;
  authorityName: string;
  authorityId: string;
  requiresAcknowledgment: boolean;
  actionRequired: string | null;
  expiresAt: string | null;
  targetArea: {
    lat: number;
    lng: number;
    radius: number;
  } | null;
  distanceFromEvent?: number;
}

export interface SafetyScoreData {
  safetyScore: number;
  timestamp: string;
  safetyLevel?: string;
  safetyColor?: string;
  description?: string;
  geofenceScore?: number;
  weatherScore?: number;
  nearestThreat?: {
    name: string;
    distance: number;
    severity: string;
    type: string;
    impact: number;
    coordinates?: any;
  };
  threats?: any[];
  totalThreats?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface SafetyScoreAlert {
  previousScore: number;
  newScore: number;
  changeType:
    | "significant_drop"
    | "significant_increase"
    | "critical_threshold";
  message: string;
  safetyScoreData: SafetyScoreData;
}

interface LocationCoords {
  lat: number;
  lng: number;
}

class TouristSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private touristId: string | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize and connect to the socket server
   * @param {string} touristId - Unique tourist ID from your auth system
   * @param {LocationCoords} initialLocation - { lat: number, lng: number }
   */
  connect(touristId: string, initialLocation: LocationCoords) {
    if (this.socket && this.isConnected) {
      return;
    }

    this.touristId = touristId;

    // Create socket connection
    // Start with polling for better compatibility, then upgrade to websocket
    this.socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
    });

    // Handle connection event
    this.socket.on("connect", () => {
      this.isConnected = true;

      // Register as tourist
      this.socket?.emit("registerTourist", {
        role: "tourist",
        touristId: this.touristId,
        location: initialLocation,
      });
    });

    // Handle registration confirmation
    this.socket.on("registrationConfirmed", (data: any) => {
      // Registration confirmed silently
    });

    // Handle connection errors
    this.socket.on("connect_error", (error: any) => {
      console.error("❌ Connection error:", error);
      console.error("❌ Error details:", error.message, error.description);
      this.isConnected = false;

      // Provide helpful debugging info
    });

    // Handle disconnection
    this.socket.on("disconnect", (reason: any) => {
      this.isConnected = false;

      // Auto-reconnect if server disconnected
      if (reason === "io server disconnect") {
        this.socket?.connect();
      }
    });
  }

  /**
   * Listen for authority alerts
   * @param {function} callback - Function to handle incoming alerts
   */
  onAuthorityAlert(callback: (alert: TouristAlert) => void) {
    if (!this.socket) {
      console.warn("Socket not initialized when adding listener");
    }

    this.socket?.off("authorityAlert");
    this.socket?.on("authorityAlert", (alertData: TouristAlert) => {
      callback(alertData);
    });
  }

  /**
   * Listen for safety score updates from backend
   * @param {function} callback - Function to handle safety score updates
   * @returns {function} - Cleanup function to remove the listener
   */
  onSafetyScoreUpdate(callback: (data: SafetyScoreData) => void) {
    if (!this.socket) {
      console.warn(
        "Socket not initialized when adding safetyScoreUpdate listener",
      );
      console.warn("Make sure to call connect() before setting up listeners");
      return () => {};
    }

    // Define the wrapper function to call callback
    const listener = (data: SafetyScoreData) => {
      callback(data);
    };

    // Add new listener (supports multiple listeners now)
    this.socket.on("safetyScoreUpdate", listener);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.off("safetyScoreUpdate", listener);
      }
    };
  }

  /**
   * Listen for critical safety score alerts
   * @param {function} callback - Function to handle safety score alerts
   */
  onSafetyScoreAlert(callback: (alert: SafetyScoreAlert) => void) {
    if (!this.socket) {
      console.warn("Socket not initialized when adding listener");
    }

    this.socket?.off("safetyScoreAlert");
    this.socket?.on("safetyScoreAlert", (alert: SafetyScoreAlert) => {
      callback(alert);
    });
  }

  /**
   * Update tourist location in real-time
   * @param {LocationCoords} location - { lat: number, lng: number }
   */
  updateLocation(location: LocationCoords) {
    if (!this.socket) {
      return;
    }

    this.socket.emit("updateTouristLocation", {
      location: location,
    });
  }

  /**
   * Start periodic location updates (every 45 seconds)
   * @param {function} getLocationFunc - Async function that returns current location coords
   */
  startPeriodicLocationUpdates(
    getLocationFunc: () => Promise<LocationCoords | null>,
  ) {
    // Clear any existing interval
    this.stopPeriodicLocationUpdates();

    // Send initial update
    getLocationFunc().then((coords) => {
      if (coords) this.updateLocation(coords);
    });

    // Set up periodic updates every 45 seconds
    this.locationUpdateInterval = setInterval(async () => {
      const coords = await getLocationFunc();
      if (coords) {
        this.updateLocation(coords);
      }
    }, 45000); // 45 seconds
  }

  /**
   * Stop periodic location updates
   */
  stopPeriodicLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    this.stopPeriodicLocationUpdates();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if socket is connected
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Check if socket is initialized (connect has been called)
   */
  isInitialized() {
    return this.socket !== null;
  }
}

// Export singleton instance
export default new TouristSocketService();
