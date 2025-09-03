import pkg from "../package.json"
import appConfig from "../app.json"

export default function Page() {
  const name = (appConfig as any)?.expo?.name || "SIH Smart Safety"
  const version = (pkg as any)?.version || "1.0.0"

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24, lineHeight: 1.6 }}>
      <h1 style={{ marginBottom: 8 }}>{name} — Expo Mobile App (Mock)</h1>
      <p style={{ marginTop: 0, color: "#555" }}>Version {version}</p>

      <p>
        This repository contains a React Native Expo application for SIH25002 "Smart Tourist Safety Monitoring Incident
        Response System." The v0 web preview cannot run native mobile code, so this page provides an overview. Download
        the ZIP from the top-right of this block and run it with Expo locally.
      </p>

      <h2>What’s included (all mock-only, no real APIs)</h2>
      <ul>
        <li>Tourist Registration and Login (simulated success/error; no real Aadhaar/phone/blockchain)</li>
        <li>Dashboard: Profile editing, Safety Score (mock weather/area data), Emergency Contacts CRUD</li>
        <li>Itinerary: sample trips with create/edit/delete</li>
        <li>Safety Recommendations: generated from mock incident/area data</li>
        <li>Location: mock map with fake current and group member locations, share on/off</li>
        <li>Emergency System: Help / Urgent Help / SOS, fake call, silent alert — all mocked</li>
        <li>Geo-fence Demo: simulate enter/exit alerts for sample zones</li>
        <li>Group Safety: mock group check-ins and buddy pings</li>
        <li>Multilingual: English/Hindi toggle (static labels)</li>
        <li>Offline Mode: pauses map/alerts and shows info message</li>
        <li>Settings: privacy note, language, wipe mock data</li>
        <li>
          Authority Dashboard (mock): tourists list with locations, incident list/filters, simple analytics, reports
        </li>
      </ul>

      <h2>How to run locally</h2>
      <ol>
        <li>Download the ZIP of this project from the top-right menu in this v0 block.</li>
        <li>Open the folder in your editor and install deps: npm install</li>
        <li>Start Expo: npm run start (then open in Expo Go or a simulator)</li>
      </ol>

      <h3>Notes</h3>
      <ul>
        <li>No real personal data is requested or transmitted. All sensitive flows are simulated.</li>
        <li>Future backend wiring points are commented inside src/context/AppContext.tsx.</li>
      </ul>
    </main>
  )
}
