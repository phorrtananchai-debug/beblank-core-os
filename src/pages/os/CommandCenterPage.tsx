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

  const setupModules = [
    { label: 'Studio', icon: '◇', count: data.projects.length, unit: 'Projects', href: '/os/studio', action: 'Create First Project' },
    { label: 'Capital', icon: '◎', count: data.financeLedgerRows.length + data.reserveRows.length, unit: 'Records', href: '/os/capital', action: 'Add Capital Record' },
    { label: 'Investments', icon: '◈', count: data.holdings.length, unit: 'Assets', href: '/os/finance/investments', action: 'Setup Portfolio' },
    { label: 'AI', icon: '✦', count: data.aiContexts.length, unit: 'Contexts', href: '/os/ai', action: 'Create AI Context' },
  ]
  const completedCount = setupModules.filter((m) => m.count > 0).length
  const totalModules = setupModules.length

  const isEmpty = data.projects.length === 0 && data.tasks.length === 0

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
              {isEmpty
                ? 'Workspace พร้อมเริ่มต้น — ทำตามขั้นตอนด้านล่างเพื่อตั้งค่าระบบ'
                : `วันนี้มี ${attentionItems} รายการที่ต้องตรวจสอบ และ ${pendingApprovals.length} งานที่ควรตัดสินใจ`}
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
      </header>

        {isEmpty ? (
          <>
            {/* WORKSPACE SUMMARY */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {setupModules.map((mod) => (
                <div
                  key={mod.label}
                  className="os-hero-metric os-hero-metric-neutral cursor-pointer"
                  onClick={() => navigate(mod.href)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(mod.href) }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`os-icon-badge os-icon-badge-neutral`}>{mod.icon}</span>
                    <span className="mt-1 text-xs text-[var(--bb-text-faint)]">→</span>
                  </div>
                  <p className="os-hero-value">{mod.count}</p>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{mod.label}</p>
                  <p className="os-hero-sub">{mod.unit}</p>
                </div>
              ))}
            </div>

            {/* SETUP + QUICK START */}
            <div className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Workspace Setup</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight">Workspace พร้อมเริ่มต้น</h3>
                  <p className="mt-1 text-sm text-[var(--bb-text-soft)]">
                    {completedCount}/{totalModules} Complete
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {setupModules.map((mod) => (
                    <div
                      key={mod.label}
                      className={`h-2 w-8 rounded-full ${mod.count > 0 ? 'bg-[var(--bb-green)]' : 'bg-black/[0.08]'}`}
                      title={mod.label}
                    />
                  ))}
                </div>
              </div>

              <hr className="my-6 border-black/[0.06]" />

              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Quick Start</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {setupModules.filter((mod) => mod.count === 0).map((mod) => (
                  <div
                    key={mod.label}
                    className="rounded-[20px] border border-dashed border-black/[0.12] bg-white p-4 transition-shadow duration-200 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold">{mod.action}</p>
                    <p className="mt-1 text-xs text-[var(--bb-text-muted)]">เริ่มต้นใช้งาน {mod.label}</p>
                    <button
                      className="btn-primary mt-4"
                      type="button"
                      onClick={() => navigate(mod.href)}
                    >
                      ไปที่ {mod.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
        {/* KPI NAV CARDS */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiNavCard
            label="Pending Reviews"
            icon="!"
            iconColor={attentionItems > 0 ? 'red' : 'green'}
            value={attentionItems > 0 ? `${attentionItems}` : '—'}
            sub={topAttention || 'ไม่มีรายการที่ต้องตรวจสอบ'}
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
            value={pendingApprovals.length > 0 ? `${pendingApprovals.length}` : '—'}
            sub={pendingApprovals[0]?.description?.slice(0, 28) || 'ไม่มี pending approvals'}
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
            value={totalAssets > 0 ? formatTHB(totalAssets) : '—'}
            sub={totalAssets > 0 ? `Portfolio ${formatTHB(portfolioValue)}` : 'ไม่มีข้อมูลทางการเงิน'}
            progress={totalAssets > 0 ? { value: financeProgress, color: 'neutral' } : undefined}
            href="/os/finance"
          />
          <KpiNavCard
            label="AI Suggestions"
            icon="✦"
            iconColor={unreviewedSuggestions.length > 0 ? 'blue' : 'neutral'}
            value={unreviewedSuggestions.length > 0 ? `${unreviewedSuggestions.length}` : '—'}
            sub={primarySuggestion?.title?.slice(0, 28) || 'ไม่มีคำแนะนำ AI'}
            href="/os/ai"
          />
        </div>

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
                  <div className="rounded-[20px] border border-dashed border-black/[0.08] bg-white/50 p-4 text-center">
                    <p className="text-sm font-semibold text-[var(--bb-text-muted)]">ยังไม่มีงานในวันนี้</p>
                    <p className="mt-1 text-xs text-[var(--bb-text-faint)]">กด Add Review เพื่อเพิ่ม Focus item แรก</p>
                  </div>
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
                {activeProjects.length === 0 && (
                  <div className="rounded-[20px] border border-dashed border-black/[0.08] bg-white/50 p-4 text-center">
                    <p className="text-sm font-semibold text-[var(--bb-text-muted)]">ยังไม่มีโปรเจกต์</p>
                    <p className="mt-1 text-xs text-[var(--bb-text-faint)]">ไปที่ Studio เพื่อสร้างโปรเจกต์แรก</p>
                  </div>
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
                title={portfolioValue > 0 ? formatTHB(portfolioValue) : '—'}
                body={portfolioValue > 0 ? `${data.holdings.length} holdings / DCA + dividends estimate` : 'ยังไม่มีข้อมูลพอร์ตการลงทุน'}
              />
              <FinanceTile
                eyebrow="Family Office"
                title={reserveValue > 0 ? formatTHB(reserveValue) : '—'}
                body={reserveValue > 0 ? `Reserve status / Upcoming expenses ${formatTHB(monthlyBills)}` : 'ยังไม่มีข้อมูลครอบครัว'}
              />
              <FinanceTile
                eyebrow="Trading Lab"
                title={data.tradingSignals.length > 0 ? `${data.tradingSignals.length} signals` : '—'}
                body={data.tradingSignals.length > 0 ? 'Sandbox only. No live execution.' : 'ยังไม่มีสัญญาณ'}
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
              {activity.length === 0 && (
                <div className="rounded-[20px] border border-dashed border-black/[0.08] bg-white/50 p-4 text-center">
                  <p className="text-sm font-semibold text-[var(--bb-text-muted)]">ยังไม่มีกิจกรรม</p>
                  <p className="mt-1 text-xs text-[var(--bb-text-faint)]">กิจกรรมจะปรากฏเมื่อมีข้อมูลโปรเจกต์และการเงิน</p>
                </div>
              )}
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
              {alerts.length === 0 && atRiskTimeline.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/50 p-3 text-center">
                  <p className="text-xs font-semibold text-[var(--bb-text-muted)]">ไม่มีรายการแจ้งเตือน</p>
                  <p className="mt-0.5 text-[10px] text-[var(--bb-text-faint)]">ทุกระบบปกติ</p>
                </div>
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
              {data.aiSuggestions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/50 p-3 text-center">
                  <p className="text-xs font-semibold text-[var(--bb-text-muted)]">ไม่มีคำแนะนำ AI</p>
                  <p className="mt-0.5 text-[10px] text-[var(--bb-text-faint)]">คำแนะนำจะปรากฏเมื่อมีข้อมูลในระบบ</p>
                </div>
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
          </>
        )}
    </section>
  )
}
