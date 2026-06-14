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

const moodDot: Record<DivisionMood, string> = {
  calm: 'bg-[#16a36a]',
  busy: 'bg-[var(--bb-accent)]',
  'review-needed': 'bg-[#c2410c]',
  offline: 'bg-black/[0.12]',
}



const queueBorder: Record<AgentState, string> = {
  running: 'border-l-[var(--bb-accent)]',
  'waiting-review': 'border-l-[#c2410c]',
  completed: 'border-l-[#16a36a]',
}

const queueProgressColor: Record<AgentState, string> = {
  running: 'os-progress-bar-accent',
  'waiting-review': 'os-progress-bar-amber',
  completed: 'os-progress-bar-green',
}

const divisionIcons: Record<string, string> = {
  'jarvis-b-hq': '⊞',
  'aequitas-capital': '◆',
  'creator-factory': '◎',
  'bbh-studio': '◇',
  'my-house': '○',
}

const divisionColors: Record<string, string> = {
  'jarvis-b-hq': 'bg-black/[0.04] text-[var(--bb-text)]',
  'aequitas-capital': 'bg-[var(--bb-accent)]/10 text-[var(--bb-accent)]',
  'creator-factory': 'bg-[#16a36a]/10 text-[#16a36a]',
  'bbh-studio': 'bg-[#2563eb]/10 text-[#2563eb]',
  'my-house': 'bg-[#7c3aed]/10 text-[#7c3aed]',
}

const moodLabel: Record<DivisionMood, string> = {
  calm: 'Calm',
  busy: 'Busy',
  'review-needed': 'Review Needed',
  offline: 'Offline',
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

      {/* System Status Strip */}
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {statusStrip.map((item) => (
          <div key={item.label} className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] px-3.5 py-2.5">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{item.label}</p>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold leading-none tracking-[-0.02em] text-[var(--bb-text)]">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Division Matrix */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-0.5">
          <h3 className="text-sm font-semibold text-[var(--bb-text)]">Division Matrix</h3>
          <span className="text-[10px] text-[var(--bb-text-faint)]">{divisions.length} divisions</span>
        </div>
        <div className="grid gap-2 xl:grid-cols-2">
          {divisions.map((division) => {
            const icon = divisionIcons[division.id] ?? '⊡'
            const colorClass = divisionColors[division.id] ?? 'bg-black/[0.04] text-[var(--bb-text-muted)]'
            const maxStat = Math.max(division.runningTasks, division.waitingReviews, division.completedToday, 1)
            return (
              <Link
                key={division.id}
                to={`/os/command-center/${division.id}`}
                className="block rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)] p-3.5 transition-colors duration-150 hover:border-[var(--bb-border-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${colorClass}`}>{icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold leading-none text-[var(--bb-text)]">{division.name}</h4>
                        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${moodDot[division.mood]} ${division.mood === 'busy' ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--bb-text-muted)]">{division.summary.slice(0, 80)}{division.summary.length > 80 ? '…' : ''}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={moodClass[division.mood]}>{moodLabel[division.mood]}</span>
                    {division.readOnly ? <span className="pill text-[9px]">R/O</span> : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  <div className="rounded-lg border border-[var(--bb-border)] px-2.5 py-2">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Agents</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--bb-text)]">{division.activeAgents}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--bb-border)] px-2.5 py-2">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Tasks</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--bb-text)]">{division.runningTasks}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--bb-border)] px-2.5 py-2">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Reviews</p>
                    <p className={`mt-0.5 text-sm font-semibold ${division.waitingReviews > 0 ? 'text-[#c2410c]' : 'text-[var(--bb-text)]'}`}>{division.waitingReviews}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--bb-border)] px-2.5 py-2">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-faint)]">Done</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--bb-text)]">{division.completedToday}</p>
                  </div>
                </div>

                {/* Compact micro bar showing task distribution */}
                <div className="mt-2 flex h-1 gap-0.5 overflow-hidden rounded-full bg-black/[0.04]">
                  <div className="bg-[var(--bb-accent)] transition-all" style={{ width: `${(division.runningTasks / maxStat) * 30}%` }} />
                  <div className="bg-[#c2410c] transition-all" style={{ width: `${(division.waitingReviews / maxStat) * 30}%` }} />
                  <div className="bg-[#16a36a] transition-all" style={{ width: `${(division.completedToday / maxStat) * 30}%` }} />
                </div>

                {/* Key metrics as compact badges */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {division.keyMetrics.map((metric) => (
                    <span key={metric.label} className="rounded-md bg-black/[0.03] px-2 py-0.5 font-mono text-[9px] text-[var(--bb-text-muted)]">
                      {metric.label}: <strong className="text-[var(--bb-text)]">{metric.value}</strong>
                    </span>
                  ))}
                  <span className="rounded-md bg-black/[0.03] px-2 py-0.5 font-mono text-[9px] text-[var(--bb-text-muted)]">
                    {division.confidence} · {division.freshness}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Agent Queue */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-0.5">
          <h3 className="text-sm font-semibold text-[var(--bb-text)]">Agent Queue</h3>
          <span className="text-[10px] text-[var(--bb-text-faint)]">{agents.length} tracked</span>
        </div>
        <div className="grid gap-2 xl:grid-cols-3">
          <QueueTable title="Running Now" items={runningNow} icon="▶" />
          <QueueTable title="Waiting Review" items={waitingReview} icon="◷" />
          <QueueTable title="Recently Completed" items={completed} icon="✓" />
        </div>
      </div>
    </section>
  )
}

const QueueTable = ({ title, items, icon }: { title: string; items: AgentRecord[]; icon: string }) => (
  <div className="overflow-hidden rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-2)]">
    <div className={`flex items-center justify-between border-b border-[var(--bb-border)] px-3 py-2`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--bb-text-faint)]">{icon}</span>
        <p className="text-xs font-semibold text-[var(--bb-text)]">{title}</p>
      </div>
      <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[var(--bb-text-muted)]">{items.length}</span>
    </div>
    <div>
      {items.length === 0 ? (
        <div className="px-3 py-5 text-xs text-[var(--bb-text-muted)]">No agents in this queue.</div>
      ) : (
        items.map((item, index) => (
          <div key={item.id} className={`${index !== items.length - 1 ? 'border-b border-[var(--bb-border)]' : ''} border-l-2 ${queueBorder[item.state]} pl-3 pr-3 py-2.5`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${item.state === 'running' ? 'bg-[var(--bb-accent)] animate-pulse' : item.state === 'waiting-review' ? 'bg-[#c2410c]' : 'bg-[#16a36a]'}`} />
                  <p className="text-xs font-semibold text-[var(--bb-text)]">{item.name}</p>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--bb-text-faint)]">{item.division} · {item.role}</p>
              </div>
              <span className="shrink-0 font-mono text-[9px] text-[var(--bb-text-faint)]">{item.updatedAt}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-[var(--bb-text-muted)]">{item.currentTask}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="os-progress flex-1" style={{ height: '4px' }}>
                <div className={`os-progress-bar ${queueProgressColor[item.state]}`} style={{ width: `${item.progress}%` }} />
              </div>
              <span className="text-[9px] font-medium text-[var(--bb-text-faint)]">{item.progress}%</span>
            </div>
            {(item.confidence || item.freshness) && (
              <div className="mt-1.5 flex gap-1.5">
                {item.confidence && <span className="rounded bg-black/[0.04] px-1.5 py-0.5 font-mono text-[8px] text-[var(--bb-text-faint)]">{item.confidence}</span>}
                {item.freshness && <span className="rounded bg-black/[0.04] px-1.5 py-0.5 font-mono text-[8px] text-[var(--bb-text-faint)]">{item.freshness}</span>}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  </div>
)
