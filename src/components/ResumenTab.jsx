import { useMemo } from 'react'
import { demoDate, demoOutcome, daysSince } from '../hooks/useOpportunities'
import OpportunityRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'

function AssigneeBar({ name, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
      <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{name}</span>
      <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 shrink-0">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-4 text-right tabular-nums">
        {count}
      </span>
    </div>
  )
}

const COLORS = [
  'bg-blue-500','bg-violet-500','bg-emerald-500',
  'bg-amber-500','bg-rose-500','bg-cyan-500',
  'bg-fuchsia-500','bg-teal-500',
]

function colorForName(name = '') {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return COLORS[hash % COLORS.length]
}

export default function ResumenTab({ opportunities, loading }) {
  const { byAssignee, staleOpps, todayOpps } = useMemo(() => {
    const now = new Date()
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const counts = {}
    const stale  = []
    const today  = []

    for (const opp of opportunities) {
      const assignee = opp.assignedTo?.name || opp.contact?.name || 'Sin asignar'
      counts[assignee] = (counts[assignee] || 0) + 1

      const d = demoDate(opp)
      if (d && d >= now && d <= todayEnd) today.push(opp)

      const outcome = demoOutcome(opp)
      if (outcome === 'cancelled' && d && (now - d) > 3 * 86_400_000) {
        stale.push(opp)
      }
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))

    return { byAssignee: sorted, staleOpps: stale, todayOpps: today }
  }, [opportunities])

  const maxCount = byAssignee[0]?.count || 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-4">
        {/* By assignee */}
        <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Distribución por Comercial
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-4 w-full" />)}
            </div>
          ) : byAssignee.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {byAssignee.map(({ name, count }) => (
                <AssigneeBar
                  key={name}
                  name={name}
                  count={count}
                  max={maxCount}
                  color={colorForName(name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Demos today */}
        <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Demos de Hoy ({loading ? '…' : todayOpps.length})
          </h3>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : todayOpps.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No hay demos agendados para hoy.</p>
          ) : (
            <div className="space-y-2">
              {todayOpps.map(opp => (
                <OpportunityRow key={opp.id} opp={opp} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stale follow-ups */}
      {(loading || staleOpps.length > 0) && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Requieren seguimiento urgente ({loading ? '…' : staleOpps.length})
            </h3>
          </div>
          {loading ? (
            <LoadingSkeleton rows={2} />
          ) : (
            <div className="space-y-2">
              {staleOpps.map(opp => (
                <OpportunityRow key={opp.id} opp={opp} showOutcome />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
