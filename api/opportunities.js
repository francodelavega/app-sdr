const BASE      = 'https://services.leadconnectorhq.com'
const TOKEN     = process.env.GHL_API_TOKEN
const LOCATION  = process.env.GHL_LOCATION_ID
const PIPELINE  = process.env.GHL_PIPELINE_ID   // MPUIAQq3Y5vZx8HZvvfC
const VERSION   = '2021-07-28'

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Version: VERSION,
  'Content-Type': 'application/json',
}

async function ghl(path) {
  const res = await fetch(`${BASE}${path}`, { headers })
  if (!res.ok) throw new Error(`GHL ${res.status}: ${path}`)
  return res.json()
}

async function getPipelineStages(pipelineId) {
  const data = await ghl(`/opportunities/pipelines/${pipelineId}?locationId=${LOCATION}`)
  return data.stages || []
}

async function getOpportunitiesByStage(pipelineId, stageId) {
  let all = []
  let page = 1
  while (true) {
    const data = await ghl(
      `/opportunities/search?location_id=${LOCATION}&pipeline_id=${pipelineId}&pipeline_stage_id=${stageId}&limit=100&page=${page}`
    )
    const opps = data.opportunities || []
    all = all.concat(opps)
    if (opps.length < 100) break
    page++
  }
  return all
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // ── 1. Pipeline principal — stage "Pre-Demo" ───────────────────────────
    const mainStages   = await getPipelineStages(PIPELINE)
    const preDemoStage = mainStages.find(s =>
      s.name.toLowerCase().includes('pre-demo') || s.name.toLowerCase().includes('pre demo')
    )

    // ── 2. Pipeline "Webinar" — stage "Agendado" ───────────────────────────
    const allPipelinesData = await ghl(`/opportunities/pipelines?locationId=${LOCATION}`)
    const pipelines = allPipelinesData.pipelines || []
    const webinarPipeline = pipelines.find(p =>
      p.name.toLowerCase().includes('webinar')
    )

    let opportunities = []

    if (preDemoStage) {
      const opps = await getOpportunitiesByStage(PIPELINE, preDemoStage.id)
      opportunities = opportunities.concat(opps.map(o => ({ ...o, _source: 'pre-demo' })))
    }

    if (webinarPipeline) {
      const webinarStages  = await getPipelineStages(webinarPipeline.id)
      const agendadoStage  = webinarStages.find(s =>
        s.name.toLowerCase().includes('agendado')
      )
      if (agendadoStage) {
        const opps = await getOpportunitiesByStage(webinarPipeline.id, agendadoStage.id)
        opportunities = opportunities.concat(opps.map(o => ({ ...o, _source: 'webinar' })))
      }
    }

    return res.status(200).json({ opportunities, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error('opportunities error', err)
    return res.status(500).json({ error: err.message })
  }
}
