import type { Project, StudioTimelinePhase, TimelineItem, ApprovalRecord } from '../../types/models'
import { OperationalStatusChip } from '../shared/OperationalStatusChip'
import { PHASES, mapPhase, projectStatus, daysUntil } from './timelineUtils'
import { computeCriticalPath } from './criticalPath'
import { computeProjectPulse } from './projectPulse'

interface Props {
  projects: Project[]
  phases: StudioTimelinePhase[]
  timeline: TimelineItem[]
  projectApprovals: ApprovalRecord[]
  onProjectClick?: (project: Project) => void
}

export const StudioTimelineBoard = ({ projects, phases, timeline, projectApprovals, onProjectClick }: Props) => {
  const activeProjects = projects.filter((p) => p.status !== 'paused')

  const projectRows = activeProjects.map((project) => {
    const status = projectStatus(project)
    const projectPhases = phases.filter((p) => p.projectId === project.id)
    const currentPhase = mapPhase(project.phase ?? '')
    const currentIdx = PHASES.findIndex((p) => p.id === currentPhase)

    const openingPhase = projectPhases.find((p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete')
    const openingDays = openingPhase ? daysUntil(openingPhase.endDate) : null
    const isPastDue = openingDays !== null && openingDays < 0
    const isUrgent = openingDays !== null && openingDays >= 0 && openingDays <= 30
    const atRiskCount = timeline.filter((t) => t.projectId === project.id && t.state === 'at-risk').length
    const pulse = computeProjectPulse(project, phases, timeline, projectApprovals)

    return { project, status, currentPhase, currentIdx, openingPhase, openingDays, isPastDue, isUrgent, atRiskCount, projectPhases, pulse }
  })

  const lateOpenings = projectRows.filter((r) => r.isPastDue).sort((a, b) => (a.openingDays ?? 0) - (b.openingDays ?? 0))
  const urgentOpenings = projectRows.filter((r) => r.isUrgent).sort((a, b) => (a.openingDays ?? 0) - (b.openingDays ?? 0))
  const upcomingOpenings = projectRows.filter((r) => openingPhaseExists(r) && !r.isUrgent && !r.isPastDue).sort((a, b) => (a.openingDays ?? 999) - (b.openingDays ?? 999))
  const noDateProjects = projectRows.filter((r) => !openingPhaseExists(r))

  function openingPhaseExists(r: typeof projectRows[number]): boolean {
    return r.openingDays !== null
  }

  if (activeProjects.length === 0) {
    return (
      <section className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-6 text-center">
        <p className="font-semibold text-[var(--bb-text-muted)]">No active studio timeline yet.</p>
        <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Connect projects or add project dates to see the timeline board.</p>
      </section>
    )
  }

  return (
    <section className="os-card-primary">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Studio Timeline</p>
          <h3>Project Roadmap</h3>
          <p className="text-xs text-[var(--bb-text-soft)]">Phase progress, opening pressure, and pulse score. Click any row to open context.</p>
        </div>
        <div className="flex gap-2">
          <span className="pill">{activeProjects.length} active</span>
          {lateOpenings.length > 0 && <span className="pill text-red">{lateOpenings.length} late</span>}
          {urgentOpenings.length > 0 && <span className="pill text-[var(--bb-amber)]">{urgentOpenings.length} urgent</span>}
        </div>
      </div>

      {/* Phase legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-[10px] text-[var(--bb-text-faint)]">
        {PHASES.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${p.color}`} />
            {p.label}
          </span>
        ))}
      </div>

      {/* Late openings */}
      {lateOpenings.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-red">Overdue</p>
          <div className="space-y-1.5">
            {lateOpenings.map((r) => renderRow(r, true))}
          </div>
        </div>
      )}

      {/* Urgent openings */}
      {urgentOpenings.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-amber)]">Opening Soon</p>
          <div className="space-y-1.5">
            {urgentOpenings.map((r) => renderRow(r, false))}
          </div>
        </div>
      )}

      {/* Upcoming openings */}
      {upcomingOpenings.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Upcoming</p>
          <div className="space-y-1.5">
            {upcomingOpenings.map((r) => renderRow(r, false))}
          </div>
        </div>
      )}

      {/* No date projects */}
      {noDateProjects.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Active Projects</p>
          <div className="space-y-1.5">
            {noDateProjects.map((r) => renderRow(r, false))}
          </div>
        </div>
      )}
    </section>
  )

  function renderRow(r: typeof projectRows[number], isLate: boolean) {
    const { project, status, currentPhase, currentIdx, openingDays, atRiskCount, pulse } = r
    const cp = computeCriticalPath(project, phases, timeline, projectApprovals)

    const completionPct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / PHASES.length) * 100) : 0

    return (
      <div key={project.id} className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-3 transition hover:bg-black/[0.04] md:flex-row md:items-center md:gap-4 ${isLate ? 'border-red/20 bg-red/[0.03]' : 'border-black/[0.04] bg-white/50'}`} onClick={() => onProjectClick?.(project)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' && onProjectClick) onProjectClick(project) }}>
        {/* Status + Name */}
        <div className="flex min-w-0 items-center gap-2.5 md:w-52">
          <OperationalStatusChip status={status} size="sm" showIcon />
          <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none ${
            pulse.band === 'risk' ? 'bg-red/10 text-red' :
            pulse.band === 'watch' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' :
            'bg-[var(--bb-green)]/10 text-[var(--bb-green)]'
          }`}>{pulse.score}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{project.name}</p>
            <p className="truncate text-[10px] text-[var(--bb-text-muted)]">{project.location ?? ''}{project.client ? ` / ${project.client}` : ''}</p>
          </div>
        </div>

        {/* Phase bar */}
        <div className="flex flex-1 items-center gap-2">
          <div className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full bg-black/[0.04]">
            {PHASES.map((ph, i) => {
              const isCurrent = ph.id === currentPhase
              const isPast = currentIdx >= 0 && i < currentIdx
              const color = isPast ? ph.color : isCurrent ? ph.color : 'bg-black/[0.06]'
              return (
                <span
                  key={ph.id}
                  className={`inline-block h-full flex-1 transition-all ${color} ${isCurrent ? 'shadow-sm' : ''}`}
                  title={`${ph.label}${isCurrent ? ' (current)' : ''}`}
                />
              )
            })}
          </div>
          <span className="shrink-0 text-[10px] font-medium text-[var(--bb-text-muted)]">{currentPhase}</span>
          <span className="hidden shrink-0 text-[10px] text-[var(--bb-text-faint)] md:inline">{completionPct}%</span>
        </div>

        {/* Risk + Days + Opening */}
        <div className="flex shrink-0 items-center gap-3 md:w-56 md:justify-end">
          <div className="min-w-0 text-right">
            <p className={`truncate text-[10px] font-medium ${cp.severity === 'risk' ? 'text-red' : cp.severity === 'watch' ? 'text-[var(--bb-amber)]' : 'text-[var(--bb-text-faint)]'}`}>{cp.label}</p>
          </div>
          {atRiskCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-semibold text-red">
              {atRiskCount} risk
            </span>
          )}
          {openingDays !== null && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isLate ? 'bg-red/10 text-red' : openingDays <= 30 ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' : openingDays <= 90 ? 'bg-black/[0.04] text-[var(--bb-text-muted)]' : 'bg-black/[0.03] text-[var(--bb-text-faint)]'
            }`}>
              {isLate ? `Overdue ${Math.abs(openingDays)}d` : `${openingDays}d`}
            </span>
          )}
        </div>
      </div>
    )
  }
}
