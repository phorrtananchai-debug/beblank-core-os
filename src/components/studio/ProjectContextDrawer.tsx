import type { Project, StudioTimelinePhase, TimelineItem, Task, ApprovalRecord } from '../../types/models'
import { OperationalStatusChip } from '../shared/OperationalStatusChip'
import { mapPhase, PHASES, daysUntil, projectStatus } from './timelineUtils'
import { computeCriticalPath } from './criticalPath'
import { computeProjectPulse } from './projectPulse'

interface Props {
  project: Project | null
  phases: StudioTimelinePhase[]
  timeline: TimelineItem[]
  tasks: Task[]
  projectApprovals: ApprovalRecord[]
  onClose: () => void
}

export const ProjectContextDrawer = ({ project, phases, timeline, tasks, projectApprovals, onClose }: Props) => {
  if (!project) return null

  const status = projectStatus(project)
  const projectPhases = phases.filter((p) => p.projectId === project.id)
  const currentPhaseId = mapPhase(project.phase ?? '')
  const currentIdx = PHASES.findIndex((p) => p.id === currentPhaseId)

  const openingPhase = projectPhases.find((p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete')
  const openingDays = openingPhase ? daysUntil(openingPhase.endDate) : null
  const isLate = openingDays !== null && openingDays < 0
  const isUrgent = openingDays !== null && openingDays >= 0 && openingDays <= 30

  const atRiskTimeline = timeline.filter((t) => t.projectId === project.id && t.state === 'at-risk')
  const activeTimeline = timeline.filter((t) => t.projectId === project.id && t.state !== 'completed')
  const projectTasks = tasks.filter((t) => t.projectId === project.id)
  const pendingTasks = projectTasks.filter((t) => t.status !== 'done')
  const blockedPhases = projectPhases.filter((p) => p.status === 'blocked')
  const criticalPath = computeCriticalPath(project, phases, timeline, projectApprovals)
  const pulse = computeProjectPulse(project, phases, timeline, projectApprovals)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header section */}
      <div className="border-b border-black/[0.05] px-6 py-5">
        <div className="mb-1 flex items-center gap-2">
          <OperationalStatusChip status={status} size="sm" showIcon />
          <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none ${
            pulse.band === 'risk' ? 'bg-red/10 text-red' :
            pulse.band === 'watch' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' :
            'bg-[var(--bb-green)]/10 text-[var(--bb-green)]'
          }`}>{pulse.score}</span>
          {project.location && <span className="text-xs text-[var(--bb-text-muted)]">{project.location}</span>}
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">{project.name}</h2>
        {project.client && <p className="mt-1 text-sm text-[var(--bb-text-muted)]">Client: {project.client}</p>}
        {project.owner && <p className="text-xs text-[var(--bb-text-faint)]">Owner: {project.owner}</p>}
      </div>

      <div className="flex-1 space-y-5 px-6 py-5">
        {/* Phase + Opening pressure */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Current Phase</p>
            <p className="mt-1 text-lg font-bold capitalize">{currentPhaseId}</p>
            {currentIdx >= 0 && (
              <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-black/[0.04]">
                {PHASES.map((ph, i) => {
                  const isCur = ph.id === currentPhaseId
                  const isPast = currentIdx >= 0 && i < currentIdx
                  return <span key={ph.id} className={`inline-block h-full flex-1 transition-all ${isPast ? ph.color : isCur ? ph.color : 'bg-black/[0.06]'}`} />
                })}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Opening</p>
            {openingDays !== null ? (
              <>
                <p className={`mt-1 text-lg font-bold ${isLate ? 'text-red' : isUrgent ? 'text-[var(--bb-amber)]' : ''}`}>
                  {isLate ? `${Math.abs(openingDays)}d overdue` : `${openingDays}d`}
                </p>
                <p className="text-[10px] text-[var(--bb-text-muted)]">{openingPhase?.endDate ?? ''}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[var(--bb-text-faint)]">No date set</p>
            )}
          </div>
        </div>

        {/* Operational Notes */}
        {project.operationalNotes && (
          <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--bb-text-soft)]">{project.operationalNotes}</p>
          </div>
        )}

        {/* Risks / Blockers */}
        {(atRiskTimeline.length > 0 || blockedPhases.length > 0) && (
          <div className="rounded-xl border border-red/10 bg-red/[0.03] p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-red">Risks & Blockers</p>
            <div className="mt-2 space-y-1.5">
              {atRiskTimeline.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                  <span>{t.label}</span>
                </div>
              ))}
              {blockedPhases.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                  <span>Blocked: {p.phase} phase</span>
                  {p.notes && <span className="text-xs text-[var(--bb-text-muted)]">— {p.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pulse score drivers */}
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Project Pulse</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center justify-center h-8 w-12 rounded-lg font-mono text-sm font-bold ${
              pulse.band === 'risk' ? 'bg-red/10 text-red' :
              pulse.band === 'watch' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' :
              'bg-[var(--bb-green)]/10 text-[var(--bb-green)]'
            }`}>{pulse.score}</span>
            <div className="text-xs text-[var(--bb-text-muted)]">
              {pulse.drivers.length > 0 ? pulse.drivers.join(' · ') : 'No issues detected'}
            </div>
          </div>
        </div>

        {/* Critical Path */}
        <div className="rounded-xl border border-black/[0.04] bg-white/60 p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Critical Path</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${criticalPath.severity === 'risk' ? 'bg-red' : criticalPath.severity === 'watch' ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-green)]'}`} />
            <div>
              <p className="text-sm font-semibold">{criticalPath.label}</p>
              <p className="text-xs text-[var(--bb-text-muted)]">{criticalPath.reason}</p>
              {criticalPath.dueDate && <p className="text-[10px] text-[var(--bb-text-faint)]">Due: {criticalPath.dueDate}</p>}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {activeTimeline.length > 0 && (
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Timeline</p>
            <div className="mt-2 space-y-1.5">
              {activeTimeline.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-black/[0.04] bg-white/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${t.state === 'at-risk' ? 'bg-red' : t.state === 'planned' ? 'bg-[var(--bb-amber)]' : 'bg-[var(--bb-green)]'}`} />
                    <span className="text-sm">{t.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--bb-text-muted)]">{t.dueDate}</span>
                    {t.state === 'at-risk' && <span className="rounded bg-red/10 px-1.5 py-0.5 text-[9px] font-semibold text-red">at risk</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase details */}
        {projectPhases.length > 0 && (
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Phases</p>
            <div className="mt-2 space-y-1">
              {projectPhases.map((ph) => (
                <div key={ph.id} className="flex items-center justify-between rounded-lg border border-black/[0.04] bg-white/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${ph.status === 'complete' ? 'bg-[var(--bb-green)]' : ph.status === 'blocked' ? 'bg-red' : ph.status === 'active' ? 'bg-[var(--bb-amber)]' : 'bg-black/[0.12]'}`} />
                    <span className="text-sm capitalize">{ph.phase}</span>
                  </div>
                  <span className="text-[10px] text-[var(--bb-text-muted)]">{ph.startDate} → {ph.endDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Tasks ({pendingTasks.length})</p>
            <div className="mt-2 space-y-1">
              {pendingTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-2 text-sm">
                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${t.status === 'doing' ? 'bg-[var(--bb-amber)]' : 'bg-black/[0.12]'}`} />
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending approvals */}
        {(() => {
          const projectApprovalsFiltered = projectApprovals.filter((a) => a.projectId === project.id)
          return (
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Approvals ({projectApprovalsFiltered.length})</p>
              {projectApprovalsFiltered.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {projectApprovalsFiltered.map((a) => (
                    <div key={a.id} className="rounded-lg border border-black/[0.04] bg-white/50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          a.status === 'approved' ? 'bg-[var(--bb-green)]/10 text-[var(--bb-green)]' :
                          a.status === 'rejected' ? 'bg-red/10 text-red' :
                          a.status === 'cancelled' ? 'bg-black/[0.05] text-[var(--bb-text-muted)]' :
                          'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]'
                        }`}>{a.status}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--bb-text-muted)]">
                        {a.owner && <span>Owner: {a.owner}</span>}
                        {a.dueDate && <span>Due: {a.dueDate}</span>}
                        {a.requestedBy && <span>Requested by: {a.requestedBy}</span>}
                      </div>
                      {a.notes && <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">{a.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-dashed border-black/[0.06] bg-white/30 p-3 text-center">
                  <p className="text-[10px] text-[var(--bb-text-faint)]">No pending approvals for this project.</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Activity placeholder */}
        <div className="rounded-xl border border-dashed border-black/[0.06] bg-white/30 p-4 text-center">
          <p className="text-xs font-semibold text-[var(--bb-text-muted)]">Recent Activity</p>
          <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">Activity feed coming soon.</p>
        </div>
      </div>

      {/* Close button */}
      <div className="border-t border-black/[0.05] px-6 py-4">
        <button className="btn-secondary w-full" type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
