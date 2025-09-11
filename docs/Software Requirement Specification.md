# Software Requirement Specification

**1. Introduction**

**1.1 Purpose**

Define functional and non-functional requirements for a system that enhances tourist safety via mobile/PWA client, AI-assisted anomaly detection, blockchain-backed auditability, and real-time dashboards for authorities.

**1.2 Scope**

- Tourist client (PWA or React Native app) with registration, digital ID, SOS, geofencing alerts, optional live tracking.
- Authority dashboard with heatmaps, alerts, case management, and e-FIR triggers.
- Backend APIs (Node.js) with real-time messaging, AI microservice integration and blockchain logging (Polygon testnet).
- Data privacy, security, and multilingual support.

**1.3 Definitions/Abbreviations**

- **LEA**: Law Enforcement Agency.
- **SOS**: Emergency alert with live location.
- **Geofence**: Polygon/Radius defining area sensitivity.
- **AID**: Anomaly/Incident Detection (AI module).

**1.4 References**

- Problem Statement SIH25002 (as shared).
- OWASP ASVS 4.0; OWASP MASVS (for mobile/PWA).
- ISO/IEC 27001 (security mgmt) – guidance.

**1.5 Overview**

Sections cover product perspective, user classes, constraints, detailed functional/non-functional requirements, data model, interfaces, and test/acceptance criteria.

**2. Overall Description**

**2.1 Product Perspective**

Modular, cloud-hosted platform with:

- Client apps (Tourist, Authority).
- API gateway & services (Auth, Tourist, Geofencing, Alerts, AID, Blockchain Logger).
- Datastores (Operational DB, Object store).

**2.2 User Classes & Characteristics**

- **Tourist**: minimal onboarding, mobile-first, multilingual, offline-tolerant.
- **LEA Operator**: map-centric console, triage alerts, assign/close cases.
- **Tourism Officer**: analytics/heatmaps, zone mgmt, policy inputs.
- **System Admin**: user/role mgmt, keys/secrets, config.

**2.3 Operating Environment**

- Client: Mobile Chrome/Safari (PWA) or Android/iOS (React Native).
- Backend: Node.js 20+, MongoDB Atlas, Socket.IO.
- AI: Python (FastAPI) or external LLM APIs.
- Blockchain: Polygon testnet via Alchemy/Infura (ethers.js).
- Cloud: Azure, Modal, Vercel , Onrender

**2.4 Design Constraints**

- Network variability; offline-friendly client.
- Data minimization; consent-based tracking.
- Strong privacy: encryption in transit/at rest.
- Time-limited digital IDs (valid for trip window).

**2.5 Assumptions/Dependencies**

- Map provider (OpenStreetMap)
- Email with Notification providers like Google Mail.
- Blockchain RPC access.
- Government data (zones) may be bootstrapped with mock data initially.

**3. External Interface Requirements**

**3.1 User Interfaces**

- **Tourist App**: Register → ID card (QR) → Dashboard (score, itinerary, map) → SOS → Tracking toggle → Settings (language, permissions).
- **Authority Dashboard (web)**: Map with clusters & geofences, alert feed, tourist search, case detail, status workflow, export.

**3.2 Hardware Interfaces**

- Mobile GPS

**3.3 Software Interfaces**

- Maps SDK, FCM/APNs, SMS/Email APIs, ethers.js (Polygon), AI API/Service

**3.4 Communications Interfaces**

- HTTPS (TLS 1.2+), WSS for Socket.IO, MQTT over TLS.

**4. System Features (Functional Requirements)**

Requirement IDs: **FR-x.y** (x = feature, y = sub-req)

**4.1 Registration & Digital Tourist ID**

- **FR-1.1**: Capture name, ID (passport/Aadhaar*), itinerary dates, emergency contacts, consent flags.
- **FR-1.2**: Generate unique TouristID; show **digital ID card** with QR.
- **FR-1.3**: Store minimal KYC hash; expiry equals trip end date.
- **FR-1.4**: Multilingual labels and stored language preference.
- **FR-1.5**: Offline form cache + retry submission.

**4.2 Geofencing & Safety Score**

- **FR-2.1**: Maintain geofence polygons with risk levels.
- **FR-2.2**: Client sends location every N secs (opt-in); backend evaluates zone membership.
- **FR-2.3**: Trigger “entered restricted zone” alerts with timestamp & coordinates.
- **FR-2.4**: Compute Safety Score (rule-based MVP: zone exposure, time, alerts history).

**4.3 SOS / Panic**

- **FR-3.1**: One-tap SOS button; collect live lat/long.
- **FR-3.2**: Dispatch notifications to nearest LEA unit + emergency contacts.
- **FR-3.3**: Maintain alert lifecycle: **New → Acknowledged → Responding → Resolved**.
- **FR-3.4**: Support web push/SMS/email fallback.

**4.4 AI-Based Anomaly Detection (AID)**

- **FR-4.1**: Detect inactivity (no location updates > threshold).
- **FR-4.2**: Detect deviation from itinerary (distance from planned path).
- **FR-4.3**: Classify text incident reports (zero-shot or rules).
- **FR-4.4**: Emit AI alerts with confidence score; allow operator override.

**4.5 Authority Dashboard & Case Management**

- **FR-5.1**: Real-time map (clusters, heat, geofences).
- **FR-5.2**: Alert feed with filters (type, time, severity).
- **FR-5.3**: Case page: timeline, last known location, contact, actions (call, message).
- **FR-5.4**: Auto e-FIR draft generation (template) with incident details (export PDF).
- **FR-5.5**: Audit trail of all actions.

**4.6 Blockchain-backed Audit**

- **FR-6.1**: Hash and write critical records (registration, SOS, closure) to Polygon testnet.
- **FR-6.2**: Expose verification endpoint that proves integrity (on-chain tx hash).
- **FR-6.3**: Graceful degradation if chain unavailable (queue & retry).

**4.7 Admin & Config**

- **FR-8.1**: RBAC (Tourist, LEA Operator, Tourism Officer, Admin).
- **FR-8.2**: Manage geofences, risk catalog, notification templates.
- **FR-8.3**: Key/secret rotation, environment config.

**5. Non-Functional Requirements**

**5.1 Security & Privacy**

- **NFR-S-1**: OAuth2/JWT; MFA for LEA/Admin.
- **NFR-S-2**: PII encryption at rest (AES-256) and in transit (TLS 1.2+).
- **NFR-S-3**: Data minimization; explicit consent for tracking; time-boxed retention (e.g., 90 days).

**5.2 Performance & Scalability**

- **NFR-P-1**: API p95 latency ≤ 300ms (non-map).
- **NFR-P-2**: Handle ≥ 5k concurrent socket clients (MVP target).
- **NFR-P-3**: SOS alert fan-out within ≤ 3s to subscribed operators.

**5.3 Reliability & Availability**

- **NFR-R-1**: Graceful retry queues for AI, blockchain, notifications.
- **NFR-R-2**: Idempotent alert creation.

**5.4 Usability & Accessibility**

- **NFR-U-1**: WCAG AA for color/contrast.
- **NFR-U-2**: Offline-first on client; low-bandwidth mode (map tile throttling).

**6. Data Requirements**

**6.1 High-level Schema (MVP)**

- **Tourist**(id, name, govIdHash, itineraryStart, itineraryEnd, emergencyContacts[], language, createdAt, consentFlags)
- **LocationPing**(touristId, lat, lon, ts, source)
- **Geofence**(id, name, polygon, riskLevel)
- **Alert**(id, type[SOS|GEOFENCE|AI|IoT], touristId, coords, createdAt, status, assignedTo, metadata)
- **Case**(id, alertIds[], status, notes[], blockchainTxHash?)
- **AuditLog**(id, actor, action, entity, before?, after?, ts, chainHash?)

**6.2 Retention**

- PII ≤ 90 days post-trip unless extended by lawful request.
- Location pings compressed/aggregated after 30 days.

**7. AI Module Specification (MVP)**

- **Inputs**: location time-series, itinerary window, optional text incident.
- **Rules/Heuristics (Phase 1)**:
    - No ping for > X minutes → “inactive” alert.
    - Distance from planned path > Y km → “deviation” alert.
- **Zero-shot text classifier** via LLM API for incident tagging.
- **Outputs**: {type, confidence, rationale}.
- **Explainability**: include rule hit and thresholds.

**8. Blockchain Module Specification**

- **Goal**: Integrity of critical events (registration, SOS raised/closed).
- **Contract (simple)**:
    - storeEvent(bytes32 eventId, bytes32 payloadHash, uint256 timestamp)
    - getEvent(eventId) → returns stored hash & timestamp.
- **Node Integration**: ethers.js with queue/retry; store txHash in Case/Alert.

**9. Constraints, Risks, Mitigations**

- **Data availability for AI** → start rule-based + zero-shot (no training).
- **Blockchain complexity** → minimal contract; testnet only.
- **Offline/poor network** → client caching + server retry queues.
- **Privacy** → opt-in tracking; clear consent UX; anonymize analytics.

**10. Verification & Validation**

**10.1 Test Types**

- Unit tests: services, geofence math, score calc.
- Integration: SOS → alert fan-out; AI proxy; blockchain logger dry-run.
- E2E: Tourist app triggers SOS → dashboard receives → case workflow.
- Security: JWT validation, RBAC checks, input validation/fuzzing.
- Performance: 5k concurrent sockets; alert fan-out latency.

**10.2 Acceptance Criteria (Samples)**

- **AC-1**: SOS from client appears on dashboard within ≤ 3s with correct coordinates.
- **AC-2**: Entering restricted geofence triggers alert and increments risk score.
- **AC-3**: Registration creates TouristID + QR and writes reg hash to blockchain (tx hash visible).
- **AC-4**: Inactivity > X mins triggers AI alert with confidence & rationale.
- **AC-5**: Dashboard can acknowledge/assign/resolve an alert and audit trail is captured.

**11. Deployment & DevOps (MVP)**

- **Services**: API (Node.js/Express), Socket.IO gateway, AI microservice (FastAPI) or LLM API, MongoDB Atlas, Nginx.
- **Environments**: dev/stage/prod (or dev/prod for MVP).
- **CI/CD**: GitHub Actions (lint/test/deploy); secrets via cloud KMS.
- **Monitoring**: Logs , metrics (Grafana or cloud native), uptime pings.