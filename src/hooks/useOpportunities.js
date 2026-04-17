import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_MS = 15 * 60 * 1000 // 15 min

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [lastUpdated, setLastUpdated]     = useState(null)
  const timerRef                          = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJSON('/api/opportunities')
      setOpportunities(data.opportunities || [])
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, REFRESH_MS)
    return () => clearInterval(timerRef.current)
  }, [load])

  return { opportunities, loading, error, lastUpdated, refresh: load }
}

// ── helpers ────────────────────────────────────────────────────────────────

export function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86_400_000)
}

export function getAsistio(opp) {
  const field = (opp.customFields || []).find(
    f => f.id === '9SSTmidWmdfaRZWNqz0g'
  )
  return field?.value ?? null
}

// Returns 'completed' | 'cancelled' | 'pending'
export function demoOutcome(opp) {
  const v = getAsistio(opp)
  if (!v) return 'pending'
  const lower = String(v).toLowerCase()
  if (lower.includes('sí') || lower.includes('si') || lower.includes('asistió') || lower === 'yes') return 'completed'
  if (lower.includes('no') || lower.includes('cancel') || lower.includes('ausente')) return 'cancelled'
  return 'pending'
}

export function demoDate(opp) {
  // GHL stores appointment date in customFields or appointmentInfo; try both
  const field = (opp.customFields || []).find(
    f => f.fieldKey?.toLowerCase().includes('fecha') || f.fieldKey?.toLowerCase().includes('demo') || f.fieldKey?.toLowerCase().includes('cita')
  )
  if (field?.value) return new Date(field.value)
  if (opp.appointmentInfo?.startTime) return new Date(opp.appointmentInfo.startTime)
  return null
}
