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

function normalizeAsistio(val) {
  if (!val) return null
  const v = val.toLowerCase()
  if (v === 'show')                              return 'showed'
  if (v === 'no show' || v === 'no contesto')   return 'noshow'
  if (v === 'no califica')                       return 'no_califica'
  return null
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

// Build contactId -> { asistio, oppId, livesLost, stageName, pipeline } map.
// Processes PRINCIPAL and any other pipeline (webinar, etc.).
//
// Status priority per opportunity:
//   1. Stage = NO SHOW          → noshow + livesLost=1  (strongest signal)
//   2. ¿Asistió? field filled   → trust the field value
//   3. Stage past PRE-DEMO      → showed (advanced in pipeline = attended)
//      (only when PRE-DEMO stage is identifiable in this pipeline)
//   4. Stage = PRE-DEMO, no field → pending
async function processPipeline(pipeline, map, pipelineLabel) {
  const stages      = pipeline.stages || []
  const preDemoStg  = stages.find(s => s.name.toUpperCase().includes('PRE-DEMO') || s.name.toUpperCase().includes('PRE DEMO'))
  const noShowStg   = stages.find(s => s.name.toUpperCase().includes('NO SHOW') || s.name.toUpperCase().includes('NOSHOW'))
  const preDemoIdx  = stages.findIndex(s => s.id === preDemoStg?.id)
  const postDemoIds = new Set(
    stages
      .filter((s, i) => i > preDemoIdx && s.id !== noShowStg?.id)
      .map(s => s.id)
  )

  const processPage = (data) => {
    for (const opp of data.opportunities || []) {
      if (!opp.contactId) continue
      const stageId   = opp.pipelineStageId
      const cf        = (opp.customFields || []).find(f => f.id === ASISTIO_FIELD)
      const fromField = normalizeAsistio(cf?.fieldValueString)

      let asistio, livesLost = 0

      if (stageId === noShowStg?.id) {
        // 1. Contact physically moved to NO SHOW stage
        asistio   = 'noshow'
        livesLost = 1
      } else if (fromField) {
        // 2. ¿Asistió? field is filled — trust it regardless of stage
        asistio = fromField
      } else if (preDemoStg && postDemoIds.has(stageId)) {
        // 3. Advanced past PRE-DEMO with no field filled → infer attended from stage
        asistio = 'showed'
      } else {
        // 4. In PRE-DEMO or pipeline has no recognizable PRE-DEMO stage → pending
        asistio = 'pending'
      }

      const stageName = stages.find(s => s.id === stageId)?.name || null
      map[opp.contactId] = { asistio, oppId: opp.id, livesLost, stageName, pipeline: pipelineLabel }
    }
  }

  const first = await ghl(
    `/opportunities/search?location_id=${LOCATION}&pipeline_id=${pipeline.id}&status=open&limit=100&page=1`
  )
  processPage(first)
  const pages = Math.ceil((first.meta?.total || 0) / 100)

  for (let start = 2; start <= pages; start += 5) {
    const batch = []
    for (let p = start; p < start + 5 && p <= pages; p++) {
      batch.push(ghl(
        `/opportunities/search?location_id=${LOCATION}&pipeline_id=${pipeline.id}&status=open&limit=100&page=${p}`
      ))
    }
    const results = await Promise.all(batch)
    results.forEach(processPage)
  }

  return first.meta?.total || 0
}

async function buildContactMap() {
  const map = {}
  let preDemoTotal = 0

  try {
    const { pipelines = [] } = await ghl(`/opportunities/pipelines?locationId=${LOCATION}`)
    const main    = pipelines.find(p => p.id === 'MPUIAQq3Y5vZx8HZvvfC' || p.name.toUpperCase().includes('PRINCIPAL'))
    const webinar = pipelines.find(p => p.name.toUpperCase().includes('WEBINAR'))

    // Process main pipeline first, then ALL other pipelines (webinar, etc.)
    const others = pipelines.filter(p => p.id !== main?.id)
    const tasks  = []
    if (main) tasks.push(processPipeline(main, map, main.name))
    for (const p of others) tasks.push(processPipeline(p, map, p.name))
    await Promise.all(tasks)

    // Count PRE-DEMO open opps in main pipeline for the summary card
    if (main) {
      const preDemoStg = (main.stages || []).find(s => s.name.toUpperCase().includes('PRE-DEMO'))
      if (preDemoStg) {
        const countRes = await ghl(
          `/opportunities/search?location_id=${LOCATION}&pipeline_id=${main.id}&pipeline_stage_id=${preDemoStg.id}&status=open&limit=1&page=1`
        )
        preDemoTotal = countRes.meta?.total || 0
      }
    }
  } catch (e) {
    console.error('buildContactMap error:', e.message)
  }

  return { map, total: preDemoTotal }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const now     = Date.now()
    const startMs = now - 60 * 24 * 60 * 60 * 1000  // 60 days ago (captures multiple no-show cycles)
    const endMs   = now + 30 * 24 * 60 * 60 * 1000  // 30 days ahead

    const [evG, evB, evK, { map: contactMap, total: preDemoTotal }] = await Promise.all([
      fetchEventsForUser('ilk9PnMA0JIoGXemoT9W', startMs, endMs),
      fetchEventsForUser('pahPHNuQSroyY1TyTn2p', startMs, endMs),
      fetchEventsForUser('yN99V1eTdEXfj0eBB3b6', startMs, endMs),
      buildContactMap(),
    ])

    const seen     = new Set()
    const appointments = []
    const nowDate  = new Date()

    for (const ev of [...evG, ...evB, ...evK]) {
      if (seen.has(ev.id) || ev.deleted) continue
      seen.add(ev.id)

      const isPast   = new Date(ev.startTime) < nowDate
      const oppData  = contactMap[ev.contactId]
      const apptSt   = (ev.appointmentStatus || '').toLowerCase()

      // Status logic:
      // - Past appointment → use pipeline stage (via contactMap). If contact not in map → pending.
      // - Future appointment:
      //     cancelled/invalid → 'cancelled' (actually cancelled, not just rescheduled)
      //     otherwise         → 'confirmed'
      // Note: appointmentStatus='cancelled' on past events usually means rescheduled,
      //       so we IGNORE it for past events and trust the pipeline stage instead.
      let status
      if (isPast) {
        status = oppData?.asistio || 'pending'
      } else {
        status = (apptSt === 'cancelled' || apptSt === 'invalid') ? 'cancelled' : 'confirmed'
      }

      appointments.push({
        id:               ev.id,
        contactId:        ev.contactId,
        opportunityId:    oppData?.oppId || null,
        contactName:      (ev.title || '').replace(/\s*\|\s*WeSpeak.*$/i, '').trim() || 'Sin nombre',
        comercial:        USERS[ev.assignedUserId] || 'Otro',
        startTime:        ev.startTime,
        endTime:          ev.endTime,
        status,
        livesLost:        oppData?.livesLost || 0,
        stageName:        oppData?.stageName || null,
        pipeline:         oppData?.pipeline || null,
        calendarId:       ev.calendarId,
      })
    }

    return res.status(200).json({ appointments, preDemoTotal, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error('error', err)
    return res.status(500).json({ error: err.message })
  }
}
