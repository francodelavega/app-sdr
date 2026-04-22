import { useState, useMemo, useEffect } from 'react'
import { getStartTime } from '../hooks/useOpportunities'
import AppointmentRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

const FILTERS = [
  { id: 'hoy',    label: 'Hoy',    hours: 24  },
  { id: 'manana', label: 'Mañana', offset: 1  },
  { id: '3dias',  label: '3 días', days: 3    },
  { id: '7dias',  label: '7 días', days: 7    },
]

export default function ProximosTab({ appointments, loading, jumpFilter }) {
  const [filter, setFilter] = useState('7dias')

  useEffect(() => {
    if (jumpFilter) setFilter(jumpFilter)
  }, [jumpFilter])

  const { active, cancelled } = useMemo(() => {
    const now = new Date()

    let from, to
    if (filter === 'hoy') {
      from = now
      to   = new Date(now); to.setHours(23, 59, 59, 999)
    } else if (filter === 'manana') {
      from = new Date(now); from.setDate(from.getDate() + 1); from.setHours(0,0,0,0)
      to   = new Date(from); to.setHours(23, 59, 59, 999)
    } else {
      const days = filter === '3dias' ? 3 : 7
      from = now
      to   = new Date(now.getTime() + days * 86_400_000)
    }

    const inRange = appointments.filter(a => {
      const d = getStartTime(a)
      return d && d >= from && d <= to
    })

    return {
      active:    inRange.filter(a => a.status !== 'cancelled' && a.status !== 'noshow')
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
      cancelled: inRange.filter(a => a.status === 'cancelled')
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    }
  }, [appointments, filter])

  const total = active.length + cancelled.length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 justify-between">
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
      </div>

      {!loading && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {active.length} demo{active.length !== 1 ? 's' : ''} confirmado{active.length !== 1 ? 's' : ''}
          {cancelled.length > 0 && (
            <span className="ml-2 text-slate-400 dark:text-slate-500">
              · {cancelled.length} cancelado{cancelled.length !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      )}

      {loading ? <LoadingSkeleton rows={6} /> : total === 0 ? (
        <EmptyState message="No hay demos agendados en este período." />
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map(a => <AppointmentRow key={a.id} appt={a} showOutcome={false} />)}
            </div>
          )}

          {cancelled.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  Cancelados ({cancelled.length})
                </h3>
              </div>
              <div className="space-y-2 opacity-60">
                {cancelled.map(a => <AppointmentRow key={a.id} appt={a} showOutcome />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
