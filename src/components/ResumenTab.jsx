import { useMemo } from 'react'
import { getStartTime } from '../hooks/useOpportunities'
import AppointmentRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'

const COLORS     = { 'Gregorio': 'bg-blue-500',    'Belén': 'bg-violet-500',    'Karen': 'bg-emerald-500'    }
const TEXT_COLORS = { 'Gregorio': 'text-blue-500', 'Belén': 'text-violet-500', 'Karen': 'text-emerald-500' }
const MEDALS     = ['🥇', '🥈', '🥉']

function colorFor(n)     { return COLORS[n]      || 'bg-slate-400' }
function textColorFor(n) { return TEXT_COLORS[n] || 'text-slate-400' }

export default function ResumenTab({ appointments, preDemoTotal, loading }) {
  const { byComercial, leaderboard, todayAppts, staleAppts } = useMemo(() => {
    const now        = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)
    const thirtyAgo  = new Date(now.getTime() - 30 * 86_400_000)
    const sevenAgo   = new Date(now.getTime() -  7 * 86_400_000)

    const counts30 = {}
    const stats    = {}   // per-setter: { demos7, showed7, streak }
    const today    = []
    const stale    = []

    for (const a of appointments) {
      const d = getStartTime(a)
      if (!d) continue

      // 30d bar chart
      if (d >= thirtyAgo && d <= now) {
        counts30[a.comercial] = (counts30[a.comercial] || 0) + 1
      }

      // 7d leaderboard stats
      if (d >= sevenAgo && d <= now) {
        if (!stats[a.comercial]) stats[a.comercial] = { demos: 0, showed: 0 }
        stats[a.comercial].demos++
        if (a.status === 'showed') stats[a.comercial].showed++
      }

      if (d >= todayStart && d <= todayEnd) today.push(a)
      if ((a.status === 'noshow' || a.status === 'cancelled') && (now - d) > 3 * 86_400_000) {
        stale.push(a)
      }
    }

    const sorted30 = Object.entries(counts30)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))

    // Leaderboard: rank by show rate, then by demo count
    const board = Object.entries(stats).map(([name, s]) => ({
      name,
      demos:    s.demos,
      showed:   s.showed,
      rate:     s.demos > 0 ? Math.round((s.showed / s.demos) * 100) : 0,
    })).sort((a, b) => b.rate - a.rate || b.demos - a.demos)

    return { byComercial: sorted30, leaderboard: board, todayAppts: today, staleAppts: stale }
  }, [appointments])

  const max = byComercial[0]?.count || 1

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Leaderboard */}
      <div className="rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Leaderboard — últimos 7 días</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Ranking por tasa de show</span>
        </div>
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-xl"/>)}</div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-slate-400">Sin datos</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map(({ name, demos, showed, rate }, i) => (
              <div key={name} className={`flex items-center gap-4 p-3 rounded-xl ${
                i === 0
                  ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border border-amber-200/60 dark:border-amber-500/20'
                  : 'bg-slate-50 dark:bg-navy-800 border border-slate-100 dark:border-slate-700'
              }`}>
                <span className="text-xl w-7 text-center shrink-0">{MEDALS[i] || `#${i+1}`}</span>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorFor(name)}`} />
                <span className="text-sm font-semibold text-slate-800 dark:text-white flex-1">{name}</span>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className={`text-lg font-bold tabular-nums ${textColorFor(name)}`}>{rate}%</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Show rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">{showed}<span className="text-slate-400 dark:text-slate-500 font-normal text-sm">/{demos}</span></p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Shows / Demos</p>
                  </div>
                </div>

                {/* Rate bar */}
                <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2 shrink-0">
                  <div
                    className={`h-2 rounded-full transition-all ${colorFor(name)}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* By comercial 30d */}
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
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-6 text-right tabular-nums">{count}</span>
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
