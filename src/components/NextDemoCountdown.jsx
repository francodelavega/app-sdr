import { useState, useEffect, useMemo } from 'react'
import { getStartTime } from '../hooks/useOpportunities'

const COMERCIAL_COLORS = {
  'Gregorio': 'bg-blue-500',
  'Belén':    'bg-violet-500',
  'Karen':    'bg-emerald-500',
}

function colorFor(name = '') {
  return COMERCIAL_COLORS[name] || 'bg-slate-400'
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatCountdown(ms) {
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

export default function NextDemoCountdown({ appointments }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const { next, inProgress } = useMemo(() => {
    const nowDate = new Date(now)
    const active  = appointments.filter(a => a.status !== 'cancelled')

    // Demo currently in progress (assume 60 min if no endTime)
    const inProg = active.find(a => {
      const start = getStartTime(a)
      if (!start || start > nowDate) return false
      const end = a.endTime ? new Date(a.endTime) : new Date(start.getTime() + 60 * 60 * 1000)
      return end > nowDate
    })
    if (inProg) return { next: inProg, inProgress: true }

    // Next upcoming demo
    const upcoming = active
      .filter(a => {
        const d = getStartTime(a)
        return d && d > nowDate
      })
      .sort((a, b) => getStartTime(a) - getStartTime(b))

    return { next: upcoming[0] || null, inProgress: false }
  }, [appointments, now])

  if (!next) return null

  const startMs   = getStartTime(next)?.getTime() ?? 0
  const msLeft    = startMs - now
  const countdown = formatCountdown(msLeft)

  const timeStr = getStartTime(next)?.toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit',
  })

  if (inProgress) {
    return (
      <div className="rounded-xl border border-emerald-400/40 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-5 py-3 flex items-center gap-4">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-0.5">Demo en curso</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{next.contactName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${colorFor(next.comercial)}`} />
          <span className="text-sm text-slate-600 dark:text-slate-300">{next.comercial}</span>
        </div>
      </div>
    )
  }

  const urgent = msLeft < 10 * 60 * 1000 // < 10 min

  return (
    <div className={`rounded-xl border px-5 py-3 flex items-center gap-4 transition-colors ${
      urgent
        ? 'border-amber-400/50 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10'
        : 'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10'
    }`}>
      {/* Clock icon */}
      <svg className={`w-5 h-5 shrink-0 ${urgent ? 'text-amber-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>

      {/* Label + name */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${urgent ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
          Próxima demo · {timeStr}
        </p>
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{next.contactName}</p>
      </div>

      {/* Comercial */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`w-2 h-2 rounded-full ${colorFor(next.comercial)}`} />
        <span className="text-sm text-slate-600 dark:text-slate-300">{next.comercial}</span>
      </div>

      {/* Countdown */}
      <div className={`text-2xl font-bold tabular-nums shrink-0 ${urgent ? 'text-amber-500 animate-pulse' : 'text-blue-500'}`}>
        {countdown}
      </div>
    </div>
  )
}
