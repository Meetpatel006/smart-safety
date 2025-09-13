# Smart Tourist Safety — System Flow Diagram and Detailed 
---

## Component responsibilities (concise)

- Mobile App (React Native / Expo)
  - Registration, authentication (JWT), local encryption, background location tracking, local geofencing checks, SOS button (3-tier), UI for safety score and itinerary, offline caching.
  - Inputs: user profile, device location, images/media for SOS, itinerary.
  - Outputs: auth requests, location updates, SOS events, telemetry.

- Backend (Node.js / Express)
  - Auth, API endpoints, geofence evaluation (or delegate to GeoEngine), alert handling, orchestrating notification fan-out, storing events in MongoDB, calling AI services, blockchain anchoring for audits.
  - Data validation, RBAC, rate-limiting, idempotency keys for SOS/endpoints.

- Database (MongoDB)
  - Persist: users, devices, geo-fence definitions, itinerary, alerts, audit logs, model outputs, authority actions.

- Realtime & Queue (Socket.IO, Redis)
  - Push live updates to dashboards and apps, queueing for retry and scalability, pub/sub between backend workers and authorities.

- AI/ML Services (FastAPI / Modal)
  - Provide risk scoring, incident classification, NLP triage, and predictive alerts. Exposed as HTTP endpoints with small JSON request/response shapes.

- Blockchain Anchoring (ethers)
  - Create tamper-evident proofs for critical events (registration, SOS). Anchor event hash and keep the record ID in the DB.

- Authority Dashboard (Web)
  - View live alerts, accept/respond to incidents, advanced analytics, map visualizations and heatmaps.

- Push & SMS Gateways
  - Deliver push notifications (FCM/APNs) and SMS fallback via SMS providers.

- Offline Storage (AsyncStorage)
  - Store geo-fence data, events, and queued alerts; used for offline detection and later sync.

- Geo-fence Engine
  - Accurate point-in-polygon, circular checks, and debouncing logic to avoid false positives. Works both client-side (for offline recognition) and server-side (authoritative events).

- Logging & Audit
  - Structured logs (Winston), periodic archival, and integration with blockchain anchor proofs for critical items.

## Minimal data contracts and examples

- Auth / Registration
  - Request: { name, email, phone, password, emergencyContacts: [ {name, phone} ] }
  - Response: { userId, jwt, digitalIdHash }

- Location Update
  - Request: { userId, deviceId, timestamp, coords: {lat,lon,acc}, speed }
  - Response: { ok: true, evaluatedGeoFenceIds: [], riskScore?: number }

- SOS Event
  - Request: { userId, deviceId, timestamp, coords, tier: "help|urgent|sos", notes?, mediaUrls[] }
  - Response: { alertId, status: "created", anchoredTx?: {txHash, blockNumber} }

- AI Risk Scoring
  - Request: { eventType: "location|sos|telemetry", features: {...} }
  - Response: { score: 0-100, labels: ["wildlife","crowd","weather"], confidence }

## Safety Scoring Models (Weather & Geo-location)

This project uses two specialized model endpoints (weather and geo-location) that each return a normalized risk score. A small ensemble service combines them into the single safety score the mobile app and backend use for alerts and recommended actions.

- Weather model
  - Purpose: assess short-term environmental risk (storms, heavy rain, wind) that could affect a tourist's safety.
  - Typical endpoint: POST /api/ai/models/weather/score
  - Example request: { "location": { "lat": 26.0, "lon": 94.0 }, "timestamp": "2025-09-13T10:00:00Z", "observations": { ... } }
  - Example response: { "weather_risk": 78, "confidence": 0.86, "details": { "top_features": ["precipIntensity","windGust"] } }

- Geo-location model
  - Purpose: evaluate movement and place-based risks (proximity to hazardous geofences, speed, terrain, incident density).
  - Typical endpoint: POST /api/ai/models/location/score
  - Example request: { "userId": "u123", "location": { "lat", "lon" }, "speed": 2.1, "recentPath": [...], "timeOfDay": "22:00" }
  - Example response: { "location_risk": 64, "confidence": 0.72, "details": { "top_features": ["distanceToRestrictedArea","nightTime"] } }

- Ensemble & final safety score
  - Purpose: combine component scores into a single actionable score and recommended action (informational/caution/urgent/emergency).
  - Typical endpoint: POST /api/ai/models/ensemble/score
  - Example request: { "userId": "u123", "location": {...}, "context": {...} }
  - Example response: { "safety_score": 71, "components": { "weather_risk": 78, "location_risk": 64 }, "confidence": 0.79, "recommended_action": "caution", "reason_codes": ["heavy_rain","near_restricted_zone"] }

Operational notes and flow integration:
 - Where called: backend calls the component model endpoints during Geo-fence Alert flow and SOS Event flow (see sequences below). For location updates the backend may call only the geo-location model; for SOS it calls both models plus the ensemble to decide triage priority.
 - Latency & scale: models are exposed as low-latency HTTP endpoints (Modal / FastAPI); ensemble logic runs in the backend or a microservice to keep app responses snappy.
 - Fallbacks: when model or data is unavailable, the backend uses deterministic rules (distance thresholds, cached weather alerts) and returns a low confidence flag so the client and operators know the result is degraded.
 - Explainability: each model returns top contributing features and a confidence score to support operator review and automated triage rules.
 - Auditing: model inputs/outputs for critical events (SOS, high-severity) are persisted in the DB and optionally anchored on-chain as part of the event audit trail.

## Common sequence flows (step-by-step)

1) Registration & Digital ID
   - Mobile -> Backend: /api/auth/register
   - Backend validates, creates DB user, optionally calls client to compute hash or server computes blockchain anchor, returns jwt + digitalIdHash.
   - Mobile displays QR/ID; authority can verify by scanning QR -> backend lookup -> optional on-chain verification.

2) Geo-fence Alert (client-side debounced)
   - Mobile computes local point-in-polygon; when threshold crossed, emits local alert and sends location to backend.
   - Backend double-checks against server-side geo rules (authoritative), stores event, calls AI for risk scoring, emits Socket.IO event, push notification, and optionally anchors critical events.

3) SOS Event Flow
   - Mobile -> Backend: /api/alerts/sos (with tier)
   - Backend creates Alert document, attaches user and device, stores evidentiary URLs, triggers immediate broadcast to Realtime and Push, calls Blockchain anchor for audit, calls AI for triage.
   - Authority receives alert on dashboard and can claim/acknowledge -> Dashboard -> Backend updates Alert status -> Backend notifies user via Socket.IO.

4) Offline Sync
   - Mobile stores events/locations to AsyncStorage with monotonic sequence numbers.
   - On reconnect, client POSTs batched /api/sync with idempotency tokens; backend dedupes and orders before processing.

## Edge cases and mitigation

- Duplicate SOS requests
  - Use idempotency keys and sequence numbers; server coalesce duplicates within a short time window.

- False geo-fence triggers due to GPS jitter
  - Use debouncing with timers, require sustained presence for entry/exit, and merge low-accuracy points.

- Intermittent connectivity / offline
  - Local detection + queued sync; SMS fallback for highest-tier SOS.

- Delayed blockchain anchoring
  - Anchor asynchronously but store local DB proof immediately; reconcile txHash later and update DB.

- High load on realtime fan-out
  - Horizontal scale Socket.IO via Redis adapter and partition by region/authority.

## Security considerations

- Authentication & Authorization
  - JWT with refresh tokens, RBAC for authority roles, ensure token revocation and short-lived tokens.

- Data protection
  - Encrypt sensitive fields at rest (phone numbers, emergency contact), TLS in transit, local encrypted AsyncStorage.

- Input validation & rate limits
  - Strong payload validation, size limits for media uploads, per-device rate limiting.

## Contracts / API endpoints (baseline)

- POST /api/auth/register — register user
- POST /api/auth/login — obtain JWT
- POST /api/location — send location update
- POST /api/alerts/sos — send SOS
- GET /api/geofences — fetch geofence definitions (for client caching)
- POST /api/sync — sync offline events
- GET /api/alerts/:id — retrieve alert
- POST /api/ai/risk — request risk score (internal)

## Notes about diagram and README usage

- The Mermaid diagram is intentionally single and central to map the whole system. You can copy the Mermaid section into a live editor to inspect the rendered graph.
- This file complements `PROJECT_OVERVIEW.md` and is intended to be the authoritative flow diagram for architecture discussions.

## Next steps (suggested)

- Add a lightweight sequence diagram for each numbered flow to `docs/SEQUENCES.md` if you want step-by-step message timing.
- Create a small OpenAPI spec for the baseline endpoints listed above (`openapi.yaml`) and generate client/server stubs to accelerate development.

---

End of file.
