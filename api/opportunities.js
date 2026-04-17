const BASE     = 'https://services.leadconnectorhq.com'
const TOKEN    = process.env.GHL_API_TOKEN
const LOCATION = process.env.GHL_LOCATION_ID
const VERSION  = '2021-07-28'

const USERS = {
  ilk9PnMA0JIoGXemoT9W: 'Gregorio',
  pahPHNuQSroyY1TyTn2p: 'Belén',
  yN99V1eTdEXfj0eBB3b6: 'Karen',
}

const HEADERS = { Authorization: `Bearer ${TOKEN}`, Version: VERSION }

async function ghl(path) {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`GHL ${res.status}: ${path}`)
  return res.json()
}

async function fetchEventsForUser(userId, startMs, endMs) {
  const data = await ghl(
    `/calendars/events?locationId=${LOCATION}&userId=${userId}&startTime=${startMs}&endTime=${endMs}`
  )
  return data.events || []
}

async function getPreDemoCount() {
  try {
    const { pipelines = [] } = await ghl(`/opportunities/pipelines?locationId=${LOCATION}`)
    const main       = pipelines.find(p => p.id === 'MPUIAQq3Y5vZx8HZvvfC' || p.name.includes('PRINCIPAL'))
    const preDemoStg = main?.stages?.find(s => s.name.toUpperCase().includes('PRE-DEMO') || s.name.toUpperCase().includes('PRE DEMO'))
    if (!main || !preDemoStg) return 0

    const data = await ghl(
      `/opportunities/search?location_id=${LOCATION}&pipeline_id=${main.id}&pipeline_stage_id=${preDemoStg.id}&limit=1`
    )
    return data.meta?.total || 0
  } catch {
    return 0
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const now    = Date.now()
    const startMs = now - 30 * 24 * 60 * 60 * 1000  // 30 days ago
    const endMs   = now + 30 * 24 * 60 * 60 * 1000  // 30 days ahead

    // Fetch events for all 3 comerciales + pre-demo count in parallel
    const [evG, evB, evK, preDemoTotal] = await Promise.all([
      fetchEventsForUser('ilk9PnMA0JIoGXemoT9W', startMs, endMs),
      fetchEventsForUser('pahPHNuQSroyY1TyTn2p', startMs, endMs),
      fetchEventsForUser('yN99V1eTdEXfj0eBB3b6', startMs, endMs),
      getPreDemoCount(),
    ])

    // Deduplicate by id, add comercial name
    const seen = new Set()
    const appointments = []
    for (const ev of [...evG, ...evB, ...evK]) {
      if (seen.has(ev.id) || ev.deleted) continue
      seen.add(ev.id)
      appointments.push({
        id:          ev.id,
        contactId:   ev.contactId,
        contactName: (ev.title || '').replace(/\s*\|\s*WeSpeak.*$/i, '').trim() || 'Sin nombre',
        comercial:   USERS[ev.assignedUserId] || ev.assignedUserId,
        startTime:   ev.startTime,
        endTime:     ev.endTime,
        status:      ev.appointmentStatus || 'confirmed',
        calendarId:  ev.calendarId,
      })
    }

    return res.status(200).json({ appointments, preDemoTotal, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error('error', err)
    return res.status(500).json({ error: err.message })
  }
}
