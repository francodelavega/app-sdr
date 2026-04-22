import { useMemo } from 'react'
import { getStartTime } from '../hooks/useOpportunities'

function isToday(d) {
  if (!d) return false
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export default function SummaryCards({ appointments, preDemoTotal, loading, onCardClick }) {
  const stats = useMemo(() => {
    const now     = new Date()
    const week    = new Date(now.getTime() + 7 * 86_400_000)
    let todayCount = 0, weekCount = 0, noShowLast7 = 0

    for (const a of appointments) {
      const d = getStartTime(a)
      if (!d) continue
      if (d > now && d <= week && a.status !== 'cancelled') {
        weekCount++
        if (isToday(d)) todayCount++
      }
      if (d < now && (now - d) <= 7 * 86_400_000 &&
          (a.status === 'noshow' || a.status === 'cancelled')) {
        noShowLast7++
      }
    }
    return { todayCount, weekCount, noShowLast7 }
  }, [appointments])

  const cards = [
    {
      id:    'predemo',
      label: 'Total en Pre-Demo',
      sub:   'solo abiertas',
      value: preDemoTotal,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
      color: 'blue',
      clickable: false,
    },
    {
      id:    'today',
      label: 'Demos hoy',
      value: stats.todayCount,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
      color: 'indigo',
      clickable: true,
    },
    {
      id:    'week',
      label: 'Demos próx. 7 días',
      value: stats.weekCount,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
      color: 'violet',
      clickable: true,
    },
    {
      id:    'noshow',
      label: 'No-shows últimos 7d',
      value: stats.noShowLast7,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
      color: stats.noShowLast7 > 3 ? 'red' : 'slate',
      alert: stats.noShowLast7 > 3,
      clickable: true,
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
          onClick={() => card.clickable && onCardClick?.(card.id)}
          className={`relative rounded-xl p-4 bg-white dark:bg-navy-700 border shadow-sm transition-all ${
            card.alert ? 'border-red-300 dark:border-red-700 ring-1 ring-red-300 dark:ring-red-700' : 'border-slate-200 dark:border-slate-700'
          } ${card.clickable ? 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-0.5' : ''}`}
        >
          {card.alert && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse-slow" />}
          {card.clickable && (
            <span className="absolute top-3 right-3 text-slate-300 dark:text-slate-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          )}
          <div className={`inline-flex p-2 rounded-lg mb-3 ${colorMap[card.color]}`}>{card.icon}</div>
          {loading ? <div className="skeleton h-7 w-12 mb-1" /> : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{card.value}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</p>
          {card.sub && <p className="text-[10px] text-slate-400 dark:text-slate-500">{card.sub}</p>}
        </div>
      ))}
    </div>
  )
}
