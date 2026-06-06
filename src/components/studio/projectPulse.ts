import type { Project, StudioTimelinePhase, TimelineItem, ApprovalRecord } from '../../types/models'
import { mapPhase, PHASES } from './timelineUtils'
import { computeCriticalPath } from './criticalPath'

export interface ProjectPulse {
  score: number
  band: 'healthy' | 'watch' | 'risk'
  drivers: string[]
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function computeProjectPulse(
  project: Project,
  phases: StudioTimelinePhase[],
  timeline: TimelineItem[],
  projectApprovals: ApprovalRecord[],
): ProjectPulse {
  let score = 100
  const drivers: string[] = []

  const cp = computeCriticalPath(project, phases, timeline, projectApprovals)
  const projectPhases = phases.filter((p) => p.projectId === project.id)
  const projectTimeline = timeline.filter((t) => t.projectId === project.id)

  // 1. Critical path severity
  if (cp.severity === 'risk') { score -= 30; drivers.push('Critical blocker') }
  else if (cp.severity === 'watch') { score -= 15; drivers.push('Needs attention') }

  // 2. Timeline status
  if (project.timelineStatus === 'at-risk') { score -= 20; drivers.push('Project at risk') }
  else if (project.timelineStatus === 'watch') { score -= 10; drivers.push('Project under watch') }

  // 3. Overdue opening
  const openingPhase = projectPhases.find((p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete')
  if (openingPhase && daysUntil(openingPhase.endDate) < 0) { score -= 25; drivers.push('Opening overdue') }

  // 4. At-risk timeline items
  const atRiskCount = projectTimeline.filter((t) => t.state === 'at-risk').length
  if (atRiskCount > 0) {
    const penalty = Math.min(atRiskCount * 10, 20)
    score -= penalty
    drivers.push(`${atRiskCount} at-risk item${atRiskCount > 1 ? 's' : ''}`)
  }

  // 5. Blocked phases
  const blockedCount = projectPhases.filter((p) => p.status === 'blocked').length
  if (blockedCount > 0) {
    const penalty = Math.min(blockedCount * 20, 20)
    score -= penalty
    drivers.push(`${blockedCount} blocked phase${blockedCount > 1 ? 's' : ''}`)
  }

  // 6. Pending approvals
  const pendingApprovalCount = projectApprovals.filter(
    (a) => a.projectId === project.id && (a.status === 'submitted' || a.status === 'waiting'),
  ).length
  if (pendingApprovalCount > 0) {
    const penalty = Math.min(pendingApprovalCount * 5, 15)
    score -= penalty
    drivers.push(`${pendingApprovalCount} pending approval${pendingApprovalCount > 1 ? 's' : ''}`)
  }

  // 7. Missing opening date
  const hasOpeningDate = projectPhases.some((p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete')
  const currentPhaseId = mapPhase(project.phase ?? '')
  if (!hasOpeningDate && currentPhaseId !== 'brief' && project.status !== 'paused') {
    score -= 10
    drivers.push('No opening date set')
  }

  // 8. Phase progress bonus
  const currentIdx = PHASES.findIndex((p) => p.id === currentPhaseId)
  if (currentIdx >= 0) {
    const progress = ((currentIdx + 1) / PHASES.length) * 100
    const bonus = Math.min(Math.round(progress / 10), 15)
    score += bonus
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score))

  const band: ProjectPulse['band'] = score >= 80 ? 'healthy' : score >= 60 ? 'watch' : 'risk'

  return { score, band, drivers }
}
