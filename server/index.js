require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { MongoClient } = require('mongodb')

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '5mb' }))

const MONGO_URI = process.env.MONGO_URI || ''
const PORT = process.env.PORT || 4000

if (!MONGO_URI) {
  console.error('MONGO_URI not set. Set it in .env or environment variables.')
  process.exit(1)
}

let dbClient
let transitionsColl

async function start() {
  dbClient = new MongoClient(MONGO_URI)
  await dbClient.connect()
  const db = dbClient.db(process.env.MONGO_DB || 'sih_smart_safety')
  transitionsColl = db.collection('transitions')

  app.post('/api/transitions', async (req, res) => {
    try {
      const { transitions } = req.body || {}
      if (!Array.isArray(transitions)) return res.status(400).json({ ok: false, error: 'transitions must be an array' })
      if (transitions.length === 0) return res.json({ ok: true, inserted: 0 })

      // Ensure basic shape and add receivedAt
      const docs = transitions.map((t) => ({ ...t, receivedAt: new Date() }))
      const r = await transitionsColl.insertMany(docs)
      return res.json({ ok: true, inserted: r.insertedCount })
    } catch (e) {
      console.error('insert error', e)
      return res.status(500).json({ ok: false, error: String(e) })
    }
  })

  app.get('/health', (req, res) => res.json({ ok: true }))

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
}

start().catch((e) => { console.error(e); process.exit(1) })
