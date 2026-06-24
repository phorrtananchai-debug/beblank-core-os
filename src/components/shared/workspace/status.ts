import type { StudioBillingGate, StudioInspection, StudioMilestone, StudioProject, StudioRisk, StudioTask } from '../../../types/models'

export const workspaceStatuses = ['LIVE', 'ACTIVE', 'WATCH', 'BLOCKED', 'COMPLETE', 'ARCHIVED'] as const

export type WorkspaceStatus = (typeof workspaceStatuses)[number]

export const normalizeWorkspaceStatus = (value: string): WorkspaceStatus => {
  switch (value.toLowerCase()) {
    case 'live':
    case 'healthy':
      return 'LIVE'
    case 'active':
    case 'ready':
    case 'planned':
    case 'scheduled':
    case 'review':
      return 'ACTIVE'
    case 'watch':
    case 'warning':
    case 'submitted':
      return 'WATCH'
    case 'blocked':
    case 'risk':
    case 'at-risk':
    case 'delayed':
    case 'failed':
      return 'BLOCKED'
    case 'complete':
    case 'completed':
    case 'done':
    case 'paid':
      return 'COMPLETE'
    case 'archived':
    case 'paused':
      return 'ARCHIVED'
    default:
      return 'WATCH'
  }
}

export const projectStatusToWorkspaceStatus = (status: StudioProject['status']) =>
  status === 'planning' ? 'WATCH' : status === 'paused' ? 'ARCHIVED' : status === 'handover' ? 'ACTIVE' : 'LIVE'

export const projectHealthToWorkspaceStatus = (health: StudioProject['projectHealth']) =>
  health === 'risk' ? 'BLOCKED' : health === 'watch' ? 'WATCH' : 'LIVE'

export const taskStatusToWorkspaceStatus = (status: StudioTask['status']) =>
  status === 'blocked' ? 'BLOCKED' : status === 'done' ? 'COMPLETE' : status === 'doing' ? 'ACTIVE' : 'WATCH'

export const milestoneStatusToWorkspaceStatus = (status: StudioMilestone['status']) =>
  status === 'complete' ? 'COMPLETE' : status === 'at-risk' ? 'BLOCKED' : status === 'active' ? 'ACTIVE' : 'WATCH'

export const gateStatusToWorkspaceStatus = (status: StudioBillingGate['status']) =>
  status === 'blocked' ? 'BLOCKED' : status === 'paid' ? 'COMPLETE' : status === 'ready' || status === 'submitted' ? 'ACTIVE' : 'WATCH'

export const inspectionStatusToWorkspaceStatus = (status: StudioInspection['status']) =>
  status === 'done' ? 'COMPLETE' : status === 'delayed' ? 'BLOCKED' : 'ACTIVE'

export const riskStatusToWorkspaceStatus = (risk: StudioRisk['severity'] | StudioRisk['processState']) =>
  risk === 'high' || risk === 'blocked' ? 'BLOCKED' : risk === 'medium' || risk === 'watch' ? 'WATCH' : 'ACTIVE'

export const statusTone = (status: WorkspaceStatus) => {
  switch (status) {
    case 'LIVE':
      return {
        bg: '#E8F7F0',
        border: '#B4E6CF',
        text: '#1E9C6A',
      }
    case 'ACTIVE':
      return {
        bg: '#EEF2F5',
        border: '#CFD7DD',
        text: '#54606A',
      }
    case 'WATCH':
      return {
        bg: '#FFF4D7',
        border: '#F0D08E',
        text: '#C98B00',
      }
    case 'BLOCKED':
      return {
        bg: '#FDEBE8',
        border: '#F2B0A7',
        text: '#CC4838',
      }
    case 'COMPLETE':
      return {
        bg: '#EEF2F5',
        border: '#CFD7DD',
        text: '#54606A',
      }
    case 'ARCHIVED':
      return {
        bg: '#F1EEE9',
        border: '#D8D1C7',
        text: '#7B7369',
      }
    default:
      return {
        bg: '#EEF2F5',
        border: '#CFD7DD',
        text: '#54606A',
      }
  }
}
