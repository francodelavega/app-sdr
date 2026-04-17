import { getStartTime, outcomeLabel, outcomeStyle } from '../hooks/useOpportunities'

const COLORS = [
  'bg-blue-500','bg-violet-500','bg-emerald-500',
  'bg-amber-500','bg-rose-500','bg-cyan-500',
]
const COMERCIAL_COLORS = {
  'Gregorio': 'bg-blue-500',
  'Belén':    'bg-violet-500',
  'Karen':    'bg-emerald-500',
}

function colorFor(name = '') {
  if (COMERCIAL_COLORS[name]) return COMERCIAL_COLORS[name]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return COLORS[h % COLORS.length]
}

function fmt(d) {
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

const LOCATION_ID = 'KSLtWxOTnDay8qeue8df'

export default function AppointmentRow({ appt, showOutcome = false }) {
  const date      = getStartTime(appt)
  const dotColor  = colorFor(appt.comercial)
  const now       = new Date()
  const isPast    = date && date < now
  const isStale   = isPast && (appt.status === 'noshow' || appt.status === 'cancelled') &&
                    (now - date) > 3 * 86_400_000

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-md ${
      isStale
        ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/60'
        : 'bg-white dark:bg-navy-700 border-slate-200 dark:border-slate-700'
    }`}>
      {/* Comercial dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {appt.contactName}
          </span>
          {isStale && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              Seguimiento
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
          {appt.comercial}
        </p>
      </div>

      {/* Date */}
      <div className="hidden sm:block text-right shrink-0">
        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {fmt(date)}
        </p>
      </div>

      {/* Outcome badge */}
      {showOutcome && (
        <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ${outcomeStyle(appt.status)}`}>
          {outcomeLabel(appt.status)}
        </span>
      )}

      {/* CRM link */}
      <a
        href={
          appt.opportunityId
            ? `https://app.gohighlevel.com/opportunities/${appt.opportunityId}`
            : `https://app.gohighlevel.com/v2/location/${LOCATION_ID}/contacts/detail/${appt.contactId}`
        }
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
      >
        Abrir CRM ↗
      </a>
    </div>
  )
}
