import { useMemo } from 'react'
import { getStartTime } from '../hooks/useOpportunities'
import AppointmentRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'

export default function ResumenTab({ appointments, preDemoTotal, loading }) {
  const { byComercial, todayAppts, staleAppts } = useMemo(() => {
    const now     = new Date()
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999)

    const counts = {}
    const today  = []
    const stale  = []

    for (const a of appointments) {
      counts[a.comercial] = (counts[a.comercial] || 0) + 1
      const d = getStartTime(a)
      if (d && d >= now && d <= todayEnd) today.push(a)
      if ((a.status === 'noshow' || a.status === 'cancelled') && d && (now - d) > 3 * 86_400_000) {
        stale.push(a)
      }
    }

    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([name,count]) => ({ name, count }))
    return { byComercial: sorted, todayAppts: today, staleAppts: stale }
  }, [appointments])

  const COLORS = { 'Gregorio': 'bg-blue-500', 'Belén': 'bg-violet-500', 'Karen': 'bg-emerald-500' }
  const colorFor = n => COLORS[n] || 'bg-slate-400'
  const max = byComercial[0]?.count || 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-4">
        {/* By comercial */}
        <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Demos por Comercial (últimos 30d)
          </h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-4 w-full"/>)}</div>
          ) : byComercial.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {byComercial.map(({ name, count }) => (
                <div key={name} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${colorFor(name)}`} />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{name}</span>
                  <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 shrink-0">
                    <div className={`h-1.5 rounded-full ${colorFor(name)}`} style={{ width: `${(count/max)*100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-4 text-right tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's demos */}
        <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">
            Demos de Hoy ({loading ? '…' : todayAppts.length})
          </h3>
          {loading ? <LoadingSkeleton rows={2} /> : todayAppts.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No hay demos para hoy.</p>
          ) : (
            <div className="space-y-2">
              {todayAppts.map(a => <AppointmentRow key={a.id} appt={a} />)}
            </div>
          )}
        </div>
      </div>

      {/* Stale follow-ups */}
      {(loading || staleAppts.length > 0) && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Requieren seguimiento urgente ({loading ? '…' : staleAppts.length})
            </h3>
          </div>
          {loading ? <LoadingSkeleton rows={2} /> : (
            <div className="space-y-2">
              {staleAppts.map(a => <AppointmentRow key={a.id} appt={a} showOutcome />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
