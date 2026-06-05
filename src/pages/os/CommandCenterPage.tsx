import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatDateTime } from '../../app/utils'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import type { SiteIssue, Task, TimelineItem } from '../../types/models'

const formatTHB = (value: number) => `THB ${Math.round(value).toLocaleString('en-US')}`

const getTone = (severity: SiteIssue['severity'] | TimelineItem['state'] | Task['status']) => {
  if (severity === 'high' || severity === 'at-risk') return 'text-red'
  if (severity === 'medium' || severity === 'doing') return 'text-amber'
  return 'text-[var(--bb-green)]'
}

const greetingText = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const KpiNavCard = ({
  label,
  icon,
  iconColor,
  value,
  sub,
  progress,
  indicator,
  href,
}: {
  label: string
  icon: string
  iconColor: string
  value: string
  sub: string
  progress?: { value: number; color: string }
  indicator?: ReactNode
  href: string
}) => {
  const navigate = useNavigate()
  const parts = value.split(/\s+/)
  const num = parts.filter((p) => p !== 'THB').join(' ')
  const hasThb = parts.includes('THB')
  return (
    <div
      className={`os-hero-metric os-hero-metric-${iconColor} cursor-pointer`}
      onClick={() => navigate(href)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(href) }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`os-icon-badge os-icon-badge-${iconColor}`}>{icon}</span>
        <span className="mt-1 text-xs text-[var(--bb-text-faint)]">→</span>
      </div>
      <p className="os-hero-value">{num}</p>
      {hasThb && <p className="os-hero-unit">THB</p>}
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p>
      <p className="os-hero-sub">{sub}</p>
      {progress && (
        <div className="os-progress-rail">
          <div className={`os-progress-fill os-progress-fill-${progress.color}`} style={{ width: `${progress.value}%` }} />
        </div>
      )}
      {indicator}
    </div>
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
  <div className="rounded-[20px] border border-black/[0.05] bg-[#faf9f8] p-4">
    <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${warning ? 'text-[var(--bb-amber)]' : 'text-[var(--bb-text-muted)]'}`}>
      {eyebrow}
    </p>
    <p className="mt-3 text-xl font-bold tracking-tight">{title}</p>
    <p className="mt-2 text-sm leading-5 text-[var(--bb-text-soft)]">{body}</p>
  </div>
)

const DirectiveRow = ({
  title,
  status,
  tone,
  onClick,
}: {
  title: string
  status: string
  tone: string
  onClick: () => void
}) => (
  <div
    className="os-list-row flex cursor-pointer items-center justify-between gap-3 transition-all duration-200 hover:border-[var(--bb-border)]"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
  >
    <div className="flex items-center gap-3">
      <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full bg-current ${tone}`} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className={`mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{status}</p>
      </div>
    </div>
    <span className="text-xs text-[var(--bb-text-faint)]">→</span>
  </div>
)

const ProjectNavRow = ({
  name,
  owner,
  status,
  issueCount,
  risk,
  onClick,
}: {
  name: string
  owner: string
  status: string
  issueCount: number
  risk: boolean
  onClick: () => void
}) => (
  <div
    className={`os-list-row flex cursor-pointer items-center justify-between gap-3 transition-all duration-200 hover:border-[var(--bb-border)] ${risk ? 'border-[var(--bb-red-border)] bg-[var(--bb-red-soft)]' : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">{name}</p>
        {risk ? <span className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-red)]">at risk</span> : null}
      </div>
      <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">
        {owner} / {status}{issueCount > 0 ? ` / ${issueCount} issues` : ''}
      </p>
    </div>
    <span className="text-xs text-[var(--bb-text-faint)]">→</span>
  </div>
)

export const CommandCenterPage = () => {
  const navigate = useNavigate()
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
  const atRiskTimeline = data.timeline.filter((item) => item.state === 'at-risk')

  const alerts = [
    ...data.siteIssues.filter((issue) => issue.severity !== 'low').map((issue) => ({
      id: issue.id,
      label: issue.issue,
      meta: `${issue.severity} risk`,
      tone: getTone(issue.severity),
      severity: issue.severity,
    })),
    ...Object.values(sourceStatuses)
      .filter((status) => status.isStale)
      .map((status) => ({
        id: status.sourceName,
        label: `${status.sourceName} is stale`,
        meta: `${status.mode} source`,
        tone: 'text-[var(--bb-amber)]' as const,
        severity: 'medium' as const,
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
  const unreviewedSuggestions = data.aiSuggestions.filter((s) => s.status === 'imported')

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
      tone: 'text-[var(--bb-text-muted)]' as const,
    })),
    ...changeLogs.slice(0, 3).map((item) => ({
      id: item.id,
      label: item.summary,
      meta: `${item.actionType} / ${formatDateTime(item.changedAt)}`,
      tone: 'text-[var(--bb-text)]' as const,
    })),
  ]

  const totalAssets = portfolioValue + reserveValue
  const attentionItems = alerts.length + atRiskTimeline.length
  const topAttention = alerts[0]?.label || atRiskTimeline[0]?.label || ''

  const highSeverityCount = data.siteIssues.filter((i) => i.severity === 'high').length
  const alertProgress = attentionItems > 0 ? Math.round((highSeverityCount / attentionItems) * 100) : 0
  const financeProgress = totalAssets > 0 ? Math.round((portfolioValue / totalAssets) * 100) : 0

  const queueTodayFocusReview = () => {
    createActionRequest({
      module: 'studio',
      actionType: 'studio.addTask',
      description: 'Command Center queued Today Focus review item',
      payload: { title: 'Reviewed from Command Center: source sync and client packet' },
    })
  }

  return (
    <section className="command-center-space space-y-6">
      {/* DAILY BRIEFING */}
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold md:text-2xl">{greetingText()}, Por.</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--bb-text-soft)]">
              วันนี้มี {attentionItems} รายการที่ต้องตรวจสอบ และ {pendingApprovals.length} งานที่ควรตัดสินใจ
            </p>
          </div>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--bb-text-faint)]">Command Center</span>
        </div>

        {/* COMMAND BAR */}
        <div className="relative mt-5">
          <div className="flex items-center gap-3 rounded-full border border-[var(--bb-border)] bg-white px-5 py-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <span className="text-sm text-[var(--bb-text-muted)]">⌘</span>
            <span className="flex-1 text-sm text-[var(--bb-text-muted)]">Search project, approval, capital, or action…</span>
            <span className="rounded-md border border-[var(--bb-border)] bg-[var(--bb-surface-3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--bb-text-faint)]">⌘K</span>
          </div>
        </div>

        {/* KPI NAV CARDS */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiNavCard
            label="Pending Reviews"
            icon="!"
            iconColor={attentionItems > 0 ? 'red' : 'green'}
            value={attentionItems > 0 ? `${attentionItems}` : '0'}
            sub={topAttention || 'No pending reviews'}
            progress={attentionItems > 0 ? { value: alertProgress, color: 'red' } : undefined}
            indicator={attentionItems > 0 ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="os-severity-dot os-severity-dot-red" />
                <span className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-red)]">{highSeverityCount} high</span>
              </div>
            ) : undefined}
            href="/os/studio"
          />
          <KpiNavCard
            label="Approvals"
            icon="✓"
            iconColor={pendingApprovals.length > 0 ? 'amber' : 'green'}
            value={pendingApprovals.length > 0 ? `${pendingApprovals.length}` : '0'}
            sub={pendingApprovals[0]?.description?.slice(0, 28) || 'No pending approvals'}
            indicator={pendingApprovals.length > 0 ? (
              <div className="os-gauge-ring-sm mt-2">
                <div
                  className="os-gauge-ring-fill"
                  style={{ background: `conic-gradient(var(--bb-amber) ${Math.min(100, (pendingApprovals.length / 10) * 100)}%, transparent ${Math.min(100, (pendingApprovals.length / 10) * 100)}%)` }}
                />
                <div className="os-gauge-ring-inner">
                  <span className="os-gauge-value">{pendingApprovals.length}</span>
                </div>
              </div>
            ) : undefined}
            href="/os/studio"
          />
          <KpiNavCard
            label="Financial Posture"
            icon="◎"
            iconColor="neutral"
            value={formatTHB(totalAssets)}
            sub={`Portfolio ${formatTHB(portfolioValue)}`}
            progress={{ value: financeProgress, color: 'neutral' }}
            indicator={portfolioValue > reserveValue ? (
              <div className="os-trend os-trend-up mt-1">◈ portfolio</div>
            ) : (
              <div className="os-trend os-trend-flat mt-1">◈ reserve</div>
            )}
            href="/os/finance"
          />
          <KpiNavCard
            label="AI Suggestions"
            icon="✦"
            iconColor={unreviewedSuggestions.length > 0 ? 'blue' : 'neutral'}
            value={unreviewedSuggestions.length > 0 ? `${unreviewedSuggestions.length}` : '0'}
            sub={primarySuggestion?.title?.slice(0, 28) || 'No new suggestions'}
            indicator={unreviewedSuggestions.length > 0 ? (
              <div className="os-confidence mt-2">
                <span className="font-mono text-[9px] font-semibold text-[var(--bb-blue)]">{unreviewedSuggestions.length} pending</span>
                <div className="os-confidence-rail">
                  <div className="os-confidence-fill os-confidence-fill-blue" style={{ width: `${Math.min(100, (unreviewedSuggestions.length / data.aiSuggestions.length) * 100)}%` }} />
                </div>
              </div>
            ) : undefined}
            href="/os/ai"
          />
        </div>
      </header>

      {/* MAIN + RAIL LAYOUT */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <main className="space-y-6">
          {/* IMMEDIATE DIRECTIVES */}
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="os-card-primary reveal-soft flex-1">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Immediate Directives</p>
                  <h3>คิวงานวันนี้</h3>
                </div>
                <button className="btn-primary" type="button" onClick={queueTodayFocusReview}>
                  Add Review
                </button>
              </div>
              <div className="space-y-2">
                {todayFocus.map((task) => (
                  <DirectiveRow
                    key={task.id}
                    title={task.title}
                    status={task.status}
                    tone={getTone(task.status)}
                    onClick={() => navigate('/os/studio')}
                  />
                ))}
                {todayFocus.length === 0 && (
                  <p className="text-sm text-[var(--bb-text-muted)]">No pending directives</p>
                )}
              </div>
            </div>

            {/* STUDIO PROJECT PULSE */}
            <div className="os-section-card reveal-soft reveal-delay-1 flex-1">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Studio Pulse</p>
                  <h3>โปรเจกต์ที่กำลังดำเนินการ</h3>
                </div>
                <span className="pill">{activeProjects.length} projects</span>
              </div>
              <div className="space-y-2">
                {activeProjects.map((project) => {
                  const projectRisk = data.timeline.filter((t) => t.projectId === project.id && t.state === 'at-risk').length > 0
                  const projectIssues = data.siteIssues.filter((i) => i.projectId === project.id && i.severity !== 'low').length
                  return (
                    <ProjectNavRow
                      key={project.id}
                      name={project.name}
                      owner={project.owner}
                      status={project.timelineStatus ?? project.status}
                      issueCount={projectIssues}
                      risk={projectRisk}
                      onClick={() => navigate('/os/studio')}
                    />
                  )
                })}
                {activeProjects.length === 0 && (
                  <p className="text-sm text-[var(--bb-text-muted)]">No active projects</p>
                )}
              </div>
            </div>
          </div>

          {/* PENDING APPROVALS */}
          <div className="reveal-soft reveal-delay-2">
            <PendingApprovalPanel
              items={pendingApprovals}
              onApprove={approveActionRequest}
              onReject={rejectActionRequest}
            />
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="os-section-card reveal-soft reveal-delay-3">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Financial Summary</p>
                <h3>สรุปการเงิน</h3>
              </div>
              <span className="pill">manual entry</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <FinanceTile
                eyebrow="Investments"
                title={formatTHB(portfolioValue)}
                body={`${data.holdings.length} holdings / DCA + dividends estimate`}
              />
              <FinanceTile
                eyebrow="Family Office"
                title={formatTHB(reserveValue)}
                body={`Reserve status / Upcoming expenses ${formatTHB(monthlyBills)}`}
              />
              <FinanceTile
                eyebrow="Trading Lab"
                title={`${data.tradingSignals.length} signals`}
                body="Sandbox only. No live execution."
                warning
              />
            </div>
          </div>

          {/* ACTIVITY TIMELINE */}
          <div className="os-section-card reveal-soft reveal-delay-4">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Activity</p>
                <h3>จังหวะกิจกรรม</h3>
              </div>
              <span className="pill">{activity.length}</span>
            </div>
            <div className="space-y-2">
              {activity.map((item) => (
                <div key={item.id} className="grid grid-cols-[0.8rem_1fr] gap-3 border-b border-black/[0.05] pb-2 last:border-b-0">
                  <span className={`mt-1 h-2 w-2 rounded-full bg-current ${item.tone}`} />
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--bb-text-muted)]">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* RIGHT RAIL */}
        <aside className="intelligence-rail space-y-4">
          {/* ALERTS / RISKS */}
          <section className="os-reference-card">
            <div className="panel-header">
              <h3>Alerts / Risks</h3>
              <span className="pill">{alerts.length}</span>
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const severityClass = alert.severity === 'high'
                  ? 'os-severity-dot-red'
                  : alert.severity === 'medium'
                    ? 'os-severity-dot-amber'
                    : 'os-severity-dot-green'
                return (
                  <div key={alert.id} className="os-list-row flex items-center gap-3">
                    <span className={`os-severity-dot ${severityClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{alert.label}</p>
                      <p className={`mt-0.5 font-mono text-[9px] uppercase tracking-wide ${alert.tone}`}>{alert.meta}</p>
                    </div>
                  </div>
                )
              })}
              {alerts.length === 0 && atRiskTimeline.length === 0 ? (
                <p className="text-sm text-[var(--bb-text-muted)]">No alerts</p>
              ) : null}
            </div>
          </section>

          {/* SOURCE STATUS */}
          <section className="os-reference-card">
            <div className="panel-header">
              <h3>Source Status</h3>
            </div>
            <div className="space-y-2">
              {[sourceStatuses.investments, sourceStatuses.familyOffice, sourceStatuses.tradingLab].map((status) => (
                <SourceStatusBadge key={status.sourceName} status={status} />
              ))}
            </div>
          </section>

          {/* AI SUGGESTIONS */}
          <section className="os-reference-card">
            <div className="panel-header">
              <h3>AI Suggestions</h3>
              <span className="pill">{data.aiSuggestions.length}</span>
            </div>
            <div className="space-y-2">
              {data.aiSuggestions.slice(0, 2).map((suggestion) => (
                <div key={suggestion.id} className="os-list-row">
                  <p className="text-xs font-semibold">{suggestion.title}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-[var(--bb-text-muted)]">{suggestion.status}</p>
                </div>
              ))}
              {data.aiSuggestions.length === 0 && (
                <p className="text-xs text-[var(--bb-text-muted)]">No suggestions</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* BOTTOM PANELS */}
      <div className="grid gap-5 xl:grid-cols-2">
        <AIContextExportPanel contexts={data.aiContexts} />
        <AISuggestionImportPanel onImport={queueSuggestionImport} />
      </div>
      <section className="grid gap-5 xl:grid-cols-2">
        <SnapshotLog items={snapshots} />
        <ChangeLogList items={changeLogs} />
      </section>
    </section>
  )
}
