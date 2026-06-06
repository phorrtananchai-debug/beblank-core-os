import { type ReactNode, useMemo, useState } from 'react'
import { InvestmentActionButton } from '../../components/investments/InvestmentActionButton'
import { InvestmentInputDialog, type DialogMode } from '../../components/investments/InvestmentInputDialog'
import { PortfolioBucketView } from '../../components/investments/PortfolioBucketView'
import { PortfolioDecisionStrip } from '../../components/investments/PortfolioDecisionStrip'
import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ChangeLogList } from '../../components/shared/ChangeLogList'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { PendingApprovalPanel } from '../../components/shared/PendingApprovalPanel'
import { SnapshotLog } from '../../components/shared/SnapshotLog'
import { AllocationDonut } from '../../components/investments/AllocationDonut'
import { AllocationComparison } from '../../components/investments/AllocationComparison'
import { RebalancePreview } from '../../components/investments/RebalancePreview'
import { computePostureBuckets, computeRebalanceSuggestions } from '../../core/investments/allocationUtils'
import { generateId } from '../../app/utils'
import { getSupportedFinnhubSymbols } from '../../core/connectors'
import { useOs } from '../../core/os/OsContext'
import type { ActionRequest, DcaRecord, DividendRecord, FinanceAsset, Holding, ThaiNavAsset } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString('en-US')} THB`
const usdToThb = 36.5
const statusClass = (status: string) => {
  if (['blocked', 'high', 'at-risk', 'open', 'failed'].includes(status)) return 'text-[var(--bb-red)]'
  if (['review', 'pending', 'medium', 'active', 'watching'].includes(status)) return 'text-[var(--bb-amber)]'
  return 'text-[var(--bb-green)]'
}

type InvestmentsTab = 'overview' | 'portfolio' | 'holdings' | 'allocation' | 'transactions' | 'dca' | 'dividends' | 'watchlist' | 'research' | 'ai'

const tabs: Array<{ key: InvestmentsTab; label: string }> = [
  { key: 'overview', label: 'ภาพรวม' },
  { key: 'portfolio', label: 'พอร์ต' },
  { key: 'holdings', label: 'กองทุน' },
  { key: 'allocation', label: 'จัดสรร' },
  { key: 'transactions', label: 'ธุรกรรม' },
  { key: 'dca', label: 'DCA' },
  { key: 'dividends', label: 'ปันผล' },
  { key: 'watchlist', label: 'ติดตาม' },
  { key: 'research', label: 'วิจัย' },
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

  const hasInvestments = data.holdings.length > 0 || data.financeAssets.length > 0
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
                    <span className="block text-sm font-bold">{suggestion.symbol} <span className="font-normal text-[var(--bb-text-muted)]">/ {suggestion.name}</span></span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{suggestion.market} / {suggestion.currency} / {suggestion.sourceLabel}</span>
                  </button>
                )) : <p className="px-3 py-2 text-xs text-[var(--bb-text-muted)]">No suggestion. Manual symbol entry is allowed.</p>}
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
          <p className="text-lg font-bold">ตรวจสอบก่อนอนุมัติ</p>
          <p className="mt-2 text-sm leading-6 text-[var(--bb-text-soft)]">แบบร่างเท่านั้น สินทรัพย์จะถูกสร้างเมื่ออนุมัติผ่าน ActionRequest และ mock Sheet adapter</p>
        </div>
        <span className="pill">source: manual</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Mini label="ต้นทุน" value={thb(manualPreview.costBasisTHB)} />
        <Mini label="มูลค่าปัจจุบัน" value={thb(manualPreview.currentValueTHB)} />
        <Mini label="แหล่งที่มา" value={helperSource} />
        <Mini label="ผลกระทบจัดสรร" value={`${manualPreview.allocationImpact.toFixed(1)}%`} />
        <Mini label="ผลกระทบ DCA" value={manualPreview.dcaImpact} />
        <Mini label="สถานะแหล่ง" value={isThaiAsset ? 'Thai NAV / ช่วยป้อน' : 'Finnhub สำหรับ US เท่านั้น'} />
      </div>
      {manualPreview.missingDataWarning ? <p className="mt-4 rounded-2xl border border-[#ead7c3] bg-[#fffaf4] p-3 text-xs leading-5 text-[#9a4f18]">{manualPreview.missingDataWarning}</p> : null}
      <p className="mt-4 text-xs leading-5 text-[var(--bb-text-soft)]">Finnhub เป็นแหล่งเสริมสำหรับสินทรัพย์ US เท่านั้น ไม่สามารถเขียนทับหน่วย ต้นทุนถัวเฉลี่ย สัดส่วน หรือบันทึกของ Por ได้</p>
      {withSubmit ? <button className="btn-primary mt-5 w-full" type="button" onClick={queueManualAssetAdd}>Queue for Approval</button> : null}
    </article>
  )

  return (
    <section className="space-y-5">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">การลงทุน / แกนหลัก Aequitas</p>
        <h2 className="mt-4 text-2xl font-extrabold leading-[0.92]">การลงทุน / หุ้น</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <OsHeroMetric icon="◆" value={hasInvestments ? thb(totalValue) : '—'} label="มูลค่าพอร์ต" helper={hasInvestments ? 'รวมทุกประเภท' : 'ยังไม่มีข้อมูล'} color="neutral" progress={100} />
          <OsHeroMetric icon="○" value={cashPosture > 0 ? thb(cashPosture) : '—'} label="เงินสดรอจัดสรร" helper={cashPosture > 0 ? 'สำรอง' : 'ยังไม่มีข้อมูล'} color="blue" progress={totalValue > 0 ? (cashPosture / totalValue) * 100 : 0} />
          <OsHeroMetric icon="↓" value={monthlyDcaTarget > 0 ? thb(monthlyDcaTarget) : '—'} label="แผน DCA เดือนนี้" helper={monthlyDcaTarget > 0 ? 'เป้าหมายรายเดือน' : 'ยังไม่มีข้อมูล'} color="green" progress={totalValue > 0 ? (monthlyDcaTarget / totalValue) * 100 : 0} />
          <OsHeroMetric icon="☆" value={expectedDividends > 0 ? thb(expectedDividends) : '—'} label="ปันผลประมาณการ" helper={expectedDividends > 0 ? 'ต่อปี' : 'ยังไม่มีข้อมูล'} color="purple" progress={totalValue > 0 ? (expectedDividends / totalValue) * 100 : 0} />
          <OsHeroMetric icon="△" value={driftHoldings.length > 0 ? `${driftHoldings.length} รายการ` : '—'} label="ความคลาดเคลื่อน" helper={driftHoldings.length > 0 ? 'สัดส่วนที่ดริฟท์' : 'ไม่มีรายการ'} color={driftHoldings.length > 0 ? 'amber' : 'green'} progress={Math.min(driftHoldings.length * 10, 100)} />
        </div>
      </header>

      {!hasInvestments ? (
        <div className="rounded-[28px] border border-dashed border-black/[0.12] bg-[#faf9f8] p-6 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Empty portfolio</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight">ยังไม่มีพอร์ตการลงทุน</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#666666]">
            เพิ่มพอร์ตหรือ import allocation เพื่อเริ่มวิเคราะห์
          </p>
          <button className="btn-primary mt-5" type="button" onClick={() => setShowAssetModal(true)}>ตั้งค่าพอร์ตแรก</button>
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-full px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
              activeTab === tab.key ? 'bg-accent text-white' : 'bg-white/70 text-[var(--bb-text-muted)] hover:bg-black/[0.05] hover:text-[var(--bb-text)]'
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
          dcaRecords={data.dcaRecords}
          dividendRecords={data.dividendRecords}
          createActionRequest={createActionRequest}
          queueDriftReview={queueDriftReview}
          queueThaiNavReview={queueThaiNavReview}
          setNavDrafts={setNavDrafts}
          thaiNavAssets={data.thaiNavAssets}
          totalValue={totalValue}
          assetName={assetName}
        />
      ) : null}

      {activeTab === 'allocation' ? (
        <AllocationTab
          createActionRequest={createActionRequest}
          financeAssets={data.financeAssets}
          holdings={data.holdings}
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
                  <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">แหล่งข้อมูลหลัก</p>
                  <h3>เพิ่มสินทรัพย์ในสมุด Aequitas</h3>
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
                <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">เพิ่มสินทรัพย์</p>
                <h3>ตรวจสอบก่อนอนุมัติ</h3>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setShowAssetModal(false)}>ปิด</button>
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

const OsHeroMetric = ({
  icon,
  value,
  label,
  helper,
  color,
  progress,
}: {
  icon: string
  value: string
  label: string
  helper: string
  color: string
  progress: number
}) => {
  const parts = value.split(/\s+/)
  const num = parts.filter((p) => p !== 'THB').join(' ')
  const hasThb = parts.includes('THB')
  return (
    <div className={`os-hero-metric os-hero-metric-${color}`}>
      <div className="flex items-center gap-3">
        <span className={`os-icon-badge os-icon-badge-${color}`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="os-hero-value">{num}</p>
          {hasThb && <p className="os-hero-unit">THB</p>}
          <p className="mt-0.5 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{label}</p>
        </div>
      </div>
      <div className="mt-3 os-progress-rail">
        <div className={`os-progress-fill-${color}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <p className="os-hero-sub">{helper}</p>
    </div>
  )
}

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/75 px-4 py-3">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p>
    <p className="mt-2 text-lg font-bold">{value}</p>
  </div>
)

const Mini = ({ label, value }: { label: string; value: string | ReactNode }) => (
  <div className="rounded-2xl border border-black/[0.04] bg-white/80 p-3">
    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{label}</p>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
)

const Field = ({ children, label }: { children: ReactNode; label: string }) => (
  <label className="mt-3 block">
    <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</span>
    {children}
  </label>
)

const SectionPanel = ({ children, label, title, endSlot }: { children: ReactNode; label: string; title: string; endSlot?: ReactNode }) => (
  <section className="panel panel-float">
    <div className="panel-header">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{label}</p>
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
    <SectionPanel label="สรุปพอร์ต" title="สมุดบันทึกความมั่งคั่ง">
      <div className="grid gap-3 md:grid-cols-6">
        <Metric label="มูลค่ารวม" value={thb(totalValue)} />
        <Metric label="DCA ต่อเดือน" value={thb(monthlyDcaTarget)} />
        <Metric label="ปันผลประมาณการ" value={thb(expectedDividends)} />
        <Metric label="เงินสดสำรอง" value={thb(cashPosture)} />
        <Metric label="รายการดริฟท์" value={driftHoldings.length} />
        <Metric label="กลุ่มจัดสรร" value={Object.keys(holdingsByCategory).length} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--bb-text-soft)]">พอร์ตทั้งหมดป้อนด้วยมือ ราคาช่วยประมาณมูลค่าแต่ไม่เขียนทับหน่วย ต้นทุนถัวเฉลี่ย การจัดสรร หรือบันทึกของ Por</p>
    </SectionPanel>
    <SectionPanel label="สัดส่วนพอร์ต" title="Core / Growth / Income / Reserve / Thai">
      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(holdingsByCategory).map(([category, value]) => <Metric key={category} label={category} value={thb(value)} />)}
      </div>
      <div className="mt-4">
        <div className="os-stacked-bar h-2.5 rounded-full">
          {(() => {
            const entries = Object.entries(holdingsByCategory).sort((a, b) => b[1] - a[1])
            const total = totalValue || 1
            return entries.map(([category, value], i) => (
              <div
                key={category}
                className="os-stacked-bar-segment first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${(value / total) * 100}%`,
                  background: i === 0 ? 'var(--bb-green)' : i === 1 ? 'var(--bb-blue)' : i === 2 ? 'var(--bb-amber)' : i === 3 ? 'var(--bb-purple)' : 'var(--bb-text-muted)',
                }}
              />
            ))
          })()}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(holdingsByCategory).sort((a, b) => b[1] - a[1]).map(([category, value], i) => (
            <span key={category} className="flex items-center gap-1 font-mono text-[9px] font-semibold uppercase text-[var(--bb-text-muted)]">
              <span className="block h-1.5 w-1.5 rounded-full" style={{
                background: i === 0 ? 'var(--bb-green)' : i === 1 ? 'var(--bb-blue)' : i === 2 ? 'var(--bb-amber)' : i === 3 ? 'var(--bb-purple)' : 'var(--bb-text-muted)',
              }} />
              {category} {(value / (totalValue || 1) * 100).toFixed(1)}%
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Mini label="เงินสดสำรอง" value={thb(cashPosture)} />
        <Mini label="ความเสี่ยงสูง" value={String(riskPosture)} />
        <Mini label="ผลกระทบ DCA" value={`${dcaImpactPreview}% ของพอร์ต`} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--bb-text-soft)]">จัดกลุ่มตามประเภทสินทรัพย์ เป้าหมายและการดริฟท์ตรวจสอบได้ในแท็บจัดสรร</p>
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
      <SectionPanel label="แหล่งข้อมูลหลัก" title="เพิ่มสินทรัพย์ในสมุด Aequitas" endSlot={<button className="btn-primary" type="button" onClick={() => setShowAssetModal(true)}>เปิด Modal</button>}>
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          {renderAssetInputs()}
          {renderApprovalPreview()}
        </div>
      </SectionPanel>

      <SectionPanel label="รีเฟรชราคา Finnhub" title="แคชราคาล่าช้า / สภาพ THB" endSlot={
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={queueMarketSourceReview}>ตรวจสอบแหล่ง</button>
          <button className="btn-primary" type="button" onClick={queueMarketRefresh}>รีเฟรชราคา</button>
        </div>
      }>
        <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <article className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold">สถานะ Connector</p>
                <p className="mt-2 text-sm leading-6 text-[var(--bb-text-soft)]">รีเฟรชที่อนุมัติด้วยตนเองเท่านั้น ถ้าไม่มีคีย์หรือคำขอล้มเหลว ราคา mock/fallback จะยังแสดงอยู่</p>
              </div>
              <span className="pill">{finnhubProvider?.mode ?? 'fallback'}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Mini label="ซิงค์ล่าสุด" value={finnhubProvider?.lastUpdated ? new Date(finnhubProvider.lastUpdated).toLocaleString() : 'ไม่ได้ซิงค์'} />
              <Mini label="ข้อมูลเก่า" value={finnhubProvider?.stale ? 'ใช่' : 'ไม่'} />
              <Mini label="ใช้ Fallback" value={finnhubProvider?.fallbackUsed ? 'ใช่' : 'ไม่'} />
              <Mini label="การทำงาน" value="ไม่มี / อ่านอย่างเดียว" />
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">Supported: {supportedMarketSymbols.join(' / ')}</p>
            {finnhubProvider?.error ? <p className="mt-4 rounded-2xl border border-[#ead7c3] bg-white/80 p-3 text-xs leading-5 text-[#9a4f18]">{finnhubProvider.error}</p> : null}
          </article>
          <article className="rounded-[28px] border border-black/[0.05] bg-white/75 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-semibold text-[var(--bb-text-muted)]">แถวแคชชีท</p>
              <span className="pill">{marketSymbols.length} symbols</span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {marketSymbols.map((symbol) => (
                <div key={symbol.id} className="rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{symbol.symbol}</p>
                      <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{symbol.notes}</p>
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-amber)]">{thb(symbol.delayedPriceTHB)}</span>
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
  dcaRecords,
  dividendRecords,
  createActionRequest,
  queueDriftReview,
  queueThaiNavReview,
  setNavDrafts,
  thaiNavAssets,
  totalValue,
  assetName,
}: {
  financeAssets: FinanceAsset[]
  holdings: Holding[]
  navDrafts: Record<string, string>
  dcaRecords: DcaRecord[]
  dividendRecords: DividendRecord[]
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  queueDriftReview: (holding: Holding) => void
  queueThaiNavReview: (navAssetId: string, fallbackNav: number) => void
  setNavDrafts: (updater: (prev: Record<string, string>) => Record<string, string>) => void
  thaiNavAssets: ThaiNavAsset[]
  totalValue: number
  assetName: (id: string) => string
}) => (
  <div className="space-y-5">
    <PortfolioDecisionStrip
      holdings={holdings}
      dcaRecords={dcaRecords}
      dividendRecords={dividendRecords}
      totalValue={totalValue}
      assetName={assetName}
    />
    <PortfolioBucketView
      holdings={holdings}
      financeAssets={financeAssets}
      thaiNavAssets={thaiNavAssets}
      dcaRecords={dcaRecords}
      dividendRecords={dividendRecords}
      totalValue={totalValue}
      queueDriftReview={queueDriftReview}
      createActionRequest={createActionRequest}
    />

    {/* Thai NAV operations (subdued) */}
    {thaiNavAssets.length > 0 ? (
      <section className="rounded-[28px] border border-black/[0.05] bg-white/60">
        <div className="border-b border-black/[0.05] px-5 py-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Thai NAV Helper Operations</p>
          <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">NAV values merged into bucket view above. Edit NAV manually below.</p>
        </div>
        <div className="divide-y divide-black/[0.03]">
          {thaiNavAssets.map((asset) => {
            const valueTHB = asset.valueTHB ?? (asset.units ?? 0) * asset.nav
            return (
              <div key={asset.id} className="grid gap-3 px-5 py-3 md:grid-cols-[1fr_120px_120px_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold">{asset.symbol}</p>
                  <p className="text-xs text-[var(--bb-text-muted)]">{asset.displayName ?? ''} / {thb(valueTHB)}</p>
                </div>
                <input className="input" inputMode="decimal" value={navDrafts[asset.id] ?? String(asset.nav)} onChange={(event) => setNavDrafts((prev) => ({ ...prev, [asset.id]: event.target.value }))} />
                <p className="text-xs text-[var(--bb-text-muted)] md:text-right">NAV updated {asset.updatedAt}</p>
                <button className="btn-secondary text-xs" type="button" onClick={() => queueThaiNavReview(asset.id, asset.nav)}>Queue NAV Review</button>
              </div>
            )
          })}
        </div>
      </section>
    ) : null}
  </div>
)

const AllocationTab = ({
  createActionRequest,
  financeAssets,
  holdings,
  totalValue,
}: {
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  financeAssets: Array<{ id: string; symbol?: string; name?: string; category?: string }>
  holdings: Array<Holding & { currentPosture?: string }>
  totalValue: number
}) => {
  const buckets = useMemo(() => computePostureBuckets(holdings as Holding[]), [holdings])
  const rebalanceSuggestions = useMemo(() => computeRebalanceSuggestions(holdings as Holding[], financeAssets), [holdings, financeAssets])
  const driftCount = holdings.filter((h) => Math.abs((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) >= 2).length

  const donutSlices = buckets.map((b) => ({
    id: b.id,
    label: b.label,
    color: b.color,
    percent: b.currentPercent,
    valueTHB: b.valueTHB,
  }))

  const handleQueueRebalance = (suggestions: Array<{ symbol: string; direction: string; suggestedAdjustmentTHB: number }>) => {
    createActionRequest({
      module: 'finance',
      actionType: 'finance.rebalancePlan',
      description: `Rebalance plan: ${suggestions.filter((s) => s.direction === 'buy').length} buys, ${suggestions.filter((s) => s.direction === 'sell').length} sells`,
      payload: {
        planId: generateId('rb'),
        suggestions,
        totalValue,
        createdAt: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="space-y-5">
      {/* Donut + Comparison side by side */}
      <SectionPanel label="จัดสรรพอร์ต" title="Allocation Overview" endSlot={<span className="pill">{driftCount} holdings drifted</span>}>
        {holdings.length === 0 ? (
          <p className="text-sm text-[var(--bb-text-muted)]">No holdings yet. Add investments to see allocation.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <AllocationDonut slices={donutSlices} totalValue={totalValue} size={220} strokeWidth={32} />
            <AllocationComparison buckets={buckets} />
          </div>
        )}
      </SectionPanel>

      {/* Rebalance Preview */}
      <SectionPanel label="ปรับสมดุล" title="Rebalance Preview" endSlot={
        <span className="pill">{rebalanceSuggestions.length} suggestions</span>
      }>
        {holdings.length === 0 ? (
          <p className="text-sm text-[var(--bb-text-muted)]">No rebalance data available.</p>
        ) : (
          <RebalancePreview
            suggestions={rebalanceSuggestions}
            onQueueRebalance={handleQueueRebalance}
          />
        )}
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
    <SectionPanel label="ธุรกรรม" title="รายการล่าสุด" endSlot={
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
        <p className="text-sm text-[var(--bb-text-muted)]">ยังไม่มีรายการเดินบัญชี</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {transactions.map((tx) => {
            const asset = financeAssets.find((a) => a.id === tx.assetId)
            return (
              <div key={tx.id} className="os-list-row">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold break-words">{tx.description}{asset ? <span className="text-xs font-normal text-[var(--bb-text-muted)]"> / {asset.symbol}</span> : null}</p>
                    <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{tx.occurredAt}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`font-semibold ${tx.amountTHB < 0 || tx.type === 'sell' || tx.type === 'expense' ? 'text-[var(--bb-red)]' : 'text-[var(--bb-green)]'}`}>{thb(tx.amountTHB)}</span>
                    <p className="text-xs text-[var(--bb-text-muted)]"><span className="pill">{tx.type}</span></p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--bb-text-soft)] break-words">{tx.notes ?? ''}</p>
                <div className="mt-3 flex flex-wrap gap-2">
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
              </div>
            )
          })}
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
      <SectionPanel label="DCA" title="แผนลงทุนประจำ" endSlot={<div className="flex flex-wrap gap-2"><span className="pill">{thb(monthlyDcaTarget)} ต่อเดือน</span><button className="btn-primary" type="button" onClick={queueDca}>ดำเนินการ DCA</button></div>}>
        <p className="mb-3 rounded-2xl border border-black/[0.04] bg-[#faf9f8] p-3 text-xs leading-5 text-[var(--bb-text-soft)]">
          ผลกระทบเบื้องต้น: DCA ครั้งถัดไปจะเพิ่มประมาณ {dcaImpactPreview}% ของพอร์ตหลังอนุมัติ การอนุมัติจะสร้างธุรกรรม รายการเปลี่ยนแปลง และ Snapshot
        </p>
        {dcaQueue.length === 0 && dcaRecords.length === 0 ? (
          <p className="text-sm text-[var(--bb-text-muted)]">ยังไม่มีแผน DCA</p>
        ) : (
          <div className="space-y-3">
            {dcaRecords.map((record) => (
              <div key={record.id} className="os-list-row">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{assetName(record.assetId)}</p>
                    <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{record.cadence} / {thb(record.plannedAmountTHB)} / {record.nextRunDate}</p>
                  </div>
                  <span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-amber)]">{record.status}</span>
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
      <SectionPanel label="สัดส่วน DCA" title="สัดส่วนแนะนำ">
        <div className="grid gap-3 md:grid-cols-3">
          {dcaRecords.filter((r) => r.status === 'planned').map((record) => {
            const pct = monthlyDcaTarget > 0 ? ((record.plannedAmountTHB / monthlyDcaTarget) * 100).toFixed(0) : '0'
            return (
              <div key={record.id} className="rounded-2xl border border-black/[0.04] bg-white/80 p-4">
                <p className="text-sm font-semibold">{assetName(record.assetId)}</p>
                <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{thb(record.plannedAmountTHB)} / {pct}% of monthly target</p>
              </div>
            )
          })}
        </div>
        {dcaRecords.filter((r) => r.status === 'review').length > 0 ? (
          <p className="mt-3 text-xs leading-5 text-[var(--bb-amber)]">{dcaRecords.filter((r) => r.status === 'review').length} item(s) pending review before next cycle.</p>
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
    <SectionPanel label="ปันผล" title="สรุปชั้นรายได้" endSlot={<span className="pill">{thb(expectedDividends)} ประมาณการ</span>}>
      {dividendRecords.length === 0 ? (
        <p className="text-sm text-[var(--bb-text-muted)]">ยังไม่มีข้อมูลปันผล</p>
      ) : (
        <div className="space-y-3">
          {dividendRecords.map((record) => (
            <div key={record.id} className="os-list-row">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{assetName(record.assetId)}</p>
                  <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{thb(record.expectedAmountTHB)} / pay {record.payDate}</p>
                </div>
                <span className="font-mono text-[10px] font-semibold uppercase text-[var(--bb-amber)]">{record.status}</span>
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
    <SectionPanel label="ประมาณการรายได้" title="ประมาณการรายเดือน/รายปี">
      <div className="grid gap-3 md:grid-cols-2">
        <Mini label="ประมาณการต่อเดือน" value={thb(Math.round(expectedDividends / 12))} />
        <Mini label="ประมาณการต่อปี" value={thb(expectedDividends)} />
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">ประมาณจากรายการปันผลที่คาดไว้ วันที่และจำนวนเงินจริงขึ้นอยู่กับการตรวจสอบใบแจ้งยอด</p>
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
    <SectionPanel label="รายการติดตาม" title="สินทรัพย์ที่เฝ้าดู" endSlot={<span className="pill">{tradingWatchlist.length} รายการ</span>}>
      {tradingWatchlist.length === 0 ? (
        <p className="text-sm text-[var(--bb-text-muted)]">ยังไม่มีสินทรัพย์ในรายการติดตาม</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tradingWatchlist.map((item) => (
            <div key={item.id} className="os-list-row">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold">{item.symbol}</p>
                  <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{item.thesis}</p>
                </div>
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(item.risk)}`}>{item.risk}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(item.status)}`}>{item.status}</span>
                <span className="text-xs text-[var(--bb-text-muted)]">/ {item.notes}</span>
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
      <SectionPanel label="สัญญาณ" title="การสังเกตใน Sandbox" endSlot={<span className="pill">{tradingSignals.length} สัญญาณ</span>}>
        <div className="grid gap-3 md:grid-cols-2">
          {tradingSignals.map((signal) => (
            <div key={signal.id} className="os-list-row">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{signal.symbol}</p>
                  <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{signal.note}</p>
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
    <SectionPanel label="วิจัย" title="บันทึกกลยุทธ์และทฤษฎี" endSlot={
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
        <p className="text-sm text-[var(--bb-text-muted)]">ยังไม่มีบันทึกการวิจัย</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tradingStrategyNotes.map((note) => (
            <div key={note.id} className="os-list-row">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold">{note.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--bb-text-soft)]">{note.note}</p>
                </div>
                <span className={`font-mono text-[10px] font-semibold uppercase ${statusClass(note.riskLevel)}`}>{note.riskLevel}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="pill">{note.status}</span>
                  <span className="text-xs text-[var(--bb-text-muted)]">{(note.tags ?? []).join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
    {aiImports.filter((imp) => imp.module === 'Finance' || imp.module === 'Trading Lab').length > 0 ? (
      <SectionPanel label="บันทึกจาก AI" title="ข้อเสนอแนะจาก AI" endSlot={<span className="pill">{aiImports.filter((imp) => imp.module === 'Finance' || imp.module === 'Trading Lab').length} รายการ</span>}>
        <div className="space-y-3">
          {aiImports.filter((imp) => imp.module === 'Finance' || imp.module === 'Trading Lab').map((importItem) => (
            <div key={importItem.id} className="os-list-row">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{importItem.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--bb-text-soft)]">{importItem.diffPreview}</p>
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
      <SectionPanel label="บริบท AI" title="ข้อมูลการเงินและการลงทุนสำหรับ AI">
        {financeContexts.length === 0 ? (
          <p className="text-sm text-[var(--bb-text-muted)]">ไม่มีบริบท AI สำหรับโมดูลการลงทุน</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {financeContexts.map((ctx) => (
              <div key={ctx.id} className="os-list-row">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">{ctx.title}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--bb-text-soft)]">{ctx.body}</p>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
      {financeDigests.length > 0 ? (
        <SectionPanel label="สรุป AI" title="สรุปสถานะการเงิน" endSlot={<span className="pill">{financeDigests.length} รายการ</span>}>
          <div className="space-y-3">
            {financeDigests.map((digest) => (
              <div key={digest.id} className="os-list-row">
                <p className="text-sm font-semibold">{digest.title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--bb-text-soft)]">{digest.summary}</p>
                <p className="mt-2 text-xs text-[var(--bb-text-muted)]">{digest.notes}</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      ) : null}
      {financeObservations.length > 0 ? (
        <SectionPanel label="ข้อสังเกต AI" title="ข้อสังเกตการลงทุน" endSlot={
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
              <div key={obs.id} className="os-list-row">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{obs.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--bb-text-soft)]">{obs.observation}</p>
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
      <p className="text-sm leading-6 text-[var(--bb-text-soft)]">แผง AI ด้านล่างใช้ร่วมกันทุกโมดูลของ OS</p>
    </div>
  )
}
