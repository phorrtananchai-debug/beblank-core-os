import { type ReactNode, useMemo, useState } from 'react'
import { InvestmentActionButton } from '../../components/investments/InvestmentActionButton'
import { InvestmentInputDialog, type DialogMode } from '../../components/investments/InvestmentInputDialog'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { getSupportedFinnhubSymbols } from '../../core/connectors'
import { useOs } from '../../core/os/OsContext'
import type { ActionRequest, Holding } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`
const usdToThb = 36.5
const statusClass = (status: string) => {
  if (['blocked', 'high', 'at-risk', 'open', 'review', 'pending', 'failed'].includes(status)) return 'text-[#c2410c]'
  if (['review', 'medium', 'active', 'watching'].includes(status)) return 'text-[#9a6a1f]'
  return 'text-[#59634a]'
}

type InvestmentsTab = 'overview' | 'portfolio' | 'holdings' | 'allocation' | 'transactions' | 'dca' | 'dividends' | 'watchlist' | 'research' | 'ai'

const tabs: Array<{ key: InvestmentsTab; label: string }> = [
  { key: 'overview', label: 'overview' },
  { key: 'portfolio', label: 'portfolio' },
  { key: 'holdings', label: 'holdings' },
  { key: 'allocation', label: 'allocation' },
  { key: 'transactions', label: 'transactions' },
  { key: 'dca', label: 'DCA' },
  { key: 'dividends', label: 'dividends' },
  { key: 'watchlist', label: 'watchlist' },
  { key: 'research', label: 'research' },
  { key: 'ai', label: 'AI' },
]

type ManualAssetDraft = {
  symbol: string
  displayName: string
  assetType: 'us-equity-etf' | 'thai-stock' | 'thai-mutual-fund' | 'thai-rmf' | 'cash' | 'other'
  units: string
  avgCost: string
  manualContributionTHB: string
  manualContributionUSD: string
  currency: 'THB' | 'USD'
  transactionDate: string
  notes: string
  tags: string
}

type AssetSuggestion = {
  symbol: string
  name: string
  assetType: ManualAssetDraft['assetType']
  currency: ManualAssetDraft['currency']
  market: string
  sourceLabel: string
}

const commonAssetSuggestions: AssetSuggestion[] = [
  { symbol: 'TSLA', name: 'Tesla, Inc.', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'PLTR', name: 'Palantir Technologies', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'MRVL', name: 'Marvell Technology', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'RBRK', name: 'Rubrik, Inc.', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
  { symbol: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium Income ETF', assetType: 'us-equity-etf', currency: 'USD', market: 'US', sourceLabel: 'Finnhub helper eligible' },
]

const initialManualAssetDraft: ManualAssetDraft = {
  symbol: 'K-US500XRMF',
  displayName: 'K US Equity RMF',
  assetType: 'thai-rmf',
  units: '100',
  avgCost: '14.86',
  manualContributionTHB: '',
  manualContributionUSD: '',
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

  const [activeTab, setActiveTab] = useState<InvestmentsTab>('overview')
  const [manualAssetDraft, setManualAssetDraft] = useState<ManualAssetDraft>(initialManualAssetDraft)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false)
  const [navDrafts, setNavDrafts] = useState<Record<string, string>>({})
  const [dialogState, setDialogState] = useState<{
    mode: DialogMode
    initial: Record<string, unknown>
    actionType: string
    description: string
    basePayload: Record<string, unknown>
  } | null>(null)

  const totalValue = data.holdings.reduce((sum, holding) => sum + (holding.marketValueTHB ?? 0), 0)
  const driftHoldings = data.holdings.filter((holding) => Math.abs((holding.allocationPercent ?? 0) - (holding.targetAllocationPercent ?? 0)) >= 2)
  const dcaQueue = data.dcaRecords.filter((record) => record.status === 'planned' || record.status === 'review')
  const expectedDividends = data.dividendRecords.reduce((sum, record) => sum + record.expectedAmountTHB, 0)
  const monthlyDcaTarget = data.dcaRecords.reduce((sum, record) => sum + (record.status === 'planned' ? record.plannedAmountTHB : 0), 0)
  const finnhubProvider = providerStatuses.finnhub
  const marketSymbols = data.marketDataSymbols
  const supportedMarketSymbols = getSupportedFinnhubSymbols()
  const normalizedDraftSymbol = manualAssetDraft.symbol.trim().toUpperCase()
  const helperMarketRow = marketSymbols.find((symbol) => symbol.symbol === normalizedDraftSymbol)
  const helperNavRow = data.thaiNavAssets.find((asset) => asset.symbol === normalizedDraftSymbol)
  const isThaiAsset = manualAssetDraft.assetType.startsWith('thai')
  const helperSource = isThaiAsset ? (helperNavRow?.helperSource ?? 'manual-nav') : supportedMarketSymbols.includes(normalizedDraftSymbol) ? 'finnhub' : 'none'

  const cashPosture = data.holdings.filter((holding) => data.financeAssets.find((asset) => asset.id === holding.assetId)?.category === 'cash').reduce((sum, holding) => sum + (holding.marketValueTHB ?? 0), 0)
  const riskPosture = data.holdings.filter((holding) => holding.risk === 'high').length
  const dcaImpactPreview = dcaQueue[0] ? ((dcaQueue[0].plannedAmountTHB / Math.max(totalValue, 1)) * 100).toFixed(2) : '0.00'
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

  const assetSuggestions = useMemo(() => {
    const thaiSuggestions: AssetSuggestion[] = data.thaiNavAssets.map((asset) => ({
      symbol: asset.symbol,
      name: asset.displayName ?? asset.symbol,
      assetType: asset.symbol.includes('RMF') ? 'thai-rmf' : 'thai-mutual-fund',
      currency: 'THB',
      market: 'TH',
      sourceLabel: 'Thai NAV manual helper',
    }))
    const manualSuggestions: AssetSuggestion[] = [
      { symbol: 'CASH-THB', name: 'Manual THB cash reserve', assetType: 'cash', currency: 'THB', market: 'Manual', sourceLabel: 'Manual sheet-ready row' },
    ]
    const query = normalizedDraftSymbol
    return [...commonAssetSuggestions, ...thaiSuggestions, ...manualSuggestions]
      .filter((item) => !query || item.symbol.includes(query) || item.name.toUpperCase().includes(query))
      .slice(0, 8)
  }, [data.thaiNavAssets, normalizedDraftSymbol])

  const manualPreview = useMemo(() => {
    const units = Number(manualAssetDraft.units) || 0
    const avgCost = Number(manualAssetDraft.avgCost) || 0
    const amountTHB = Number(manualAssetDraft.manualContributionTHB) || 0
    const amountUSD = Number(manualAssetDraft.manualContributionUSD) || 0
    const fallbackNativeContribution = units * avgCost
    const fallbackTHB = manualAssetDraft.currency === 'USD' ? fallbackNativeContribution * usdToThb : fallbackNativeContribution
    const costBasisTHB = amountTHB || (amountUSD ? amountUSD * usdToThb : fallbackTHB)
    const helperPrice = isThaiAsset ? helperNavRow?.nav : helperMarketRow?.delayedPriceTHB
    const helperValueTHB = helperPrice ? units * helperPrice : 0
    const currentValueTHB = helperValueTHB || costBasisTHB
    const allocationImpact = totalValue > 0 ? (currentValueTHB / (totalValue + currentValueTHB)) * 100 : 100
    return {
      units,
      avgCost,
      manualContributionTHB: costBasisTHB,
      manualContributionUSD: amountUSD || (manualAssetDraft.currency === 'USD' ? fallbackNativeContribution : 0),
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

  const applySuggestion = (suggestion: AssetSuggestion) => {
    setManualAssetDraft((current) => ({
      ...current,
      symbol: suggestion.symbol,
      displayName: suggestion.name,
      assetType: suggestion.assetType,
      currency: suggestion.currency,
    }))
    setShowAssetSuggestions(false)
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
        manualContribution: manualPreview.manualContributionTHB,
        manualContributionTHB: manualPreview.manualContributionTHB,
        manualContributionUSD: manualPreview.manualContributionUSD,
        currentHelperPrice: manualPreview.helperPrice,
        helperSource,
        sourceOfTruth: 'manual',
        previewValueTHB: manualPreview.currentValueTHB,
      },
    })
    setShowAssetModal(false)
  }

  const queueThaiNavReview = (navAssetId: string, fallbackNav: number) => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.reviewThaiNavAsset',
      description: `Review Thai NAV helper row ${navAssetId}`,
      payload: { navAssetId, nav: Number(navDrafts[navAssetId] ?? fallbackNav) || fallbackNav },
    })
  }
  const queueMarketRefreshV2 = () => {
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

  const handleDialogConfirm = (form: Record<string, unknown>) => {
    if (!dialogState) return
    createActionRequest({
      module: 'finance',
      actionType: dialogState.actionType,
      description: dialogState.description,
      payload: { ...dialogState.basePayload, ...form },
    })
    setDialogState(null)
  }

  const openEditTransactionNote = (transactionId: string, currentNotes: string, rowDescription: string) => {
    setDialogState({
      mode: 'edit-transaction-note',
      initial: { notes: currentNotes },
      actionType: 'finance.editTransactionNote',
      description: `Edit note for ${rowDescription}`,
      basePayload: { transactionId },
    })
  }

  const openAdjustDcaTarget = (dcaId: string, currentAmount: number, assetLabel: string) => {
    setDialogState({
      mode: 'adjust-dca-target',
      initial: { newAmountTHB: currentAmount },
      actionType: 'finance.adjustDcaTarget',
      description: `Adjust DCA target for ${assetLabel}`,
      basePayload: { dcaId },
    })
  }

  const openAddResearchNote = () => {
    setDialogState({
      mode: 'add-research-note',
      initial: {},
      actionType: 'finance.addResearchNote',
      description: 'Add manual research note',
      basePayload: {},
    })
  }

  const renderAssetInputs = (compact = false) => (
    <article className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Ticker / name">
          <div className="relative">
            <input
              className="input"
              value={manualAssetDraft.symbol}
              onChange={(event) => {
                updateManualAssetDraft('symbol', event.target.value.toUpperCase())
                setShowAssetSuggestions(true)
              }}
              onFocus={() => setShowAssetSuggestions(true)}
              placeholder="Type TSLA, VOO, K-US500XRMF..."
            />
            {showAssetSuggestions ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-20 max-h-72 overflow-y-auto rounded-[22px] border border-black/[0.08] bg-white p-2 shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
                {assetSuggestions.length > 0 ? assetSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.symbol}-${suggestion.market}`}
                    className="w-full rounded-2xl px-3 py-2 text-left transition hover:bg-[#faf9f8]"
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <span className="block text-sm font-bold">{suggestion.symbol} <span className="font-normal text-[#777777]">/ {suggestion.name}</span></span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-[#777777]">{suggestion.market} / {suggestion.currency} / {suggestion.sourceLabel}</span>
                  </button>
                )) : <p className="px-3 py-2 text-xs text-[#777777]">No suggestion. Manual symbol entry is allowed.</p>}
              </div>
            ) : null}
          </div>
        </Field>
        <Field label="Display name"><input className="input" value={manualAssetDraft.displayName} onChange={(event) => updateManualAssetDraft('displayName', event.target.value)} /></Field>
        <Field label="Asset type"><select className="input" value={manualAssetDraft.assetType} onChange={(event) => updateManualAssetDraft('assetType', event.target.value)}><option value="us-equity-etf">US equity / ETF</option><option value="thai-stock">Thai stock</option><option value="thai-mutual-fund">Thai mutual fund</option><option value="thai-rmf">Thai RMF</option><option value="cash">Cash</option><option value="other">Other</option></select></Field>
        <Field label="Currency"><select className="input" value={manualAssetDraft.currency} onChange={(event) => updateManualAssetDraft('currency', event.target.value)}><option value="THB">THB</option><option value="USD">USD</option></select></Field>
        <Field label="Units"><input className="input" inputMode="decimal" value={manualAssetDraft.units} onChange={(event) => updateManualAssetDraft('units', event.target.value)} /></Field>
        <Field label="Average cost"><input className="input" inputMode="decimal" value={manualAssetDraft.avgCost} onChange={(event) => updateManualAssetDraft('avgCost', event.target.value)} /></Field>
        <Field label="Amount invested THB"><input className="input" inputMode="decimal" placeholder="Manual THB amount" value={manualAssetDraft.manualContributionTHB} onChange={(event) => updateManualAssetDraft('manualContributionTHB', event.target.value)} /></Field>
        <Field label="Amount invested USD"><input className="input" inputMode="decimal" placeholder="Manual USD amount" value={manualAssetDraft.manualContributionUSD} onChange={(event) => updateManualAssetDraft('manualContributionUSD', event.target.value)} /></Field>
        <Field label="Source"><input className="input" value={helperSource} readOnly /></Field>
        <Field label="Contribution date"><input className="input" type="date" value={manualAssetDraft.transactionDate} onChange={(event) => updateManualAssetDraft('transactionDate', event.target.value)} /></Field>
      </div>
      <Field label="Note"><textarea className="input min-h-20" value={manualAssetDraft.notes} onChange={(event) => updateManualAssetDraft('notes', event.target.value)} /></Field>
      {!compact ? <Field label="Tags / category"><input className="input" value={manualAssetDraft.tags} onChange={(event) => updateManualAssetDraft('tags', event.target.value)} /></Field> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {assetSuggestions.slice(0, 6).map((suggestion) => <button key={suggestion.symbol} className="btn-secondary" type="button" onClick={() => applySuggestion(suggestion)}>{suggestion.symbol}</button>)}
      </div>
    </article>
  )

  const renderApprovalPreview = (withSubmit = false) => (
    <article className="rounded-[28px] border border-black/[0.05] bg-white/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold">Preview before approval</p>
          <p className="mt-2 text-sm leading-6 text-[#666666]">Draft only. The holding is created only after approval through ActionRequest and the mock Sheet adapter.</p>
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
      <p className="mt-4 text-xs leading-5 text-[#666666]">Finnhub remains helper-only for US assets. It never overwrites units, average cost, allocation, manual notes, or Thai NAV rows.</p>
      {withSubmit ? <button className="btn-primary mt-5 w-full" type="button" onClick={queueManualAssetAdd}>Queue for Approval</button> : null}
    </article>
  )

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">Investments / early Aequitas core</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">Investments / Stocks</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#666666]">Manual portfolio input is the source of truth. Finnhub and Thai NAV are helper sources only. No broker execution, no auto trading, and no helper source can overwrite Por's manual records.</p>
          </div>
          <div className="intelligence-card rounded-[30px] border border-black/[0.06] bg-white/92 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">AI allocation note</p>
            <p className="mt-4 text-xl font-semibold leading-snug">Growth sleeve is slightly crowded.</p>
            <p className="mt-3 text-sm leading-6 text-[#666666]">NVDA and PLTR sit above target. Approve core DCA first, then resolve drift before adding more satellite risk.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-6">
          <SourceStatusBadge status={sourceStatuses.investments} />
          <SourceStatusBadge status={sourceStatuses.finnhub} />
          <Metric label="Total THB" value={thb(totalValue)} />
          <Metric label="Dividend estimate" value={thb(expectedDividends)} />
          <Metric label="Monthly DCA" value={thb(monthlyDcaTarget)} />
          <Metric label="Drift reviews" value={driftHoldings.length} />
        </div>
      </header>

      <nav className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
              activeTab === tab.key ? 'bg-black text-white' : 'bg-white/70 text-[#777777] hover:bg-black/[0.05] hover:text-[#111111]'
            }`}
            role="tab"
            aria-selected={activeTab === tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? (
        <OverviewTab
          cashPosture={cashPosture}
          driftHoldings={driftHoldings}
          dcaImpactPreview={dcaImpactPreview}
          expectedDividends={expectedDividends}
          holdingsByCategory={holdingsByCategory}
          monthlyDcaTarget={monthlyDcaTarget}
          riskPosture={riskPosture}
          totalValue={totalValue}
        />
      ) : null}

      {activeTab === 'portfolio' ? (
        <PortfolioTab
          finnhubProvider={finnhubProvider}
          marketSymbols={marketSymbols}
          queueMarketRefresh={queueMarketRefreshV2}
          queueMarketSourceReview={queueMarketSourceReview}
          renderApprovalPreview={renderApprovalPreview}
          renderAssetInputs={renderAssetInputs}
          setShowAssetModal={setShowAssetModal}
          supportedMarketSymbols={supportedMarketSymbols}
        />
      ) : null}

      {activeTab === 'holdings' ? (
        <HoldingsTab
          financeAssets={data.financeAssets}
          holdings={data.holdings}
          navDrafts={navDrafts}
          queueDriftReview={queueDriftReview}
          queueThaiNavReview={queueThaiNavReview}
          setNavDrafts={setNavDrafts}
          thaiNavAssets={data.thaiNavAssets}
          totalValue={totalValue}
        />
      ) : null}

      {activeTab === 'allocation' ? (
        <AllocationTab
          createActionRequest={createActionRequest}
          financeAssets={data.financeAssets}
          holdings={data.holdings}
          holdingsByCategory={holdingsByCategory}
          totalValue={totalValue}
        />
      ) : null}

      {activeTab === 'transactions' ? (
        <TransactionsTab createActionRequest={createActionRequest} financeAssets={data.financeAssets} openEditTransactionNote={openEditTransactionNote} transactions={data.transactions} />
      ) : null}

      {activeTab === 'dca' ? (
        <DcaTab
          assetName={assetName}
          createActionRequest={createActionRequest}
          dcaImpactPreview={dcaImpactPreview}
          dcaQueue={dcaQueue}
          dcaRecords={data.dcaRecords}
          openAdjustDcaTarget={openAdjustDcaTarget}
          queueDca={queueDca}
        />
      ) : null}

      {activeTab === 'dividends' ? (
        <DividendsTab
          assetName={assetName}
          createActionRequest={createActionRequest}
          dividendRecords={data.dividendRecords}
          expectedDividends={expectedDividends}
        />
      ) : null}

      {activeTab === 'watchlist' ? (
        <WatchlistTab
          createActionRequest={createActionRequest}
          tradingSignals={data.tradingSignals}
          tradingWatchlist={data.tradingWatchlist}
        />
      ) : null}

      {activeTab === 'research' ? (
        <ResearchTab aiImports={data.aiImports} openAddResearchNote={openAddResearchNote} tradingStrategyNotes={data.tradingStrategyNotes} />
      ) : null}

      {activeTab === 'ai' ? (
        <AiTab aiContexts={data.aiContexts} aiDigests={data.aiDigests} aiObservations={data.aiObservations} createActionRequest={createActionRequest} />
      ) : null}

      {['overview', 'holdings', 'allocation'].includes(activeTab) ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-5">
            <section className="panel panel-float">
              <div className="panel-header">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Manual source of truth</p>
                  <h3>Add asset to early Aequitas ledger</h3>
                </div>
                <button className="btn-primary" type="button" onClick={() => setShowAssetModal(true)}>Open Asset Modal</button>
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                {renderAssetInputs()}
                {renderApprovalPreview()}
              </div>
            </section>
          </main>
          <aside className="intelligence-rail space-y-5">
            <PendingApprovalPanel items={pendingApprovals} onApprove={approveActionRequest} onReject={rejectActionRequest} />
            <ModuleAISummaryPanel moduleName="Finance" suggestions={data.aiSuggestions} />
          </aside>
        </section>
      ) : null}

      {showAssetModal ? (
        <div className="modal-scrim">
          <div className="modal-panel">
            <div className="panel-header">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Add Asset Modal</p>
                <h3>Preview before approval</h3>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setShowAssetModal(false)}>Close</button>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
              {renderAssetInputs(true)}
              {renderApprovalPreview(true)}
            </div>
          </div>
        </div>
      ) : null}

      {dialogState ? (
        <InvestmentInputDialog
          mode={dialogState.mode}
          initial={dialogState.initial}
          onConfirm={handleDialogConfirm}
          onCancel={() => setDialogState(null)}
        />
      ) : null}

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

const Field = ({ children, label }: { children: ReactNode; label: string }) => (
  <label className="mt-3 block">
    <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</span>
    {children}
  </label>
)

const SectionPanel = ({ children, label, title, endSlot }: { children: ReactNode; label: string; title: string; endSlot?: ReactNode }) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{label}</p>
        <h3>{title}</h3>
      </div>
      {endSlot ?? null}
    </div>
    {children}
  </section>
)

const OverviewTab = ({
  cashPosture,
  driftHoldings,
  dcaImpactPreview,
  expectedDividends,
  holdingsByCategory,
  monthlyDcaTarget,
  riskPosture,
  totalValue,
}: {
  cashPosture: number
  driftHoldings: Holding[]
  dcaImpactPreview: string
  expectedDividends: number
  holdingsByCategory: Record<string, number>
  monthlyDcaTarget: number
  riskPosture: number
  totalValue: number
}) => (
  <div className="space-y-5">
    <SectionPanel label="Portfolio summary" title="Manual wealth notebook">
      <div className="grid gap-3 md:grid-cols-6">
        <Metric label="Total THB" value={thb(totalValue)} />
        <Metric label="Monthly DCA" value={thb(monthlyDcaTarget)} />
        <Metric label="Dividend estimate" value={thb(expectedDividends)} />
        <Metric label="Cash reserve" value={thb(cashPosture)} />
        <Metric label="Drift items" value={driftHoldings.length} />
        <Metric label="Allocation groups" value={Object.keys(holdingsByCategory).length} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#666666]">Portfolio rows stay manual-first. Helper prices help estimate value, but never overwrite units, average cost, allocation, or notes entered by Por.</p>
    </SectionPanel>
    <SectionPanel label="Posture breakdown" title="Core / Growth / Income / Reserve / Thai">
      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(holdingsByCategory).map(([category, value]) => <Metric key={category} label={category} value={thb(value)} />)}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Mini label="Cash / dry powder" value={thb(cashPosture)} />
        <Mini label="High-risk holdings" value={String(riskPosture)} />
        <Mini label="DCA impact" value={`${dcaImpactPreview}% of portfolio`} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#666666]">Holdings grouped by asset category. Target allocation and drift are reviewed in the Allocation tab.</p>
    </SectionPanel>
  </div>
)

const PortfolioTab = ({
  finnhubProvider,
  marketSymbols,
  queueMarketRefresh,
  queueMarketSourceReview,
  renderApprovalPreview,
  renderAssetInputs,
  setShowAssetModal,
  supportedMarketSymbols,
}: {
  finnhubProvider: { mode?: string; lastUpdated?: string; stale?: boolean; fallbackUsed?: boolean; error?: string } | undefined
  marketSymbols: Array<{ id: string; symbol: string; lastUpdated: string; staleAfterHours: number; delayedPriceTHB?: number; notes: string }>
  queueMarketRefresh: () => void
  queueMarketSourceReview: () => void
  renderApprovalPreview: (withSubmit?: boolean) => ReactNode
  renderAssetInputs: (compact?: boolean) => ReactNode
  setShowAssetModal: (show: boolean) => void
  supportedMarketSymbols: string[]
}) => (
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <main className="space-y-5">
      <SectionPanel label="Manual source of truth" title="Add asset to early Aequitas ledger" endSlot={<button className="btn-primary" type="button" onClick={() => setShowAssetModal(true)}>Open Asset Modal</button>}>
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          {renderAssetInputs()}
          {renderApprovalPreview()}
        </div>
      </SectionPanel>

      <SectionPanel label="Finnhub manual market refresh" title="Delayed quote cache / THB posture" endSlot={
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={queueMarketSourceReview}>Review Stale Source</button>
          <button className="btn-primary" type="button" onClick={queueMarketRefresh}>Refresh Market Data</button>
        </div>
      }>
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
      </SectionPanel>
    </main>
    <aside className="intelligence-rail space-y-5">
      <PendingApprovalPanel items={[]} onApprove={() => {}} onReject={() => {}} />
    </aside>
  </div>
)

const HoldingsTab = ({
  financeAssets,
  holdings,
  navDrafts,
  queueDriftReview,
  queueThaiNavReview,
  setNavDrafts,
  thaiNavAssets,
  totalValue,
}: {
  financeAssets: Array<{ id: string; symbol?: string; name: string; category?: string; sourceOfTruth?: string }>
  holdings: Array<Holding & { currentPosture?: string; dcaStatus?: string; notes?: string }>
  navDrafts: Record<string, string>
  queueDriftReview: (holding: Holding) => void
  queueThaiNavReview: (navAssetId: string, fallbackNav: number) => void
  setNavDrafts: (updater: (prev: Record<string, string>) => Record<string, string>) => void
  thaiNavAssets: Array<{ id: string; symbol: string; displayName?: string; nav: number; units?: number; valueTHB?: number; helperSource?: string; stale?: boolean; notes?: string; updatedAt: string }>
  totalValue: number
}) => (
  <div className="space-y-5">
    <SectionPanel label="Holdings" title="Allocation posture" endSlot={<button className="btn-primary" type="button">Queue Manual Tx</button>}>
      <div className="mb-4 overflow-x-auto rounded-[24px] border border-black/[0.05] bg-white/75">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-black/[0.05] font-mono text-[9px] uppercase tracking-[0.12em] text-[#777777]">
            <tr>
              <th className="px-4 py-3">Holding</th>
              <th className="px-4 py-3">Current value</th>
              <th className="px-4 py-3">Gain/loss</th>
              <th className="px-4 py-3">Allocation</th>
              <th className="px-4 py-3">Last update</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const asset = financeAssets.find((item) => item.id === holding.assetId)
              const costBasis = (holding.units ?? holding.quantity) * holding.averageCost
              const gainLoss = (holding.marketValueTHB ?? 0) - costBasis
              return (
                <tr key={holding.id} className="border-b border-black/[0.04] last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{asset?.symbol ?? holding.assetId}<p className="text-xs font-normal text-[#777777]">{asset?.name}</p></td>
                  <td className="px-4 py-3">{thb(holding.marketValueTHB)}</td>
                  <td className={`px-4 py-3 ${gainLoss < 0 ? 'text-[#c2410c]' : 'text-[#59634a]'}`}>{thb(gainLoss)}</td>
                  <td className="px-4 py-3">{holding.allocationPercent ?? 0}% / target {holding.targetAllocationPercent ?? 0}%</td>
                  <td className="px-4 py-3">{holding.lastUpdated ?? 'manual'}</td>
                  <td className="px-4 py-3"><span className="pill">{asset?.sourceOfTruth ?? 'manual'}{holding.sourceStatus?.isStale ? ' / stale' : ''}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {holdings.map((holding) => {
          const asset = financeAssets.find((item) => item.id === holding.assetId)
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
    </SectionPanel>

    <SectionPanel label="Thai NAV foundation" title="Manual NAV / future Sheet NAV bridge" endSlot={<span className="pill">no Finnhub</span>}>
      <div className="grid gap-3 lg:grid-cols-3">
        {thaiNavAssets.map((asset) => {
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
              <div className="mt-4 grid gap-2">
                <input className="input" inputMode="decimal" value={navDrafts[asset.id] ?? String(asset.nav)} onChange={(event) => setNavDrafts((prev) => ({ ...prev, [asset.id]: event.target.value }))} />
                <button className="btn-secondary" type="button" onClick={() => queueThaiNavReview(asset.id, asset.nav)}>Queue NAV Review</button>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#666666]">{asset.notes}</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a8176]">NAV updated {asset.updatedAt} / source {asset.helperSource === 'fallback' ? 'sheet-ready' : 'manual'} / {asset.stale ? 'stale' : 'reviewed'}</p>
            </article>
          )
        })}
      </div>
      <p className="mt-4 rounded-2xl border border-black/[0.04] bg-white/75 p-3 text-xs leading-5 text-[#666666]">Thai funds, RMF, and local NAV assets use manual NAV now and a future Google Sheet NAV bridge later. They never use Finnhub and never create holdings automatically.</p>
    </SectionPanel>
  </div>
)

const AllocationTab = ({
  createActionRequest,
  financeAssets,
  holdings,
  holdingsByCategory,
  totalValue,
}: {
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  financeAssets: Array<{ id: string; symbol?: string; name?: string; category?: string }>
  holdings: Array<Holding & { currentPosture?: string }>
  holdingsByCategory: Record<string, number>
  totalValue: number
}) => {
  const driftHoldings = holdings.filter((holding) => Math.abs((holding.allocationPercent ?? 0) - (holding.targetAllocationPercent ?? 0)) >= 2)

  return (
    <div className="space-y-5">
      <SectionPanel label="Allocation" title="Target vs current" endSlot={<span className="pill">{driftHoldings.length} drift items</span>}>
        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(holdingsByCategory).map(([category, value]) => <Metric key={category} label={category} value={thb(value)} />)}
        </div>
        <p className="mt-4 text-sm leading-6 text-[#666666]">Current allocation by category. Review drift in the table below. No auto rebalance — every allocation change requires manual review and approval.</p>
      </SectionPanel>

      <SectionPanel label="Drift detection" title="Allocation variance" endSlot={<span className="pill">{driftHoldings.length} above threshold</span>}>
        <div className="overflow-x-auto rounded-[24px] border border-black/[0.05] bg-white/75">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-black/[0.05] font-mono text-[9px] uppercase tracking-[0.12em] text-[#777777]">
              <tr>
                <th className="px-4 py-3">Holding</th>
                <th className="px-4 py-3">Value THB</th>
                <th className="px-4 py-3">Current %</th>
                <th className="px-4 py-3">Target %</th>
                <th className="px-4 py-3">Drift</th>
                <th className="px-4 py-3">Posture</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const asset = financeAssets.find((item) => item.id === holding.assetId)
                const currentPct = holding.allocationPercent ?? 0
                const targetPct = holding.targetAllocationPercent ?? 0
                const drift = currentPct - targetPct
                const isDrifted = Math.abs(drift) >= 2
                return (
                  <tr key={holding.id} className={`border-b border-black/[0.04] last:border-b-0 ${isDrifted ? 'bg-[#fffaf4]' : ''}`}>
                    <td className="px-4 py-3 font-semibold">{asset?.symbol ?? holding.assetId}</td>
                    <td className="px-4 py-3">{thb(holding.marketValueTHB)}</td>
                    <td className="px-4 py-3">{currentPct}%</td>
                    <td className="px-4 py-3">{targetPct}%</td>
                    <td className={`px-4 py-3 font-semibold ${drift > 0 ? 'text-[#c2410c]' : drift < 0 ? 'text-[#59634a]' : ''}`}>
                      {drift > 0 ? `+${drift.toFixed(1)}%` : `${drift.toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-3"><span className="pill">{holding.currentPosture ?? '—'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {isDrifted ? (
                          <InvestmentActionButton
                            actionType="finance.resolveAllocationDrift"
                            description={`Resolve allocation drift for ${asset?.symbol ?? holding.assetId}`}
                            payload={{ holdingId: holding.id }}
                            createActionRequest={createActionRequest}
                            label="แก้ไขดริฟท์"
                          />
                        ) : null}
                        <InvestmentActionButton
                          actionType="finance.markRebalanceReviewed"
                          description={`Mark rebalance reviewed for ${asset?.symbol ?? holding.assetId}`}
                          payload={{ holdingId: holding.id }}
                          createActionRequest={createActionRequest}
                          label="รีวิวแล้ว"
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#666666]">Holdings highlighted if drift exceeds ±2%. Allocation changes require manual review through ActionRequest approval. No auto rebalance.</p>
      </SectionPanel>

      <SectionPanel label="Cash allocation" title="Reserve posture">
        {holdings.filter((h) => financeAssets.find((a) => a.id === h.assetId)?.category === 'cash').map((holding) => {
          const asset = financeAssets.find((a) => a.id === holding.assetId)
          return (
            <div key={holding.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{asset?.name}</p>
                  <p className="mt-1 text-xs text-[#777777]">{holding.notes}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{thb(holding.marketValueTHB)}</p>
                  <p className="font-mono text-[10px] text-[#777777]">{holding.allocationPercent}%</p>
                </div>
              </div>
            </div>
          )
        })}
        <p className="mt-3 text-sm leading-6 text-[#666666]">Cash / dry powder = {thb(totalValue > 0 ? (holdings.filter((h) => financeAssets.find((a) => a.id === h.assetId)?.category === 'cash').reduce((s, h) => s + (h.marketValueTHB ?? 0), 0)) : 0)}.</p>
      </SectionPanel>
    </div>
  )
}

const TransactionsTab = ({
  createActionRequest,
  financeAssets,
  openEditTransactionNote,
  transactions,
}: {
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  financeAssets: Array<{ id: string; symbol?: string }>
  openEditTransactionNote: (transactionId: string, currentNotes: string, rowDescription: string) => void
  transactions: Array<{ id: string; assetId?: string; occurredAt: string; type: string; description: string; amountTHB: number; notes?: string }>
}) => (
  <div className="space-y-5">
    <SectionPanel label="Transactions" title="Recent manual activity" endSlot={
      <div className="flex flex-wrap gap-2">
        <span className="pill">{transactions.length} rows</span>
        <InvestmentActionButton
          actionType="finance.queueManualTransaction"
          description="Queue manual THB transaction"
          payload={{ description: 'Manual transaction', amountTHB: 6000, occurredAt: new Date().toISOString().slice(0, 10), type: 'expense', notes: 'Manual entry.' }}
          createActionRequest={createActionRequest}
          label="เพิ่มรายการ"
        />
      </div>
    }>
      {transactions.length === 0 ? (
        <p className="text-sm text-[#777777]">ยังไม่มีรายการเดินบัญชี</p>
      ) : (
        <div className="overflow-x-auto rounded-[24px] border border-black/[0.05] bg-white/75">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-black/[0.05] font-mono text-[9px] uppercase tracking-[0.12em] text-[#777777]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const asset = financeAssets.find((a) => a.id === tx.assetId)
                return (
                  <tr key={tx.id} className="border-b border-black/[0.04] last:border-b-0">
                    <td className="px-4 py-3 text-xs text-[#777777]">{tx.occurredAt}</td>
                    <td className="px-4 py-3"><span className="pill">{tx.type}</span></td>
                    <td className="px-4 py-3 font-semibold">{tx.description}{asset ? <span className="block text-xs font-normal text-[#777777]">{asset.symbol}</span> : null}</td>
                    <td className={`px-4 py-3 font-semibold ${tx.amountTHB < 0 || tx.type === 'sell' || tx.type === 'expense' ? 'text-[#c2410c]' : 'text-[#59634a]'}`}>{thb(tx.amountTHB)}</td>
                    <td className="px-4 py-3 text-xs text-[#777777]">{tx.notes ?? ''}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => openEditTransactionNote(tx.id, tx.notes ?? '', tx.description)}
                        >แก้ไข</button>
                        <InvestmentActionButton
                          actionType="finance.archiveTransaction"
                          description={`Archive transaction ${tx.description}`}
                          payload={{ transactionId: tx.id }}
                          createActionRequest={createActionRequest}
                          label="ลบ"
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionPanel>
  </div>
)

const DcaTab = ({
  assetName,
  createActionRequest,
  dcaImpactPreview,
  dcaQueue,
  dcaRecords,
  openAdjustDcaTarget,
  queueDca,
}: {
  assetName: (id: string) => string
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  dcaImpactPreview: string
  dcaQueue: Array<{ assetId: string; cadence: string; plannedAmountTHB: number; status: string; nextRunDate: string }>
  dcaRecords: Array<{ id: string; assetId: string; cadence: string; plannedAmountTHB: number; status: string; nextRunDate: string }>
  openAdjustDcaTarget: (dcaId: string, currentAmount: number, assetLabel: string) => void
  queueDca: () => void
}) => {
  const monthlyDcaTarget = dcaRecords.reduce((s, r) => s + (r.status === 'planned' ? r.plannedAmountTHB : 0), 0)
  return (
    <div className="space-y-5">
      <SectionPanel label="DCA" title="Monthly investment plan" endSlot={<div className="flex flex-wrap gap-2"><span className="pill">{thb(monthlyDcaTarget)} monthly</span><button className="btn-primary" type="button" onClick={queueDca}>Queue DCA Contribution</button></div>}>
        <p className="mb-3 rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-3 text-xs leading-5 text-[#666666]">
          Preview impact: the next DCA adds about {dcaImpactPreview}% of the current portfolio after approval. Approval creates a transaction, ChangeLog, and Snapshot.
        </p>
        {dcaQueue.length === 0 && dcaRecords.length === 0 ? (
          <p className="text-sm text-[#777777]">ยังไม่มีแผน DCA</p>
        ) : (
          <div className="space-y-3">
            {dcaRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{assetName(record.assetId)}</p>
                    <p className="mt-1 text-xs text-[#777777]">{record.cadence} / {thb(record.plannedAmountTHB)} / {record.nextRunDate}</p>
                  </div>
                  <span className="font-mono text-[10px] font-semibold uppercase text-[#9a6a1f]">{record.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <InvestmentActionButton
                    actionType="finance.markDcaSkipped"
                    description={`Skip DCA for ${assetName(record.assetId)}`}
                    payload={{ dcaId: record.id }}
                    createActionRequest={createActionRequest}
                    label="ข้ามรอบนี้"
                  />
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => openAdjustDcaTarget(record.id, record.plannedAmountTHB, assetName(record.assetId))}
                  >ปรับเป้า</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
      <SectionPanel label="DCA allocation" title="Suggested split">
        <div className="grid gap-3 md:grid-cols-3">
          {dcaRecords.filter((r) => r.status === 'planned').map((record) => {
            const pct = monthlyDcaTarget > 0 ? ((record.plannedAmountTHB / monthlyDcaTarget) * 100).toFixed(0) : '0'
            return (
              <div key={record.id} className="rounded-2xl border border-black/[0.04] bg-white/80 p-4">
                <p className="text-sm font-semibold">{assetName(record.assetId)}</p>
                <p className="mt-1 text-xs text-[#777777]">{thb(record.plannedAmountTHB)} / {pct}% of monthly target</p>
              </div>
            )
          })}
        </div>
        {dcaRecords.filter((r) => r.status === 'review').length > 0 ? (
          <p className="mt-3 text-xs leading-5 text-[#9a6a1f]">{dcaRecords.filter((r) => r.status === 'review').length} item(s) pending review before next cycle.</p>
        ) : null}
      </SectionPanel>
    </div>
  )
}

const DividendsTab = ({
  assetName,
  createActionRequest,
  dividendRecords,
  expectedDividends,
}: {
  assetName: (id: string) => string
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  dividendRecords: Array<{ id: string; assetId: string; expectedAmountTHB: number; payDate: string; status: string }>
  expectedDividends: number
}) => (
  <div className="space-y-5">
    <SectionPanel label="Dividends" title="Income layer summary" endSlot={<span className="pill">{thb(expectedDividends)} estimated</span>}>
      {dividendRecords.length === 0 ? (
        <p className="text-sm text-[#777777]">ยังไม่มีข้อมูลปันผล</p>
      ) : (
        <div className="space-y-3">
          {dividendRecords.map((record) => (
            <div key={record.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{assetName(record.assetId)}</p>
                  <p className="mt-1 text-xs text-[#777777]">{thb(record.expectedAmountTHB)} / pay {record.payDate}</p>
                </div>
                <span className="font-mono text-[10px] font-semibold uppercase text-[#9a6a1f]">{record.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <InvestmentActionButton
                  actionType="finance.markDividendReceived"
                  description={`Mark dividend received for ${assetName(record.assetId)}`}
                  payload={{ dividendId: record.id, amountTHB: record.expectedAmountTHB }}
                  createActionRequest={createActionRequest}
                  label="รับแล้ว"
                />
                <InvestmentActionButton
                  actionType="finance.reviewDividendEstimate"
                  description={`Review dividend estimate for ${assetName(record.assetId)}`}
                  payload={{ dividendId: record.id }}
                  createActionRequest={createActionRequest}
                  label="รีวิว"
                />
                <InvestmentActionButton
                  actionType="finance.archiveDividendRow"
                  description={`Archive dividend row for ${assetName(record.assetId)}`}
                  payload={{ dividendId: record.id }}
                  createActionRequest={createActionRequest}
                  label="เก็บ"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
    <SectionPanel label="Income estimate" title="Monthly / annual projection">
      <div className="grid gap-3 md:grid-cols-2">
        <Mini label="Monthly estimate" value={thb(Math.round(expectedDividends / 12))} />
        <Mini label="Annual estimate" value={thb(expectedDividends)} />
      </div>
      <p className="mt-3 text-sm leading-6 text-[#666666]">Estimated from expected dividend rows. Actual pay dates and amounts depend on statement review.</p>
    </SectionPanel>
  </div>
)

const WatchlistTab = ({
  createActionRequest,
  tradingSignals,
  tradingWatchlist,
}: {
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  tradingSignals: Array<{ id: string; symbol: string; signal: string; confidence: number; risk?: string; note: string }>
  tradingWatchlist: Array<{ id: string; symbol: string; thesis: string; risk: string; status: string; notes: string }>
}) => (
  <div className="space-y-5">
    <SectionPanel label="Watchlist" title="Symbols under observation" endSlot={<span className="pill">{tradingWatchlist.length} symbols</span>}>
      {tradingWatchlist.length === 0 ? (
        <p className="text-sm text-[#777777]">ยังไม่มีสินทรัพย์ในรายการติดตาม</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tradingWatchlist.map((item) => (
            <div key={item.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold">{item.symbol}</p>
                  <p className="mt-1 text-xs text-[#777777]">{item.thesis}</p>
                </div>
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(item.risk)}`}>{item.risk}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(item.status)}`}>{item.status}</span>
                <span className="text-xs text-[#777777]">/ {item.notes}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <InvestmentActionButton
                  actionType="finance.approveWatchlistResearch"
                  description={`Approve research for ${item.symbol}`}
                  payload={{ watchlistId: item.id }}
                  createActionRequest={createActionRequest}
                  label="อนุมัติวิจัย"
                />
                <InvestmentActionButton
                  actionType="finance.archiveWatchlistItem"
                  description={`Archive watchlist item ${item.symbol}`}
                  payload={{ watchlistId: item.id }}
                  createActionRequest={createActionRequest}
                  label="เก็บ"
                />
                <InvestmentActionButton
                  actionType="finance.flagWatchlistRisk"
                  description={`Flag risk for ${item.symbol}`}
                  payload={{ watchlistId: item.id, risk: item.risk === 'low' ? 'medium' : item.risk === 'medium' ? 'high' : 'low' }}
                  createActionRequest={createActionRequest}
                  label="เปลี่ยนความเสี่ยง"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
    {tradingSignals.filter((s) => s.signal === 'watch').length > 0 ? (
      <SectionPanel label="Signals" title="Sandbox observations" endSlot={<span className="pill">{tradingSignals.length} signals</span>}>
        <div className="grid gap-3 md:grid-cols-2">
          {tradingSignals.map((signal) => (
            <div key={signal.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{signal.symbol}</p>
                  <p className="mt-1 text-xs text-[#777777]">{signal.note}</p>
                </div>
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(signal.risk ?? '')}`}>{signal.signal} / {signal.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
    ) : null}
  </div>
)

const ResearchTab = ({
  aiImports,
  openAddResearchNote,
  tradingStrategyNotes,
}: {
  aiImports: Array<{ id: string; module: string; title: string; diffPreview: string; reviewStatus: string }>
  openAddResearchNote: () => void
  tradingStrategyNotes: Array<{ id: string; title: string; note: string; riskLevel: string; status?: string; tags?: string[] }>
}) => (
  <div className="space-y-5">
    <SectionPanel label="Research" title="Strategy notes and thesis" endSlot={
      <div className="flex flex-wrap gap-2">
        <span className="pill">{tradingStrategyNotes.length} notes</span>
        <button
          className="btn-secondary"
          type="button"
          onClick={openAddResearchNote}
        >เพิ่มบันทึก</button>
      </div>
    }>
      {tradingStrategyNotes.length === 0 ? (
        <p className="text-sm text-[#777777]">ยังไม่มีบันทึกการวิจัย</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tradingStrategyNotes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold">{note.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#666666]">{note.note}</p>
                </div>
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(note.riskLevel)}`}>{note.riskLevel}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="pill">{note.status}</span>
                  <span className="text-xs text-[#777777]">{(note.tags ?? []).join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
    {aiImports.filter((imp) => imp.module === 'Finance' || imp.module === 'Trading Lab').length > 0 ? (
      <SectionPanel label="AI import notes" title="AI-sourced suggestions" endSlot={<span className="pill">{aiImports.filter((imp) => imp.module === 'Finance' || imp.module === 'Trading Lab').length} imports</span>}>
        <div className="space-y-3">
          {aiImports.filter((imp) => imp.module === 'Finance' || imp.module === 'Trading Lab').map((importItem) => (
            <div key={importItem.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{importItem.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#666666]">{importItem.diffPreview}</p>
                </div>
                <span className="pill">{importItem.reviewStatus}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
    ) : null}
  </div>
)

const AiTab = ({
  aiContexts,
  aiDigests,
  aiObservations,
  createActionRequest,
}: {
  aiContexts: Array<{ id: string; module: string; title: string; body: string; createdAt: string }>
  aiDigests: Array<{ id: string; module: string; title: string; summary: string; notes: string }>
  aiObservations: Array<{ id: string; module: string; title: string; observation: string; reviewStatus: string }>
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
}) => {
  const financeContexts = aiContexts.filter((ctx) => ctx.module === 'Finance' || ctx.module === 'Command Center')
  const financeDigests = aiDigests.filter((digest) => digest.module === 'finance' || digest.module === 'daily')
  const financeObservations = aiObservations.filter((obs) => obs.reviewStatus !== 'archived')
  return (
    <div className="space-y-5">
      <SectionPanel label="AI context" title="Finance & investment reading">
        {financeContexts.length === 0 ? (
          <p className="text-sm text-[#777777]">ไม่มีบริบท AI สำหรับโมดูลการลงทุน</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {financeContexts.map((ctx) => (
              <div key={ctx.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">{ctx.title}</p>
                <p className="mt-3 text-sm leading-6 text-[#666666]">{ctx.body}</p>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
      {financeDigests.length > 0 ? (
        <SectionPanel label="AI digests" title="Finance posture summaries" endSlot={<span className="pill">{financeDigests.length} digests</span>}>
          <div className="space-y-3">
            {financeDigests.map((digest) => (
              <div key={digest.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <p className="text-sm font-semibold">{digest.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#666666]">{digest.summary}</p>
                <p className="mt-2 text-xs text-[#777777]">{digest.notes}</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      ) : null}
      {financeObservations.length > 0 ? (
        <SectionPanel label="AI observations" title="Investment observations" endSlot={
          <div className="flex flex-wrap gap-2">
            <span className="pill">{financeObservations.length} items</span>
            <InvestmentActionButton
              actionType="finance.queueInvestmentAiReview"
              description="Queue AI investment review"
              payload={{ title: 'Manual AI investment review', confidence: 70, notes: 'Manual AI review request from investments workspace.' }}
              createActionRequest={createActionRequest}
              label="ขอ AI รีวิว"
              variant="primary"
            />
          </div>
        }>
          <div className="space-y-3">
            {financeObservations.map((obs) => (
              <div key={obs.id} className="rounded-2xl border border-black/[0.05] bg-[#faf9f8] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{obs.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#666666]">{obs.observation}</p>
                  </div>
                  <span className="pill">{obs.reviewStatus}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <InvestmentActionButton
                    actionType="finance.archiveInvestmentObservation"
                    description={`Archive observation ${obs.title}`}
                    payload={{ observationId: obs.id }}
                    createActionRequest={createActionRequest}
                    label="เก็บ"
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      ) : null}
      <p className="text-sm leading-6 text-[#666666]">AI panels below are shared across all OS modules.</p>
    </div>
  )
}
