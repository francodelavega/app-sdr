import { useState, useMemo, useEffect } from 'react'
import { getStartTime } from '../hooks/useOpportunities'
import AppointmentRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // Monday as start
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate()
}

export default function ProximosTab({ appointments, loading, jumpFilter, livesMap = {} }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d
  })
  const [pipelineFilter, setPipelineFilter] = useState('all')

  // Compute available pipelines from actual data
  const pipelineOptions = useMemo(() => {
    const names = [...new Set(appointments.map(a => a.pipeline).filter(Boolean))]
    return [{ id: 'all', label: 'Todos' }, ...names.map(n => ({ id: n, label: n }))]
  }, [appointments])

  // jumpFilter compatibility: 'hoy' → today, '7dias' → today
  useEffect(() => {
    if (jumpFilter) {
      const d = new Date(); d.setHours(0,0,0,0)
      setSelectedDay(d)
      setWeekStart(startOfWeek(d))
    }
  }, [jumpFilter])

  // Week days array (Mon–Sun)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }, [weekStart])

  const filteredByPipeline = useMemo(() =>
    pipelineFilter === 'all'
      ? appointments
      : appointments.filter(a => a.pipeline === pipelineFilter),
  [appointments, pipelineFilter])

  const { active, cancelled } = useMemo(() => {
    const from = new Date(selectedDay)
    const to   = new Date(selectedDay)
    to.setHours(23, 59, 59, 999)

    const inRange = filteredByPipeline.filter(a => {
      const d = getStartTime(a)
      return d && d >= from && d <= to
    })

    return {
      active:    inRange.filter(a => a.status !== 'cancelled' && a.status !== 'noshow')
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
      cancelled: inRange.filter(a => a.status === 'cancelled')
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    }
  }, [appointments, selectedDay])

  // Count appointments per day for dot indicators
  const countByDay = useMemo(() => {
    const map = {}
    for (const a of filteredByPipeline) {
      const d = getStartTime(a)
      if (!d) continue
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = { active: 0, cancelled: 0 }
      if (a.status === 'cancelled') map[key].cancelled++
      else map[key].active++
    }
    return map
  }, [appointments])

  function countForDay(d) {
    return countByDay[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] || { active: 0, cancelled: 0 }
  }

  const isToday = (d) => isSameDay(d, today)
  const isSelected = (d) => isSameDay(d, selectedDay)
  const isPast = (d) => d < today

  const dayLabel = `${DAY_NAMES_FULL[selectedDay.getDay()]} ${selectedDay.getDate()} de ${MONTH_NAMES[selectedDay.getMonth()]}`

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Pipeline filter */}
      {pipelineOptions.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {pipelineOptions.map(f => (
            <button key={f.id} onClick={() => setPipelineFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pipelineFilter === f.id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Week navigator */}
      <div className="bg-white dark:bg-navy-700 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {weekDays[0].getDate()} {MONTH_NAMES[weekDays[0].getMonth()]} — {weekDays[6].getDate()} {MONTH_NAMES[weekDays[6].getMonth()]}
          </span>
          <button
            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const counts = countForDay(day)
            const total  = counts.active + counts.cancelled
            const sel    = isSelected(day)
            const tod    = isToday(day)
            const past   = isPast(day)

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(new Date(day))}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                  sel
                    ? 'bg-blue-500 text-white shadow-sm'
                    : tod
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                    : past
                    ? 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="text-[10px] font-medium mb-1">{DAY_NAMES[day.getDay()]}</span>
                <span className="text-sm font-bold">{day.getDate()}</span>
                {/* Dot indicators */}
                <div className="flex gap-0.5 mt-1 h-1.5">
                  {counts.active > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${sel ? 'bg-white/80' : 'bg-blue-400'}`} />
                  )}
                  {counts.cancelled > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${sel ? 'bg-white/50' : 'bg-slate-400'}`} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day header + count */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{dayLabel}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {active.length} confirmado{active.length !== 1 ? 's' : ''}
            {cancelled.length > 0 && <span className="ml-2 text-slate-400">· {cancelled.length} cancelado{cancelled.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>
      )}

      {loading ? <LoadingSkeleton rows={5} /> : active.length + cancelled.length === 0 ? (
        <EmptyState message="No hay demos en este día." />
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map(a => <AppointmentRow key={a.id} appt={a} showOutcome showStage livesLost={livesMap[a.contactId] || 0} />)}
            </div>
          )}
          {cancelled.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <h3 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide">
                  Cancelados ({cancelled.length})
                </h3>
              </div>
              <div className="space-y-2 opacity-60">
                {cancelled.map(a => <AppointmentRow key={a.id} appt={a} showOutcome showStage livesLost={livesMap[a.contactId] || 0} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
