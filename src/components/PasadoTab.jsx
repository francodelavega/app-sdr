import { useState, useMemo } from 'react'
import { demoDate, demoOutcome } from '../hooks/useOpportunities'
import OpportunityRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

const FILTERS = [
  { id: 'ayer',  label: 'Ayer',    days: 1  },
  { id: '7d',    label: '7 días',  days: 7  },
  { id: '14d',   label: '14 días', days: 14 },
  { id: '21d',   label: '21 días', days: 21 },
]

export default function PasadoTab({ opportunities, loading }) {
  const [filter, setFilter] = useState('7d')

  const { filtered, completed, cancelled } = useMemo(() => {
    const now  = new Date()
    const days = FILTERS.find(f => f.id === filter)?.days || 7
    const from = new Date(now.getTime() - days * 86_400_000)
    from.setHours(0, 0, 0, 0)

    const result = opportunities
      .filter(opp => {
        const d = demoDate(opp)
        return d && d >= from && d <= now
      })
      .sort((a, b) => (demoDate(b)?.getTime() || 0) - (demoDate(a)?.getTime() || 0))

    const comp = result.filter(o => demoOutcome(o) === 'completed').length
    const canc = result.filter(o => demoOutcome(o) === 'cancelled').length

    return { filtered: result, completed: comp, cancelled: canc }
  }, [opportunities, filter])

  const convRate = filtered.length > 0
    ? Math.round((completed / filtered.length) * 100)
    : 0

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats strip */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{completed}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Asistieron</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">{cancelled}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No-show / Cancelado</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{convRate}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tasa de asistencia</p>
          </div>
        </div>
      )}

      {/* Section: cancelled first (re-engage focus) */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No hay demos pasados en este período." />
      ) : (
        <div className="space-y-4">
          {/* No-shows — most actionable */}
          {filtered.filter(o => demoOutcome(o) === 'cancelled').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  No-show / Cancelados
                </h3>
              </div>
              <div className="space-y-2">
                {filtered
                  .filter(o => demoOutcome(o) === 'cancelled')
                  .map(opp => (
                    <OpportunityRow key={opp.id} opp={opp} showOutcome />
                  ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {filtered.filter(o => demoOutcome(o) === 'completed').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Completados
                </h3>
              </div>
              <div className="space-y-2">
                {filtered
                  .filter(o => demoOutcome(o) === 'completed')
                  .map(opp => (
                    <OpportunityRow key={opp.id} opp={opp} showOutcome />
                  ))}
              </div>
            </div>
          )}

          {/* Pending outcome */}
          {filtered.filter(o => demoOutcome(o) === 'pending').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Sin resultado registrado
                </h3>
              </div>
              <div className="space-y-2">
                {filtered
                  .filter(o => demoOutcome(o) === 'pending')
                  .map(opp => (
                    <OpportunityRow key={opp.id} opp={opp} showOutcome />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
