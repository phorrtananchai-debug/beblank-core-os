import { useEffect, useMemo, useState } from 'react'
import { AgentQueueBoard } from '../../components/command-center/AgentQueueBoard'
import { ActivityFeed } from '../../components/command-center/ActivityFeed'
import { CommandHeader } from '../../components/command-center/CommandHeader'
import { DivisionTile } from '../../components/command-center/DivisionTile'
import { buildAequitasCapitalModel } from '../../core/aequitas/buildAequitasCapitalModel'
import { buildCreatorFactoryModel, loadCreatorFactorySnapshot, type CreatorFactoryModel } from '../../core/creator/buildCreatorFactoryModel'
import { buildJarvisBModel } from '../../core/jarvis/buildJarvisBModel'
import { buildLifeModel } from '../../core/life/buildLifeModel'
import { useOs } from '../../core/os/useOs'
import { buildStudioModel } from '../../core/studio/buildStudioModel'

type DivisionMood = 'calm' | 'busy' | 'review-needed' | 'offline'
type AgentState = 'running' | 'waiting-review' | 'completed'
type Confidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock' | 'Derived'
type Freshness = 'Fresh' | 'Stale' | 'Unknown'

type DivisionRecord = {
  id: string
  name: string
  mood: DivisionMood
  activeAgents: number
  runningTasks: number
  waitingReviews: number
  completedToday: number
  summary: string
  confidence: Confidence
  freshness: Freshness
  readOnly: boolean
  keyMetrics: Array<{
    label: string
    value: string | number
  }>
}

type AgentRecord = {
  id: string
  name: string
  division: string
  role: string
  state: AgentState
  currentTask: string
  progress: number
  updatedAt: string
  confidence?: Confidence
  freshness?: Freshness
}

const creatorFallbackModel: CreatorFactoryModel = buildCreatorFactoryModel({
  episodes: [],
  ideasCount: 0,
  importHistory: [],
  source: 'unavailable',
  sourceLabel: 'Creator OS adapter fallback',
  confidence: 'Fallback',
})

export const CommandCenterPage = () => {
  const { data, sourceStatuses } = useOs()
  const aequitas = useMemo(() => buildAequitasCapitalModel(data, sourceStatuses), [data, sourceStatuses])
  const life = useMemo(() => buildLifeModel(data, sourceStatuses), [data, sourceStatuses])
  const studio = useMemo(() => buildStudioModel(data, sourceStatuses), [data, sourceStatuses])
  const [creator, setCreator] = useState<CreatorFactoryModel>(creatorFallbackModel)

  useEffect(() => {
    let cancelled = false

    const syncCreator = async () => {
      const snapshot = await loadCreatorFactorySnapshot()
      if (!cancelled) setCreator(buildCreatorFactoryModel(snapshot))
    }

    void syncCreator()

    return () => {
      cancelled = true
    }
  }, [])

  const jarvis = useMemo(
    () => buildJarvisBModel(aequitas, creator, studio, life, sourceStatuses, sourceStatuses?.commandCenter),
    [aequitas, creator, life, studio, sourceStatuses],
  )

  const divisions: DivisionRecord[] = useMemo(() => ([
    {
      id: 'jarvis-b-hq',
      name: 'Jarvis B HQ',
      mood: jarvis.systemMood,
      activeAgents: jarvis.activeAgents,
      runningTasks: jarvis.runningTasks,
      waitingReviews: jarvis.waitingReviews,
      completedToday: jarvis.completedToday,
      summary: jarvis.executiveBrief,
      confidence: jarvis.overallFreshness === 'Fresh' ? 'Real' : jarvis.overallFreshness === 'Stale' ? 'Inferred' : 'Fallback',
      freshness: jarvis.overallFreshness,
      readOnly: false,
      keyMetrics: [
        { label: 'Active Divisions', value: jarvis.activeDivisions },
        { label: 'Stale Sources', value: jarvis.staleSources.length },
        { label: 'Priorities', value: jarvis.topPriorities.length },
      ],
    },
    {
      id: 'aequitas-capital',
      name: 'Aequitas Capital',
      mood: aequitas.division.mood,
      activeAgents: aequitas.division.activeAgents,
      runningTasks: aequitas.division.runningTasks,
      waitingReviews: aequitas.division.waitingReviews,
      completedToday: aequitas.division.completedToday,
      summary: aequitas.division.summary,
      confidence: aequitas.scanner.confidence,
      freshness: aequitas.overallFreshness,
      readOnly: true,
      keyMetrics: [
        { label: 'Scanner', value: aequitas.scanner.watchCount },
        { label: 'Strong Watch', value: aequitas.scanner.strongWatchCount },
        { label: 'Market Bias', value: aequitas.market.bias },
      ],
    },
    {
      id: 'creator-factory',
      name: 'Creator Factory',
      mood: creator.division.mood,
      activeAgents: creator.division.activeAgents,
      runningTasks: creator.division.runningTasks,
      waitingReviews: creator.division.waitingReviews,
      completedToday: creator.division.completedToday,
      summary: creator.division.summary,
      confidence: creator.pipeline.confidence,
      freshness: creator.overallFreshness,
      readOnly: true,
      keyMetrics: [
        { label: 'Episodes', value: creator.pipeline.totalEpisodes },
        { label: 'Ready', value: creator.pipeline.ready },
        { label: 'Publish Ready', value: creator.readiness.readyToPublish },
      ],
    },
    {
      id: 'bbh-studio',
      name: 'BBH Studio',
      mood: studio.division.mood,
      activeAgents: studio.division.activeAgents,
      runningTasks: studio.division.runningTasks,
      waitingReviews: studio.division.waitingReviews,
      completedToday: studio.division.completedToday,
      summary: studio.division.summary,
      confidence: studio.projects.confidence,
      freshness: studio.overallFreshness,
      readOnly: true,
      keyMetrics: [
        { label: 'Projects', value: studio.division.activeProjects },
        { label: 'Deadlines', value: studio.division.deadlinesThisWeek },
        { label: 'Project Health', value: studio.division.projectHealth },
      ],
    },
    {
      id: 'my-house',
      name: 'My House',
      mood: life.division.mood,
      activeAgents: life.division.activeAgents,
      runningTasks: life.division.runningTasks,
      waitingReviews: life.division.waitingReviews,
      completedToday: life.division.completedToday,
      summary: life.division.summary,
      confidence: life.finance.confidence,
      freshness: life.overallFreshness,
      readOnly: true,
      keyMetrics: [
        { label: 'Health', value: life.health.runningPlanStatus },
        { label: 'Finance', value: life.finance.personalFinanceHealth },
        { label: 'Study Queue', value: life.learning.studyQueue },
      ],
    },
  ]), [aequitas, creator, jarvis, life, studio])

  const agents: AgentRecord[] = useMemo(() => ([
    ...jarvis.agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      division: 'Jarvis B HQ',
      role: agent.role,
      state: agent.state,
      currentTask: agent.currentTask,
      progress: agent.progress,
      updatedAt: agent.updatedAt,
      confidence: jarvis.overallFreshness === 'Fresh' ? 'Derived' as const : 'Fallback' as const,
      freshness: jarvis.overallFreshness,
    })),
    ...aequitas.agents.items.map((agent) => ({
      id: agent.id,
      name: agent.name,
      division: 'Aequitas Capital',
      role: agent.role,
      state: agent.state,
      currentTask: agent.currentTask,
      progress: agent.progress,
      updatedAt: agent.updatedAt,
      confidence: aequitas.agents.confidence,
      freshness: aequitas.agents.freshness,
    })),
    ...creator.agents.items.map((agent) => ({
      id: agent.id,
      name: agent.name,
      division: 'Creator Factory',
      role: agent.role,
      state: agent.state,
      currentTask: agent.currentTask,
      progress: agent.progress,
      updatedAt: agent.updatedAt,
      confidence: creator.agents.confidence,
      freshness: creator.agents.freshness,
    })),
    ...studio.agents.items.map((agent) => ({
      id: agent.id,
      name: agent.name,
      division: 'BBH Studio',
      role: agent.role,
      state: agent.state,
      currentTask: agent.currentTask,
      progress: agent.progress,
      updatedAt: agent.updatedAt,
      confidence: studio.agents.confidence,
      freshness: studio.agents.freshness,
    })),
    ...life.agents.items.map((agent) => ({
      id: agent.id,
      name: agent.name,
      division: 'My House',
      role: agent.role,
      state: agent.state,
      currentTask: agent.currentTask,
      progress: agent.progress,
      updatedAt: agent.updatedAt,
      confidence: life.agents.confidence,
      freshness: life.agents.freshness,
    })),
  ]), [aequitas, creator, jarvis, life, studio])

  const systemMood = useMemo(() => {
    if (jarvis.systemMood === 'review-needed') return 'Review Pressure'
    if (jarvis.systemMood === 'busy' || jarvis.systemMood === 'offline') return 'Busy / Controlled'
    return 'Calm'
  }, [jarvis])

  const lastUpdated = [jarvis.lastUpdated, aequitas.lastUpdated, creator.lastUpdated, studio.lastUpdated, life.lastUpdated].find((value) => value !== 'Unavailable') ?? 'Unavailable'

  const statusStrip = [
    { label: 'System Mood', value: systemMood },
    { label: 'Active Agents', value: jarvis.activeAgents },
    { label: 'Running Tasks', value: jarvis.runningTasks },
    { label: 'Waiting Reviews', value: jarvis.waitingReviews },
    { label: 'Completed Today', value: jarvis.completedToday },
    { label: 'Last Updated', value: lastUpdated },
  ]

  const runningNow = agents.filter((agent) => agent.state === 'running')
  const waitingReview = agents.filter((agent) => agent.state === 'waiting-review')
  const completed = agents.filter((agent) => agent.state === 'completed')

  return (
    <section className="space-y-4">
      <CommandHeader
        title="BeBlank Core OS"
        subtitle={jarvis.executiveBrief}
        systemMood={systemMood}
        systemMoodSource={jarvis.systemMood}
        divisionsCount={divisions.length}
        agentsCount={agents.length}
        statusStrip={statusStrip}
      />

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-0.5">
          <h3 className="text-sm font-semibold text-[var(--bb-text)]">Division Matrix</h3>
          <span className="text-[10px] text-[var(--bb-text-faint)]">{divisions.length} divisions</span>
        </div>
        <div className="grid gap-2 xl:grid-cols-2">
          {divisions.map((division) => (
            <DivisionTile key={division.id} division={division} />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-0.5">
          <h3 className="text-sm font-semibold text-[var(--bb-text)]">Agent Queue</h3>
          <span className="text-[10px] text-[var(--bb-text-faint)]">{agents.length} tracked</span>
        </div>
        <AgentQueueBoard
          runningNow={runningNow}
          waitingReview={waitingReview}
          completed={completed}
        />
      </div>

      <ActivityFeed
        systemMood={systemMood}
        topPriorities={jarvis.topPriorities}
        staleSourcesCount={jarvis.staleSources.length}
        runningAgents={runningNow}
        divisions={divisions.map((division) => ({
          id: division.id,
          name: division.name,
          mood: division.mood,
        }))}
      />
    </section>
  )
}
