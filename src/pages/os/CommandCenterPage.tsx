import { type ReactNode } from 'react'
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
  if (severity === 'high' || severity === 'at-risk') return 'text-red'
  if (severity === 'medium' || severity === 'doing') return 'text-amber'
  return 'text-[var(--bb-green)]'
}

const HeroMetricCard = ({
  label,
  icon,
  iconColor,
  value,
  sub,
  progress,
  indicator,
}: {
  label: string
  icon: string
  iconColor: string
  value: string
  sub: string
  progress?: { value: number; color: string }
  indicator?: ReactNode
}) => (
  <div className={`os-hero-metric os-hero-metric-${iconColor}`}>
    <span className={`os-icon-badge os-icon-badge-${iconColor}`}>{icon}</span>
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p>
    <p className="os-hero-value">{value}</p>
    <p className="os-hero-sub">{sub}</p>
    {progress && (
      <div className="os-progress-rail">
        <div className={`os-progress-fill os-progress-fill-${progress.color}`} style={{ width: `${progress.value}%` }} />
      </div>
    )}
    {indicator}
  </div>
)

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
        tone: 'text-[var(--bb-amber)]',
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
      tone: 'text-[var(--bb-text-muted)]',
    })),
    ...changeLogs.slice(0, 3).map((item) => ({
      id: item.id,
      label: item.summary,
      meta: `${item.actionType} / ${formatDateTime(item.changedAt)}`,
      tone: 'text-[var(--bb-text)]',
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
      {/* HERO */}
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-5 md:p-6">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          ศูนย์ควบคุมวันนี้
        </h2>
        <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">
          Command Center
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <HeroMetricCard
            label="ต้องตรวจสอบ"
            icon="!"
            iconColor={attentionItems > 0 ? 'red' : 'green'}
            value={attentionItems > 0 ? `${attentionItems} รายการ` : 'ปกติ'}
            sub={topAttention || 'ไม่มีรายการที่ต้องตรวจสอบ'}
            progress={attentionItems > 0 ? { value: alertProgress, color: 'red' } : undefined}
            indicator={attentionItems > 0 ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="os-severity-dot os-severity-dot-red" />
                <span className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-red)]">{highSeverityCount} high</span>
              </div>
            ) : undefined}
          />
          <HeroMetricCard
            label="รออนุมัติ"
            icon="✓"
            iconColor={pendingApprovals.length > 0 ? 'amber' : 'green'}
            value={pendingApprovals.length > 0 ? `${pendingApprovals.length} รายการ` : 'ไม่มี'}
            sub={pendingApprovals[0]?.description?.slice(0, 28) || 'ไม่มีรายการรออนุมัติ'}
            indicator={pendingApprovals.length > 0 ? (
              <div className={`os-gauge-ring-sm mt-2`}>
                <div
                  className="os-gauge-ring-fill"
                  style={{ background: `conic-gradient(var(--bb-amber) ${Math.min(100, (pendingApprovals.length / 10) * 100)}%, transparent ${Math.min(100, (pendingApprovals.length / 10) * 100)}%)` }}
                />
                <div className="os-gauge-ring-inner">
                  <span className="os-gauge-value">{pendingApprovals.length}</span>
                </div>
              </div>
            ) : undefined}
          />
          <HeroMetricCard
            label="ฐานะการเงิน"
            icon="◎"
            iconColor="neutral"
            value={formatTHB(totalAssets)}
            sub={`พอร์ต ${formatTHB(portfolioValue)} | สำรอง ${formatTHB(reserveValue)}`}
            progress={{ value: financeProgress, color: 'neutral' }}
            indicator={portfolioValue > reserveValue ? (
              <div className="os-trend os-trend-up mt-1">◈ portfolio</div>
            ) : (
              <div className="os-trend os-trend-flat mt-1">◈ reserve</div>
            )}
          />
          <HeroMetricCard
            label="ข้อเสนอแนะ AI"
            icon="✦"
            iconColor={unreviewedSuggestions.length > 0 ? 'blue' : 'neutral'}
            value={unreviewedSuggestions.length > 0 ? `${unreviewedSuggestions.length} ต้องการรีวิว` : 'ไม่มี'}
            sub={primarySuggestion?.title?.slice(0, 28) || 'ไม่มีข้อเสนอแนะใหม่'}
            indicator={unreviewedSuggestions.length > 0 ? (
              <div className="os-confidence mt-2">
                <span className="font-mono text-[9px] font-semibold text-[var(--bb-blue)]">{unreviewedSuggestions.length} pending</span>
                <div className="os-confidence-rail">
                  <div className="os-confidence-fill os-confidence-fill-blue" style={{ width: `${Math.min(100, (unreviewedSuggestions.length / data.aiSuggestions.length) * 100)}%` }} />
                </div>
              </div>
            ) : undefined}
          />
        </div>
      </header>

      {/* LEVEL 2 (Operations) + LEVEL 3 (Reference) */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <main className="space-y-6">
          {/* — Focus Queue + Project Pulse (Primary Heroes) — */}
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="os-card-primary reveal-soft flex-1">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">โฟกัสวันนี้</p>
                  <h3>คิวงานวันนี้</h3>
                </div>
                <button className="btn-primary" type="button" onClick={queueTodayFocusReview}>
                  เพิ่มรีวิว
                </button>
              </div>
              <div className="space-y-2">
                {todayFocus.map((task) => (
                  <div key={task.id} className="os-list-row">
                    <p className="text-sm font-semibold">{task.title}</p>
                    <p className={`mt-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${getTone(task.status)}`}>
                      {task.status}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-[var(--bb-text-muted)]">
                UI Action → ActionRequest → อนุมัติ → mock → ChangeLog → Snapshot
              </p>
            </div>

            <div className="os-section-card reveal-soft reveal-delay-1">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">งานสตูดิโอ</p>
                  <h3>ชีพจรโปรเจกต์</h3>
                </div>
                <span className="pill">{activeProjects.length} โปรเจค</span>
              </div>
              <div className="space-y-2">
                {activeProjects.map((project) => {
                  const projectRisk = data.timeline.filter((t) => t.projectId === project.id && t.state === 'at-risk').length > 0
                  const projectIssues = data.siteIssues.filter((i) => i.projectId === project.id && i.severity !== 'low').length
                  return (
                    <div key={project.id} className={`os-list-row ${projectRisk ? 'border-[var(--bb-red-border)] bg-[var(--bb-red-soft)]' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">{project.name}</p>
                        {projectRisk ? <span className="font-mono text-[9px] font-semibold uppercase text-[var(--bb-red)]">มีความเสี่ยง</span> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{project.owner} / {project.timelineStatus ?? project.status}{projectIssues > 0 ? ` / ${projectIssues} ปัญหา` : ''}</p>
                    </div>
                  )
                })}
                {activeProjects.length === 0 && (
                  <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีโปรเจคที่กำลังดำเนินการ</p>
                )}
              </div>
            </div>
          </div>

          {/* — Pending Approvals (hero section) — */}
          <div className="reveal-soft reveal-delay-2">
            <PendingApprovalPanel
              items={pendingApprovals}
              onApprove={approveActionRequest}
              onReject={rejectActionRequest}
            />
          </div>

          {/* — Financial Posture — */}
          <div className="os-section-card reveal-soft reveal-delay-3">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">การเงิน</p>
                <h3>สรุปการเงิน</h3>
              </div>
              <span className="pill">ป้อนด้วยมือ</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <FinanceTile
                eyebrow="การลงทุน"
                title={formatTHB(portfolioValue)}
                body={`${data.holdings.length} รายการ / ประมาณการ DCA และปันผลเท่านั้น`}
              />
              <FinanceTile
                eyebrow="การเงินครอบครัว"
                title={formatTHB(reserveValue)}
                body={`สถานะสำรอง / ค่าใช้จ่ายที่กำลังจะถึง ${formatTHB(monthlyBills)}`}
              />
              <FinanceTile
                eyebrow="เทรดดิ้งแล็บ"
                title={`${data.tradingSignals.length} สัญญาณ`}
                body="Sandbox เท่านั้น ไม่มีการซื้อขายจริง"
                warning
              />
            </div>
          </div>

          {/* — Activity Timeline — */}
          <div className="os-section-card reveal-soft reveal-delay-4">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">กิจกรรม</p>
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

        {/* LEVEL 3: REFERENCE RAIL */}
        <aside className="intelligence-rail space-y-4">
          {/* Alerts */}
          <section className="os-reference-card">
            <div className="panel-header">
              <h3>การแจ้งเตือน / ความเสี่ยง</h3>
              <span className="pill">{alerts.length}</span>
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="os-list-row">
                  <p className="text-xs font-semibold">{alert.label}</p>
                  <p className={`mt-0.5 font-mono text-[9px] uppercase tracking-wide ${alert.tone}`}>{alert.meta}</p>
                </div>
              ))}
              {alerts.length === 0 && atRiskTimeline.length === 0 ? (
                <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีการแจ้งเตือน</p>
              ) : null}
            </div>
          </section>

          <section className="os-reference-card">
            <div className="panel-header">
              <h3>สถานะแหล่งข้อมูล</h3>
            </div>
            <div className="space-y-2">
              {[sourceStatuses.investments, sourceStatuses.familyOffice, sourceStatuses.tradingLab].map((status) => (
                <SourceStatusBadge key={status.sourceName} status={status} />
              ))}
            </div>
          </section>

          {/* AI Suggestions (demoted to reference) */}
          <section className="os-reference-card">
            <div className="panel-header">
              <h3>ข้อเสนอแนะ AI</h3>
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
                <p className="text-xs text-[var(--bb-text-muted)]">ไม่มีข้อเสนอแนะ</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* REFERENCE BOTTOM ROW */}
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
