import type { AequitasCapitalModel } from '../aequitas/buildAequitasCapitalModel'
import type { CreatorFactoryModel } from '../creator/buildCreatorFactoryModel'
import type { StudioModel } from '../studio/buildStudioModel'
import type { LifeModel } from '../life/buildLifeModel'
import type { SourceStatus } from '../../types/models'

type AgentState = 'running' | 'waiting-review' | 'completed'
type DivisionMood = 'calm' | 'busy' | 'review-needed' | 'offline'
type FreshnessState = 'Fresh' | 'Stale' | 'Unknown'

export type JarvisBAgent = {
  id: string
  name: string
  role: string
  state: AgentState
  currentTask: string
  progress: number
  updatedAt: string
}

export type JarvisBModel = {
  division: {
    mood: DivisionMood
    activeAgents: number
    runningTasks: number
    waitingReviews: number
    completedToday: number
    summary: string
  }
  systemMood: DivisionMood
  activeDivisions: number
  activeAgents: number
  runningTasks: number
  waitingReviews: number
  completedToday: number
  topPriorities: string[]
  blockedItems: string[]
  staleSources: string[]
  readOnlyIntegrations: string[]
  executiveBrief: string
  agents: JarvisBAgent[]
  statuses: Record<string, SourceStatus | null>
  lastUpdated: string
  overallFreshness: FreshnessState
}

type DivisionInput = {
  model: { division: { mood: DivisionMood; activeAgents: number; runningTasks: number; waitingReviews: number; completedToday: number; summary: string }; overallFreshness: string }
  id: string
  name: string
  readOnly: boolean
  sourceStatuses: Array<{ id: string; status: SourceStatus | null }>
}

const formatBangkokTime = (value?: string) => {
  if (!value) return 'Unavailable'
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

const resolveLatestTimestamp = (timestamps: Array<string | undefined>) => {
  const valid = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())
  return valid[0]?.toISOString()
}

const getOverallFreshness = (statuses: Array<SourceStatus | null>): FreshnessState => {
  const hasStale = statuses.some((s) => s?.isStale)
  const hasFresh = statuses.some((s) => s?.lastSyncedAt && !s?.isStale)
  if (hasStale) return 'Stale'
  if (hasFresh) return 'Fresh'
  return 'Unknown'
}

const emptyDivision: DivisionInput['model']['division'] = {
  mood: 'offline',
  activeAgents: 0,
  runningTasks: 0,
  waitingReviews: 0,
  completedToday: 0,
  summary: 'Division is offline or has no data.',
}

const toDivisionInput = (
  model: { division: { mood: DivisionMood; activeAgents: number; runningTasks: number; waitingReviews: number; completedToday: number; summary: string }; overallFreshness: string } | null,
  id: string,
  name: string,
  readOnly: boolean,
  statuses: Array<{ id: string; status: SourceStatus | null }>,
): DivisionInput => ({
  model: model ?? { division: emptyDivision, overallFreshness: 'Unknown' },
  id,
  name,
  readOnly,
  sourceStatuses: statuses,
})

const SYSTEM_MOOD_PRIORITY: DivisionMood[] = ['offline', 'review-needed', 'busy', 'calm']

export const buildJarvisBModel = (
  aequitas: AequitasCapitalModel | null,
  creator: CreatorFactoryModel | null,
  studio: StudioModel | null,
  life: LifeModel | null,
  sourceStatuses?: Record<string, SourceStatus>,
  commandCenterSourceStatus?: SourceStatus | null,
): JarvisBModel => {
  const divisions: DivisionInput[] = [
    toDivisionInput(aequitas, 'aequitas-capital', 'Aequitas Capital', true, [
      { id: 'investments', status: aequitas?.statuses.investments ?? null },
      { id: 'finnhub', status: aequitas?.statuses.finnhub ?? null },
    ]),
    toDivisionInput(creator, 'creator-factory', 'Creator Factory', true, [
      { id: 'aiWorkflow', status: sourceStatuses?.aiWorkflow ?? null },
    ]),
    toDivisionInput(studio, 'bbh-studio', 'BBH Studio', true, [
      { id: 'studio', status: sourceStatuses?.studio ?? null },
    ]),
    toDivisionInput(life, 'my-house', 'My House', true, [
      { id: 'familyOffice', status: sourceStatuses?.familyOffice ?? null },
    ]),
  ]

  const activeDivisions = divisions.filter((d) => d.model.division.mood !== 'offline').length
  const allMoods = divisions.map((d) => d.model.division.mood)

  const systemMood: DivisionMood =
    SYSTEM_MOOD_PRIORITY.reduce<DivisionMood | null>((worst, mood) => {
      if (allMoods.includes(mood)) return mood
      return worst
    }, null) ?? 'calm'

  const totalRunningTasks = divisions.reduce((s, d) => s + (d.model.division.runningTasks ?? 0), 0)
  const totalWaitingReviews = divisions.reduce((s, d) => s + (d.model.division.waitingReviews ?? 0), 0)
  const totalCompletedToday = divisions.reduce((s, d) => s + (d.model.division.completedToday ?? 0), 0)
  const totalActiveAgents = divisions.reduce((s, d) => s + (d.model.division.activeAgents ?? 0), 0)

  const staleSources: string[] = []
  const readOnlyIntegrations: string[] = []
  const blockedItems: string[] = []

  for (const div of divisions) {
    for (const src of div.sourceStatuses) {
      if (src.status?.isStale) staleSources.push(`${div.name} / ${src.id}`)
    }
    if (div.readOnly) readOnlyIntegrations.push(div.name)
    if (div.model.division.mood === 'offline') blockedItems.push(`${div.name} is offline`)
    if (div.model.division.mood === 'review-needed') blockedItems.push(`${div.name} needs review`)
  }

  const topPriorities: string[] = []
  if (totalWaitingReviews > 0) topPriorities.push(`Resolve ${totalWaitingReviews} pending review(s) across divisions`)
  if (staleSources.length > 0) topPriorities.push(`Refresh ${staleSources.length} stale source(s): ${staleSources.slice(0, 3).join(', ')}${staleSources.length > 3 ? ` +${staleSources.length - 3} more` : ''}`)
  if (life && life.division.mood !== 'offline' && life.finance.confidence !== 'Real') topPriorities.push('Verify My House adapter — data confidence is not live')

  const activeDivisionsNeedingAttention = divisions.filter((d) => d.model.division.mood === 'review-needed').length
  if (activeDivisionsNeedingAttention > 0 && totalRunningTasks > 0) {
    topPriorities.push(`Prioritize ${activeDivisionsNeedingAttention} division(s) needing review while ${totalRunningTasks} tasks are running`)
  }
  if (topPriorities.length === 0) {
    topPriorities.push('All divisions operating normally — monitor via Command Center')
  }

  const allStatuses = divisions.flatMap((d) => d.sourceStatuses.map((s) => s.status).filter(Boolean) as SourceStatus[])
  const overallFreshness = getOverallFreshness(allStatuses)

  const lastUpdatedRaw = resolveLatestTimestamp([
    aequitas?.lastUpdated,
    commandCenterSourceStatus?.lastSyncedAt,
    ...allStatuses.map((s) => s.lastSyncedAt),
  ])

  const formatBrief = (): string => {
    const moodWord = systemMood === 'review-needed' ? 'mixed' : systemMood
    const parts: string[] = [
      `System is ${moodWord}. ${activeDivisions} of ${divisions.length} divisions active.`,
    ]
    if (totalRunningTasks > 0) parts.push(`${totalRunningTasks} task(s) running.`)
    if (totalWaitingReviews > 0) parts.push(`${totalWaitingReviews} review(s) pending.`)
    if (staleSources.length > 0) parts.push(`${staleSources.length} source(s) stale.`)
    if (readOnlyIntegrations.length > 0) parts.push(`${readOnlyIntegrations.length} read-only integration(s).`)
    return parts.join(' ')
  }

  const agents: JarvisBAgent[] = [
    {
      id: 'orchestrator',
      name: 'Orchestrator',
      role: 'Cross-division routing',
      state: totalRunningTasks > 0 || totalWaitingReviews > 0 ? 'running' : 'completed',
      currentTask: systemMood === 'offline' ? 'No active divisions to coordinate' :
        totalWaitingReviews > 0 ? `Routing ${totalWaitingReviews} pending review(s) across divisions` :
        `Coordinating ${activeDivisions} active division(s) with ${totalRunningTasks} running task(s)`,
      progress: totalWaitingReviews > 0 || staleSources.length > 0 ? 62 : 88,
      updatedAt: formatBangkokTime(lastUpdatedRaw),
    },
    {
      id: 'context-manager',
      name: 'Context Manager',
      role: 'State aggregation',
      state: staleSources.length > 0 ? 'waiting-review' : 'running',
      currentTask: staleSources.length > 0
        ? `Waiting on ${staleSources.length} stale source(s) for updated context`
        : `Aggregating state across ${activeDivisions} active division(s)`,
      progress: staleSources.length > 0 ? 45 : 82,
      updatedAt: formatBangkokTime(lastUpdatedRaw),
    },
    {
      id: 'reviewer',
      name: 'Reviewer',
      role: 'Quality check',
      state: totalWaitingReviews > 0 ? 'running' : 'completed',
      currentTask: totalWaitingReviews > 0
        ? `Reviewing ${totalWaitingReviews} pending item(s) across divisions`
        : 'All reviews cleared',
      progress: totalWaitingReviews > 0 ? 40 : 100,
      updatedAt: formatBangkokTime(lastUpdatedRaw),
    },
    {
      id: 'systems-monitor',
      name: 'Systems Monitor',
      role: 'Integration health',
      state: staleSources.length > 0 ? 'waiting-review' : 'running',
      currentTask: staleSources.length > 0
        ? `Monitoring ${staleSources.length} stale integration(s)`
        : `All ${readOnlyIntegrations.length} read-only integration(s) operational`,
      progress: staleSources.length > 0 ? 35 : 91,
      updatedAt: formatBangkokTime(lastUpdatedRaw),
    },
    {
      id: 'travel-coordinator',
      name: 'Travel Coordinator',
      role: 'Life logistics',
      state: life && life.division.mood !== 'offline' ? 'running' : 'completed',
      currentTask: life && life.division.mood !== 'offline'
        ? 'Coordinating personal life logistics'
        : 'Life adapter offline — no travel coordination active',
      progress: life && life.division.mood !== 'offline' ? 60 : 0,
      updatedAt: formatBangkokTime(life?.lastUpdated),
    },
  ]

  return {
    division: {
      mood: systemMood,
      activeAgents: totalActiveAgents,
      runningTasks: totalRunningTasks,
      waitingReviews: totalWaitingReviews,
      completedToday: totalCompletedToday,
      summary: `Read-only system summary aggregating ${activeDivisions} of ${divisions.length} divisions.`,
    },
    systemMood,
    activeDivisions,
    activeAgents: totalActiveAgents,
    runningTasks: totalRunningTasks,
    waitingReviews: totalWaitingReviews,
    completedToday: totalCompletedToday,
    topPriorities,
    blockedItems,
    staleSources,
    readOnlyIntegrations,
    executiveBrief: formatBrief(),
    agents,
    statuses: {
      commandCenter: commandCenterSourceStatus ?? null,
      ...divisions.reduce<Record<string, SourceStatus | null>>((acc, d) => {
        for (const src of d.sourceStatuses) {
          if (src.status) acc[`${d.id}-${src.id}`] = src.status
        }
        return acc
      }, {}),
    },
    lastUpdated: formatBangkokTime(lastUpdatedRaw),
    overallFreshness,
  }
}
