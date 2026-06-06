import type { Project, StudioTimelinePhase, TimelineItem } from '../../types/models'
import { OperationalStatusChip } from '../shared/OperationalStatusChip'

interface Props {
  projects: Project[]
  phases: StudioTimelinePhase[]
  timeline: TimelineItem[]
}

const PHASE_ORDER = ['feasibility', 'concept', 'schematic', 'design', 'review', 'approval', 'construction', 'handover', 'operations']

const PHASE_COLORS: Record<string, string> = {
  feasibility: 'bg-black/[0.2]',
  concept: 'bg-sky-200',
  schematic: 'bg-[var(--bb-accent)]/40',
  design: 'bg-[var(--bb-accent)]',
  review: 'bg-[var(--bb-amber)]',
  approval: 'bg-[var(--bb-amber)]/70',
  construction: 'bg-[var(--bb-green)]',
  handover: 'bg-[var(--bb-green)]/70',
  operations: 'bg-black/[0.15]',
}

function mapPhase(phase: string): string {
  const p = phase.toLowerCase()
  if (p.includes('feasibility') || p.includes('feas')) return 'feasibility'
  if (p.includes('concept') || p.includes('schematic')) return p.includes('concept') ? 'concept' : 'schematic'
  if (p.includes('design') || p.includes('dd') || p.includes('drawing')) return 'design'
  if (p.includes('review') || p.includes('approval') || p.includes('permit')) return 'review'
  if (p.includes('procurement') || p.includes('bid') || p.includes('buyout')) return 'construction'
  if (p.includes('construction') || p.includes('site') || p.includes('build')) return 'construction'
  if (p.includes('handover') || p.includes('hand-off') || p.includes('opening')) return 'handover'
  if (p.includes('operations') || p.includes('ops') || p.includes('complete')) return 'operations'
  return 'design'
}

function projectStatus(project: Project): import('../../core/status/status').OperationalStatus {
  if (project.timelineStatus === 'at-risk') return 'atRisk'
  if (project.timelineStatus === 'watch') return 'watch'
  if (project.status === 'paused') return 'blocked'
  return 'healthy'
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export const StudioTimelineBoard = ({ projects, phases, timeline }: Props) => {
  const activeProjects = projects.filter((p) => p.status !== 'paused')
  const atRiskCount = timeline.filter((t) => t.state === 'at-risk').length
  const upcomingOpenings = phases.filter((p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete')
  const completedCount = projects.filter((p) => p.status === 'planning').length + timeline.filter((t) => t.state === 'completed').length
  const openingSoon = upcomingOpenings.filter((p) => {
    const days = daysUntil(p.endDate)
    return days >= 0 && days <= 30
  })
  const lateOpenings = upcomingOpenings.filter((p) => daysUntil(p.endDate) < 0)

  if (activeProjects.length === 0) {
    return (
      <section className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-6 text-center">
        <p className="font-semibold text-[var(--bb-text-muted)]">No active studio timeline yet.</p>
        <p className="mt-1 text-xs text-[var(--bb-text-faint)]">Connect projects or add project dates to see the timeline board.</p>
      </section>
    )
  }

  return (
    <section className="os-card-primary">
      <div className="panel-header">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">STUDIO TIMELINE BOARD</p>
          <h3>Project Roadmap</h3>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] px-3 py-1 text-[11px] font-medium">{activeProjects.length} active</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${atRiskCount > 0 ? 'border-red/20 bg-red/5 text-red' : 'border-black/[0.06] bg-black/[0.03] text-[var(--bb-text-muted)]'}`}>{atRiskCount} at risk</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${openingSoon.length > 0 ? 'border-[var(--bb-amber)]/20 bg-[var(--bb-amber)]/5 text-[var(--bb-amber)]' : 'border-black/[0.06] bg-black/[0.03] text-[var(--bb-text-muted)]'}`}>{openingSoon.length > 0 ? `${openingSoon.length} opening soon` : 'No upcoming openings'}</span>
        {completedCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] px-3 py-1 text-[11px] font-medium">{completedCount} completed</span>}
      </div>

      {/* Phase legend */}
      <div className="mb-4 flex flex-wrap gap-2 text-[10px] text-[var(--bb-text-faint)]">
        {PHASE_ORDER.filter((p) => p !== 'operations').map((phase) => (
          <span key={phase} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${PHASE_COLORS[phase] ?? 'bg-black/[0.12]'}`} />
            {phase}
          </span>
        ))}
      </div>

      {/* Project rows */}
      <div className="space-y-2">
        {activeProjects.map((project) => {
          const status = projectStatus(project)
          const projectPhases = phases.filter((p) => p.projectId === project.id)
          const currentPhase = mapPhase(project.phase ?? '')
          const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase)
          const nearestMilestone = timeline.find((t) => t.projectId === project.id)
          const openingPhase = projectPhases.find((p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete')
          const openingDays = openingPhase ? daysUntil(openingPhase.endDate) : null
          const isLate = lateOpenings.some((p) => projectPhases.includes(p))

          return (
            <div key={project.id} className="flex flex-col gap-2 rounded-2xl border border-black/[0.05] bg-white/50 p-3 md:flex-row md:items-center md:gap-4">
              {/* Status + Name */}
              <div className="flex min-w-0 items-center gap-3 md:w-56">
                <OperationalStatusChip status={status} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{project.name}</p>
                  {project.location && <p className="truncate text-[10px] text-[var(--bb-text-muted)]">{project.client ?? ''} {project.client ? '/' : ''} {project.location}</p>}
                </div>
              </div>

              {/* Phase bar */}
              <div className="flex flex-1 items-center gap-2">
                <div className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full bg-black/[0.04]">
                  {PHASE_ORDER.map((phase, i) => {
                    const isCurrent = phase === currentPhase
                    const isPast = currentPhaseIndex >= 0 && i < currentPhaseIndex
                    const color = isPast ? PHASE_COLORS[phase] : isCurrent ? PHASE_COLORS[phase] : 'bg-black/[0.06]'
                    return (
                      <span
                        key={phase}
                        className={`inline-block h-full flex-1 transition-all ${color} ${isCurrent ? 'shadow-sm' : ''}`}
                        title={`${phase}${isCurrent ? ' (current)' : ''}`}
                      />
                    )
                  })}
                </div>
                <span className="shrink-0 text-[10px] font-medium text-[var(--bb-text-muted)]">{currentPhase}</span>
              </div>

              {/* Milestone / Opening */}
              <div className="flex shrink-0 items-center gap-2 md:w-36 md:justify-end">
                {openingDays !== null && openingDays <= 90 && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isLate ? 'bg-red/10 text-red' : openingDays <= 30 ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' : 'bg-black/[0.04] text-[var(--bb-text-muted)]'
                  }`}>
                    {isLate ? `Late ${Math.abs(openingDays)}d` : openingDays <= 30 ? `${openingDays}d` : `${openingDays}d`}
                  </span>
                )}
                {nearestMilestone && (
                  <span className="text-[10px] text-[var(--bb-text-faint)]">{nearestMilestone.dueDate}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
