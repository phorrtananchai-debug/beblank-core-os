import type { CommandEvent, CommandEventCategory, CommandEventSeverity } from './commandCenterEvents'

export type ActivityFeedSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
export type ActivityFeedSource = 'SYSTEM' | 'CONNECTOR' | 'AGENT' | 'CREATOR' | 'STUDIO' | 'PORTFOLIO' | 'LIFE'

export type ActivityFeedRow = {
  id: string
  title: string
  message: string
  severity: ActivityFeedSeverity
  sourceLabel: ActivityFeedSource
  divisionLabel: string
  timestampLabel: string
}

export type ActivityFeedModel = {
  rows: ActivityFeedRow[]
  hasEvents: boolean
  columns: [ActivityFeedRow[], ActivityFeedRow[], ActivityFeedRow[]]
}

const EVENT_LIMIT = 20

const severityLabel: Record<CommandEventSeverity, ActivityFeedSeverity> = {
  info: 'INFO',
  success: 'SUCCESS',
  warning: 'WARNING',
  error: 'CRITICAL',
}

const sourceLabel: Record<CommandEventCategory, ActivityFeedSource> = {
  system: 'SYSTEM',
  connector: 'CONNECTOR',
  agent: 'AGENT',
  creator: 'CREATOR',
  studio: 'STUDIO',
  portfolio: 'PORTFOLIO',
  life: 'LIFE',
}

const divisionLabelByCategory: Record<CommandEventCategory, string> = {
  system: 'Jarvis B HQ',
  connector: 'System',
  agent: 'Agent Layer',
  creator: 'Creator Factory',
  studio: 'BBH Studio',
  portfolio: 'Aequitas Capital',
  life: 'My House',
}

const formatBangkokTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getDivisionLabel = (event: CommandEvent) => {
  const raw =
    event.metadata?.divisionLabel ??
    event.metadata?.divisionName ??
    event.metadata?.division ??
    event.metadata?.module

  return typeof raw === 'string' && raw.trim().length > 0
    ? raw
    : divisionLabelByCategory[event.category]
}

export const buildActivityFeedModel = (commandEvents: CommandEvent[]): ActivityFeedModel => {
  const rows = [...commandEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, EVENT_LIMIT)
    .map((event) => ({
      id: event.id,
      title: event.title,
      message: event.message,
      severity: severityLabel[event.severity],
      sourceLabel: sourceLabel[event.category],
      divisionLabel: getDivisionLabel(event),
      timestampLabel: formatBangkokTime(event.timestamp),
    }))

  return {
    rows,
    hasEvents: rows.length > 0,
    columns: [
      rows.slice(0, 7),
      rows.slice(7, 14),
      rows.slice(14, 20),
    ],
  }
}
