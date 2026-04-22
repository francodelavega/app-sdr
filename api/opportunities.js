const BASE     = 'https://services.leadconnectorhq.com'
const TOKEN    = process.env.GHL_API_TOKEN
const LOCATION = process.env.GHL_LOCATION_ID
const VERSION  = '2021-07-28'
const ASISTIO_FIELD = '9SSTmidWmdfaRZWNqz0g'

const USERS = {
  ilk9PnMA0JIoGXemoT9W: 'Gregorio',
  pahPHNuQSroyY1TyTn2p: 'Belén',
  yN99V1eTdEXfj0eBB3b6: 'Karen',
}

// Normalize ¿Asistió? value to a standard status
function normalizeAsistio(val) {
  if (!val) return 'pending'
  const v = val.toLowerCase()
  if (v === 'show')                                    return 'showed'
  if (v === 'no show' || v === 'no contesto')         return 'noshow'
  if (v === 'no califica')                             return 'no_califica'
  return 'pending'
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

// Build contactId -> { asistio, oppId } map from all Pre-Demo opportunities
async function buildContactMap() {
  const map = {}
  let total = 0

  try {
    const { pipelines = [] } = await ghl(`/opportunities/pipelines?locationId=${LOCATION}`)
    const main       = pipelines.find(p => p.id === 'MPUIAQq3Y5vZx8HZvvfC' || p.name.includes('PRINCIPAL'))
    const preDemoStg = main?.stages?.find(s => s.name.toUpperCase().includes('PRE-DEMO'))
    if (!main || !preDemoStg) return { map, total }

    // First page to get total count — only OPEN opportunities
    const first = await ghl(
      `/opportunities/search?location_id=${LOCATION}&pipeline_id=${main.id}&pipeline_stage_id=${preDemoStg.id}&status=open&limit=100&page=1`
    )
    total = first.meta?.total || 0
    const pages = Math.ceil(total / 100)

    const processPage = (data) => {
      for (const opp of data.opportunities || []) {
        if (!opp.contactId) continue
        const cf = (opp.customFields || []).find(f => f.id === ASISTIO_FIELD)
        map[opp.contactId] = {
          asistio: normalizeAsistio(cf?.fieldValueString),
          oppId:   opp.id,
        }
      }
    }
    processPage(first)

    // Fetch remaining pages in parallel batches of 5
    for (let start = 2; start <= pages; start += 5) {
      const batch = []
      for (let p = start; p < start + 5 && p <= pages; p++) {
        batch.push(ghl(
          `/opportunities/search?location_id=${LOCATION}&pipeline_id=${main.id}&pipeline_stage_id=${preDemoStg.id}&status=open&limit=100&page=${p}`
        ))
      }
      const results = await Promise.all(batch)
      results.forEach(processPage)
    }
  } catch (e) {
    console.error('buildContactMap error:', e.message)
  }

  return { map, total }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const now     = Date.now()
    const startMs = now - 21 * 24 * 60 * 60 * 1000  // 21 days ago
    const endMs   = now + 30 * 24 * 60 * 60 * 1000  // 30 days ahead

    // Fetch calendar events + contact map in parallel
    const [evG, evB, evK, { map: contactMap, total: preDemoTotal }] = await Promise.all([
      fetchEventsForUser('ilk9PnMA0JIoGXemoT9W', startMs, endMs),
      fetchEventsForUser('pahPHNuQSroyY1TyTn2p', startMs, endMs),
      fetchEventsForUser('yN99V1eTdEXfj0eBB3b6', startMs, endMs),
      buildContactMap(),
    ])

    // Deduplicate, enrich with ¿Asistió? from opportunity
    const seen = new Set()
    const appointments = []
    const nowDate = new Date()

    for (const ev of [...evG, ...evB, ...evK]) {
      if (seen.has(ev.id) || ev.deleted) continue
      seen.add(ev.id)

      const isPast        = new Date(ev.startTime) < nowDate
      const oppData       = contactMap[ev.contactId]
      const apptStatus    = (ev.appointmentStatus || '').toLowerCase()
      const isCancelled   = apptStatus === 'cancelled' || apptStatus === 'invalid'

      // Determine status:
      // - Cancelled by GHL → 'cancelled' (regardless of past/future)
      // - Future (not cancelled) → 'confirmed'
      // - Past (not cancelled) → use ¿Asistió? field if set, otherwise 'pending'
      let status = 'confirmed'
      if (isCancelled) {
        status = 'cancelled'
      } else if (isPast) {
        status = oppData?.asistio || 'pending'
      }

      appointments.push({
        id:             ev.id,
        contactId:      ev.contactId,
        opportunityId:  oppData?.oppId || null,
        contactName:    (ev.title || '').replace(/\s*\|\s*WeSpeak.*$/i, '').trim() || 'Sin nombre',
        comercial:      USERS[ev.assignedUserId] || 'Otro',
        startTime:      ev.startTime,
        endTime:        ev.endTime,
        status,
        appointmentStatus: ev.appointmentStatus || null,
        calendarId:     ev.calendarId,
      })
    }

    return res.status(200).json({ appointments, preDemoTotal, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error('error', err)
    return res.status(500).json({ error: err.message })
  }
}
