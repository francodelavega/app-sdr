const BASE     = 'https://services.leadconnectorhq.com'
const TOKEN    = process.env.GHL_API_TOKEN
const LOCATION = process.env.GHL_LOCATION_ID
const VERSION  = '2021-07-28'

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Version: VERSION,
}

async function ghl(path) {
  const res = await fetch(`${BASE}${path}`, { headers })
  if (!res.ok) throw new Error(`GHL ${res.status}: ${path}`)
  return res.json()
}

async function getOpportunitiesByStage(pipelineId, stageId) {
  let all  = []
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
    // Fetch all pipelines (stages included in response)
    const { pipelines = [] } = await ghl(`/opportunities/pipelines?locationId=${LOCATION}`)

    // ── Pipeline principal (1-PRINCIPAL) — stage PRE-DEMO ─────────────────
    const mainPipeline  = pipelines.find(p => p.name.includes('PRINCIPAL') || p.id === 'MPUIAQq3Y5vZx8HZvvfC')
    const preDemoStage  = mainPipeline?.stages?.find(s =>
      s.name.toLowerCase().includes('pre-demo') || s.name.toLowerCase().includes('pre demo')
    )

    // ── Pipeline Webinars (2-WEBINARS) — stage Agendado ───────────────────
    const webinarPipeline = pipelines.find(p => p.name.toLowerCase().includes('webinar'))
    const agendadoStage   = webinarPipeline?.stages?.find(s =>
      s.name.toLowerCase().includes('agendado')
    )

    let opportunities = []

    if (mainPipeline && preDemoStage) {
      const opps = await getOpportunitiesByStage(mainPipeline.id, preDemoStage.id)
      opportunities = opportunities.concat(opps.map(o => ({ ...o, _source: 'pre-demo' })))
    }

    if (webinarPipeline && agendadoStage) {
      const opps = await getOpportunitiesByStage(webinarPipeline.id, agendadoStage.id)
      opportunities = opportunities.concat(opps.map(o => ({ ...o, _source: 'webinar' })))
    }

    return res.status(200).json({ opportunities, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error('opportunities error', err)
    return res.status(500).json({ error: err.message })
  }
}
