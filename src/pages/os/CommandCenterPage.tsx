import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { MockSheetSyncStatus } from '../../components/shared/MockSheetSyncStatus'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

export const CommandCenterPage = () => {
  const {
    data,
    sourceStatuses,
    pendingApprovals,
    changeLogs,
    snapshots,
    approveActionRequest,
    rejectActionRequest,
  } = useOs()

  const cards = [
    { label: 'Studio Tasks', value: data.tasks.length },
    { label: 'Finance Transactions', value: data.transactions.length },
    { label: 'Trading Signals', value: data.tradingSignals.length },
    { label: 'Pending Approvals', value: pendingApprovals.length },
  ]

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-[#a36a42]">Command Center</p>
        <h2 className="mt-2 text-3xl font-semibold">Overall Life Dashboard</h2>
        <p className="mt-2 text-sm text-[#615a50]">Studio, Finance, AI workflow, alerts, approvals, and source health.</p>
      </header>

      <SourceStatusBadge status={sourceStatuses.commandCenter} />

      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-[#e1d8cb] bg-[#fffaf1] p-4">
            <p className="text-xs uppercase tracking-wider text-[#9f6a44]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PendingApprovalPanel
          items={pendingApprovals}
          onApprove={approveActionRequest}
          onReject={rejectActionRequest}
        />
        <ModuleAISummaryPanel moduleName="Command" suggestions={data.aiSuggestions} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChangeLogList items={changeLogs} />
        <SnapshotLog items={snapshots} />
      </div>

      <MockSheetSyncStatus statuses={Object.values(sourceStatuses)} />
    </section>
  )
}

