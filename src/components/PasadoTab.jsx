import { useState, useMemo, useEffect } from 'react'
import { getStartTime } from '../hooks/useOpportunities'
import AppointmentRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

const FILTERS = [
  { id: 'ayer', label: 'Ayer',    days: 1  },
  { id: '7d',   label: '7d',     days: 7  },
  { id: '14d',  label: '14d',    days: 14 },
  { id: '21d',  label: '21d',    days: 21 },
  { id: '28d',  label: '28d',    days: 28 },
  { id: '35d',  label: '35d',    days: 35 },
  { id: '42d',  label: '42d',    days: 42 },
]

export default function PasadoTab({ appointments, loading, jumpFilter, livesMap = {} }) {
  const [filter, setFilter]   = useState('7d')
  const [sortDir, setSortDir] = useState('desc') // 'desc' = más reciente primero

  useEffect(() => {
    if (jumpFilter) setFilter(jumpFilter)
  }, [jumpFilter])

  const { filtered, showed, noshow } = useMemo(() => {
    const now  = new Date()
    const days = FILTERS.find(f => f.id === filter)?.days || 7
    const from = new Date(now.getTime() - days * 86_400_000)
    from.setHours(0, 0, 0, 0)

    const result = appointments
      .filter(a => {
        const d = getStartTime(a)
        return d && d >= from && d < now
      })
      .sort((a, b) => sortDir === 'desc'
        ? new Date(b.startTime) - new Date(a.startTime)
        : new Date(a.startTime) - new Date(b.startTime)
      )

    return {
      filtered: result,
      showed:   result.filter(a => a.status === 'showed').length,
      noshow:   result.filter(a => a.status === 'noshow' || a.status === 'cancelled').length,
    }
  }, [appointments, filter, sortDir])

  const rate = filtered.length > 0 ? Math.round((showed / filtered.length) * 100) : 0

  const noshows    = filtered.filter(a => a.status === 'noshow' || a.status === 'cancelled')
  const showedList = filtered.filter(a => a.status === 'showed')
  const rest       = filtered.filter(a => a.status !== 'showed' && a.status !== 'noshow' && a.status !== 'cancelled')

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
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
        {/* Sort direction toggle */}
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          title={sortDir === 'desc' ? 'Más reciente primero' : 'Más antiguo primero'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sortDir === 'desc'
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l-4 4m4-4H7"/>
            }
          </svg>
          {sortDir === 'desc' ? 'Reciente primero' : 'Antiguo primero'}
        </button>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{showed}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Asistieron</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">{noshow}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No-show / Cancelado</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{rate}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tasa asistencia</p>
          </div>
        </div>
      )}

      {loading ? <LoadingSkeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState message="No hay demos en este período." />
      ) : (
        <div className="space-y-4">
          {noshows.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  No-show / Cancelados ({noshows.length})
                </h3>
              </div>
              <div className="space-y-2">
                {noshows.map(a => <AppointmentRow key={a.id} appt={a} showOutcome showStage livesLost={livesMap[a.contactId] || 0} />)}
              </div>
            </div>
          )}
          {showedList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Asistieron ({showedList.length})
                </h3>
              </div>
              <div className="space-y-2">
                {showedList.map(a => <AppointmentRow key={a.id} appt={a} showOutcome showStage livesLost={livesMap[a.contactId] || 0} />)}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Sin resultado ({rest.length})
                </h3>
              </div>
              <div className="space-y-2">
                {rest.map(a => <AppointmentRow key={a.id} appt={a} showOutcome showStage livesLost={livesMap[a.contactId] || 0} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
