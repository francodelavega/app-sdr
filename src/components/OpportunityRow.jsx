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

function pipelineBadge(name) {
  if (!name) return null
  const n = name.toUpperCase()
  if (n.includes('WEBINAR')) return { label: 'Webinar', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' }
  if (n.includes('PRINCIPAL')) return { label: 'Principal', color: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' }
  // fallback: first word of pipeline name
  return { label: name.split(' ')[0], color: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' }
}

// Friendly label for pipeline stage name coming from GHL
function stageLabel(stageName) {
  if (!stageName) return null
  const n = stageName.toUpperCase()
  if (n.includes('PRE-DEMO') || n.includes('PRE DEMO')) return { label: 'Pre-Demo', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' }
  if (n.includes('NO SHOW'))                              return { label: 'No Show', color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' }
  if (n.includes('DEMO') || n.includes('NUTRICI'))       return { label: 'Demo Nutrición', color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' }
  if (n.includes('DECISI'))                              return { label: 'Decisión', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  if (n.includes('NEGOCI'))                              return { label: 'Negociación', color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' }
  if (n.includes('PAGO'))                                return { label: 'Pago', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
  return { label: stageName, color: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' }
}

const LOCATION_ID = 'KSLtWxOTnDay8qeue8df'

export default function AppointmentRow({ appt, showOutcome = false, showStage = false, livesLost = 0 }) {
  const date      = getStartTime(appt)
  const dotColor  = colorFor(appt.comercial)
  const now       = new Date()
  const isPast    = date && date < now
  const isStale   = isPast && (appt.status === 'noshow' || appt.status === 'cancelled') &&
                    (now - date) > 3 * 86_400_000
  const stage     = showStage ? stageLabel(appt.stageName) : null
  const pipeline  = pipelineBadge(appt.pipeline)

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-md ${
      isStale
        ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/60'
        : 'bg-white dark:bg-navy-700 border-slate-200 dark:border-slate-700'
    }`}>
      {/* Comercial dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

      {/* Name + badges */}
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
          {livesLost > 0 && (
            <span
              title={`${livesLost} no-show${livesLost > 1 ? 's' : ''} anterior${livesLost > 1 ? 'es' : ''}`}
              className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                livesLost >= 2
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                  : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
              }`}
            >
              <span className="text-base leading-none">💀</span>
              <span>{livesLost}</span>
            </span>
          )}
          {pipeline && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${pipeline.color}`}>
              {pipeline.label}
            </span>
          )}
          {stage && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${stage.color}`}>
              {stage.label}
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
