import { type ReactNode, useMemo, useState } from 'react'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { getSupportedFinnhubSymbols } from '../../core/connectors/finnhub/config'
import { useOs } from '../../core/os/OsContext'
import type { Holding } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`
const usdToThb = 36.5

type ManualAssetDraft = {
  symbol: string
  displayName: string
  assetType: 'us-equity-etf' | 'thai-stock' | 'thai-mutual-fund' | 'thai-rmf' | 'cash' | 'other'
  units: string
  avgCost: string
  manualContribution: string
  currency: 'THB' | 'USD'
  transactionDate: string
  notes: string
  tags: string
}

const initialManualAssetDraft: ManualAssetDraft = {
  symbol: 'K-US500XRMF',
  displayName: 'K US Equity RMF',
  assetType: 'thai-rmf',
  units: '100',
  avgCost: '14.86',
  manualContribution: '',
  currency: 'THB',
  transactionDate: '2026-06-03',
  notes: 'Manual first. NAV/Finnhub helper data cannot create or overwrite holdings.',
  tags: 'manual, early-aequitas',
}

export const InvestmentsPage = () => {
  const {
    data,
    sourceStatuses,
    providerStatuses,
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
  const finnhubProvider = providerStatuses.finnhub
  const marketSymbols = data.marketDataSymbols
  const supportedMarketSymbols = getSupportedFinnhubSymbols()
  const [manualAssetDraft, setManualAssetDraft] = useState<ManualAssetDraft>(initialManualAssetDraft)
  const normalizedDraftSymbol = manualAssetDraft.symbol.trim().toUpperCase()
  const helperMarketRow = marketSymbols.find((symbol) => symbol.symbol === normalizedDraftSymbol)
  const helperNavRow = data.thaiNavAssets.find((asset) => asset.symbol === normalizedDraftSymbol)
  const isThaiAsset = manualAssetDraft.assetType.startsWith('thai')
  const helperSource = isThaiAsset ? (helperNavRow?.helperSource ?? 'manual-nav') : supportedMarketSymbols.includes(normalizedDraftSymbol) ? 'finnhub' : 'none'
  const assetSuggestions = useMemo(() => {
    const query = normalizedDraftSymbol
    return [
      ...supportedMarketSymbols.map((symbol) => ({ symbol, label: `${symbol} / Finnhub helper only`, assetType: 'us-equity-etf' as const, currency: 'USD' as const })),
      ...data.thaiNavAssets.map((asset) => ({ symbol: asset.symbol, label: `${asset.symbol} / Thai NAV helper`, assetType: asset.symbol.includes('RMF') ? 'thai-rmf' as const : 'thai-mutual-fund' as const, currency: 'THB' as const })),
      { symbol: 'CASH-THB', label: 'CASH-THB / manual cash reserve', assetType: 'cash' as const, currency: 'THB' as const },
    ].filter((item) => !query || item.symbol.includes(query)).slice(0, 6)
  }, [data.thaiNavAssets, normalizedDraftSymbol, supportedMarketSymbols])
  const manualPreview = useMemo(() => {
    const units = Number(manualAssetDraft.units) || 0
    const avgCost = Number(manualAssetDraft.avgCost) || 0
    const manualContribution = Number(manualAssetDraft.manualContribution) || units * avgCost
    const helperPrice = isThaiAsset ? helperNavRow?.nav : helperMarketRow?.delayedPriceTHB
    const helperValue = helperPrice ? units * helperPrice : 0
    const costBasisTHB = manualAssetDraft.currency === 'USD' ? manualContribution * usdToThb : manualContribution
    const currentValueTHB = helperValue ? (manualAssetDraft.currency === 'USD' && !isThaiAsset ? helperValue : helperValue) : costBasisTHB
    const allocationImpact = totalValue > 0 ? (currentValueTHB / (totalValue + currentValueTHB)) * 100 : 100
    return {
      units,
      avgCost,
      manualContribution,
      helperPrice,
      costBasisTHB,
      currentValueTHB,
      allocationImpact,
      dcaImpact: allocationImpact > 5 ? 'review sizing before recurring DCA' : 'small enough for watchlist/DCA review',
      missingDataWarning: !helperPrice ? 'No helper price/NAV found. Manual cost basis will be used until helper data is reviewed.' : undefined,
    }
  }, [helperMarketRow, helperNavRow, isThaiAsset, manualAssetDraft, totalValue])
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

  const updateManualAssetDraft = (field: keyof ManualAssetDraft, value: string) => {
    setManualAssetDraft((current) => ({ ...current, [field]: value }))
  }

  const applySuggestion = (suggestion: { symbol: string; label: string; assetType: ManualAssetDraft['assetType']; currency: ManualAssetDraft['currency'] }) => {
    setManualAssetDraft((current) => ({ ...current, symbol: suggestion.symbol, displayName: suggestion.label.split(' / ')[0], assetType: suggestion.assetType, currency: suggestion.currency }))
  }

  const queueManualAssetAdd = () => {
    if (!normalizedDraftSymbol || manualPreview.units <= 0 || manualPreview.avgCost <= 0) return
    createActionRequest({
      module: 'finance',
      actionType: 'finance.addManualAsset',
      description: `Add manual portfolio asset ${normalizedDraftSymbol}`,
      payload: {
        ...manualAssetDraft,
        symbol: normalizedDraftSymbol,
        units: manualPreview.units,
        avgCost: manualPreview.avgCost,
        manualContribution: manualPreview.manualContribution,
        currentHelperPrice: manualPreview.helperPrice,
        helperSource,
        sourceOfTruth: 'manual',
        previewValueTHB: manualPreview.currentValueTHB,
      },
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

  const queueMarketRefresh = () => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.manualMarketRefresh',
      description: 'Approve manual Finnhub market data refresh',
      payload: { symbols: supportedMarketSymbols, mode: 'manual-refresh-only' },
    })
  }

  const queueMarketSourceReview = () => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.reviewStaleMarketSource',
      description: 'Review stale Finnhub market source status',
      payload: { connectorId: 'conn-finnhub', source: 'Finnhub Manual Market Refresh' },
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
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <SourceStatusBadge status={sourceStatuses.investments} />
          <SourceStatusBadge status={sourceStatuses.finnhub} />
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
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Manual source of truth</p>
                <h3>Add asset to early Aequitas ledger</h3>
              </div>
              <button className="btn-primary" type="button" onClick={queueManualAssetAdd}>Queue Manual Asset</button>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Asset / ticker"><input className="input" value={manualAssetDraft.symbol} onChange={(event) => updateManualAssetDraft('symbol', event.target.value)} /></Field>
                  <Field label="Display name"><input className="input" value={manualAssetDraft.displayName} onChange={(event) => updateManualAssetDraft('displayName', event.target.value)} /></Field>
                  <Field label="Asset type"><select className="input" value={manualAssetDraft.assetType} onChange={(event) => updateManualAssetDraft('assetType', event.target.value)}><option value="us-equity-etf">US equity / ETF</option><option value="thai-stock">Thai stock</option><option value="thai-mutual-fund">Thai mutual fund</option><option value="thai-rmf">Thai RMF</option><option value="cash">Cash</option><option value="other">Other</option></select></Field>
                  <Field label="Currency"><select className="input" value={manualAssetDraft.currency} onChange={(event) => updateManualAssetDraft('currency', event.target.value)}><option value="THB">THB</option><option value="USD">USD</option></select></Field>
                  <Field label="Units"><input className="input" inputMode="decimal" value={manualAssetDraft.units} onChange={(event) => updateManualAssetDraft('units', event.target.value)} /></Field>
                  <Field label="Average cost"><input className="input" inputMode="decimal" value={manualAssetDraft.avgCost} onChange={(event) => updateManualAssetDraft('avgCost', event.target.value)} /></Field>
                  <Field label="Contribution"><input className="input" inputMode="decimal" placeholder="auto from units x avg" value={manualAssetDraft.manualContribution} onChange={(event) => updateManualAssetDraft('manualContribution', event.target.value)} /></Field>
                  <Field label="Transaction date"><input className="input" type="date" value={manualAssetDraft.transactionDate} onChange={(event) => updateManualAssetDraft('transactionDate', event.target.value)} /></Field>
                </div>
                <Field label="Notes"><textarea className="input min-h-20" value={manualAssetDraft.notes} onChange={(event) => updateManualAssetDraft('notes', event.target.value)} /></Field>
                <Field label="Tags / category"><input className="input" value={manualAssetDraft.tags} onChange={(event) => updateManualAssetDraft('tags', event.target.value)} /></Field>
                <div className="mt-4 flex flex-wrap gap-2">
                  {assetSuggestions.map((suggestion) => <button key={suggestion.symbol} className="btn-secondary" type="button" onClick={() => applySuggestion(suggestion)}>{suggestion.symbol}</button>)}
                </div>
              </article>
              <article className="rounded-[28px] border border-black/[0.05] bg-white/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold">Preview before approval</p>
                    <p className="mt-2 text-sm leading-6 text-[#666666]">This preview is draft-only. The portfolio row is created only after approval through the mock Sheet adapter.</p>
                  </div>
                  <span className="pill">source: manual</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Mini label="Cost basis" value={thb(manualPreview.costBasisTHB)} />
                  <Mini label="Current value" value={thb(manualPreview.currentValueTHB)} />
                  <Mini label="Helper source" value={helperSource} />
                  <Mini label="Allocation impact" value={`${manualPreview.allocationImpact.toFixed(1)}%`} />
                  <Mini label="DCA impact" value={manualPreview.dcaImpact} />
                  <Mini label="Source status" value={isThaiAsset ? 'Thai NAV/manual sheet helper' : 'Finnhub helper for US only'} />
                </div>
                {manualPreview.missingDataWarning ? <p className="mt-4 rounded-2xl border border-[#ead7c3] bg-[#fffaf4] p-3 text-xs leading-5 text-[#9a4f18]">{manualPreview.missingDataWarning}</p> : null}
                <p className="mt-4 text-xs leading-5 text-[#666666]">Finnhub and Thai NAV may enrich helper price fields, but they never create holdings or overwrite units, average cost, allocation targets, or manual holding records.</p>
              </article>
            </div>
          </div>

          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Finnhub manual market refresh</p>
                <h3>Delayed quote cache / THB posture</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary" type="button" onClick={queueMarketSourceReview}>Review Stale Source</button>
                <button className="btn-primary" type="button" onClick={queueMarketRefresh}>Refresh Market Data</button>
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
              <article className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold">Connector status</p>
                    <p className="mt-2 text-sm leading-6 text-[#666666]">Manual approved refresh only. Missing key or failed request keeps mock/fallback prices visible.</p>
                  </div>
                  <span className="pill">{finnhubProvider?.mode ?? 'fallback'}</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Mini label="Last sync" value={finnhubProvider?.lastUpdated ? new Date(finnhubProvider.lastUpdated).toLocaleString() : 'not synced'} />
                  <Mini label="Stale" value={finnhubProvider?.stale ? 'yes' : 'no'} />
                  <Mini label="Fallback used" value={finnhubProvider?.fallbackUsed ? 'yes' : 'no'} />
                  <Mini label="Execution" value="none / read only" />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777777]">Supported: {supportedMarketSymbols.join(' / ')}</p>
                {finnhubProvider?.error ? <p className="mt-4 rounded-2xl border border-[#ead7c3] bg-white/80 p-3 text-xs leading-5 text-[#9a4f18]">{finnhubProvider.error}</p> : null}
              </article>
              <article className="rounded-[28px] border border-black/[0.05] bg-white/75 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Sheet cache rows</p>
                  <span className="pill">{marketSymbols.length} symbols</span>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {marketSymbols.map((symbol) => (
                    <div key={symbol.id} className="rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{symbol.symbol}</p>
                          <p className="mt-1 text-xs text-[#777777]">{symbol.notes}</p>
                        </div>
                        <span className="font-mono text-[10px] font-semibold uppercase text-[#9a6a1f]">{thb(symbol.delayedPriceTHB)}</span>
                      </div>
                      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a8176]">last {new Date(symbol.lastUpdated).toLocaleDateString()} / stale after {symbol.staleAfterHours}h</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>

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

          <div className="panel panel-float">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Thai NAV foundation</p>
                <h3>Manual NAV / future Sheet NAV bridge</h3>
              </div>
              <span className="pill">no Finnhub</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {data.thaiNavAssets.map((asset) => {
                const valueTHB = asset.valueTHB ?? (asset.units ?? 0) * asset.nav
                const allocation = totalValue > 0 ? (valueTHB / (totalValue + valueTHB)) * 100 : 0
                return (
                  <article key={asset.id} className="surface-hover rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold">{asset.symbol}</p>
                        <p className="mt-1 text-xs text-[#777777]">{asset.displayName ?? 'Thai NAV asset'} / {asset.helperSource}</p>
                      </div>
                      <span className={`font-mono text-[10px] font-semibold uppercase ${asset.stale ? 'text-[#c2410c]' : 'text-[#59634a]'}`}>{asset.stale ? 'stale' : 'manual'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <Mini label="NAV" value={thb(asset.nav)} />
                      <Mini label="Units" value={(asset.units ?? 0).toLocaleString()} />
                      <Mini label="Value" value={thb(valueTHB)} />
                      <Mini label="Alloc impact" value={`${allocation.toFixed(1)}%`} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#666666]">{asset.notes}</p>
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a8176]">NAV updated {asset.updatedAt} / source {asset.sourceStatus?.mode ?? 'manual'}</p>
                  </article>
                )
              })}
            </div>
            <p className="mt-4 rounded-2xl border border-black/[0.04] bg-white/75 p-3 text-xs leading-5 text-[#666666]">Thai funds, RMF, and local NAV assets use manual NAV now and a future Google Sheet NAV bridge later. They never use Finnhub and never create holdings automatically.</p>
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









const Field = ({ children, label }: { children: ReactNode; label: string }) => (
  <label className="mt-3 block">
    <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</span>
    {children}
  </label>
)
