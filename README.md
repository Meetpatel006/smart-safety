# SIH Smart Tourist Safety (Mock-Only)

This is a React Native Expo app implementing the mock UI flows for SIH25002 "Smart Tourist Safety Monitoring Incident Response System".

Important:
- No real APIs, Aadhaar, phone, or blockchain are used; all flows are simulated.
- Replace the mock functions in src/context/AppContext.tsx and add API wiring where commented when moving to production.

Run locally:
1. Install dependencies: npm install (or pnpm/yarn)
2. Start Expo: npm run start
3. Open on a device with Expo Go or run on a simulator.

Structure:
- src/screens: Auth, Dashboard, Itinerary, Emergency, Settings, Authority
- src/components: UI sections (Profile, Safety Score, Contacts, Map, Panic, Geofences, Group, Language/Offline)
- src/context: Global mock state with AsyncStorage persistence, translations (EN/HI)
- src/utils: mock data and safety score logic
- src/navigation: React Navigation stacks and tabs

Where to add real backend later:
- src/context/AppContext.tsx (login, register, profile update, data fetching)
- Replace MockMap with real map provider
- Authority dashboard lists/incidents can connect to your backend once available
