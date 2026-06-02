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

  const queueTodayFocusReview = () => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.addTask',
      description: 'Command Center queued Today Focus review item',
      payload: { title: 'Reviewed from Command Center: source sync and client packet' },
    })
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[32px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-8">
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
          <div className="rounded-[28px] border border-black/[0.06] bg-white p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">
              AI Daily Brief
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
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <SourceStatusBadge status={sourceStatuses.commandCenter} />
          <SourceStatusBadge status={sourceStatuses.studio} />
          <SourceStatusBadge status={sourceStatuses.aiWorkflow} />
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Today Focus</p>
                  <h3>Manual review queue</h3>
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

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Studio Work</p>
                  <h3>Active projects and queue</h3>
                </div>
                <span className="pill">{activeProjects.length} active</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="rounded-2xl border border-black/[0.05] bg-white p-4">
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

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Finance</p>
                <h3>THB-first snapshot</h3>
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
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Timeline</p>
                  <h3>Activity stream</h3>
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

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Embedded AI</p>
                  <h3>Suggested next actions</h3>
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

        <aside className="space-y-5">
          <PendingApprovalPanel
            items={pendingApprovals}
            onApprove={approveActionRequest}
            onReject={rejectActionRequest}
          />

          <section className="panel">
            <div className="panel-header">
              <h3>AI Suggestions</h3>
              <span className="pill">{data.aiSuggestions.length}</span>
            </div>
            <div className="space-y-3">
              {data.aiSuggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                  <p className="text-sm font-semibold">{suggestion.title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#666666]">{suggestion.recommendation}</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-[#777777]">{suggestion.status}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
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

          <section className="panel">
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
