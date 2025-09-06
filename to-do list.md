# Geo-fencing Implementation To-do List

This file tracks the implementation roadmap for the geo-fencing feature (based on `geo-fencing.md`) and mirrors the workspace todo manager.

Usage: update the `Status:` field as work progresses. Keep one task `in-progress` at a time in the manager.

---

## 1) Project setup & scaffold
- ID: 1
- Status: in-progress
- Description: Create initial geo-fencing feature plan, add folders/modules (`src/geoFence`, `src/utils/geofenceLogic`), update `README.md` with implementation plan, wire up a navigation entry (e.g., add route to `navigation/index.tsx`).
- Acceptance: repo contains `src/geoFence` and a README note describing where the feature will live.
- Estimated effort: 1–2 days

---

## 2) Permissions & location API
- ID: 2
- Status: not-started
- Description: Implement permission prompts and a location provider abstraction exposing `getCurrentLocation()` and `watchPosition()`. Include platform notes for Android/iOS (foreground/background usage and manifest/Info.plist entries).
- Acceptance: app requests appropriate location permissions and exposes the two APIs for the rest of the app to consume.

---

## 3) Basic GPS tracking
- ID: 3
- Status: not-started
- Description: Implement location tracking service using React Native/Expo Location. Support configurable accuracy and interval; persist breadcrumbs locally (e.g., AsyncStorage or SQLite).
- Acceptance: location updates are received at configurable intervals and breadcrumbs are stored.

---

## 4) Geo-fence data model
- ID: 4
- Status: not-started
- Description: Design the geo-fence schema: `{ id, type, coords, radius, riskLevel, metadata, version }`. Implement local cache and versioning. Provide an importer for CSV/JSON (use `geo-fencing-data/` CSVs as a seed).
- Acceptance: can load CSV/JSON into local store and list zones in a debug screen.

---

## 5) Circular geo-fence detection
- ID: 5
- Status: not-started
- Description: Implement point-in-circle detection and an approaching buffer zone. Add debounce/flapping prevention logic.
- Acceptance: unit tests show reliable entry/exit detection for circles.

---

## 6) Polygon geo-fence detection
- ID: 6
- Status: not-started
- Description: Implement point-in-polygon detection for complex areas. Use a robust algorithm or lightweight library and support overlapping zones with priority rules.
- Acceptance: polygon tests pass and priority rules decide which zone's alert to fire.

---

## 7) State & transition handling
- ID: 7
- Status: not-started
- Description: Track per-zone user state (outside / approaching / inside). Persist transitions and create events (entry/exit) with timestamps.
- Acceptance: state machine tests and event logs show correct transitions.

---

## 8) Alerting & notification system
- ID: 8
- Status: not-started
- Description: Add in-app alert components, push/local notifications, sound/vibration mapping, and action buttons ("I'm safe", "Need help", "Emergency").
- Acceptance: notifications trigger on entry and action buttons perform expected mock behaviors.

---

## 9) Offline support & caching
- ID: 9
- Status: not-started
- Description: Cache geo-fence data locally and ensure detection continues offline. Implement sync and queued alerts to flush when online.
- Acceptance: detection works without network; queued alerts persist and flush on sync.

---

## 10) Map visualization & UI
- ID: 10
- Status: not-started
- Description: Render colored zone overlays on `OsmMap` (or `MockMap` during dev). Add a risk legend, popups with zone details, and a nearby zones list component.
- Acceptance: map shows overlays, touch opens zone details and risk legend visible.

---

## 11) Emergency integration
- ID: 11
- Status: not-started
- Description: Wire SOS actions to share location with emergency contacts, optionally auto-dial authorities, and broadcast the user location to designated recipients.
- Acceptance: SOS sends a mock location payload to saved contacts and optionally initiates a call (in dev this may be mocked).

---

## 12) Risk scoring & progressive alerts
- ID: 12
- Status: not-started
- Description: Implement base risk score per zone plus temporal/context modifiers (time of day, weather, user factors) and progressive alert levels (info → warning → critical → emergency).
- Acceptance: risk score is computed and used to choose alert templates.

---

## 13) Tests & quality gates
- ID: 13
- Status: not-started
- Description: Add unit tests for point-in-polygon/circle algorithms, integration smoke tests for tracking → detection → alert flow, and configure lint/typecheck jobs locally.
- Acceptance: tests for core algorithms and state transitions run locally and pass.

---

## 14) Docs & handoff README
- ID: 14
- Status: not-started
- Description: Maintain this `to-do list.md`, create a feature README with setup steps (permissions, platform notes), and a runbook for authority integration.
- Acceptance: README contains platform setup and testing instructions for QA.

---

## How to use
- Edit `Status:` when a task begins/finishes.
- Keep one task `in-progress` in the workspace todo manager at a time.
- Reference CSVs at `geo-fencing-data/` for seed data.
- Suggested first steps: create `src/geoFence` and add a simple debug UI route under `navigation/index.tsx` to view loaded zones.

---

Last updated: 2025-09-06
