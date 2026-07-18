import type { OsData, StudioTask } from '../../types/models'
import { createKarunCkkSeed } from './karunCkkSeed.ts'
import type { ProjectTask, ProjectWorkspaceData } from './types'

const isoNow = () => new Date().toISOString()

export const adaptLegacyStudioProject = (projectId: string, data: OsData): ProjectWorkspaceData | null => {
  const project = data.studioProjects.find((item) => item.id === projectId || item.slug === projectId)
  if (!project) return null
  const now = isoNow()
  const workSections = Array.from(new Set(data.studioTasks.filter((task) => task.projectId === project.id).map((task) => task.trade))).map((name, index) => ({ id: `legacy-section-${index + 1}`, code: String(index + 1).padStart(2, '0'), name }))
  const tasks: ProjectTask[] = data.studioTasks.filter((task) => task.projectId === project.id).map((task) => ({
    id: task.id, projectId: project.id, createdAt: now, updatedAt: now, createdBy: task.owner, source: 'legacy-adapter', title: task.title, description: task.notes ?? task.trade, phase: task.processState, workSectionId: workSections.find((section) => section.name === task.trade)?.id, responsibleMemberId: `legacy-member-${task.owner}`, contractor: task.trade, plannedStart: task.startDate, plannedFinish: task.endDate, progress: task.progress, priority: task.priority === 'high' ? 'high' : task.priority, status: task.status === 'todo' ? 'ready' : task.status === 'doing' ? 'in-progress' : task.status, timeImpactDays: task.status === 'blocked' ? 1 : 0, costImpact: 0, dependencies: [], checklist: [], commentIds: [], assetIds: [], boqItemIds: [], siteReportIds: [], decisionIds: [], drawingReferenceIds: [],
  }))
  return {
    schemaVersion: 'project-workspace.v1',
    project: { id: project.id, slug: project.slug, code: project.id.toUpperCase(), name: project.name, client: project.client ?? 'Unspecified client', locationLabel: project.location ?? 'Unspecified location', summary: project.notes ?? project.taskTimeline ?? 'Legacy Studio project adapted to the Project Workspace model.', status: project.status === 'handover' ? 'handover' : project.status === 'paused' ? 'on-hold' : project.status, phase: project.phase, startDate: project.startDate, targetHandoverDate: project.endDate, plannedProgress: project.progress, actualProgress: project.progress, approvedBudget: 0, currency: 'THB', members: Array.from(new Set([project.owner, ...tasks.map((task) => task.createdBy)])).map((name) => ({ id: `legacy-member-${name}`, name, role: 'Legacy project member', responsibility: 'Imported from Studio records' })), locations: [{ id: 'legacy-location', name: project.location ?? 'Project site', kind: 'site' }], workSections, createdAt: now, updatedAt: now, source: 'legacy-adapter' },
    tasks, assets: [], siteReports: [], boqItems: [], decisions: [], risks: [], activities: [], assetRelationships: [],
  }
}

export const getInitialProjectWorkspace = (projectId: string, data: OsData) => ['sp-kcc-main', 'karun-central-khon-kaen', 'karun-central-khon-kaen-campus', 'karun-ckk'].includes(projectId) ? createKarunCkkSeed() : adaptLegacyStudioProject(projectId, data)

export const synchronizeProjectWorkspaceToOsData = (data: OsData, workspace: ProjectWorkspaceData): OsData => {
  const legacyProject = data.studioProjects.find((project) => project.id === workspace.project.id)
  if (!legacyProject) return data
  const sourceStatus = legacyProject.sourceStatus
  const tasks: StudioTask[] = workspace.tasks.map((task) => ({
    id: task.id,
    projectId: workspace.project.id,
    title: task.title,
    status: task.status === 'done' ? 'done' : task.status === 'in-progress' || task.status === 'review' ? 'doing' : task.status === 'blocked' ? 'blocked' : 'todo',
    processState: task.status === 'done' ? 'done' : task.status === 'blocked' ? 'blocked' : task.status === 'in-progress' || task.status === 'review' ? 'on-site' : task.status === 'backlog' ? 'planned' : 'ready',
    owner: workspace.project.members.find((member) => member.id === task.responsibleMemberId)?.name ?? task.createdBy,
    trade: task.contractor ?? workspace.project.workSections.find((section) => section.id === task.workSectionId)?.name ?? task.phase,
    priority: task.priority === 'critical' ? 'high' : task.priority,
    blocker: task.status === 'blocked' ? task.description : undefined,
    startDate: task.plannedStart,
    endDate: task.plannedFinish,
    progress: task.progress,
    timelineSlot: task.plannedStart,
    siteCheck: task.locationId ? 'required' : 'pending',
    notes: task.description,
    sourceStatus,
  }))
  return {
    ...data,
    studioProjects: data.studioProjects.map((project) => project.id === workspace.project.id ? {
      ...project,
      name: workspace.project.name,
      phase: workspace.project.phase,
      status: workspace.project.status === 'on-hold' ? 'paused' : workspace.project.status === 'complete' ? 'handover' : workspace.project.status,
      startDate: workspace.project.startDate,
      endDate: workspace.project.targetHandoverDate,
      progress: workspace.project.actualProgress,
      notes: workspace.project.summary,
    } : project),
    studioTasks: [...data.studioTasks.filter((task) => task.projectId !== workspace.project.id), ...tasks],
  }
}
