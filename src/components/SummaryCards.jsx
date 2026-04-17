import { useMemo } from 'react'
import { demoDate, demoOutcome } from '../hooks/useOpportunities'

function isToday(d) {
  if (!d) return false
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate()  === now.getDate()
}

function isThisWeek(d) {
  if (!d) return false
  const now  = new Date()
  const diff = d.getTime() - now.getTime()
  return diff >= 0 && diff <= 7 * 86_400_000
}

function withinLastDays(d, days) {
  if (!d) return false
  const diff = Date.now() - d.getTime()
  return diff >= 0 && diff <= days * 86_400_000
}

export default function SummaryCards({ opportunities, loading }) {
  const stats = useMemo(() => {
    const total = opportunities.length

    let todayCount    = 0
    let weekCount     = 0
    let noShowLast7   = 0

    for (const opp of opportunities) {
      const d       = demoDate(opp)
      const outcome = demoOutcome(opp)
      const now     = new Date()

      if (d && d > now) {
        if (isToday(d))     todayCount++
        if (isThisWeek(d))  weekCount++
      } else if (d && d <= now) {
        if (outcome === 'cancelled' && withinLastDays(d, 7)) noShowLast7++
      }
    }

    return { total, todayCount, weekCount, noShowLast7 }
  }, [opportunities])

  const cards = [
    {
      label: 'Total en Pre-Demo',
      value: stats.total,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      ),
      color: 'blue',
    },
    {
      label: 'Demos hoy',
      value: stats.todayCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      ),
      color: 'indigo',
    },
    {
      label: 'Demos esta semana',
      value: stats.weekCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
      color: 'violet',
    },
    {
      label: 'No-shows últimos 7d',
      value: stats.noShowLast7,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      ),
      color: stats.noShowLast7 > 3 ? 'red' : 'slate',
      alert: stats.noShowLast7 > 3,
    },
  ]

  const colorMap = {
    blue:   'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
    slate:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    red:    'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className={`relative rounded-xl p-4 bg-white dark:bg-navy-700 border shadow-sm transition-all ${
            card.alert
              ? 'border-red-300 dark:border-red-700 ring-1 ring-red-300 dark:ring-red-700'
              : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          {card.alert && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse-slow" />
          )}
          <div className={`inline-flex p-2 rounded-lg mb-3 ${colorMap[card.color]}`}>
            {card.icon}
          </div>
          {loading ? (
            <div className="skeleton h-7 w-12 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {card.value}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
