import { demoDate, demoOutcome, daysSince } from '../hooks/useOpportunities'

// Deterministic color per assignee name
const COLORS = [
  'bg-blue-500',   'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500',   'bg-cyan-500',
  'bg-fuchsia-500','bg-teal-500',
]

function colorForName(name = '') {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return COLORS[hash % COLORS.length]
}

function formatDate(d) {
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const OUTCOME_STYLES = {
  completed: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-red-50   dark:bg-red-500/10   text-red-700   dark:text-red-400',
  pending:   'bg-slate-100 dark:bg-slate-700    text-slate-600 dark:text-slate-400',
}

const OUTCOME_LABELS = {
  completed: 'Asistió',
  cancelled: 'No-show',
  pending:   'Pendiente',
}

export default function OpportunityRow({ opp, showOutcome = false }) {
  const assignee   = opp.assignedTo?.name || opp.contact?.name || 'Sin asignar'
  const dotColor   = colorForName(assignee)
  const date       = demoDate(opp)
  const outcome    = demoOutcome(opp)
  const staleOpp   = outcome === 'cancelled' && date && (Date.now() - date.getTime()) > 3 * 86_400_000
  const staleDays  = date ? daysSince(date.toISOString()) : null
  const lastContact = opp.lastActivityDate
    ? daysSince(opp.lastActivityDate)
    : (opp.dateUpdated ? daysSince(opp.dateUpdated) : null)

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-md cursor-default ${
        staleOpp
          ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/60'
          : 'bg-white dark:bg-navy-700 border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Assignee dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

      {/* Name + source badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {opp.name || opp.contact?.name || 'Sin nombre'}
          </span>
          {opp._source === 'webinar' && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400">
              Webinar
            </span>
          )}
          {staleOpp && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
              Seguimiento
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} mr-1 align-middle`} />
          {assignee}
        </p>
      </div>

      {/* Date */}
      <div className="hidden sm:block text-right shrink-0">
        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {formatDate(date)}
        </p>
        {staleDays !== null && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            hace {staleDays}d
          </p>
        )}
      </div>

      {/* Days without contact */}
      <div className="hidden md:block text-center shrink-0 w-16">
        {lastContact !== null ? (
          <span className={`text-xs font-semibold tabular-nums ${
            lastContact > 7
              ? 'text-red-600 dark:text-red-400'
              : lastContact > 3
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-600 dark:text-slate-400'
          }`}>
            {lastContact}d
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
        <p className="text-[10px] text-slate-400 dark:text-slate-500">s/contacto</p>
      </div>

      {/* Outcome badge */}
      {showOutcome && (
        <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ${OUTCOME_STYLES[outcome]}`}>
          {OUTCOME_LABELS[outcome]}
        </span>
      )}

      {/* CRM link */}
      <a
        href={`https://app.gohighlevel.com/opportunities/${opp.id}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
      >
        Abrir CRM ↗
      </a>
    </div>
  )
}
