import type { Project, StudioTimelinePhase, TimelineItem, ActionRequest, ApprovalRecord } from '../../types/models'
import { computeCriticalPath } from './criticalPath'
import type { CriticalPathItem } from './criticalPath'

interface Props {
  projects: Project[]
  phases: StudioTimelinePhase[]
  timeline: TimelineItem[]
  pendingApprovals: ActionRequest[]
  projectApprovals: ApprovalRecord[]
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const SectionCard = ({ label, children, color }: { label: string; children: React.ReactNode; color?: string }) => (
  <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
    <p className={`font-mono text-[9px] font-semibold uppercase tracking-[0.1em] ${color ?? 'text-[var(--bb-text-muted)]'}`}>{label}</p>
    <div className="mt-2 space-y-1.5">{children}</div>
  </div>
)

const EmptyRow = ({ text }: { text: string }) => (
  <p className="text-[10px] text-[var(--bb-text-faint)]">{text}</p>
)

interface ScoredItem {
  id: string
  label: string
  detail: string
  severity: number
}

export const OperatingRhythm = ({ projects, phases, timeline, pendingApprovals, projectApprovals }: Props) => {
  const activePhases = phases.filter((p) => p.projectId !== '')

  // Needs Attention Today — severity weight: risk=100, watch=50, overdue=90
  const needsAttention: ScoredItem[] = []
  for (const phase of activePhases) {
    if (phase.status === 'blocked') {
      const proj = projects.find((p) => p.id === phase.projectId)
      needsAttention.push({
        id: `blocked-${phase.id}`,
        label: `${proj?.name ?? 'Project'} — ${phase.phase} blocked`,
        detail: phase.notes || 'No details',
        severity: 100,
      })
    }
    if ((phase.phase === 'handover' || phase.phase === 'opening') && daysUntil(phase.endDate) < 0) {
      const proj = projects.find((p) => p.id === phase.projectId)
      needsAttention.push({
        id: `overdue-${phase.id}`,
        label: `${proj?.name ?? 'Project'} opening overdue`,
        detail: `${Math.abs(daysUntil(phase.endDate))} days past ${phase.endDate}`,
        severity: 90,
      })
    }
  }
  for (const t of timeline) {
    if (t.state === 'at-risk') {
      const proj = projects.find((p) => p.id === t.projectId)
      needsAttention.push({
        id: `atrisk-${t.id}`,
        label: `${proj?.name ?? 'Project'} — ${t.label}`,
        detail: `Due ${t.dueDate}`,
        severity: 100,
      })
    }
  }
  for (const a of pendingApprovals) {
    needsAttention.push({
      id: `approval-${a.id}`,
      label: a.description.slice(0, 60),
      detail: a.actionType,
      severity: 80,
    })
  }
  for (const a of projectApprovals) {
    if (a.status === 'submitted' || a.status === 'waiting') {
      needsAttention.push({
        id: `project-approval-${a.id}`,
        label: a.title.slice(0, 60),
        detail: `${a.projectId} · ${a.status}`,
        severity: 80,
      })
    }
  }
  needsAttention.sort((a, b) => b.severity - a.severity)

  // Upcoming This Week — deadlines within 7d, openings within 14d
  const upcoming: ScoredItem[] = []
  for (const t of timeline) {
    const d = daysUntil(t.dueDate)
    if (d >= 0 && d <= 7 && t.state !== 'completed') {
      const proj = projects.find((p) => p.id === t.projectId)
      upcoming.push({
        id: `deadline-${t.id}`,
        label: `${proj?.name ?? 'Project'} — ${t.label}`,
        detail: `Due ${t.dueDate} (${d}d)`,
        severity: 70 - d,
      })
    }
  }
  for (const phase of activePhases) {
    const d = daysUntil(phase.endDate)
    if ((phase.phase === 'handover' || phase.phase === 'opening') && d >= 0 && d <= 14) {
      const proj = projects.find((p) => p.id === phase.projectId)
      upcoming.push({
        id: `opening-${phase.id}`,
        label: `${proj?.name ?? 'Project'} opening ${d}d`,
        detail: `Target ${phase.endDate}`,
        severity: 60 - d,
      })
    }
  }
  upcoming.sort((a, b) => b.severity - a.severity)

  // Executive Focus — top 3 from critical path, non-healthy only
  const criticalPaths: CriticalPathItem[] = projects
    .filter((p) => p.status !== 'paused')
    .map((p) => computeCriticalPath(p, phases, timeline, projectApprovals))
    .filter((cp) => cp.severity !== 'healthy')
  const severityRank = { risk: 100, watch: 50, healthy: 0 }
  criticalPaths.sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
  const top3 = criticalPaths.slice(0, 3)

  // Watch List — watch/at-risk projects + missing schedule
  const watchList = projects
    .filter((p) => p.timelineStatus === 'watch' || p.timelineStatus === 'at-risk')
    .map((p) => ({
      id: p.id,
      label: `${p.name} — ${p.timelineStatus === 'at-risk' ? 'at risk' : 'watch'}`,
      detail: p.operationalNotes?.slice(0, 60) ?? '',
      severity: p.timelineStatus === 'at-risk' ? 100 : 50,
    }))
  const missingSchedule = projects
    .filter((p) => {
      const hasOpening = phases.some((ph) => (ph.phase === 'handover' || ph.phase === 'opening') && ph.projectId === p.id)
      return p.status !== 'paused' && !hasOpening
    })
    .map((p) => ({
      id: `no-schedule-${p.id}`,
      label: `${p.name} — needs schedule`,
      detail: 'No opening date set',
      severity: 30,
    }))
  watchList.push(...missingSchedule)
  watchList.sort((a, b) => b.severity - a.severity)

  // Positive Momentum — completed milestones + approvals
  const momentum: ScoredItem[] = []
  for (const t of timeline) {
    if (t.state === 'completed') {
      const proj = projects.find((p) => p.id === t.projectId)
      momentum.push({
        id: `done-${t.id}`,
        label: `${proj?.name ?? 'Project'} — ${t.label}`,
        detail: 'Completed',
        severity: 10,
      })
    }
  }
  for (const phase of activePhases) {
    if (phase.status === 'complete' || phase.status === 'reviewed') {
      const proj = projects.find((p) => p.id === phase.projectId)
      momentum.push({
        id: `phase-done-${phase.id}`,
        label: `${proj?.name ?? 'Project'} — ${phase.phase} phase ${phase.status}`,
        detail: `${phase.startDate} → ${phase.endDate}`,
        severity: 10,
      })
    }
  }
  momentum.sort((a, b) => b.severity - a.severity)

  const hasAnyContent = needsAttention.length > 0 || upcoming.length > 0 || top3.length > 0 || watchList.length > 0 || momentum.length > 0
  if (!hasAnyContent) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Operating Rhythm</p>
        <span className="text-[10px] text-[var(--bb-text-faint)]">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Needs Attention Today */}
        <SectionCard label="Needs Attention Today" color="text-red/80">
          {needsAttention.length > 0 ? needsAttention.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
              <div className="min-w-0">
                <p className="truncate font-medium">{item.label}</p>
                <p className="truncate text-[10px] text-[var(--bb-text-muted)]">{item.detail}</p>
              </div>
            </div>
          )) : <EmptyRow text="No urgent items today" />}
        </SectionCard>

        {/* Upcoming This Week */}
        <SectionCard label="Upcoming This Week" color="text-[var(--bb-amber)]/80">
          {upcoming.length > 0 ? upcoming.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bb-amber)]" />
              <div className="min-w-0">
                <p className="truncate font-medium">{item.label}</p>
                <p className="truncate text-[10px] text-[var(--bb-text-muted)]">{item.detail}</p>
              </div>
            </div>
          )) : <EmptyRow text="No upcoming items this week" />}
        </SectionCard>

        {/* Executive Focus */}
        <SectionCard label="Executive Focus" color="text-[var(--bb-text)]">
          {top3.length > 0 ? top3.map((cp, i) => (
            <div key={`${cp.projectId}-${i}`} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${cp.severity === 'risk' ? 'bg-red' : 'bg-[var(--bb-amber)]'}`} />
              <div className="min-w-0">
                <p className="truncate font-medium">{cp.label}</p>
                <p className="truncate text-[10px] text-[var(--bb-text-muted)]">{cp.reason}</p>
              </div>
            </div>
          )) : <EmptyRow text="No blocking items — all projects on track" />}
        </SectionCard>

        {/* Watch List */}
        <SectionCard label="Watch List" color="text-[var(--bb-amber)]/60">
          {watchList.length > 0 ? watchList.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bb-amber)]" />
              <div className="min-w-0">
                <p className="truncate font-medium">{item.label}</p>
                <p className="truncate text-[10px] text-[var(--bb-text-muted)]">{item.detail}</p>
              </div>
            </div>
          )) : <EmptyRow text="No projects under watch" />}
        </SectionCard>

        {/* Positive Momentum */}
        <SectionCard label="Positive Momentum" color="text-[var(--bb-green)]/70">
          {momentum.length > 0 ? momentum.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bb-green)]" />
              <div className="min-w-0">
                <p className="truncate font-medium">{item.label}</p>
                <p className="truncate text-[10px] text-[var(--bb-text-muted)]">{item.detail}</p>
              </div>
            </div>
          )) : <EmptyRow text="Complete milestones to build momentum" />}
        </SectionCard>
      </div>
    </section>
  )
}
