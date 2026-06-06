import type { Project, StudioTimelinePhase, TimelineItem, ApprovalRecord } from '../../types/models'
import { mapPhase } from './timelineUtils'

export interface CriticalPathItem {
  projectId: string
  label: string
  reason: string
  severity: 'healthy' | 'watch' | 'risk'
  dueDate?: string
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function computeCriticalPath(
  project: Project,
  phases: StudioTimelinePhase[],
  timeline: TimelineItem[],
  projectApprovals: ApprovalRecord[],
): CriticalPathItem {
  const projectPhases = phases.filter((p) => p.projectId === project.id)
  const projectTimeline = timeline.filter((t) => t.projectId === project.id)
  const pendingProjectApprovals = projectApprovals.filter(
    (a) => a.projectId === project.id && (a.status === 'submitted' || a.status === 'waiting'),
  )

  // 1. Blocked phase
  const blockedPhase = projectPhases.find((p) => p.status === 'blocked')
  if (blockedPhase) {
    return {
      projectId: project.id,
      label: `Blocked: ${blockedPhase.phase} phase`,
      reason: blockedPhase.notes || 'Phase is blocked',
      severity: 'risk',
      dueDate: blockedPhase.endDate,
    }
  }

  // 2. At-risk timeline item
  const atRisk = projectTimeline.find((t) => t.state === 'at-risk')
  if (atRisk) {
    return {
      projectId: project.id,
      label: atRisk.label,
      reason: 'At-risk timeline item',
      severity: 'risk',
      dueDate: atRisk.dueDate,
    }
  }

  // 3. Overdue opening
  const openingPhase = projectPhases.find(
    (p) => (p.phase === 'handover' || p.phase === 'opening') && p.status !== 'complete',
  )
  if (openingPhase && daysUntil(openingPhase.endDate) < 0) {
    return {
      projectId: project.id,
      label: 'Opening overdue',
      reason: `Past due by ${Math.abs(daysUntil(openingPhase.endDate))} days`,
      severity: 'risk',
      dueDate: openingPhase.endDate,
    }
  }

  // 4. Pending approval
  if (pendingProjectApprovals.length > 0) {
    return {
      projectId: project.id,
      label: `${pendingProjectApprovals.length} pending approval${pendingProjectApprovals.length > 1 ? 's' : ''}`,
      reason: pendingProjectApprovals[0].title.slice(0, 60),
      severity: 'watch',
    }
  }

  // 5. Deadline within 7 days
  const nearDeadline = projectTimeline.find((t) => {
    const d = daysUntil(t.dueDate)
    return d >= 0 && d <= 7 && t.state !== 'completed'
  })
  if (nearDeadline) {
    return {
      projectId: project.id,
      label: `Deadline: ${nearDeadline.label}`,
      reason: `Due ${nearDeadline.dueDate}`,
      severity: 'watch',
      dueDate: nearDeadline.dueDate,
    }
  }

  // 6. Opening within 30 days
  if (openingPhase && daysUntil(openingPhase.endDate) >= 0 && daysUntil(openingPhase.endDate) <= 30) {
    return {
      projectId: project.id,
      label: 'Opening approaching',
      reason: `${daysUntil(openingPhase.endDate)} days remaining`,
      severity: 'watch',
      dueDate: openingPhase.endDate,
    }
  }

  // 7. Missing opening date or phase data — healthy fallback
  const currentPhase = mapPhase(project.phase ?? '')
  if (!openingPhase && currentPhase === 'brief') {
    return {
      projectId: project.id,
      label: 'No opening date set',
      reason: 'Project in early phase — set target opening',
      severity: 'watch',
    }
  }

  return {
    projectId: project.id,
    label: 'On track',
    reason: project.phase ? `Phase: ${currentPhase}` : 'No blockers detected',
    severity: 'healthy',
  }
}
