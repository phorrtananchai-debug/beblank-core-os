import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkspaceDrawer } from '../../components/shared/WorkspaceDrawer'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { BridgeStatusWidget } from '../../components/shared/BridgeStatusWidget'
import { SourceHealthMonitor } from '../../components/shared/SourceHealthMonitor'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { AttentionCenter } from '../../components/dashboard/AttentionCenter'
import { ExecutiveSummary } from '../../components/dashboard/ExecutiveSummary'
import { StudioHealthCard } from '../../components/dashboard/StudioHealthCard'
import { useProfile } from '../../hooks/useProfile'
import { CapitalHealthCard } from '../../components/dashboard/CapitalHealthCard'
import { InvestmentHealthCard } from '../../components/dashboard/InvestmentHealthCard'
import { DailyFocusCard } from '../../components/dashboard/DailyFocusCard'
import { useOs } from '../../core/os/useOs'
import { loadWriteHistory, loadWriteStatusSummary } from '../../core/sheetBridge/writeback'
import type { SiteIssue, Task, TimelineItem } from '../../types/models'



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





export const CommandCenterPage = () => {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const {
    data,
    sourceStatuses,
    pendingApprovals,
    changeLogs,
    snapshots,
    approveActionRequest,
    rejectActionRequest,
    queueSuggestionImport,
  } = useOs()

  const activeProjects = data.projects.filter((project) => project.status !== 'paused')
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

  const driftCount = data.holdings.filter((holding) => Math.abs((holding.allocationPercent ?? 0) - (holding.targetAllocationPercent ?? 0)) >= 2).length
  const attentionItems = alerts.length + atRiskTimeline.length

  const bridgeHistory = loadWriteHistory()
  const bridgeStatus = loadWriteStatusSummary()
  const bridgeLastSuccess = bridgeHistory.find((h) => h.status === 'success')
  const bridgeLastFailed = bridgeHistory.find((h) => h.status === 'failed')
  const bridgeOverallStatus: 'healthy' | 'watch' | 'atRisk' | 'empty' = !bridgeHistory.length && !bridgeStatus.pending
    ? 'empty'
    : bridgeLastFailed && (!bridgeLastSuccess || bridgeLastFailed.writtenAt > (bridgeLastSuccess?.writtenAt ?? ''))
      ? 'atRisk'
      : 'healthy'

  const setupModules = [
    { label: 'Studio', icon: '◇', count: data.projects.length, unit: 'Projects', href: '/os/studio', action: 'Create First Project' },
    { label: 'Capital', icon: '◎', count: data.financeLedgerRows.length + data.reserveRows.length, unit: 'Records', href: '/os/capital', action: 'Add Capital Record' },
    { label: 'Investments', icon: '◈', count: data.holdings.length, unit: 'Assets', href: '/os/finance/investments', action: 'Setup Portfolio' },
    { label: 'AI', icon: '✦', count: data.aiContexts.length, unit: 'Contexts', href: '/os/ai', action: 'Create AI Context' },
  ]
  const completedCount = setupModules.filter((m) => m.count > 0).length
  const totalModules = setupModules.length

  const isEmpty = data.projects.length === 0 && data.tasks.length === 0
  const [showAiDrawer, setShowAiDrawer] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  return (
    <section className="command-center-space space-y-5">
      {/* DAILY BRIEFING */}
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold md:text-2xl">{greetingText()}, {profile.displayName}.</h2>
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
          {/* ATTENTION CENTER */}
          <AttentionCenter
            pendingApprovals={pendingApprovals}
            holdings={data.holdings}
            dcaRecords={data.dcaRecords}
            timeline={data.timeline}
            siteIssues={data.siteIssues}
            sourceStatuses={sourceStatuses}
          />

          {/* DAILY FOCUS — primary block */}
          <DailyFocusCard
            tasks={data.tasks}
            timeline={data.timeline}
            pendingApprovals={pendingApprovals}
            siteIssues={data.siteIssues}
            onNavigate={navigate}
          />

          {/* EXECUTIVE SUMMARY — concise status strip */}
        <ExecutiveSummary
          studio={{
            label: 'Studio',
            status: activeProjects.length > 0 ? 'healthy' : atRiskTimeline.length > 0 ? 'atRisk' : 'empty',
            detail: atRiskTimeline.length > 0 ? `${atRiskTimeline.length} at-risk` : activeProjects.length > 0 ? `${data.tasks.filter(t => t.status !== 'done').length} tasks` : 'No data',
          }}
          capital={{
            label: 'Capital',
            status: data.financeLedgerRows.length > 0 ? 'healthy' : 'empty',
            detail: data.financeLedgerRows.length > 0 ? `${data.financeLedgerRows.length} records` : 'No data',
          }}
          investment={{
            label: 'Investments',
            status: data.holdings.length > 0 ? (driftCount > 0 ? 'watch' : 'healthy') : 'empty',
            detail: data.holdings.length > 0 ? (driftCount > 0 ? `${driftCount} drifted` : 'On target') : 'No data',
          }}
          bridge={{
            label: 'Bridge',
            status: bridgeOverallStatus,
            detail: bridgeOverallStatus === 'empty' ? 'No activity' : bridgeOverallStatus === 'atRisk' ? 'Write failed' : `${bridgeHistory.length} writes`,
          }}
        />

        {/* STUDIO + CAPITAL + INVESTMENT HEALTH */}
          <div className="grid gap-4 xl:grid-cols-3">
          <StudioHealthCard projects={data.projects} tasks={data.tasks} timeline={data.timeline} />
          <CapitalHealthCard financeLedgerRows={data.financeLedgerRows} reserveRows={data.reserveRows} familyFinanceRecords={data.familyFinanceRecords} />
          <InvestmentHealthCard holdings={data.holdings} dcaRecords={data.dcaRecords} dividendRecords={data.dividendRecords} tradingWatchlist={data.tradingWatchlist} />
        </div>

        {/* PENDING APPROVALS PANEL */}
        <div>
          <PendingApprovalPanel
            items={pendingApprovals}
            onApprove={approveActionRequest}
            onReject={rejectActionRequest}
          />
        </div>

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

          {/* BRIDGE STATUS */}
          <BridgeStatusWidget />

          {/* SOURCE HEALTH */}
          <SourceHealthMonitor />

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

          {/* COMPACT BOTTOM ACTIONS */}
          <div className="grid gap-4 xl:grid-cols-3">
            <button className="rounded-2xl border border-black/[0.05] bg-white/60 p-4 text-left transition hover:bg-black/[0.03]" type="button" onClick={() => setShowAiDrawer(true)}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">AI Workspace</p>
              <p className="mt-1 text-sm font-semibold">{data.aiContexts.length} contexts · {data.aiSuggestions.length} suggestions</p>
              <p className="mt-0.5 text-xs text-[var(--bb-text-faint)]">Open AI Workspace →</p>
            </button>
            <button className="rounded-2xl border border-black/[0.05] bg-white/60 p-4 text-left transition hover:bg-black/[0.03]" type="button" onClick={() => setShowHistoryDrawer(true)}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">History</p>
              <p className="mt-1 text-sm font-semibold">{changeLogs.length} changes · {snapshots.length} snapshots</p>
              <p className="mt-0.5 text-xs text-[var(--bb-text-faint)]">Open History →</p>
            </button>
            <div className="rounded-2xl border border-black/[0.05] bg-white/60 p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Latest Snapshot</p>
              <p className="mt-1 text-sm font-semibold">{snapshots.length > 0 ? new Date(snapshots[0].createdAt).toLocaleDateString() : 'No snapshots'}</p>
              <p className="mt-0.5 text-xs text-[var(--bb-text-faint)]">{snapshots.length} total records</p>
            </div>
          </div>

          {/* AI WORKSPACE DRAWER */}
          <WorkspaceDrawer open={showAiDrawer} onClose={() => setShowAiDrawer(false)} title="AI Workspace">
            <div className="space-y-5">
              <AIContextExportPanel contexts={data.aiContexts} />
              <AISuggestionImportPanel onImport={queueSuggestionImport} />
            </div>
          </WorkspaceDrawer>

          {/* HISTORY DRAWER */}
          <WorkspaceDrawer open={showHistoryDrawer} onClose={() => setShowHistoryDrawer(false)} title="System History">
            <div className="space-y-5">
              <SnapshotLog items={snapshots} />
              <ChangeLogList items={changeLogs} />
            </div>
          </WorkspaceDrawer>
          </>
        )}
    </section>
  )
}
