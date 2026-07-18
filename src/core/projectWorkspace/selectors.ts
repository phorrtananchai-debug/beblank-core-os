import type { BOQItem, CostSummary, ProjectEvent, ProjectIntelligence, ProjectTask, ProjectWorkspaceData } from './types'

const dayMs = 86_400_000
const dateOnly = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export const getBoqBaseAmount = (item: BOQItem) => item.quantity * (item.materialRate + item.labourRate)
export const getBoqRevisedAmount = (item: BOQItem) => item.approvedAmount + item.variation
export const getBoqVariance = (item: BOQItem) => getBoqRevisedAmount(item) - item.forecastCost

export const getCostSummary = (data: ProjectWorkspaceData): CostSummary => {
  const baseAmount = sum(data.boqItems.map(getBoqBaseAmount))
  const revisedAmount = sum(data.boqItems.map(getBoqRevisedAmount))
  const actualCost = sum(data.boqItems.map((item) => item.actualCost))
  const forecastFinalCost = sum(data.boqItems.map((item) => item.forecastCost))
  return {
    approvedBudget: data.project.approvedBudget,
    baseAmount,
    revisedAmount,
    actualCost,
    forecastFinalCost,
    remainingCommitment: Math.max(0, forecastFinalCost - actualCost),
    varianceToBudget: data.project.approvedBudget - forecastFinalCost,
    variationTotal: sum(data.boqItems.map((item) => item.variation)),
  }
}

export const isTaskLate = (task: ProjectTask, today: string) => task.status !== 'done' && dateOnly(task.plannedFinish) < dateOnly(today)

export const getTasksInRange = (tasks: ProjectTask[], start: string, end: string) => {
  const rangeStart = dateOnly(start)
  const rangeEnd = dateOnly(end)
  return tasks.filter((task) => dateOnly(task.plannedStart) <= rangeEnd && dateOnly(task.plannedFinish) >= rangeStart)
}

export const getProjectIntelligence = (data: ProjectWorkspaceData, today = new Date().toISOString().slice(0, 10)): ProjectIntelligence => {
  const todayDate = dateOnly(today)
  const tomorrow = new Date(todayDate.getTime() + dayMs).toISOString().slice(0, 10)
  const weekEnd = new Date(todayDate.getTime() + 6 * dayMs).toISOString().slice(0, 10)
  const incomplete = data.tasks.filter((task) => task.status !== 'done')
  return {
    lateTasks: incomplete.filter((task) => isTaskLate(task, today)),
    dueTodayTasks: incomplete.filter((task) => task.plannedFinish === today),
    dueThisWeekTasks: incomplete.filter((task) => dateOnly(task.plannedFinish) >= todayDate && dateOnly(task.plannedFinish) <= dateOnly(weekEnd)),
    atRiskTasks: incomplete.filter((task) => task.status === 'blocked' || task.priority === 'critical' || task.timeImpactDays > 0),
    pendingDecisions: data.decisions.filter((decision) => decision.status === 'pending'),
    openRisks: data.risks.filter((risk) => risk.status !== 'closed'),
    unapprovedAssets: data.assets.filter((asset) => asset.approvalStatus === 'pending' || asset.approvalStatus === 'rejected'),
    boqWithoutActualCost: data.boqItems.filter((item) => item.actualCost <= 0 || item.procurementState === 'quoting'),
    tomorrowTasks: getTasksInRange(data.tasks, tomorrow, tomorrow),
    thisWeekTasks: getTasksInRange(data.tasks, today, weekEnd),
    latestSiteReport: [...data.siteReports].sort((a, b) => b.date.localeCompare(a.date))[0],
    nextMilestone: incomplete.filter((task) => dateOnly(task.plannedFinish) >= todayDate).sort((a, b) => a.plannedFinish.localeCompare(b.plannedFinish))[0],
    recentEvents: getProjectEvents(data).filter((event) => dateOnly(event.occurredAt) >= new Date(todayDate.getTime() - 7 * dayMs)).slice(0, 10),
    scheduleRiskDays: Math.max(0, ...incomplete.map((task) => task.timeImpactDays)),
    cost: getCostSummary(data),
  }
}

export const getBudgetByWorkSection = (data: ProjectWorkspaceData) => data.project.workSections.map((section) => {
  const items = data.boqItems.filter((item) => item.workSectionId === section.id)
  return {
    section,
    approved: sum(items.map((item) => item.approvedAmount)),
    revised: sum(items.map(getBoqRevisedAmount)),
    actual: sum(items.map((item) => item.actualCost)),
    forecast: sum(items.map((item) => item.forecastCost)),
  }
}).filter((row) => row.approved || row.revised || row.actual || row.forecast)

export const getAssetRelationshipLabel = (data: ProjectWorkspaceData, targetType: string, targetId: string) => {
  if (targetType === 'project') return data.project.name
  if (targetType === 'task') return data.tasks.find((item) => item.id === targetId)?.title ?? targetId
  if (targetType === 'site-report') return data.siteReports.find((item) => item.id === targetId)?.date ?? targetId
  if (targetType === 'boq-item') return data.boqItems.find((item) => item.id === targetId)?.code ?? targetId
  if (targetType === 'decision') return data.decisions.find((item) => item.id === targetId)?.title ?? targetId
  return targetId
}

export const getAssetRelationships = (data: ProjectWorkspaceData, assetId: string) => (data.assetRelationships ?? data.assets.find((asset) => asset.id === assetId)?.relationships ?? []).filter((relationship) => relationship.assetId === assetId)

export const getAssetsForEntity = (data: ProjectWorkspaceData, targetType: string, targetId: string) => {
  const assetIds = new Set((data.assetRelationships ?? data.assets.flatMap((asset) => asset.relationships ?? [])).filter((relationship) => relationship.targetType === targetType && relationship.targetId === targetId).map((relationship) => relationship.assetId))
  return data.assets.filter((asset) => assetIds.has(asset.id))
}

export const getProjectEvents = (data: ProjectWorkspaceData): ProjectEvent[] => {
  const events: ProjectEvent[] = []
  for (const task of data.tasks) {
    events.push({ id: `event-task-${task.id}`, projectId: data.project.id, occurredAt: task.updatedAt, actor: task.createdBy, type: task.status === 'done' ? 'completed' : 'updated', entityType: 'task', entityId: task.id, title: task.status === 'done' ? `Task completed: ${task.title}` : `Task updated: ${task.title}`, detail: `${task.status} · ${task.progress}%` })
  }
  for (const asset of data.assets) {
    events.push({ id: `event-asset-${asset.id}`, projectId: data.project.id, occurredAt: asset.updatedAt, actor: asset.createdBy, type: asset.approvalStatus === 'approved' ? 'approved' : 'uploaded', entityType: 'asset', entityId: asset.id, title: asset.approvalStatus === 'approved' ? `Asset approved: ${asset.name}` : `File uploaded: ${asset.name}`, detail: asset.caption })
  }
  for (const report of data.siteReports) {
    events.push({ id: `event-report-${report.id}`, projectId: data.project.id, occurredAt: report.updatedAt, actor: report.createdBy, type: 'submitted', entityType: 'site-report', entityId: report.id, title: `Site report submitted: ${report.date}`, detail: report.completedToday })
  }
  for (const item of data.boqItems.filter((row) => row.variation !== 0)) {
    events.push({ id: `event-boq-${item.id}`, projectId: data.project.id, occurredAt: item.updatedAt, actor: item.createdBy, type: 'updated', entityType: 'boq-item', entityId: item.id, title: `BOQ variation recorded: ${item.code}`, detail: `${item.description} · THB ${item.variation.toLocaleString()}` })
  }
  for (const decision of data.decisions) {
    events.push({ id: `event-decision-${decision.id}`, projectId: data.project.id, occurredAt: decision.updatedAt, actor: decision.createdBy, type: 'decision', entityType: 'decision', entityId: decision.id, title: `Decision ${decision.status}: ${decision.title}`, detail: decision.description })
  }
  for (const risk of data.risks.filter((item) => item.status !== 'closed')) {
    events.push({ id: `event-risk-${risk.id}`, projectId: data.project.id, occurredAt: risk.updatedAt, actor: risk.createdBy, type: 'risk', entityType: 'project', entityId: risk.id, title: `Risk ${risk.status}: ${risk.title}`, detail: risk.description })
  }
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}
