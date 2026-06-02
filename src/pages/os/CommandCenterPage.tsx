import { formatDate, formatDateTime } from '../../app/utils'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import type { SiteIssue, Task, TimelineItem } from '../../types/models'

const formatTHB = (value: number) => `THB ${Math.round(value).toLocaleString()}`

const getTone = (severity: SiteIssue['severity'] | TimelineItem['state'] | Task['status']) => {
  if (severity === 'high' || severity === 'at-risk') return 'text-[#c2410c]'
  if (severity === 'medium' || severity === 'doing') return 'text-[#9a6a1f]'
  return 'text-[#59634a]'
}

export const CommandCenterPage = () => {
  const {
    data,
    sourceStatuses,
    pendingApprovals,
    changeLogs,
    snapshots,
    createActionRequest,
    approveActionRequest,
    rejectActionRequest,
    queueSuggestionImport,
  } = useOs()

  const activeProjects = data.projects.filter((project) => project.status !== 'paused')
  const todayFocus = data.tasks.filter((task) => task.status !== 'done').slice(0, 4)
  const studioQueue = data.tasks.slice(0, 5)
  const atRiskTimeline = data.timeline.filter((item) => item.state === 'at-risk')
  const alerts = [
    ...data.siteIssues.filter((issue) => issue.severity !== 'low').map((issue) => ({
      id: issue.id,
      label: issue.issue,
      meta: `${issue.severity} studio risk`,
      tone: getTone(issue.severity),
    })),
    ...Object.values(sourceStatuses)
      .filter((status) => status.isStale)
      .map((status) => ({
        id: status.sourceName,
        label: `${status.sourceName} is stale`,
        meta: `${status.mode} source status`,
        tone: 'text-[#c2410c]',
      })),
  ]

  const portfolioValue = data.holdings.reduce((total, holding) => total + holding.quantity * holding.averageCost, 0)
  const reserveValue = data.familyFinanceRecords
    .filter((record) => record.bucket === 'reserve')
    .reduce((total, record) => total + record.amountTHB, 0)
  const monthlyBills = data.familyFinanceRecords
    .filter((record) => record.bucket === 'bill' || record.bucket === 'expense')
    .reduce((total, record) => total + record.amountTHB, 0)

  const commandSuggestions = data.aiSuggestions.filter((suggestion) =>
    suggestion.module.toLowerCase().includes('command'),
  )
  const primarySuggestion = commandSuggestions[0] ?? data.aiSuggestions[0]

  const activity = [
    ...data.timeline.slice(0, 4).map((item) => ({
      id: item.id,
      label: item.label,
      meta: `${formatDate(item.dueDate)} / ${item.state}`,
      tone: getTone(item.state),
    })),
    ...data.transactions.slice(0, 3).map((item) => ({
      id: item.id,
      label: item.description,
      meta: `${formatTHB(item.amountTHB)} / ${item.type}`,
      tone: 'text-[#59634a]',
    })),
    ...changeLogs.slice(0, 3).map((item) => ({
      id: item.id,
      label: item.summary,
      meta: `${item.actionType} / ${formatDateTime(item.changedAt)}`,
      tone: 'text-[#111111]',
    })),
  ]

  const studioFragments = [
    { label: 'material trace', tone: 'stone', caption: 'marble lot / sample variance' },
    { label: 'site frame', tone: 'paper', caption: 'HVAC alignment / field note' },
    { label: 'render crop', tone: 'ink', caption: 'client review packet' },
  ]

  const queueTodayFocusReview = () => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.addTask',
      description: 'Command Center queued Today Focus review item',
      payload: { title: 'Reviewed from Command Center: source sync and client packet' },
    })
  }

  return (
    <section className="command-center-space space-y-8">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
              Today / Command Center
            </p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">
              Por's operating surface for the day.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">
              Studio work, finance posture, AI notes, approvals, source health, and recent operating activity in one calm private workspace.
            </p>
          </div>
          <div className="intelligence-card rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">
              Jarvis B / Daily Brief
            </p>
            <p className="mt-4 text-xl font-semibold leading-snug">{primarySuggestion?.title ?? 'No daily brief yet'}</p>
            <p className="mt-3 text-sm leading-6 text-[#666666]">
              {primarySuggestion?.recommendation ?? 'Export context, review manually with Jarvis B, then import a suggestion.'}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#c2410c]">
              Risk note: {primarySuggestion?.riskNotes ?? 'No risk note imported.'}
            </p>
          </div>
        </div>
        <div className="today-context-strip mt-8 grid gap-3 rounded-[28px] border border-black/[0.04] bg-white/55 p-3 md:grid-cols-4">
          {[
            ['Operating state', alerts.length > 0 ? `${alerts.length} items watching` : 'clear field'],
            ['Focus mode', `${todayFocus.length} open loops`],
            ['Source posture', Object.values(sourceStatuses).some((status) => status.isStale) ? 'one stale source' : 'sources calm'],
            ['AI stance', primarySuggestion?.status ?? 'waiting'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#faf9f8]/80 px-4 py-3">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
              <p className="mt-2 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SourceStatusBadge status={sourceStatuses.commandCenter} />
          <SourceStatusBadge status={sourceStatuses.studio} />
          <SourceStatusBadge status={sourceStatuses.aiWorkflow} />
        </div>
      </header>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_370px]">
        <main className="space-y-7">
          <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <article className="panel panel-float reveal-soft">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Today Focus</p>
                  <h3>Focus queue</h3>
                </div>
                <button className="btn-primary" type="button" onClick={queueTodayFocusReview}>
                  Queue Focus Review
                </button>
              </div>
              <div className="space-y-3">
                {todayFocus.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                    <p className="text-sm font-semibold">{task.title}</p>
                    <p className={`mt-2 font-mono text-[10px] font-semibold uppercase tracking-wide ${getTone(task.status)}`}>
                      {task.status}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-[#777777]">
                This button demonstrates the Sheet-first flow: UI Action -&gt; ActionRequest -&gt; approval -&gt; mock SheetWriteAdapter -&gt; ChangeLog -&gt; Snapshot -&gt; refreshed OS.
              </p>
            </article>

            <article className="panel panel-float reveal-soft reveal-delay-1">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Studio Work</p>
                  <h3>Project pulse</h3>
                </div>
                <span className="pill">{activeProjects.length} active</span>
              </div>
              <div className="grid gap-5 md:grid-cols-[0.85fr_1fr]">
                <div className="space-y-3">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="surface-hover rounded-2xl border border-black/[0.05] bg-white p-4">
                      <p className="text-base font-semibold">{project.name}</p>
                      <p className="mt-1 text-xs text-[#777777]">{project.owner} / {project.status}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {studioQueue.map((task) => (
                    <div key={task.id} className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-3 last:border-b-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${getTone(task.status)}`}>{task.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="studio-fragment-board reveal-soft reveal-delay-2">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Studio Presence</p>
              <h3 className="mt-2 text-xl font-semibold">Pinned traces from the workspace</h3>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {studioFragments.map((fragment) => (
                <article key={fragment.label} className="studio-fragment surface-hover">
                  <div className={`studio-fragment-media studio-fragment-${fragment.tone}`} />
                  <p className="mt-4 text-sm font-semibold uppercase">{fragment.label}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-[#777777]">{fragment.caption}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel panel-float reveal-soft reveal-delay-3">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Finance</p>
                <h3>Calm THB posture</h3>
              </div>
              <span className="pill">manual only</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <FinanceTile
                eyebrow="Investments"
                title={formatTHB(portfolioValue)}
                body={`${data.holdings.length} holdings / DCA and dividend estimates only`}
              />
              <FinanceTile
                eyebrow="Family Office"
                title={formatTHB(reserveValue)}
                body={`Reserve posture / ${formatTHB(monthlyBills)} upcoming bill load`}
              />
              <FinanceTile
                eyebrow="Trading Lab"
                title={`${data.tradingSignals.length} paper signals`}
                body="Sandbox only. No broker execution. No auto trading."
                warning
              />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <article className="panel panel-float reveal-soft reveal-delay-4">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Timeline</p>
                  <h3>Activity rhythm</h3>
                </div>
                <span className="pill">{activity.length}</span>
              </div>
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="grid grid-cols-[0.8rem_1fr] gap-3 border-b border-black/[0.05] pb-3 last:border-b-0">
                    <span className={`mt-1 h-2 w-2 rounded-full bg-current ${item.tone}`} />
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[#777777]">{item.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel intelligence-card reveal-soft reveal-delay-5">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Embedded AI</p>
                  <h3>Quiet next actions</h3>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  'Review client packet before finance context switching.',
                  'Approve one source update, then check the snapshot log.',
                  'Keep Trading Lab paper-only until stale signal is refreshed.',
                ].map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-[#faf9f8] p-4">
                    <span className="font-mono text-[10px] font-bold text-[#777777]">{index + 1}</span>
                    <p className="text-sm leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </main>

        <aside className="intelligence-rail space-y-5">
          <div className="rounded-[30px] border border-black/[0.05] bg-[#111111] p-5 text-white shadow-[0_28px_70px_-52px_rgba(0,0,0,0.8)]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Jarvis B is observing</p>
            <p className="mt-4 text-sm leading-6 text-white/78">
              Watching approvals, stale sources, studio risks, and imported suggestions. Nothing applies without manual approval.
            </p>
          </div>
          <PendingApprovalPanel
            items={pendingApprovals}
            onApprove={approveActionRequest}
            onReject={rejectActionRequest}
          />

          <section className="panel rail-panel">
            <div className="panel-header">
              <h3>AI Suggestions</h3>
              <span className="pill">{data.aiSuggestions.length}</span>
            </div>
            <div className="space-y-3">
              {data.aiSuggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.id} className="surface-hover rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                  <p className="text-sm font-semibold">{suggestion.title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#666666]">{suggestion.recommendation}</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-[#777777]">{suggestion.status}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel rail-panel">
            <div className="panel-header">
              <h3>Alerts / Risks</h3>
              <span className="pill">{alerts.length}</span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-black/[0.05] bg-white p-4">
                  <p className="text-sm font-semibold">{alert.label}</p>
                  <p className={`mt-2 font-mono text-[10px] uppercase tracking-wide ${alert.tone}`}>{alert.meta}</p>
                </div>
              ))}
              {atRiskTimeline.length === 0 && alerts.length === 0 ? (
                <p className="text-sm text-[#777777]">No active alerts.</p>
              ) : null}
            </div>
          </section>

          <section className="panel rail-panel">
            <div className="panel-header">
              <h3>Source Status</h3>
            </div>
            <div className="space-y-3">
              {[sourceStatuses.investments, sourceStatuses.familyOffice, sourceStatuses.tradingLab].map((status) => (
                <SourceStatusBadge key={status.sourceName} status={status} />
              ))}
            </div>
          </section>

          <AIContextExportPanel contexts={data.aiContexts} />
          <AISuggestionImportPanel onImport={queueSuggestionImport} />
          <SnapshotLog items={snapshots} />
          <ChangeLogList items={changeLogs} />
        </aside>
      </div>
    </section>
  )
}

const FinanceTile = ({
  eyebrow,
  title,
  body,
  warning = false,
}: {
  eyebrow: string
  title: string
  body: string
  warning?: boolean
}) => (
  <div className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
    <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${warning ? 'text-[#c2410c]' : 'text-[#777777]'}`}>
      {eyebrow}
    </p>
    <p className="mt-4 text-2xl font-bold tracking-tight">{title}</p>
    <p className="mt-3 text-sm leading-6 text-[#666666]">{body}</p>
  </div>
)
