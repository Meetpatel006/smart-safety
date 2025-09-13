# Smart Tourist Safety Monitoring and Incident Response System

## Overview

The Smart Tourist Safety application addresses the critical need for enhanced safety and security of tourists visiting destinations in India, with a special focus on the Northeast Region (NER). This comprehensive solution provides real-time monitoring, geo-fencing alerts, blockchain-based identity verification, emergency response mechanisms, and AI-powered safety recommendations to ensure tourists can enjoy their travel experiences with confidence and security.

## Problem Statement

**Official Problem Statement**: Smart Tourist Safety Monitoring & Incident Response System using AI, Geo-Fencing, and Blockchain-based Digital ID

**Organization**: Ministry of Development of North Eastern Region

The Northeast Region (NER) of India is a tourism hotspot but faces unique challenges in ensuring tourist safety due to:
- Remote and challenging terrain
- Limited connectivity and infrastructure
- Weather-related risks (monsoons, landslides)
- Wildlife encounters in eco-tourism areas
- Cultural and language barriers for non-local tourists
- Limited emergency response infrastructure
- Need for real-time monitoring of tourist movements

## Solution

Our Smart Tourist Safety application provides an integrated platform that addresses these challenges through:

1. **Blockchain-based Digital Tourist ID System**: Secure registration with unique tourist blockchain hash/ID
2. **Enhanced Tourist Dashboard**: Smart profile card with real-time safety score and intelligent itinerary management
3. **Advanced Geo-fencing & Risk Management**: Multi-level monitoring with risk-based alert system
4. **Multi-level Panic & Emergency System**: Smart panic button with tiered response options
5. **AI-Powered Real-time Safety Monitoring**: Intelligent tracking with adaptive frequency and AI safety assistant
6. **Offline Emergency Features**: Critical functionality that works without internet connectivity
7. **Authority Dashboard**: Command and control center with real-time monitoring and incident management

## Technology Stack

### Frontend (React Native with Expo)
- **React Native**: Cross-platform mobile application framework
- **Expo**: Development platform for building and deploying React Native applications
- **TypeScript**: Typed JavaScript for improved code quality and developer experience
- **React Navigation**: Advanced nested navigation
- **React Native Paper**: Material Design components with custom theming
- **AsyncStorage**: Encrypted local storage for offline support

### Mapping & Geo-fencing
- **Expo Maps**: Native map integration (Apple Maps on iOS, Google Maps on Android)
- **Expo Location**: Precise GPS with background tracking capabilities
- **OpenStreetMap**: Open-source mapping data and rendering (via WebView integration)
- **Custom Geo-fence Engine**: Advanced logic for polygon and circular geo-fence detection with debouncing

## Backend Overview

A Node.js backend (CommonJS) providing user authentication, SOS alerts, geofence handling, authority workflows, blockchain anchoring and realtime notifications for tourist safety.

### Technology Stack
- **Platform**: Node.js (CommonJS)
- **Web Framework**: Express 
- **Database**: MongoDB via Mongoose
- **Authentication**: Passport (local + JWT), `jsonwebtoken`, `bcryptjs`
- **Real-time**: Socket.IO (used for live notifications / updates)
- **Blockchain Integration**: `ethers` (for interacting with Ethereum-compatible networks)
- **Logging**: Winston (file and structured logging)
- **Environment Config**: dotenv
- **Containerization**: `Dockerfile` and `docker-compose.yml` for containerized deployment

### Key Third-party Libraries
- express, mongoose, passport, passport-local, passport-jwt
- jsonwebtoken, bcryptjs
- ioredis, socket.io
- ethers, winston, dotenv

### Primary Use Cases
- **User Authentication**: Registration, login, token-based access control
- **SOS Alert Management**: Creation, storage, logging and broadcasting to authorities
- **Real-time Notifications**: Socket.IO pushes alerts and status changes
- **Geofence Monitoring**: Triggers notifications when tourists enter/leave zones
- **Authority Workflows**: Endpoints for viewing/responding to alerts
- **Immutable Audit Anchoring**: On-chain recording of critical events
- **Fallback Logging**: Critical events have fallback paths for durability
- **Realtime Service**: Broadcasting to dashboards and external services

### Mobile App Integration
- **Expo Crypto**: Blockchain hash generation on the client side
- **End-to-end Encryption**: For sensitive user data
- **AsyncStorage**: Client-side storage for offline support

## AI/ML Model Overview

The AI/ML components provide intelligent safety monitoring, risk assessment, and predictive capabilities to enhance the tourist safety system.

### Technology Stack
- **Language**: Python 3.11+
- **Core ML Libraries**: numpy, pandas, scikit-learn, xgboost
- **Deep Learning/NLP**: torch, transformers
- **Forecasting**: pytorch-forecasting
- **Web/API**: fastapi, uvicorn
- **Utilities**: joblib
- **Deployment**: Modal (serverless Python cloud platform)

### Modal Platform Integration
Modal is integrated as the primary deployment platform for AI/ML services, offering:
- Serverless deployment of ML models with automatic scaling
- GPU-enabled containers for deep learning inference
- Ephemeral cloud environments that match development setup
- Built-in scheduling for batch processing jobs
- Easy CI/CD integration with webhook triggers
- Cost-effective pay-per-use pricing model

### Safety Scoring Models: Weather & Geo-Location

This project runs two specialized, production-ready models that each produce a normalized risk/safety score (0-100). Their outputs are combined by a lightweight ensemble service to produce the single "Safety Score" shown to users and used by the backend for alerting.

- Weather model
   - Inputs: current and forecasted weather (temperature, wind speed, precipitation, humidity), short-term forecasts (6-24h), nearby station observations, terrain/altitude, and broadcast weather alerts.
   - Model type: gradient-boosted trees (XGBoost) for tabular features with an optional temporal component (LSTM or simple sequence model) for short-term trend detection.
   - Output: { weather_risk: 0-100, confidence: 0-1, details: { top_features } }.
   - Typical inference endpoint: POST /models/weather/score { "location": {lat,lng}, "timestamp": ... } -> { weather_risk, confidence, details }.

- Geo-location model
   - Inputs: current GPS coordinates, movement vector (speed/course), proximity to geofences (protected or hazardous areas), local terrain/road safety layers, time of day, and historical incident density for the area.
   - Model type: XGBoost + engineered spatial features (point-in-polygon, distance-to-hazard, nearest-road-type); graph or sequence features can be added if movement history is available.
   - Output: { location_risk: 0-100, confidence: 0-1, details: { top_features } }.
   - Typical inference endpoint: POST /models/location/score { "location": {...}, "movement": {...}, "context": {...} } -> { location_risk, confidence, details }.

- Ensemble & final safety score
   - A small ensemble microservice combines the two model outputs using configurable weights and contextual rules (for example, increase weather weight during heavy storms). The service also enforces business rules (hard thresholds) to trigger immediate alerts regardless of averaged score.
   - Final output shape: { safety_score: 0-100, components: { weather_risk, location_risk }, confidence, reason_codes: [...], recommended_action: "informational|caution|urgent|emergency" }.
   - Ensemble endpoint: POST /models/ensemble/score { "user_id", "location", "timestamp", "sensor_data" } -> { safety_score, components, action }.

Operational notes:
- Latency: inference targets are low (sub-200ms under normal load); Modal auto-scaling handles spikes and GPU-backed containers are used for heavier models.
- Fallbacks: when model endpoints or input data are unavailable, the system falls back to deterministic rule-based heuristics (distance thresholds, cached weather) and marks overall confidence as low.
- Training & data: models are trained on historical incident logs, meteorological datasets, geofence labels, road-network safety indices, and simulated incident data where necessary. Retraining and A/B evaluation jobs run on a schedule.
- Explainability & monitoring: each inference returns top contributing features and a confidence score for operator review. Model performance metrics and concept-drift alerts are tracked in monitoring dashboards.

### Primary Use Cases
- **Safety Incident Detection**: Real-time risk scoring and classification for automated alerts
- **Automated Incident Triage**: NLP processing of free-text incident reports to determine severity and next steps
- **Predictive Risk Assessment**: Time-series forecasting to predict safety issues before they occur
- **Batch Risk Scoring**: Nightly processing of historical data for audit and reporting
- **Human-in-the-loop Review**: Model confidence metrics and explanations to help operators prioritize cases
- **Model Performance Evaluation**: A/B testing and benchmarking different model versions

### Deployment Scenarios
1. **Real-time API Endpoints**:
   - FastAPI applications deployed as Modal web endpoints
   - Auto-scaling based on incoming request load
   - GPU acceleration for transformer-based models

2. **Scheduled Batch Processing**:
   - Periodic model retraining jobs
   - Nightly risk assessment calculations
   - Automated model evaluation pipelines

3. **Asynchronous Processing**:
   - Queue heavy processing tasks via Modal webhooks
   - Handle long-running inference jobs
   - Process batch predictions in parallel

4. **Development Workflow**:
   - Modal's development environment for testing
   - Seamless deployment from local to production
   - Version control integration for model artifacts

## Key Features

### Blockchain-based Digital Tourist ID System
- **Advanced Registration Process**: Multi-step form with validation
- **Blockchain Integration**: Unique tourist blockchain hash/ID generation
- **QR Code Generation**: For quick verification by authorities
- **Encrypted Data Storage**: Primary AsyncStorage with encryption

### Auth & Blockchain Anchoring Flow

The detailed Auth & Blockchain Anchoring Flow is documented in `docs/PROJECT_FLOW.md` under "Registration & Digital ID" and the anchoring subsections. See that file for the complete step-by-step sequence, sample payloads, and verification details.

### Enhanced Tourist Dashboard
- **Smart Profile Card**: Blockchain-verified digital tourist ID
- **Dynamic Safety Score System**: AI-powered scoring (0-100) based on multiple risk factors
- **Intelligent Itinerary Management**: Import/create travel plans with timeline

### Advanced Geo-fencing & Risk Management
- **Location Monitoring**: Continuous GPS tracking with multiple accuracy levels
- **Geo-Fence Types**: Support for point, circle, and complex polygon areas
- **Risk-Based Alert System**: Progressive alert levels from informational to emergency
- **Smart Detection Engine**: Point-in-polygon detection with debouncing to prevent false alerts
- **Data Sources**: Natural disaster zones, security sensitive areas, wildlife protection zones
- **Offline Functionality**: Local storage for geo-fence data with offline detection

### Multi-level Panic & Emergency System
- **Smart Panic Button**: Three-tier system (Help → Urgent Help → Emergency SOS)
- **Special Features**: Fake call function, silent alarm mode
- **Emergency Features**: Automatic location sharing, photo/video capture
- **Group Safety Features**: Group panic alerts, buddy system with periodic check-ins
  
For a full production-ready sequence and endpoint examples for SOS alerts (ingest, AI triage, anchoring and authority handling), see `docs/PROJECT_FLOW.md` — "Detailed SOS Alert Flow with Authority".

### AI-Powered Real-time Safety Monitoring
- **Intelligent Tracking**: Adaptive tracking frequency based on risk level
- **AI Safety Assistant**: Natural language chatbot for safety queries powered by transformer models
- **Risk Classification**: Real-time incident detection and classification using XGBoost and PyTorch models
- **Predictive Analytics**: Time-series forecasting to identify potential safety issues before they occur
- **NLP Processing**: Transformer-based analysis of incident reports and emergency communications
- **Multilingual Support**: Hindi, English, and major NER languages with advanced NLP capabilities

### Offline Emergency Features
- **Offline Protocols**: Emergency contacts and procedures available offline
- **SMS Fallback**: Emergency alerts when internet is unavailable
- **Bluetooth Mesh**: Group communication in offline scenarios

### Authority Dashboard & Control Center
- **Real-time Monitoring**: Live tourist heat map with density indicators
- **Tourist Analytics**: Flow patterns, safety score distribution
- **Incident Management**: Multi-channel alert reception with priority classification
- **Reporting System**: Comprehensive analytics and predictive modeling

## Use Cases

### 1. Registration and Digital ID Creation
A tourist planning to visit Northeast India registers in the app, providing basic information and emergency contacts. The system generates a blockchain-secured digital ID with QR code that can be verified by authorities and serves as their official tourism identity throughout their journey.

### 2. Real-time Safety Monitoring in Remote Areas
A tourist hiking in a remote area of Arunachal Pradesh receives an adaptive safety score based on their location, weather conditions, time of day, and proximity to known risk areas. The app provides real-time recommendations to improve their safety score and avoid potential risks.

### 3. Geo-fence Alerts in Sensitive Areas
A trekker approaching a wildlife sanctuary receives progressive alerts:
- First an "approaching restricted zone" notification with educational information
- Then a "warning" alert as they get closer with safety recommendations
- Finally an "emergency protocol" if they enter a highly restricted area

### 4. Multi-level Emergency Response
A tourist facing a threatening situation can choose from multiple emergency options:
- "Help" for minor assistance needs
- "Urgent Help" for more serious situations
- "Emergency SOS" for critical emergencies
- "Silent Alert" for discrete emergency reporting
- "Fake Call" feature to deter potential threats

### 5. Group Travel Coordination
A family visiting Kaziranga National Park can:
- Create a travel group with all members
- Monitor each member's location and safety status
- Set up automatic check-ins at designated intervals
- Receive alerts if someone deviates from the group or planned route
- Trigger group-wide emergency notifications if needed

### 6. Offline Operation in Remote Areas
A tourist trekking in a connectivity-challenged area of Meghalaya can still:
- Access offline maps with pre-downloaded geo-fence data
- Receive local alerts based on cached risk information
- Use SMS fallback for emergency communications
- Record location data for later synchronization

### 7. Authority Dashboard Operations
Tourism and law enforcement authorities can:
- Monitor tourist density across the region with heat maps
- View real-time alerts categorized by severity
- Manage incident response through a structured workflow
- Generate reports and analyze patterns to improve safety measures
- Create and modify geo-fence zones based on changing conditions


## Technical Verification & Validation

Our implementation includes comprehensive testing:

- **Unit Tests**: Services, geofence math, safety score calculation
- **Integration Tests**: SOS → alert fan-out; AI proxy; blockchain logger
- **E2E Testing**: Tourist app triggers SOS → dashboard receives → case workflow
- **Security Testing**: JWT validation, RBAC checks, input validation
- **Performance Testing**: Concurrent connections, alert fan-out latency

## Future Enhancements

1. **AI/ML Module Expansion**: 
   - Advanced anomaly detection for user behavior patterns
   - Automated incident triage with priority assignment
   - Transformer-based NLP for contextual safety recommendations
   - Time-series forecasting for predictive risk assessment
   - Computer vision integration for landmark and hazard recognition
   - Federated learning for privacy-preserving model improvements

2. **Blockchain Implementation**:
   - Immutable integrity for critical events (registration, SOS)
   - Smart contracts for emergency protocols
   - Verification endpoint for data integrity

3. **IoT Integration**: 
   - Wearable device support for discrete emergency alerts
   - Environmental sensors for conditions monitoring
   - Beacon technology for indoor navigation

4. **Advanced Communication**:
   - Multi-modal alerts across channels
   - Social media integration for safe check-ins
   - Enhanced offline communication protocols

## Expected Deliverables

### Technical Deliverables

1. **Complete React Native (Expo) Application**
   - Source code with comprehensive documentation
   - Deployment-ready builds for Android and iOS
   - Mock backend with all API endpoints functional

2. **Web Dashboard for Authorities**
   - Real-time monitoring interface
   - Comprehensive tourist and incident management
   - Analytics and reporting modules

3. **AI/ML Services**
   - FastAPI endpoints for real-time inference
   - Modal-based serverless deployment
   - Trained models for risk assessment and incident classification
   - Batch processing pipelines for analytics
   - Model evaluation and monitoring tools

4. **Documentation Package**
   - Technical architecture documentation
   - User manuals for tourists and authorities
   - API documentation with example calls
   - Deployment and maintenance guides

### Demonstration Capabilities

- Full offline demo mode with mock data scenarios
- Emergency simulation with end-to-end alert flow
- Multi-user demo showing tourist app + authority dashboard interaction
- Scalability demonstration with multiple concurrent users

## Conclusion

The Smart Tourist Safety application represents a comprehensive solution to enhance tourist safety across India, with special focus on the Northeast Region. By combining blockchain-based digital IDs, real-time monitoring, geo-fencing alerts, AI-powered safety recommendations, and emergency response mechanisms, the system provides both tourists and authorities with the tools needed to ensure safer travel experiences.

This project directly addresses the Smart India Hackathon challenge SIH25002 "Smart Tourist Safety Monitoring Incident Response System" with an implementation that is scalable, multilingual, and designed for the diverse landscapes and unique challenges of tourist destinations across India's Northeast Region.
