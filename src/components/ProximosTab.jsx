import { useState, useMemo } from 'react'
import { demoDate } from '../hooks/useOpportunities'
import OpportunityRow from './OpportunityRow'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

const FILTERS = [
  { id: 'hoy',     label: 'Hoy',     days: 0 },
  { id: 'manana',  label: 'Mañana',  days: 1 },
  { id: '3dias',   label: '3 días',  days: 3 },
  { id: '7dias',   label: '7 días',  days: 7 },
]

function startOfDay(offset = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d
}

function endOfDay(offset = 0) {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  d.setDate(d.getDate() + offset)
  return d
}

export default function ProximosTab({ opportunities, loading }) {
  const [filter, setFilter]   = useState('7dias')
  const [sortStale, setSortStale] = useState(false)

  const filtered = useMemo(() => {
    const now = new Date()
    const f   = FILTERS.find(x => x.id === filter)

    let from, to
    if (filter === 'hoy') {
      from = startOfDay(0); to = endOfDay(0)
    } else if (filter === 'manana') {
      from = startOfDay(1); to = endOfDay(1)
    } else {
      from = now
      to   = endOfDay(f.days)
    }

    const result = opportunities.filter(opp => {
      const d = demoDate(opp)
      return d && d >= from && d <= to
    })

    if (sortStale) {
      return result.sort((a, b) => {
        const da = a.lastActivityDate || a.dateUpdated || '9999'
        const db = b.lastActivityDate || b.dateUpdated || '9999'
        return new Date(da) - new Date(db)
      })
    }
    return result.sort((a, b) => {
      const da = demoDate(a)?.getTime() || 0
      const db = demoDate(b)?.getTime() || 0
      return da - db
    })
  }, [opportunities, filter, sortStale])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
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

        <button
          onClick={() => setSortStale(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            sortStale
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400'
              : 'bg-white dark:bg-navy-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
          </svg>
          Días s/contacto
        </button>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {filtered.length} demo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No hay demos agendados en este período. ¡Es buen momento para prospectar!" />
      ) : (
        <div className="space-y-2">
          {filtered.map(opp => (
            <OpportunityRow key={opp.id} opp={opp} showOutcome={false} />
          ))}
        </div>
      )}
    </div>
  )
}
