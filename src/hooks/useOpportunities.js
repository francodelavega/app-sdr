import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_MS = 15 * 60 * 1000

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useOpportunities() {
  const [appointments, setAppointments] = useState([])
  const [preDemoTotal, setPreDemoTotal] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [lastUpdated, setLastUpdated]   = useState(null)
  const timerRef                        = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJSON('/api/opportunities')
      setAppointments(data.appointments || [])
      setPreDemoTotal(data.preDemoTotal || 0)
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

  return { appointments, preDemoTotal, loading, error, lastUpdated, refresh: load }
}

// ── helpers ───────────────────────────────────────────────────────────────

export function getStartTime(appt) {
  if (!appt?.startTime) return null
  return new Date(appt.startTime)
}

// 'showed' | 'noshow' | 'cancelled' | 'confirmed' | 'invalid'
export function outcomeLabel(status) {
  switch (status) {
    case 'showed':    return 'Asistió'
    case 'noshow':    return 'No-show'
    case 'cancelled': return 'Cancelado'
    case 'confirmed': return 'Confirmado'
    default:          return status || 'Pendiente'
  }
}

export function outcomeStyle(status) {
  switch (status) {
    case 'showed':    return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    case 'noshow':    return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
    case 'cancelled': return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
    case 'confirmed': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
    default:          return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
  }
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}
