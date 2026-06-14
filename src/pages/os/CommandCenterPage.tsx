import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildAequitasCapitalModel } from '../../core/aequitas/buildAequitasCapitalModel'
import { buildCreatorFactoryModel, loadCreatorFactorySnapshot, type CreatorFactoryModel } from '../../core/creator/buildCreatorFactoryModel'
import { buildJarvisBModel } from '../../core/jarvis/buildJarvisBModel'
import { buildLifeModel } from '../../core/life/buildLifeModel'
import { buildStudioModel } from '../../core/studio/buildStudioModel'
import { useOs } from '../../core/os/useOs'

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

const moodClass: Record<DivisionMood, string> = {
  calm: 'pill-green',
  busy: 'pill-accent',
  'review-needed': 'pill-amber',
  offline: 'pill',
}

const queueClass: Record<AgentState, string> = {
  running: 'pill-accent',
  'waiting-review': 'pill-amber',
  completed: 'pill-green',
}

const queueLabel: Record<AgentState, string> = {
  running: 'Running',
  'waiting-review': 'Waiting Review',
  completed: 'Completed',
}

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

  const jarvis = useMemo(() => buildJarvisBModel(aequitas, creator, studio, life, sourceStatuses, sourceStatuses?.commandCenter), [aequitas, creator, life, studio, sourceStatuses])

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
  const totalActiveAgents = jarvis.activeAgents
  const totalRunningTasks = jarvis.runningTasks
  const totalWaitingReviews = jarvis.waitingReviews
  const totalCompletedToday = jarvis.completedToday

  const statusStrip = [
    { label: 'System Mood', value: systemMood },
    { label: 'Active Agents', value: totalActiveAgents },
    { label: 'Running Tasks', value: totalRunningTasks },
    { label: 'Waiting Reviews', value: totalWaitingReviews },
    { label: 'Completed Today', value: totalCompletedToday },
    { label: 'Last Updated', value: lastUpdated },
  ]

  const runningNow = agents.filter((agent) => agent.state === 'running')
  const waitingReview = agents.filter((agent) => agent.state === 'waiting-review')
  const completed = agents.filter((agent) => agent.state === 'completed')

  return (
    <section className="space-y-4">
      <header className="panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-faint)]">
              Command Center / Operational Matrix
            </p>
            <div>
              <h2 className="text-[1.9rem] font-semibold leading-none tracking-[-0.04em] md:text-[2.4rem]">
                BeBlank Core OS
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bb-text-muted)]">
                Executive operations board for division status, read-only integrations, and live agent queues.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill">{divisions.length} divisions</span>
            <span className="pill">{agents.length} agents</span>
            <span className="pill-accent">Command View</span>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {statusStrip.map((item) => (
          <article key={item.label} className="panel">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-faint)]">{item.label}</p>
            <p className="mt-3 text-xl font-semibold leading-none tracking-[-0.03em] text-[var(--bb-text)] md:text-2xl">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Division Matrix</h3>
          <span className="pill">Read-only aggregation layer</span>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {divisions.map((division) => (
            <Link
              key={division.id}
              to={`/os/command-center/${division.id}`}
              className="group rounded-[12px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-4 transition-colors duration-150 hover:border-[var(--bb-border-strong)] hover:bg-[var(--bb-surface-3)]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold leading-none tracking-[-0.02em]">{division.name}</h4>
                      <span className={moodClass[division.mood]}>{division.mood}</span>
                      {division.readOnly ? <span className="pill">Read-only</span> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--bb-text-muted)]">{division.summary}</p>
                  </div>
                  <div className="grid min-w-[180px] grid-cols-2 gap-2 text-right">
                    <MetaBadge label="Confidence" value={division.confidence} />
                    <MetaBadge label="Freshness" value={division.freshness} />
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <DivisionStat label="Active Agents" value={division.activeAgents} />
                  <DivisionStat label="Running Tasks" value={division.runningTasks} />
                  <DivisionStat label="Waiting Reviews" value={division.waitingReviews} />
                </div>

                <div className="overflow-hidden rounded-[10px] border border-[var(--bb-border)]">
                  <div className="grid grid-cols-3 border-b border-[var(--bb-border)] bg-[var(--bb-surface-3)] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">
                    <span className="px-3 py-2">Metric</span>
                    <span className="px-3 py-2">Value</span>
                    <span className="px-3 py-2 text-right">Today</span>
                  </div>
                  {division.keyMetrics.map((metric, index) => (
                    <div
                      key={`${division.id}-${metric.label}`}
                      className={`grid grid-cols-3 text-sm ${index !== division.keyMetrics.length - 1 ? 'border-b border-[var(--bb-border)]' : ''}`}
                    >
                      <span className="px-3 py-2.5 text-[var(--bb-text-muted)]">{metric.label}</span>
                      <span className="px-3 py-2.5 font-medium text-[var(--bb-text)]">{metric.value}</span>
                      <span className="px-3 py-2.5 text-right text-[var(--bb-text-muted)]">
                        {metric.label === 'Completed' ? division.completedToday : division.completedToday > 0 ? `${division.completedToday} done` : 'No change'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Agent Queue</h3>
          <span className="pill">{agents.length} tracked</span>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <QueueTable title="Running Now" items={runningNow} />
          <QueueTable title="Waiting Review" items={waitingReview} />
          <QueueTable title="Recently Completed" items={completed} />
        </div>
      </section>
    </section>
  )
}

const MetaBadge = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-3 py-2">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--bb-text)]">{value}</p>
  </div>
)

const DivisionStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-3 py-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{label}</p>
    <p className="mt-2 text-lg font-semibold leading-none tracking-[-0.02em] text-[var(--bb-text)]">{value}</p>
  </div>
)

const QueueTable = ({ title, items }: { title: string; items: AgentRecord[] }) => (
  <div className="overflow-hidden rounded-[12px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)]">
    <div className="flex items-center justify-between border-b border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-3 py-2.5">
      <p className="text-sm font-semibold">{title}</p>
      <span className="pill">{items.length}</span>
    </div>
    <div>
      {items.length === 0 ? (
        <div className="px-3 py-6 text-sm text-[var(--bb-text-muted)]">No agents in this queue.</div>
      ) : (
        items.map((item, index) => (
          <div key={item.id} className={`${index !== items.length - 1 ? 'border-b border-[var(--bb-border)]' : ''} px-3 py-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--bb-text)]">{item.name}</p>
                  <span className={queueClass[item.state]}>{queueLabel[item.state]}</span>
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{item.division} / {item.role}</p>
              </div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{item.updatedAt}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--bb-text-muted)]">{item.currentTask}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="os-progress flex-1">
                <div className="os-progress-bar os-progress-bar-accent" style={{ width: `${item.progress}%` }} />
              </div>
              <span className="text-xs font-medium text-[var(--bb-text-muted)]">{item.progress}%</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.confidence ? <span className="pill">{item.confidence}</span> : null}
              {item.freshness ? <span className="pill">{item.freshness}</span> : null}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)
