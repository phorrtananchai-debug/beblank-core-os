export type CommandEventCategory =
  | 'system'
  | 'connector'
  | 'agent'
  | 'creator'
  | 'studio'
  | 'portfolio'
  | 'life'

export type CommandEventType =
  | 'system.bootstrap.completed'
  | 'system.bootstrap.failed'
  | 'connector.refresh.started'
  | 'connector.refresh.completed'
  | 'connector.refresh.failed'
  | 'connector.status.changed'
  | 'agent.execution.logged'
  | 'creator.snapshot.imported'
  | 'creator.import.logged'
  | 'studio.review.logged'
  | 'portfolio.sync.logged'
  | 'life.status.logged'

export type CommandEventSeverity = 'info' | 'success' | 'warning' | 'error'

export type CommandEvent = {
  id: string
  type: CommandEventType
  category: CommandEventCategory
  severity: CommandEventSeverity
  title: string
  message: string
  timestamp: string
  source: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export type CommandEventInput = Omit<CommandEvent, 'id' | 'timestamp'>

export type CommandEventListener = (event: CommandEvent) => void

const createEventId = () =>
  `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const createCommandEvent = (input: CommandEventInput): CommandEvent => ({
  ...input,
  id: createEventId(),
  timestamp: new Date().toISOString(),
})

export const COMMAND_EVENT_LOG_LIMIT = 200
