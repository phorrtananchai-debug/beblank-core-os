import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'
import type { Holding } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`

export const InvestmentsPage = () => {
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

  const totalValue = data.holdings.reduce((sum, holding) => sum + (holding.marketValueTHB ?? 0), 0)
  const driftHoldings = data.holdings.filter((holding) => Math.abs((holding.allocationPercent ?? 0) - (holding.targetAllocationPercent ?? 0)) >= 2)
  const dcaQueue = data.dcaRecords.filter((record) => record.status === 'planned' || record.status === 'review')
  const expectedDividends = data.dividendRecords.reduce((sum, record) => sum + record.expectedAmountTHB, 0)
  const holdingsByCategory = data.financeAssets.reduce<Record<string, number>>((acc, asset) => {
    const value = data.holdings.filter((holding) => holding.assetId === asset.id).reduce((sum, holding) => sum + (holding.marketValueTHB ?? 0), 0)
    acc[asset.category] = (acc[asset.category] ?? 0) + value
    return acc
  }, {})

  const assetName = (assetId: string) => data.financeAssets.find((asset) => asset.id === assetId)?.symbol ?? assetId
  const queueDca = () => {
    const record = dcaQueue[0]
    if (!record) return
    createActionRequest({
      module: 'finance',
      actionType: 'finance.approveDcaContribution',
      description: `Approve DCA contribution for ${assetName(record.assetId)}`,
      payload: { dcaId: record.id },
    })
  }

  const queueManualTransaction = () => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.addTransaction',
      description: 'Add manual portfolio transaction row',
      payload: { description: 'Manual THB portfolio adjustment', amountTHB: 6000, occurredAt: '2026-06-03' },
    })
  }

  const queueDriftReview = (holding: Holding) => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.resolveAllocationDrift',
      description: `Resolve allocation drift review for ${assetName(holding.assetId)}`,
      payload: { holdingId: holding.id },
    })
  }

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Investments / early Aequitas core</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">THB-first portfolio operating room.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">Long-term allocation, DCA, dividends, manual transactions, and AI-assisted review without live brokerage or automatic sync.</p>
          </div>
          <div className="intelligence-card rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Quiet AI allocation note</p>
            <p className="mt-4 text-xl font-semibold leading-snug">Growth sleeve is slightly crowded.</p>
            <p className="mt-3 text-sm leading-6 text-[#666666]">NVDA and PLTR sit above target. Approve core DCA first, then resolve drift before adding more satellite risk.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <SourceStatusBadge status={sourceStatuses.investments} />
          <Metric label="Portfolio value" value={thb(totalValue)} />
          <Metric label="Expected dividends" value={thb(expectedDividends)} />
          <Metric label="Drift reviews" value={driftHoldings.length} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Holdings overview</p>
                <h3>Allocation posture</h3>
              </div>
              <button className="btn-primary" type="button" onClick={queueManualTransaction}>Queue Manual Tx</button>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.holdings.map((holding) => {
                const asset = data.financeAssets.find((item) => item.id === holding.assetId)
                const drift = (holding.allocationPercent ?? 0) - (holding.targetAllocationPercent ?? 0)
                return (
                  <article key={holding.id} className="surface-hover rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-bold">{asset?.symbol ?? asset?.name}</p>
                        <p className="mt-1 text-xs text-[#777777]">{asset?.name} / {asset?.category} / {holding.currentPosture}</p>
                      </div>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${holding.risk === 'high' ? 'text-[#c2410c]' : 'text-[#59634a]'}`}>{holding.risk}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <Mini label="Value" value={thb(holding.marketValueTHB)} />
                      <Mini label="Alloc" value={`${holding.allocationPercent}% / ${holding.targetAllocationPercent}%`} />
                      <Mini label="DCA" value={holding.dcaStatus ?? 'review'} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#666666]">{holding.notes}</p>
                    {Math.abs(drift) >= 2 ? <button className="btn-secondary mt-4" type="button" onClick={() => queueDriftReview(holding)}>Queue Drift Review</button> : null}
                  </article>
                )
              })}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel">
              <div className="panel-header"><h3>DCA tracking</h3><button className="btn-primary" type="button" onClick={queueDca}>Queue DCA Approval</button></div>
              <div className="space-y-3">
                {data.dcaRecords.map((record) => <FinanceRow key={record.id} title={assetName(record.assetId)} meta={`${record.cadence} / ${thb(record.plannedAmountTHB)} / ${record.nextRunDate}`} status={record.status} />)}
              </div>
            </div>
            <div className="panel">
              <div className="panel-header"><h3>Dividend tracking</h3><span className="pill">estimate only</span></div>
              <div className="space-y-3">
                {data.dividendRecords.map((record) => <FinanceRow key={record.id} title={assetName(record.assetId)} meta={`${thb(record.expectedAmountTHB)} / pay ${record.payDate}`} status={record.status} />)}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3>Allocation grouping</h3><span className="pill">THB posture</span></div>
            <div className="grid gap-3 md:grid-cols-4">
              {Object.entries(holdingsByCategory).map(([category, value]) => <Metric key={category} label={category} value={thb(value)} />)}
            </div>
          </div>
        </main>

        <aside className="intelligence-rail space-y-5">
          <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
          <ModuleAISummaryPanel moduleName="Finance" suggestions={data.aiSuggestions} />
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AIContextExportPanel contexts={data.aiContexts} />
        <AISuggestionImportPanel onImport={queueSuggestionImport} />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <ChangeLogList items={changeLogs} />
        <SnapshotLog items={snapshots} />
      </section>
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    <p className="mt-2 text-lg font-bold">{value}</p>
  </div>
)

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3">
    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#777777]">{label}</p>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
)

const FinanceRow = ({ meta, status, title }: { meta: string; status: string; title: string }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-[#777777]">{meta}</p>
      </div>
      <span className="font-mono text-[10px] font-semibold uppercase text-[#9a6a1f]">{status}</span>
    </div>
  </div>
)
