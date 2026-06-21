import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfidenceBadge } from '../../components/command-center/ConfidenceBadge'
import { FreshnessBadge } from '../../components/command-center/FreshnessBadge'
import { MetricStrip } from '../../components/command-center/MetricStrip'
import { ReadOnlyBadge } from '../../components/command-center/ReadOnlyBadge'
import { WorkloadBar } from '../../components/command-center/WorkloadBar'
import { buildAequitasCapitalModel } from '../../core/aequitas/buildAequitasCapitalModel'
import { useCreatorFactorySync } from '../../core/creator/useCreatorFactorySync'
import { buildLifeModel } from '../../core/life/buildLifeModel'
import { buildStudioModel } from '../../core/studio/buildStudioModel'
import { useOs } from '../../core/os/useOs'

type DivisionStatus = 'stable' | 'active' | 'review'

type CreatorSnapshotV1 = {
  schemaVersion: 'creator.snapshot.v1'
  source: 'creator-os'
  confidence: 'Real'
  updatedAt: string
  episodes: unknown[]
  ideasCount: number
  importHistory: unknown[]
}

type DivisionRecord = {
  id: string
  name: string
  status: DivisionStatus
  activeAgents: number
  runningTasks: number
  waitingReviews: number
  summary: string
}

const divisions: DivisionRecord[] = [
  { id: 'jarvis-b-hq', name: 'Jarvis B HQ', status: 'active', activeAgents: 3, runningTasks: 8, waitingReviews: 2, summary: 'Coordinating daily operations, agent orchestration, and command routing.' },
  { id: 'aequitas-capital', name: 'Aequitas Capital', status: 'stable', activeAgents: 1, runningTasks: 4, waitingReviews: 1, summary: 'Monitoring capital posture, planning reviews, and investment reporting.' },
  { id: 'creator-factory', name: 'Creator Factory', status: 'review', activeAgents: 0, runningTasks: 0, waitingReviews: 1, summary: 'Creator Factory now uses a read-only adapter over Creator OS instead of a mocked division model.' },
  { id: 'bbh-studio', name: 'BBH Studio', status: 'review', activeAgents: 0, runningTasks: 0, waitingReviews: 1, summary: 'BBH Studio now uses a read-only adapter over the existing Core OS studio domain instead of a static placeholder.' },
  { id: 'my-house', name: 'My House', status: 'stable', activeAgents: 0, runningTasks: 0, waitingReviews: 0, summary: 'Read-only life operations layer for health, finance, learning, and Mook support tracking.' },
]

const notesByDivision: Record<string, string[]> = {
  'jarvis-b-hq': [
    'Top-level shell routing and orchestration will live here later.',
    'Agent supervision stays mock-only in Command Center.',
  ],
  'aequitas-capital': [
    'Trading and portfolio data remain read-only in this surface.',
    'No trading actions execute from Command Center.',
  ],
  'creator-factory': [
    'Creator Factory is a read-only aggregation over Creator OS pipeline and readiness data.',
    'Command Center does not copy Creator OS UI or execute creator automation.',
  ],
  'bbh-studio': [
    'BBH Studio is a read-only aggregation over projects, timelines, reviews, queues, and studio health.',
    'Command Center does not duplicate Studio Workspace UI or execute write actions.',
  ],
  'my-house': [
    'My House is a read-only life adapter for personal tracking only.',
    'This surface does not provide medical advice, diagnosis, or intense training recommendations.',
  ],
}

const tone: Record<DivisionStatus, string> = {
  stable: 'pill-green',
  active: 'pill-accent',
  review: 'pill-amber',
}

const CREATOR_SNAPSHOT_LOCAL_STORAGE_KEYS = [
  'beblank_creator_os_snapshot_v1',
  'beblank_creator_factory_snapshot_v1',
] as const

const validateCreatorSnapshotV1 = (value: unknown): string[] => {
  const errors: string[] = []
  if (!value || typeof value !== 'object') {
    return ['Snapshot must be a JSON object.']
  }

  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 'creator.snapshot.v1') errors.push('schemaVersion must equal creator.snapshot.v1.')
  if (candidate.source !== 'creator-os') errors.push('source must equal creator-os.')
  if (candidate.confidence !== 'Real') errors.push('confidence must equal Real.')
  if (typeof candidate.updatedAt !== 'string') errors.push('updatedAt must be a string.')
  if (!Array.isArray(candidate.episodes)) errors.push('episodes must be an array.')
  if (typeof candidate.ideasCount !== 'number') errors.push('ideasCount must be a number.')
  if (!Array.isArray(candidate.importHistory)) errors.push('importHistory must be an array.')
  if (Array.isArray(candidate.episodes) && typeof candidate.ideasCount === 'number' && Array.isArray(candidate.importHistory)) {
    const isEmpty = candidate.episodes.length === 0 && candidate.ideasCount === 0 && candidate.importHistory.length === 0
    if (isEmpty) errors.push('snapshot must contain at least one episode, idea, or import history entry.')
  }

  return errors
}

const persistCreatorSnapshotImport = (snapshot: CreatorSnapshotV1) => {
  const payload = JSON.stringify(snapshot)
  for (const key of CREATOR_SNAPSHOT_LOCAL_STORAGE_KEYS) {
    window.localStorage.setItem(key, payload)
  }
  ;(window as Window & { __BEBLANK_CREATOR_OS_SNAPSHOT__?: CreatorSnapshotV1 }).__BEBLANK_CREATOR_OS_SNAPSHOT__ = snapshot
}

export const CommandCenterDivisionPage = () => {
  const { divisionId } = useParams()
  const { data, sourceStatuses, publishCommandEvent } = useOs()
  const division = divisions.find((item) => item.id === divisionId)
  const aequitas = useMemo(() => buildAequitasCapitalModel(data, sourceStatuses), [data, sourceStatuses])
  const life = useMemo(() => buildLifeModel(data, sourceStatuses), [data, sourceStatuses])
  const studio = useMemo(() => buildStudioModel(data, sourceStatuses), [data, sourceStatuses])
  const { creator, refreshCreatorFactory } = useCreatorFactorySync()
  const [snapshotInput, setSnapshotInput] = useState('')
  const [snapshotStatus, setSnapshotStatus] = useState('')

  const importCreatorSnapshot = async () => {
    let parsed: unknown

    try {
      parsed = JSON.parse(snapshotInput)
    } catch {
      setSnapshotStatus('Import failed: invalid JSON.')
      return
    }

    const validationErrors = validateCreatorSnapshotV1(parsed)
    if (validationErrors.length > 0) {
      setSnapshotStatus(`Import failed: ${validationErrors.join(' ')}`)
      return
    }

    const snapshot = parsed as CreatorSnapshotV1
    try {
      persistCreatorSnapshotImport(snapshot)
      await refreshCreatorFactory()
      publishCommandEvent({
        type: 'creator.snapshot.imported',
        category: 'creator',
        severity: 'success',
        title: 'Creator snapshot imported',
        message: `Imported ${snapshot.episodes.length} episode(s) into the shared Creator snapshot bridge.`,
        source: 'CommandCenterDivisionPage.importCreatorSnapshot',
        tags: ['creator', 'snapshot', 'import'],
        metadata: {
          schemaVersion: snapshot.schemaVersion,
          ideasCount: snapshot.ideasCount,
          importHistoryCount: snapshot.importHistory.length,
        },
      })
      setSnapshotStatus('Snapshot imported successfully.')
    } catch (error) {
      setSnapshotStatus(error instanceof Error ? error.message : 'Import failed.')
    }
  }

  const displayDivision = useMemo(() => {
    if (!division) return undefined

    if (division.id === 'aequitas-capital') {
      return {
        ...division,
        activeAgents: aequitas.division.activeAgents,
        runningTasks: aequitas.division.runningTasks,
        waitingReviews: aequitas.division.waitingReviews,
        summary: aequitas.division.summary,
      }
    }

    if (division.id === 'creator-factory') {
      return {
        ...division,
        activeAgents: creator.division.activeAgents,
        runningTasks: creator.division.runningTasks,
        waitingReviews: creator.division.waitingReviews,
        summary: creator.division.summary,
      }
    }

    if (division.id === 'bbh-studio') {
      return {
        ...division,
        activeAgents: studio.division.activeAgents,
        runningTasks: studio.division.runningTasks,
        waitingReviews: studio.division.waitingReviews,
        summary: studio.division.summary,
      }
    }

    if (division.id === 'my-house') {
      return {
        ...division,
        status: life.division.mood === 'review-needed' ? 'review' : life.division.mood === 'busy' ? 'active' : 'stable' as DivisionStatus,
        activeAgents: life.division.activeAgents,
        runningTasks: life.division.runningTasks,
        waitingReviews: life.division.waitingReviews,
        summary: life.division.summary,
      }
    }

    return division
  }, [aequitas, creator, division, life, studio])

  if (!displayDivision) {
    return (
      <section className="space-y-4">
        <div className="panel">
          <div className="panel-header">
            <h3>Division not found</h3>
            <span className="pill">Unknown</span>
          </div>
          <p className="text-sm leading-6 text-[var(--bb-text-muted)]">This division detail route is reserved for future Command Center expansion.</p>
          <Link to="/os/command-center" className="btn-secondary mt-4 inline-flex">Back to Command Center</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <header className="panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-faint)]">
              Division Detail / Operational View
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.8rem] font-semibold leading-none tracking-[-0.04em] md:text-[2.2rem]">{displayDivision.name}</h2>
              <span className={tone[displayDivision.status]}>{displayDivision.status}</span>
              {displayDivision.id === 'aequitas-capital' || displayDivision.id === 'creator-factory' || displayDivision.id === 'bbh-studio' || displayDivision.id === 'my-house' ? (
                <ReadOnlyBadge />
              ) : null}
            </div>
            <p className="max-w-3xl text-sm leading-6 text-[var(--bb-text-muted)]">{displayDivision.summary}</p>
          </div>
          <Link to="/os/command-center" className="btn-secondary inline-flex">Back to Command Center</Link>
        </div>
      </header>

      <MetricStrip
        items={[
          { label: 'Active Agents', value: displayDivision.activeAgents },
          { label: 'Running Tasks', value: displayDivision.runningTasks },
          { label: 'Waiting Reviews', value: displayDivision.waitingReviews },
        ]}
        columnsClass="md:grid-cols-3"
      />

      {displayDivision.id === 'aequitas-capital' ? (
        <>
          <ReadOnlyBanner text="Aequitas Capital is read-only. No trading actions are executed from Command Center." />

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.95fr]">
            <SummaryPanel
              title="Scanner Summary"
              badges={[aequitas.scanner.confidence, aequitas.scanner.freshness]}
              stats={[
                { label: 'Tracked Universe', value: aequitas.scanner.trackedUniverseCount },
                { label: 'Strong Watch', value: aequitas.scanner.strongWatchCount },
                { label: 'Watch Count', value: aequitas.scanner.watchCount },
                { label: 'Last Updated', value: aequitas.scanner.lastUpdated },
              ]}
              note={`Source: ${aequitas.scanner.sourceLabel}`}
              emptyState={aequitas.scanner.emptyState}
            />
            <SummaryPanel
              title="Market Summary"
              badges={[aequitas.market.confidence, aequitas.market.freshness]}
              stats={[
                { label: 'Market Bias', value: aequitas.market.bias },
                { label: 'Updated', value: aequitas.market.lastUpdated },
              ]}
              note={aequitas.market.note}
              emptyState={aequitas.market.emptyState}
            />
            <SummaryPanel
              title="Portfolio Summary"
              badges={[aequitas.portfolio.confidence, aequitas.portfolio.freshness]}
              stats={[
                { label: 'Portfolio Value', value: thb(aequitas.portfolio.portfolioValueTHB) },
                { label: 'USD Exposure', value: thb(aequitas.portfolio.usdExposureValueTHB) },
                { label: 'Holdings', value: aequitas.portfolio.holdingsCount },
                { label: 'Dividend Rows', value: aequitas.portfolio.dividendCount },
                { label: 'Open Reviews', value: aequitas.portfolio.reviewCount },
              ]}
              emptyState={aequitas.portfolio.emptyState}
            />
          </section>

          <AgentTable
            title="Agent Status"
            badges={[aequitas.agents.confidence, aequitas.agents.freshness, 'Derived']}
            rows={aequitas.agents.items.map((agent) => ({
              id: agent.id,
              name: agent.name,
              role: agent.role,
              state: agent.state,
              task: agent.currentTask,
              progress: agent.progress,
              updatedAt: agent.updatedAt,
            }))}
            emptyState={aequitas.agents.emptyState}
          />
        </>
      ) : null}

      {displayDivision.id === 'creator-factory' ? (
        <>
          <ReadOnlyBanner text="Creator Factory is read-only. No creator automation or publishing actions execute from Command Center." />

          <section className="panel">
            <div className="panel-header">
              <h3>Creator Snapshot Import</h3>
              <span className="pill">Read-only</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--bb-text-muted)]">
              Paste a CreatorSnapshotV1 JSON blob from Creator OS to import a local snapshot copy into this browser origin.
            </p>
            <textarea
              className="mt-4 min-h-56 w-full rounded-[12px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-4 py-3 font-mono text-xs leading-6 text-[var(--bb-text)] outline-none transition focus:border-[var(--bb-border-strong)]"
              placeholder='{"schemaVersion":"creator.snapshot.v1","source":"creator-os","confidence":"Real","updatedAt":"2026-06-21T00:00:00.000Z","episodes":[],"ideasCount":0,"importHistory":[]}'
              value={snapshotInput}
              onChange={(event) => setSnapshotInput(event.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => void importCreatorSnapshot()}
              >
                Import Snapshot
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSnapshotInput('')
                  setSnapshotStatus('')
                }}
              >
                Clear
              </button>
            </div>
              <p className="mt-3 text-sm leading-6 text-[var(--bb-text-muted)]">
                Validation checks schemaVersion, episodes, ideasCount, and importHistory before writing the shared snapshot keys.
              </p>
              {snapshotStatus ? (
                <p className="mt-3 text-sm leading-6 text-[var(--bb-text-muted)]">{snapshotStatus}</p>
              ) : null}
            </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <SummaryPanel
              title="Pipeline Summary"
              badges={[creator.pipeline.confidence, creator.pipeline.freshness]}
              stats={[
                { label: 'Total Episodes', value: creator.pipeline.totalEpisodes },
                { label: 'Needs Story', value: creator.pipeline.needsStory },
                { label: 'Needs Script', value: creator.pipeline.needsScript },
                { label: 'Needs Scenes', value: creator.pipeline.needsScenes },
                { label: 'Needs Images', value: creator.pipeline.needsImages },
                { label: 'Needs Voice', value: creator.pipeline.needsVoice },
                { label: 'Needs CapCut', value: creator.pipeline.needsCapCut },
                { label: 'Ready', value: creator.pipeline.ready },
                { label: 'Published', value: creator.pipeline.published },
                { label: 'Archived', value: creator.pipeline.archived },
              ]}
              emptyState={creator.pipeline.emptyState}
            />

            <div className="grid gap-4">
              <SummaryPanel
                title="Readiness Summary"
                badges={[creator.readiness.confidence, creator.readiness.freshness]}
                stats={[
                  { label: 'Ready To Produce', value: creator.readiness.readyToProduce },
                  { label: 'Ready For CapCut', value: creator.readiness.readyForCapCut },
                  { label: 'Ready To Publish', value: creator.readiness.readyToPublish },
                ]}
                note="Readiness is inferred from Creator OS stage data."
                emptyState={creator.readiness.emptyState}
              />

              <SummaryPanel
                title="Snapshot Metadata"
                badges={[creator.snapshotMeta.status, creator.operations.freshness]}
                stats={[
                  { label: 'Snapshot Source', value: creator.snapshotMeta.sourceLabel },
                  { label: 'Snapshot Status', value: creator.snapshotMeta.status },
                  { label: 'Last Imported', value: creator.snapshotMeta.lastImported },
                  { label: 'Snapshot Age', value: creator.snapshotMeta.ageLabel },
                  { label: 'Import History Count', value: creator.operations.importHistoryCount },
                ]}
                note={`Last updated: ${creator.operations.lastUpdated}`}
                emptyState={creator.operations.emptyState}
              />
            </div>
          </section>

          <AgentTable
            title="Agent Status"
            badges={[creator.agents.confidence, creator.agents.freshness, 'Inferred']}
            rows={creator.agents.items.map((agent) => ({
              id: agent.id,
              name: agent.name,
              role: agent.role,
              state: agent.state,
              task: agent.currentTask,
              progress: agent.progress,
              updatedAt: agent.updatedAt,
            }))}
            emptyState={creator.agents.emptyState}
          />
        </>
      ) : null}

      {displayDivision.id === 'bbh-studio' ? (
        <>
          <ReadOnlyBanner text="BBH Studio is read-only. No studio write actions, approvals, or project mutations execute from Command Center." />

          <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <SummaryPanel
              title="Division Summary"
              badges={[studio.operations.confidence, studio.operations.freshness]}
              stats={[
                { label: 'Active Projects', value: studio.division.activeProjects },
                { label: 'Waiting Client', value: studio.division.waitingClient },
                { label: 'Deadlines This Week', value: studio.division.deadlinesThisWeek },
                { label: 'Rendering Queue', value: studio.division.renderingQueue },
                { label: 'Proposal Queue', value: studio.division.proposalQueue },
                { label: 'Project Health', value: studio.division.projectHealth },
              ]}
              note={`Source: ${studio.operations.sourceLabel}`}
              emptyState={studio.operations.emptyState}
            />

            <div className="grid gap-4">
              <SummaryPanel
                title="Projects"
                badges={[studio.projects.confidence, studio.projects.freshness]}
                stats={[
                  { label: 'Active', value: studio.projects.active },
                  { label: 'Planning', value: studio.projects.planning },
                  { label: 'Paused', value: studio.projects.paused },
                  { label: 'At Risk', value: studio.projects.atRisk },
                ]}
                emptyState={studio.projects.emptyState}
              />
              <SummaryPanel
                title="Deadlines"
                badges={[studio.deadlines.confidence, studio.deadlines.freshness]}
                stats={[
                  { label: 'Timeline Due This Week', value: studio.deadlines.timelineDueThisWeek },
                  { label: 'Reviews Due This Week', value: studio.deadlines.reviewsDueThisWeek },
                  { label: 'Opening/Handover This Week', value: studio.deadlines.openingOrHandoverThisWeek },
                ]}
                emptyState={studio.deadlines.emptyState}
              />
              <SummaryPanel
                title="Queues"
                badges={[studio.queues.confidence, studio.queues.freshness]}
                stats={[
                  { label: 'Rendering Queue', value: studio.queues.renderingQueue },
                  { label: 'Proposal Queue', value: studio.queues.proposalQueue },
                ]}
                emptyState={studio.queues.emptyState}
              />
            </div>
          </section>

          <AgentTable
            title="Agent Status"
            badges={[studio.agents.confidence, studio.agents.freshness, 'Inferred']}
            rows={studio.agents.items.map((agent) => ({
              id: agent.id,
              name: agent.name,
              role: agent.role,
              state: agent.state,
              task: agent.currentTask,
              progress: agent.progress,
              updatedAt: agent.updatedAt,
            }))}
            emptyState={studio.agents.emptyState}
          />
        </>
      ) : null}

      {displayDivision.id === 'my-house' ? (
        <>
          <ReadOnlyBanner text="My House is read-only. This surface stays in tracking/status mode only and does not provide medical advice, diagnosis, or action execution." />

          <section className="grid gap-4 xl:grid-cols-2">
            <SummaryPanel
              title="Health"
              badges={[life.health.confidence, life.health.freshness]}
              stats={[
                { label: 'Running Plan Status', value: life.health.runningPlanStatus },
                { label: 'Weekly Sessions', value: life.health.weeklySessions },
                { label: 'Current Pace', value: life.health.currentPace },
                { label: 'Goal Pace', value: life.health.goalPace },
                { label: 'Recovery Status', value: life.health.recoveryStatus },
              ]}
              emptyState={life.health.emptyState}
            />

            <SummaryPanel
              title="Finance"
              badges={[life.finance.confidence, life.finance.freshness]}
              stats={[
                { label: 'DCA Status', value: life.finance.dcaStatus },
                { label: 'Passive Income Goal', value: life.finance.passiveIncomeGoal },
                { label: 'Emergency Fund Status', value: life.finance.emergencyFundStatus },
                { label: 'Personal Finance Health', value: life.finance.personalFinanceHealth },
              ]}
              emptyState={life.finance.emptyState}
            />

            <SummaryPanel
              title="Learning"
              badges={[life.learning.confidence, life.learning.freshness]}
              stats={[
                { label: 'English / TOEIC', value: life.learning.englishToeic },
                { label: 'AI Courses', value: life.learning.aiCourses },
                { label: 'Coding', value: life.learning.coding },
                { label: 'Study Queue', value: life.learning.studyQueue },
              ]}
              emptyState={life.learning.emptyState}
            />

            <SummaryPanel
              title="Mook"
              badges={[life.mook.confidence, life.mook.freshness]}
              stats={[
                { label: 'Training Status', value: life.mook.trainingStatus },
                { label: 'Knee / Recovery Status', value: life.mook.kneeRecoveryStatus },
                { label: 'Weekly Progress', value: life.mook.weeklyProgress },
              ]}
              emptyState={life.mook.emptyState}
            />
          </section>

          <AgentTable
            title="Agent Status"
            badges={[life.agents.confidence, life.agents.freshness]}
            rows={life.agents.items.map((agent) => ({
              id: agent.id,
              name: agent.name,
              role: agent.role,
              state: agent.state,
              task: agent.currentTask,
              progress: agent.progress,
              updatedAt: agent.updatedAt,
            }))}
            emptyState={life.agents.emptyState}
          />
        </>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <h3>{displayDivision.id === 'aequitas-capital' || displayDivision.id === 'creator-factory' || displayDivision.id === 'bbh-studio' || displayDivision.id === 'my-house' ? 'Read-only Rules' : 'Placeholder Notes'}</h3>
          <span className="pill">{displayDivision.id === 'aequitas-capital' || displayDivision.id === 'creator-factory' || displayDivision.id === 'bbh-studio' || displayDivision.id === 'my-house' ? 'Read-only' : 'Mock-only'}</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-[12px] border border-[var(--bb-border)]">
          {notesByDivision[displayDivision.id]?.map((note, index, list) => (
            <div key={note} className={`px-4 py-3 text-sm leading-6 text-[var(--bb-text-muted)] ${index !== list.length - 1 ? 'border-b border-[var(--bb-border)]' : ''}`}>
              {note}
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

const ReadOnlyBanner = ({ text }: { text: string }) => (
  <section className="rounded-[12px] border border-[var(--bb-accent-border)] bg-[var(--bb-accent-wash)] px-4 py-3">
    <div className="flex flex-wrap items-center gap-2">
      <ReadOnlyBadge />
      <span className="text-sm text-[var(--bb-text-muted)]">{text}</span>
    </div>
  </section>
)

const SummaryPanel = ({
  title,
  badges,
  stats,
  note,
  emptyState,
}: {
  title: string
  badges: string[]
  stats: Array<{ label: string; value: string | number }>
  note?: string
  emptyState?: string
}) => (
  <article className="panel">
    <div className="panel-header">
      <h3>{title}</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          badge === 'Fresh' || badge === 'Stale' || badge === 'Unknown'
            ? <FreshnessBadge key={`${title}-${badge}`} freshness={badge} />
            : badge === 'Real' || badge === 'Inferred' || badge === 'Fallback' || badge === 'Mock' || badge === 'Derived'
              ? <ConfidenceBadge key={`${title}-${badge}`} confidence={badge} />
              : <span key={`${title}-${badge}`} className="pill">{badge}</span>
        ))}
      </div>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <article key={`${title}-${stat.label}`} className="rounded-[10px] border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-3 py-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{stat.label}</p>
          <p className="mt-2 text-lg font-semibold leading-none tracking-[-0.02em] text-[var(--bb-text)]">{stat.value}</p>
        </article>
      ))}
    </div>
    {note ? <p className="mt-4 text-sm leading-6 text-[var(--bb-text-muted)]">{note}</p> : null}
    {emptyState ? <EmptyState message={emptyState} /> : null}
  </article>
)

const AgentTable = ({
  title,
  badges,
  rows,
  emptyState,
}: {
  title: string
  badges: string[]
  rows: Array<{
    id: string
    name: string
    role: string
    state: string
    task: string
    progress: number
    updatedAt: string
  }>
  emptyState?: string
}) => (
  <section className="panel">
    <div className="panel-header">
      <h3>{title}</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          badge === 'Fresh' || badge === 'Stale' || badge === 'Unknown'
            ? <FreshnessBadge key={`${title}-${badge}`} freshness={badge} />
            : badge === 'Real' || badge === 'Inferred' || badge === 'Fallback' || badge === 'Mock' || badge === 'Derived'
              ? <ConfidenceBadge key={`${title}-${badge}`} confidence={badge} />
              : <span key={`${title}-${badge}`} className="pill">{badge}</span>
        ))}
      </div>
    </div>
    <div className="mt-4 overflow-hidden rounded-[12px] border border-[var(--bb-border)]">
      <div className="grid grid-cols-[1.2fr_1fr_2fr_120px_90px] gap-3 border-b border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">
        <span>Agent</span>
        <span>Status</span>
        <span>Current Task</span>
        <span>Progress</span>
        <span>Updated</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[1.2fr_1fr_2fr_120px_90px] gap-3 border-b border-[var(--bb-border)] px-4 py-3 text-sm last:border-b-0">
          <div>
            <p className="font-semibold text-[var(--bb-text)]">{row.name}</p>
            <p className="mt-1 text-xs text-[var(--bb-text-faint)]">{row.role}</p>
          </div>
          <div className="flex items-start">
            <span className={row.state === 'running' ? 'pill-accent' : row.state === 'waiting-review' ? 'pill-amber' : 'pill-green'}>
              {row.state}
            </span>
          </div>
          <p className="leading-6 text-[var(--bb-text-muted)]">{row.task}</p>
          <div className="space-y-2">
            <WorkloadBar value={row.progress} tone={row.state === 'running' ? 'running' : row.state === 'waiting-review' ? 'waiting-review' : 'completed'} showValue={false} />
            <p className="text-xs text-[var(--bb-text-faint)]">{row.progress}%</p>
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">{row.updatedAt}</p>
        </div>
      ))}
    </div>
    {emptyState ? <EmptyState message={emptyState} /> : null}
  </section>
)

const EmptyState = ({ message }: { message: string }) => (
  <div className="mt-4 rounded-[12px] border border-dashed border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-4 py-3 text-sm leading-6 text-[var(--bb-text-muted)]">
    {message}
  </div>
)

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`
