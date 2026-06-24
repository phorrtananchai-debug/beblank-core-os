import type { StudioBillingGate, StudioInspection, StudioMilestone, StudioProject, StudioRisk, StudioTask } from '../../types/models'

export const STUDIO_SAMPLE_DATE = '2026-06-25'
export const STUDIO_SAMPLE_WEEK_END = '2026-06-30'

const dateKey = (value: string) => value.slice(0, 10)

export const formatStudioDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(value.includes('T') ? value : `${value}T00:00:00.000Z`))

export const formatStudioDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export const projectTone = (health: StudioProject['projectHealth']) =>
  health === 'risk' ? 'red' : health === 'watch' ? 'amber' : 'green'

export const priorityTone = (priority: StudioProject['priority'] | StudioTask['priority']) =>
  priority === 'high' ? 'red' : priority === 'medium' ? 'amber' : 'green'

export const gateTone = (gate: StudioBillingGate) =>
  gate.status === 'blocked' ? 'red' : gate.status === 'ready' || gate.status === 'submitted' ? 'amber' : gate.status === 'paid' ? 'green' : 'neutral'

export const riskTone = (risk: StudioRisk['severity'] | StudioInspection['status'] | StudioMilestone['status'] | StudioTask['status']) =>
  risk === 'high' || risk === 'blocked' ? 'red' : risk === 'medium' || risk === 'active' || risk === 'doing' || risk === 'scheduled' ? 'amber' : 'green'

export const statusLabel = (value: string) => value.replace(/-/g, ' ')

export const byDateAsc = (a: string, b: string) => a.localeCompare(b)

export const projectById = (projects: StudioProject[], projectId: string) => projects.find((project) => project.id === projectId)

export const tasksByProject = (tasks: StudioTask[], projectId: string) => tasks.filter((task) => task.projectId === projectId)

export const milestonesByProject = (milestones: StudioMilestone[], projectId: string) => milestones.filter((milestone) => milestone.projectId === projectId)

export const gatesByProject = (gates: StudioBillingGate[], projectId: string) => gates.filter((gate) => gate.projectId === projectId)

export const inspectionsByProject = (inspections: StudioInspection[], projectId: string) => inspections.filter((inspection) => inspection.projectId === projectId)

export const risksByProject = (risks: StudioRisk[], projectId: string) => risks.filter((risk) => risk.projectId === projectId)

export const isStudioTodayDate = (value: string) => dateKey(value) === STUDIO_SAMPLE_DATE

export const isStudioThisWeekDate = (value: string) => {
  const key = dateKey(value)
  return key >= STUDIO_SAMPLE_DATE && key <= STUDIO_SAMPLE_WEEK_END
}

export const isStudioTodayTask = (task: StudioTask) =>
  isStudioTodayDate(task.startDate) ||
  isStudioTodayDate(task.endDate) ||
  task.timelineSlot.toLowerCase().includes('today')

export const isStudioThisWeekTask = (task: StudioTask) =>
  isStudioThisWeekDate(task.startDate) ||
  isStudioThisWeekDate(task.endDate) ||
  task.timelineSlot.toLowerCase().includes('this week') ||
  task.timelineSlot.toLowerCase().includes('tomorrow') ||
  task.timelineSlot.toLowerCase().includes('wed') ||
  task.timelineSlot.toLowerCase().includes('thu') ||
  task.timelineSlot.toLowerCase().includes('fri')

export const isStudioUpcomingInspection = (inspection: StudioInspection) => dateKey(inspection.scheduledAt) > STUDIO_SAMPLE_DATE
