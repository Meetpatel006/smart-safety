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

## Safey Scoring Model (Geo-fencing And Weather Models)

### React native App

This repository exposes two specialized model endpoints: a geo-location model and a weather model. The mobile app calls helper functions in `src/utils/api.ts` which proxy to these model endpoints (via `GEO_MODEL_URL` and `WEATHER_MODEL_URL`). The sections below describe the exact request/response shapes the code expects so model servers and backend adaptors can be implemented without guesswork.

Geo-location model (getGeoPrediction)
- Caller path: app -> backend -> model (or backend directly -> `GEO_MODEL_URL`).
- App-side helper: `getGeoPrediction(latitude, longitude)`
- Exact request body sent to the geo model:
  { "latitude": 26.5, "longitude": 94.2 }
- Recommended response shape (JSON):
  {
    "location_risk": 0-100,
    "confidence": 0.0-1.0,
    "geofence_ids"?: ["g1","g2"],
    "details"?: { "distanceToFence": number, "nearestHazard": string }
  }

Notes: `getGeoPrediction` sends only latitude and longitude. The geo model should return a numeric risk and optional metadata (geofence ids, distances) for explainability and downstream rules.

Weather model (getWeatherPrediction)
- Caller path: app -> backend -> helper -> `fetchOpenMeteoCurrentHour` -> `getWeatherPrediction(features)` -> `WEATHER_MODEL_URL`.
- The helper `fetchOpenMeteoCurrentHour(latitude, longitude)` queries Open-Meteo and returns two objects: a compact raw snapshot and `modelFeatures` prepared for the weather model. The weather model expects the `modelFeatures` object.
- Exact model-ready `modelFeatures` fields (as produced by the helper):
  {
    temperature: number | null,
    apparent_temperature: number | null,
    humidity: number | null,      // normalized 0-1
    wind_speed: number | null,
    wind_bearing: number | null,
    visibility: number | null,
    cloud_cover: number | null,
    pressure: number | null
  }
- Example request body sent to the weather model:
  {
    "temperature": 23.4,
    "apparent_temperature": 25.0,
    "humidity": 0.78,
    "wind_speed": 3.4,
    "wind_bearing": 210,
    "visibility": 10000,
    "cloud_cover": 0.6,
    "pressure": 1012
  }
- Recommended response shape (JSON):
  {
    "weather_risk": 0-100,
    "confidence": 0.0-1.0,
    "details"?: { "top_features": ["precipIntensity","windGust"] }
  }

Notes: `fetchOpenMeteoCurrentHour` normalizes humidity to 0-1 and may set fields to null if data is missing. Models should accept nulls and return graceful fallbacks.

Ensemble / Aggregation
- While the repo keeps geo and weather models separate, the backend or an aggregator service can merge component scores into a single safety object with this shape:
  {
    "safety_score": 0-100,
    "components": { "weather_risk": number, "location_risk": number },
    "confidence": 0.0-1.0,
    "recommended_action": "informational|caution|urgent|emergency",
    "reason_codes"?: ["heavy_rain","near_restricted_zone"]
  }

Integration & operational notes
- Where called: backend calls the component model endpoints during Geo-fence Alert flow and SOS Event flow. For high-frequency location updates, call the geo model and reuse cached weather snapshots.
- For SOS or high-priority events, call both models and run aggregation logic in the backend to determine triage priority.
- Fallbacks: when models or external APIs are unavailable, the backend should apply deterministic heuristics and return `confidence: 0` or a low value so clients and operators treat the result as degraded.
- Explainability: each model should return top contributing features to help operators and for auditing.
- Auditing: persist model inputs/outputs for critical events in the DB; anchor compact event hashes on-chain when audit-proof is required.

### python Backend 
### Purpose

This document unifies the system flow for both the Geo-fencing and Weather safety models in this repository and describes integration patterns and recommended deployment approaches. Important: the models in this repository are deployed independently (separate services/endpoints) — they are not packaged or deployed as a single combined model. The doc still shows a conceptual combined flow to explain how scores could be aggregated, but any aggregator is optional and not implemented in this repo.

### High-level components (shared)

- Data stores: object storage (S3/GCS) for model artifacts and CSV/JSON datasets.
- Secrets store: Modal secrets or environment variables for external API keys.
- Inference endpoints: one or more HTTP endpoints for the geo-fencing and weather models.
- Orchestration: optional queue/worker system for batch scoring (Celery/RQ) or Modal scheduled functions.

### Per-component summary

- Geo-fencing
  - Inputs: `geofences.json`, route/points, geofence-specific features CSVs
  - Output: geofence risk score, geofence id, contributing features
  - Artifacts: `geofence_safety_model.pkl`, `label_encoder.pkl`

- Weather
  - Inputs: `weatherHistory.csv`, live weather API data
  - Output: weather-based risk score, top weather features
  - Artifacts: `weather_safety_model_kaggle.pkl`, `feature_importance.csv`

### Combined dataflow

1. Data ingestion
   - Geofence definitions and historical CSVs are stored in the repo or object storage.
   - Weather data is stored or pulled from external APIs and normalized.
2. Feature engineering
   - Geo-fencing: spatial and temporal features (distance to boundary, dwell time, speed)
   - Weather: time-series features (lags, rolling averages, categorical encodings)
3. Training
   - Each pipeline produces a serialized model artifact and feature metadata.
   - Store artifacts in object storage and tag versions with timestamps/commit hashes.
4. Serving
   - Deploy inference endpoints for each model. In this repository the Geo-fencing and Weather models are served as separate endpoints (separate services/functions). They are not deployed as a single combined model.
   - Clients may call each model independently (for example: one call for geo-fencing, one for weather). If a combined score is desired, an external aggregator or gateway can call both endpoints and merge the results — this aggregator is optional and not part of the current repo.

Project-accurate ASCII flow (reflects repository layout; aggregator optional/out-of-repo):

            +-----------------+                      +--------------------+
            |  Geo data &     |                      |  Weather data &    |
            |  geofences.json |                      |  weatherHistory.csv|
            +--------+--------+                      +----------+---------+
                     |                                      |
                     v                                      v
            +-----------------+                      +--------------------+
            | geo fencing/    |                      | weather model/     |
            | (feature.py,    |                      | (feature_importance,
            |  dataset.py,    |                      |  training.py, api.py)
            |  training.py)   |                      |                    |
            +--------+--------+                      +----------+---------+
                     |                                      |
                     v                                      v
            +-----------------+                      +--------------------+
            | geofence_safety |                      | weather_safety_model|
            | _model.pkl,     |                      | _kaggle.pkl         |
            | label_encoder.pkl|                     | feature_importance.csv
            +--------+--------+                      +----------+---------+
                     |                                      |
                     v                                      v
            +-----------------+                      +--------------------+
            | Geo-fencing API |                      | Weather API        |
            | (e.g. /predict) |                      | (e.g. /predict)    |
            +--------+--------+                      +----------+---------+
                     \                                      /
                      \                                    /
                       -> (Optional) Aggregator / Client <-

Note: The repository contains the separate `geo fencing/` and `weather model/` folders, their model artifacts, and example serving code. A combined aggregator (if used) should be implemented as a separate service and is not included here.

### API design patterns

- Keep endpoints small and focused. Note: both models use the same endpoint patterns (for example `POST /predict`, `GET /model`) but they are exposed under different base URLs so the URLs differ while the payload/response contracts remain consistent:
   - `POST /predict` — route or point sequence -> geofence risk
   - `GET /model` — geo model metadata
   - `POST /predict` — weather snapshot or time-series -> weather risk
   - `GET /model` — weather model metadata
- Responses should include: score, model version, feature contributions (top-n), and timestamp.

### Deployment on Modal (serverless)

Modal is well suited for hosting light-weight API endpoints and scheduled/batch jobs. Below are best practices and a recommended architecture — note that the examples in this repository assume separate deployments for each model (separate functions/endpoints), not a single combined service.

1. Model storage & versioning
   - Keep model artifacts in an object store (S3/GCS) or Modal's file layers. Tag artifacts with semantic versions or commit hashes.
   - At cold-start, a Modal function should check artifact version and download only when missing or out-of-date. Cache the artifact in the filesystem for the lifetime of the container instance.

2. Secrets & credentials
   - Use Modal's secrets store to keep external API keys and storage credentials. Inject them as environment variables into the function runtime.

3. Function layout
   - In this repo, use separate Modal functions for `geo_predict` and `weather_predict` to keep functions small and specialized. This mirrors the repo layout (separate model artifacts and serving code).
   - If you need a combined risk score, implement an external `aggregator` service or gateway that calls both endpoints — the aggregator is optional and intentionally out-of-repo.

4. HTTP routing & gateway
   - Use Modal's HTTP gateway to expose endpoints. Expose `/predict` under each model's base path (for example `/predict` and `/predict`).

5. Cold-start & latency mitigation
   - Keep model artifacts compact (<50MB suggested) or use lazy loading for model components.
   - For predictable latency, maintain a warm pool of Modal instances or use Modal's scheduling to periodically invoke functions.

6. Observability
   - Emit logs, metrics, and model version as part of each prediction. Sample and store inputs/outputs for debugging.


### Auth & Blockchain Anchoring Flow

Authentication and Digital ID anchoring follow a deterministic sequence to ensure integrity and verifiability:

- Step 1 — Client registration
  - Mobile client collects user information (name, DOB, email, phone, emergency contacts, optional documents/photos).
  - Client POSTs to: POST /api/auth/register { name, email, phone, password, emergencyContacts, optional: documentUrls }

- Step 2 — DB persistence and local hash
  - Backend validates and creates a user document in MongoDB: users collection.
  - Backend (or client) computes a canonicalized digital ID payload and generates a SHA-256 hash (digitalIdHash).
  - DB stores user record with digitalIdHash and returns jwt + digitalIdHash to the client.
  - Example DB user document (simplified):
    { _id: "u123", name: "Asha", phone: "+91...", digitalIdHash: "0xabc123...", createdAt: ... }

- Step 3 — Anchor on-chain
  - Backend constructs an event payload (user id, digitalIdHash, timestamp) and sends a transaction to the configured blockchain via `ethers`.
  - Transaction receipts (txHash, blockNumber) are stored in an `anchors` or `audit` collection linked to the user.
  - Example anchor record: { userId: "u123", digitalIdHash: "0xabc123...", txHash: "0xdeadbeef...", blockNumber: 178234 }

- Step 4 — Verification (scan QR / verify endpoint)
  - Authority or verifier scans the user's QR code containing digitalIdHash (or requests verification by userId).
  - Backend verification endpoint: GET /api/auth/verify?digitalIdHash=0xabc123
  - Backend fetches on-chain proof (via provider) and compares the on-chain anchored hash to the stored DB hash. If they match, verification = success.
  - Response: { verified: true, userSummary: { name, emergencyContacts }, txHash }

- Error and reconciliation handling
  - If transaction confirmation is delayed, the DB still stores the anchor request and marks status = "pending". The system retries anchoring and reconciles the txHash once available.
  - For data updates that change the canonicalized digital ID, a new anchor is written on-chain and the user record keeps a history of anchor proofs. Verification checks the latest anchor unless an audit of previous anchors is requested.

2) Geo-fence Alert (client-side debounced)
   - Mobile computes local point-in-polygon; when threshold crossed, emits local alert and sends location to backend.
   - Backend double-checks against server-side geo rules (authoritative), stores event, calls AI for risk scoring, emits Socket.IO event, push notification, and optionally anchors critical events.

3) SOS Event Flow
   - Mobile -> Backend: /api/alerts/sos (with tier)
   - Backend creates Alert document, attaches user and device, stores evidentiary URLs, triggers immediate broadcast to Realtime and Push, calls Blockchain anchor for audit, calls AI for triage.
   - Authority receives alert on dashboard and can claim/acknowledge -> Dashboard -> Backend updates Alert status -> Backend notifies user via Socket.IO.

### Detailed SOS Alert Flow with Authority

This section expands the SOS Event Flow into a step-by-step, production-ready sequence including endpoints, sample payloads, AI triage, anchoring rules, broadcasts, authority actions, and fallbacks.

1) Client: initiate SOS
   - User triggers SOS (three-tier: help|urgent|sos). The mobile app immediately:
     - captures latest GPS, accuracy, deviceId, timestamp
     - generates an idempotencyKey for the event (UUID)
     - persists the unsent alert locally (AsyncStorage) with monotonic sequence
     - displays local confirmation UI (alert created/queued)

  - Client endpoint: POST /api/sos/trigger
   - Sample request:
     {
       "idempotencyKey": "uuid-1234",
       "userId": "u123",
       "deviceId": "d456",
       "timestamp": "2025-09-14T08:12:00Z",
       "coords": { "lat": 26.5, "lon": 94.2, "acc": 12 },
       "tier": "sos",
       "notes": "I am being followed",
       "media": ["presigned-url-1", "presigned-url-2"]
     }

2) Backend: ingest, dedupe, persist
   - Validate payload, enforce rate limits and idempotency using idempotencyKey.
   - Create Alert document in MongoDB with initial status = "created" and store evidentiary media URLs.
   - Example Alert document (simplified):
     {
       "_id": "alert_789",
       "userId": "u123",
       "deviceId": "d456",
       "coords": {...},
       "tier": "sos",
       "status": "created",
       "idempotencyKey": "uuid-1234",
       "evidence": [ ... ],
       "createdAt": "..."
     }

3) Backend: ingest, persist and immediate response
  - Backend validates the incoming `POST /api/sos/trigger` payload, enforces idempotency and rate limits, and creates an Alert document in MongoDB.
  - Immediately respond to the client with a lightweight acknowledgement: { alertId, status: "created" } so the app can show confirmation and continue background work.

4) Backend: parallel work (queued)
  - The backend enqueues heavier tasks (worker queue / Redis) to run asynchronously and reliably:
    a) AI triage & scoring (internal): call internal AI proxy or model endpoints to classify/score the event (e.g. eventType: sos). Store result on the alert as `alert.ai`.
      - Example (conceptual) AI result: { priority: "high", score: 92, labels: ["assault","nightTime"], recommended_action: "emergency" }
    b) Broadcast & realtime fan-out: emit a Socket.IO event (for example `alert.created`) scoped to region/authority channels with a minimal payload (alertId, coords, priority) so dashboards and subscribed clients receive it quickly.
    c) Notifications: send push notifications to subscribed authority devices and optionally SMS to emergency contacts per user preference and tier configuration.
    d) Anchoring (audit): if configured (tier == "sos" or priority >= threshold) enqueue an anchoring job that computes a compact anchor hash (for example: H(alertId + user.digitalIdHash + timestamp + tier)) and submits it to the blockchain. Store anchor record on the alert: { txHash, blockNumber, status } and retry/reconcile asynchronously.

5) Authority Dashboard: receive & act (authority endpoints)
  - Authorities obtain alerts via the authority API and realtime channels. Your app uses `GET /api/authority/alerts` for the authority list.
  - Claim / accept and lifecycle updates can be implemented under the authority namespace, for example:
    - Claim: POST /api/authority/alerts/:id/claim { authorityId }
    - Action update: POST /api/authority/alerts/:id/action { action: "enroute|on-scene|resolved", notes?, mediaUrls? }
  - Each authority action is appended to the alert history with operator id and timestamp. Critical actions (claim, resolve) may also be anchored if required by policy.

6) User notifications & closure
  - Notify the user and configured emergency contacts via Socket.IO and push/SMS updates when the alert is claimed, updated, or resolved.
  - On resolution, mark the alert closed, persist a full audit record, and optionally attach a closure verification signed by the authority for dispute resolution.

7) Media & evidence handling
  - Large media (photos / video) should be uploaded by the client to object storage via presigned URLs; the backend stores only the media URLs and optional content-hashes for integrity checks.
  - For forensic needs, include media hashes in any anchor payloads rather than raw media or PII.

8) Offline and fallback behavior
  - Client offline: the app queues the alert locally (AsyncStorage) with an idempotencyKey and retries when connectivity is restored by calling `POST /api/sos/trigger`.
  - SMS fallback: for extreme cases, the client can send a compact SMS payload to a regional gateway; the backend or gateway must translate it into an Alert and honor the idempotencyKey to avoid duplicates.

9) Timings, scale and reliability
  - SLA: aim to acknowledge (created) within a few seconds; process heavy tasks asynchronously.
  - Fan-out: scale Socket.IO with Redis adapter and partition channels by region to reduce blast radius.
  - Retries: worker jobs (anchoring, notification delivery) should use exponential backoff and durable queues; reconcile pending anchors periodically.

Example AI triage (conceptual)
Request (internal):
{
  "eventType": "sos",
  "features": {
   "coords": { "lat": 26.5, "lon": 94.2 },
   "timeOfDay": "22:12",
   "nearbyIncidents24h": 5,
   "proximityToRestrictedArea": 120
  }
}

Response (conceptual):
{
  "priority": "high",
  "score": 92,
  "labels": ["assault","nightTime"],
  "recommended_action": "emergency"
}

Security, privacy and audit notes for SOS
- Do not store raw PII on-chain; only include compact hashes or reference IDs in anchors.
- Keep push notifications minimal and require dashboard authentication to access details.
- Persist a full audit trail in the database and anchor compact proofs for critical events.


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
