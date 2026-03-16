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
  
  private listeners: Record<string, Function[]> = {};
  private pendingListeners: Array<{ event: string; callback: Function }> = [];
  
  // Track all active socket listeners for reconnection
  private activeSocketListeners: Map<string, Set<Function>> = new Map();
  
  /**
   * Initialize and connect to the socket server
   * @param {string} touristId - Unique tourist ID from your auth system
   * @param {LocationCoords} initialLocation - { lat: number, lng: number }
   */
  connect(touristId: string, initialLocation: LocationCoords) {
    this.touristId = touristId;

    // If socket already exists, do not create another instance
    if (this.socket) {
      // Ensure connection attempt continues if socket exists but is not connected yet
      if (!this.isConnected && !this.socket.connected) {
        console.log("[TouristSocket] 🔄 Socket exists but disconnected, reconnecting...");
        this.socket.connect();
      }
      return;
    }

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
      console.log(
        `[TouristSocket] ✅ Connected to server with socket ID: ${this.socket?.id}`,
      );
      this.isConnected = true;

      // Register as tourist
      console.log(
        `[TouristSocket] 📝 Registering as tourist: ${this.touristId}`,
      );
      this.socket?.emit("registerTourist", {
        role: "tourist",
        touristId: this.touristId,
        location: initialLocation,
      });
      
      // Re-attach ALL active listeners (for reconnection scenarios)
      this.reattachAllListeners();
      
      // Attach any pending listeners that were added before connection
      this.attachPendingListeners();
    });

    // Handle registration confirmation
    this.socket.on("registrationConfirmed", (data: any) => {
      console.log(
        "[TouristSocket] ✅ Registration confirmed by backend:",
        data,
      );
    });

    // Handle risk grid updates
    this.socket.on("riskGridUpdated", (gridData: any) => {
      console.log(`Risk grid update broadcasted: ${gridData.gridId}`);
      this.emit("riskGridUpdated", gridData);
    });

    // Handle safety score updates globally so app-level listeners always receive them
    this.socket.on("safetyScoreUpdate", (data: SafetyScoreData) => {
      this.emit("safetyScoreUpdate", data);
    });

    // Handle connection errors
    this.socket.on("connect_error", (error: any) => {
      console.error("[TouristSocket] ❌ Connection error:", error);
      console.error(
        "[TouristSocket] ❌ Error details:",
        error.message,
        error.description,
      );
      console.error(
        `[TouristSocket] ❌ Attempting to connect to: ${SOCKET_URL}`,
      );
      this.isConnected = false;
    });

    // Handle disconnection
    this.socket.on("disconnect", (reason: any) => {
      console.warn(`[TouristSocket] ⚠️ Disconnected from server. Reason: ${reason}`);
      this.isConnected = false;

      // Auto-reconnect if server disconnected
      if (reason === "io server disconnect") {
        console.log("[TouristSocket] 🔄 Server disconnected, attempting to reconnect...");
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
      // Queue the listener to be attached when socket connects
      this.pendingListeners.push({ event: "authorityAlert", callback });
      return;
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
        "[TouristSocket] ⚠️ Socket not initialized, queuing safetyScoreUpdate listener",
      );
      // Queue the listener to be attached when socket connects
      this.pendingListeners.push({ event: "safetyScoreUpdate", callback });
      
      // Return cleanup function that will work even if queued
      return () => {
        this.pendingListeners = this.pendingListeners.filter(
          (l) => !(l.event === "safetyScoreUpdate" && l.callback === callback)
        );
      };
    }

    console.log(
      "[TouristSocket] ✅ Attaching safetyScoreUpdate listener to socket",
    );

    // Define the wrapper function to call callback
    const listener = (data: SafetyScoreData) => {
      console.log(
        "[TouristSocket] 📥 safetyScoreUpdate event received from backend:",
        data,
      );
      callback(data);
    };

    // Add new listener (supports multiple listeners now)
    this.socket.on("safetyScoreUpdate", listener);
    
    // Track this listener for reconnection
    if (!this.activeSocketListeners.has("safetyScoreUpdate")) {
      this.activeSocketListeners.set("safetyScoreUpdate", new Set());
    }
    this.activeSocketListeners.get("safetyScoreUpdate")!.add(listener);
    console.log(
      `[TouristSocket] 📌 Tracking safetyScoreUpdate listener (total: ${this.activeSocketListeners.get("safetyScoreUpdate")!.size})`,
    );

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.off("safetyScoreUpdate", listener);
        // Remove from active listeners tracking
        this.activeSocketListeners.get("safetyScoreUpdate")?.delete(listener);
        console.log(
          "[TouristSocket] 🧹 Removed safetyScoreUpdate listener",
        );
      }
    };
  }

  /**
   * Listen for critical safety score alerts
   * @param {function} callback - Function to handle safety score alerts
   */
  onSafetyScoreAlert(callback: (alert: SafetyScoreAlert) => void) {
    if (!this.socket) {
      // Queue the listener to be attached when socket connects
      this.pendingListeners.push({ event: "safetyScoreAlert", callback });
      return;
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
      console.warn(
        "[TouristSocket] ⚠️ Socket not initialized, cannot update location",
      );
      return;
    }

    if (!this.isConnected) {
      console.warn(
        "[TouristSocket] ⚠️ Socket not connected, queueing location update",
      );
    }

    console.log(
      `[TouristSocket] 📍 Updating location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
    );
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
      // Clear active listeners tracking on explicit disconnect
      this.activeSocketListeners.clear();
      this.pendingListeners = [];
    }
  }
    requestSafetyScoreUpdate() {
    if (!this.socket) {
      console.error(
        "[TouristSocket] ❌ Socket not initialized, cannot request safety score update",
      );
      return;
    }

    if (!this.isConnected) {
      console.warn(
        "[TouristSocket] ⚠️ Socket not connected yet, cannot request safety score update",
      );
      return;
    }

    console.log(
      "[TouristSocket] 🔄 Requesting immediate safety score update from backend",
    );
    this.socket.emit("requestSafetyScoreUpdate");
    console.log("[TouristSocket] ✅ requestSafetyScoreUpdate event emitted");
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
  
  /**
   * Re-attach all active listeners (called on reconnect)
   */
  private reattachAllListeners() {
    if (!this.socket || this.activeSocketListeners.size === 0) {
      return;
    }
    
    console.log(`📡 Re-attaching ${this.activeSocketListeners.size} active listener type(s) after reconnect`);
    
    for (const [event, listeners] of this.activeSocketListeners.entries()) {
      console.log(`📡 Re-attaching ${listeners.size} listener(s) for event: ${event}`);
      for (const listener of listeners) {
        this.socket.on(event, listener as any);
      }
    }
  }
  
  /**
   * Attach any listeners that were added before socket was connected
   */
  private attachPendingListeners() {
    if (!this.socket || this.pendingListeners.length === 0) {
      return;
    }
    
    console.log(`📡 Attaching ${this.pendingListeners.length} pending listener(s)`);
    
    // Attach each pending listener
    for (const { event, callback } of this.pendingListeners) {
      if (event === "authorityAlert") {
        this.socket.off("authorityAlert");
        this.socket.on("authorityAlert", callback as any);
        // Track for reconnection
        if (!this.activeSocketListeners.has(event)) {
          this.activeSocketListeners.set(event, new Set());
        }
        this.activeSocketListeners.get(event)!.add(callback);
      } else if (event === "safetyScoreUpdate") {
        this.socket.on("safetyScoreUpdate", callback as any);
        // Track for reconnection
        if (!this.activeSocketListeners.has(event)) {
          this.activeSocketListeners.set(event, new Set());
        }
        this.activeSocketListeners.get(event)!.add(callback);
      } else if (event === "safetyScoreAlert") {
        this.socket.off("safetyScoreAlert");
        this.socket.on("safetyScoreAlert", callback as any);
        // Track for reconnection
        if (!this.activeSocketListeners.has(event)) {
          this.activeSocketListeners.set(event, new Set());
        }
        this.activeSocketListeners.get(event)!.add(callback);
      }
    }
    
    // Clear the pending listeners
    this.pendingListeners = [];
  }
  
    on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return cleanup function
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Emit internal service event
   */
  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}

// Export singleton instance
export default new TouristSocketService();
