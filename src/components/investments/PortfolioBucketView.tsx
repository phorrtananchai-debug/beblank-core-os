import { useMemo, type ReactNode } from 'react'
import type { ActionRequest, DcaRecord, DividendRecord, FinanceAsset, Holding, ThaiNavAsset } from '../../types/models'

const thb = (value = 0) => `${Math.round(value).toLocaleString()} THB`
const pct = (value: number | undefined | null) => `${(value ?? 0).toFixed(1)}%`
const driftStyle = (drift: number) => {
  if (drift > 2) return 'text-[#c2410c]'
  if (drift < -2) return 'text-[#59634a]'
  return 'text-[#777777]'
}

type BucketId = 'core-wealth' | 'growth-engine' | 'income-layer' | 'thai-tax' | 'cash-reserve' | 'sandbox' | 'watchlist' | 'unclassified'

interface BucketMeta {
  id: BucketId
  name: string
  purpose: string
}

const BUCKET_META: Record<BucketId, BucketMeta> = {
  'core-wealth': { id: 'core-wealth', name: 'Core Wealth', purpose: 'Long-term core holdings, market anchor' },
  'growth-engine': { id: 'growth-engine', name: 'Growth Engine', purpose: 'Compounders, tech, innovation exposure' },
  'income-layer': { id: 'income-layer', name: 'Income Layer', purpose: 'Dividends, premium income, cashflow' },
  'thai-tax': { id: 'thai-tax', name: 'Thai Tax Wrapper', purpose: 'RMF / Thai fund tax-advantaged sleeve' },
  'cash-reserve': { id: 'cash-reserve', name: 'Cash Reserve', purpose: 'Dry powder, operating liquidity' },
  sandbox: { id: 'sandbox', name: 'Sandbox', purpose: 'High-risk experiments, satellite positions' },
  watchlist: { id: 'watchlist', name: 'Watchlist / Research', purpose: 'Under observation, not yet held' },
  unclassified: { id: 'unclassified', name: 'Unclassified', purpose: 'Fallback — review mapping' },
}

const SYMBOL_BUCKET: Record<string, BucketId> = {
  VOO: 'core-wealth',
  'K-US500X-A(A)': 'core-wealth',
  'K-US500XRMF': 'core-wealth',
  MSFT: 'growth-engine',
  GOOGL: 'growth-engine',
  AMZN: 'growth-engine',
  AVGO: 'growth-engine',
  NVDA: 'growth-engine',
  PLTR: 'growth-engine',
  ANET: 'growth-engine',
  TSLA: 'growth-engine',
  SCHD: 'income-layer',
  JEPQ: 'income-layer',
  ABBV: 'income-layer',
  'TH-INCOME-DIV': 'income-layer',
  'CASH-THB': 'cash-reserve',
  RBRK: 'sandbox',
  MRVL: 'sandbox',
  DDOG: 'sandbox',
}

const bucketForHolding = (holding: Holding, asset: FinanceAsset | undefined): BucketId => {
  const symbol = asset?.symbol ?? ''
  if (SYMBOL_BUCKET[symbol]) return SYMBOL_BUCKET[symbol]
  if (asset?.category === 'cash') return 'cash-reserve'
  if (asset?.region === 'TH' && asset?.category === 'fund') return 'thai-tax'
  if (asset?.assetType === 'thai-rmf' || asset?.assetType === 'thai-mutual-fund') return 'thai-tax'
  if (holding.currentPosture === 'core') return 'core-wealth'
  if (holding.currentPosture === 'growth') return 'growth-engine'
  if (holding.currentPosture === 'income') return 'income-layer'
  if (holding.currentPosture === 'reserve') return 'cash-reserve'
  if (holding.currentPosture === 'watch' || holding.risk === 'high') return 'sandbox'
  return 'unclassified'
}

interface EnrichedHolding extends Holding {
  asset: FinanceAsset | undefined
  drift: number
}

interface BucketGroup {
  meta: BucketMeta
  holdings: EnrichedHolding[]
  valueTHB: number
  targetAllocationPercent: number
  allocationPercent: number
  drift: number
  status: 'on-track' | 'review' | 'attention'
}

export type PortfolioBucketViewProps = {
  holdings: Holding[]
  financeAssets: FinanceAsset[]
  thaiNavAssets: ThaiNavAsset[]
  dcaRecords: DcaRecord[]
  dividendRecords: DividendRecord[]
  totalValue: number
  queueDriftReview: (holding: Holding) => void
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
}

export const PortfolioBucketView = ({
  holdings,
  financeAssets,
  dcaRecords,
  dividendRecords,
  totalValue,
  thaiNavAssets: navAssets,
  queueDriftReview,
  createActionRequest,
}: PortfolioBucketViewProps): ReactNode => {
  const assetMap = useMemo(() => {
    const map = new Map<string, FinanceAsset>()
    for (const asset of financeAssets) map.set(asset.id, asset)
    for (const nav of navAssets) {
      const synthId = `synth-nav-${nav.id}`
      if (!map.has(synthId)) {
        const assetType = nav.symbol.includes('RMF') ? 'thai-rmf' : 'thai-mutual-fund'
        map.set(synthId, {
          id: synthId,
          name: nav.displayName ?? nav.symbol,
          symbol: nav.symbol,
          currency: 'THB',
          category: 'fund',
          region: 'TH',
          assetType,
        } as FinanceAsset)
      }
    }
    return map
  }, [financeAssets, navAssets])

  const dcaMap = useMemo(() => {
    const map = new Map<string, DcaRecord>()
    for (const dca of dcaRecords) map.set(dca.assetId, dca)
    return map
  }, [dcaRecords])

  const dividendMap = useMemo(() => {
    const map = new Map<string, DividendRecord>()
    for (const div of dividendRecords) map.set(div.assetId, div)
    return map
  }, [dividendRecords])

  const buckets = useMemo(() => {
    const navDerived: Array<{ asset: FinanceAsset; holding: Holding }> = navAssets.map((nav) => {
      const synthId = `synth-nav-${nav.id}`
      const valueTHB = nav.valueTHB ?? (nav.units ?? 0) * nav.nav
      return {
        asset: assetMap.get(synthId)!,
        holding: {
          id: synthId,
          assetId: synthId,
          quantity: nav.units ?? 0,
          units: nav.units,
          averageCost: nav.nav,
          marketValueTHB: valueTHB,
          allocationPercent: totalValue > 0 ? (valueTHB / (totalValue + navAssets.reduce((s, n) => s + (n.valueTHB ?? (n.units ?? 0) * n.nav), 0))) * 100 : 0,
          targetAllocationPercent: 0,
          risk: 'low',
          notes: nav.notes,
          currentPosture: nav.symbol.includes('DIV') ? 'income' : 'core',
          dcaStatus: 'paused',
          sourceStatus: nav.sourceStatus,
          lastUpdated: nav.updatedAt,
        },
      }
    })

    const enriched = [...holdings, ...navDerived.map((n) => n.holding)].map((h) => ({
      ...h,
      asset: assetMap.get(h.assetId),
      drift: (h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0),
    }))

    const groups = new Map<BucketId, EnrichedHolding[]>()
    for (const id of Object.keys(BUCKET_META) as BucketId[]) groups.set(id, [])

    for (const h of enriched) {
      const bucketId = bucketForHolding(h, h.asset)
      groups.get(bucketId)?.push(h)
    }

    const result: BucketGroup[] = []
    for (const [id, bucketHoldings] of groups) {
      if (bucketHoldings.length === 0 && id !== 'unclassified') continue
      const meta = BUCKET_META[id]
      const valueTHB = bucketHoldings.reduce((s, h) => s + (h.marketValueTHB ?? 0), 0)
      const targetSum = bucketHoldings.reduce((s, h) => s + (h.targetAllocationPercent ?? 0), 0)
      const allocSum = bucketHoldings.reduce((s, h) => s + (h.allocationPercent ?? 0), 0)
      const drift = allocSum - targetSum
      const hasDrift = bucketHoldings.some((h) => Math.abs(h.drift) >= 2)
      const hasRisk = bucketHoldings.some((h) => h.risk === 'high')
      const status: BucketGroup['status'] = hasRisk ? 'attention' : hasDrift ? 'review' : 'on-track'
      result.push({ meta, holdings: bucketHoldings, valueTHB, targetAllocationPercent: targetSum, allocationPercent: allocSum, drift, status })
    }

    return result
  }, [holdings, assetMap, navAssets, totalValue])

  if (holdings.length === 0) {
    return (
      <div className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-6 text-center">
        <p className="text-sm text-[#777777]">ไม่มีข้อมูลการถือครอง</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {buckets.map((bucket) => (
        <BucketSection
          key={bucket.meta.id}
          bucket={bucket}
          dcaMap={dcaMap}
          dividendMap={dividendMap}
          queueDriftReview={queueDriftReview}
          createActionRequest={createActionRequest}
          totalValue={totalValue}
        />
      ))}
    </div>
  )
}

const BucketSection = ({
  bucket,
  dcaMap,
  dividendMap,
  queueDriftReview,
  createActionRequest,
  totalValue,
}: {
  bucket: BucketGroup
  dcaMap: Map<string, DcaRecord>
  dividendMap: Map<string, DividendRecord>
  queueDriftReview: (holding: Holding) => void
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  totalValue: number
}): ReactNode => {
  const valuePct = totalValue > 0 ? ((bucket.valueTHB / totalValue) * 100).toFixed(1) : '0.0'
  const statusColor = bucket.status === 'attention' ? 'bg-[#fdeae7] text-[#c2410c]' : bucket.status === 'review' ? 'bg-[#fff4d8] text-[#9a6a1f]' : 'bg-[#e8f8ef] text-[#16a36a]'

  return (
    <section className="rounded-[28px] border border-black/[0.05] bg-white overflow-hidden">
      {/* Bucket Header */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-black/[0.05] bg-[#faf9f8] px-5 py-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold">{bucket.meta.name}</h3>
            <span className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${statusColor}`}>{bucket.status}</span>
          </div>
          <p className="mt-0.5 text-xs text-[#777777]">{bucket.meta.purpose}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-[9px] font-semibold text-[#777777]">มูลค่า</p>
            <p className="text-sm font-bold">{thb(bucket.valueTHB)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-[#777777]">สัดส่วน</p>
            <p className="text-sm font-bold">{valuePct}%</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-[#777777]">เป้าหมาย</p>
            <p className="text-sm font-bold">{pct(bucket.targetAllocationPercent)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-[#777777]">ดริฟท์</p>
            <p className={`text-sm font-bold ${driftStyle(bucket.drift)}`}>{bucket.drift > 0 ? '+' : ''}{bucket.drift.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {bucket.holdings.length === 0 ? (
        <div className="p-5 text-center text-sm text-[#777777]">ไม่มีสินทรัพย์ในกลุ่มนี้</div>
      ) : (
        <>
          {/* Desktop column headers */}
          <div className="hidden items-center gap-3 border-b border-black/[0.03] bg-white/60 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#999999] md:grid md:grid-cols-[1fr_100px_80px_80px_80px_70px_60px_auto]">
            <span>Asset</span>
            <span className="text-right">Value</span>
            <span className="text-right">%</span>
            <span className="text-right">Target</span>
            <span className="text-right">Drift</span>
            <span className="text-right">DCA</span>
            <span className="text-right">Risk</span>
            <span />
          </div>

          <div className="divide-y divide-black/[0.03]">
            {bucket.holdings.map((holding) => (
              <AssetRow
                key={holding.id}
                holding={holding}
                dcaRecord={dcaMap.get(holding.assetId)}
                dividendRecord={dividendMap.get(holding.assetId)}
                queueDriftReview={queueDriftReview}
                createActionRequest={createActionRequest}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

const AssetRow = ({
  holding,
  dcaRecord,
  queueDriftReview,
}: {
  holding: EnrichedHolding
  dcaRecord?: DcaRecord
  dividendRecord?: DividendRecord
  queueDriftReview: (holding: Holding) => void
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
}): ReactNode => {
  const drift = holding.drift
  const isDrifted = Math.abs(drift) >= 2
  const dcaLabel = holding.dcaStatus ?? '—'
  const isDcaReview = dcaRecord?.status === 'review' || holding.dcaStatus === 'review'

  return (
    <div className="grid grid-cols-1 gap-1 px-5 py-3 transition hover:bg-[#faf9f8] md:grid-cols-[1fr_100px_80px_80px_80px_70px_60px_auto] md:items-center md:gap-3">
      {/* Mobile: stacked card */}
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold break-words">{holding.asset?.symbol ?? holding.assetId}</p>
            <p className="text-xs text-[#777777] truncate">{holding.asset?.name ?? ''}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold">{thb(holding.marketValueTHB)}</p>
            <p className={`text-xs font-semibold ${driftStyle(drift)}`}>{drift > 0 ? '+' : ''}{drift.toFixed(1)}%</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#777777]">
          <span>Qty: {holding.units ?? holding.quantity}</span>
          <span>Alloc: {pct(holding.allocationPercent)}</span>
          <span>Target: {pct(holding.targetAllocationPercent)}</span>
          <span className={isDcaReview ? 'text-[#9a6a1f] font-semibold' : ''}>DCA: {dcaLabel}</span>
          {holding.risk ? <span className={holding.risk === 'high' ? 'text-[#c2410c] font-semibold' : ''}>{holding.risk}</span> : null}
        </div>
        {holding.notes ? <p className="mt-1 text-xs text-[#777777] truncate">{holding.notes}</p> : null}
      </div>

      {/* Desktop: table row */}
      <div className="hidden min-w-0 md:block">
        <p className="text-sm font-semibold truncate">{holding.asset?.symbol ?? holding.assetId}</p>
        <p className="text-xs text-[#777777] truncate">{holding.asset?.name ?? ''}</p>
      </div>
      <p className="hidden text-right text-sm font-semibold md:block">{thb(holding.marketValueTHB)}</p>
      <p className="hidden text-right text-sm md:block">{pct(holding.allocationPercent)}</p>
      <p className="hidden text-right text-sm text-[#777777] md:block">{pct(holding.targetAllocationPercent)}</p>
      <p className={`hidden text-right text-sm font-semibold md:block ${driftStyle(drift)}`}>{drift > 0 ? '+' : ''}{drift.toFixed(1)}%</p>
      <p className={`hidden text-right text-sm md:block ${isDcaReview ? 'text-[#9a6a1f] font-semibold' : 'text-[#777777]'}`}>{dcaLabel}</p>
      <p className={`hidden text-right text-sm md:block ${holding.risk === 'high' ? 'text-[#c2410c] font-semibold' : 'text-[#777777]'}`}>{holding.risk ?? '—'}</p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
        {isDrifted ? (
          <button
            className="rounded-full border border-[#ead7c3] bg-[#fffaf4] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#c2410c] transition hover:bg-[#fdeae7]"
            type="button"
            onClick={() => queueDriftReview(holding)}
          >
            drift
          </button>
        ) : null}
        {holding.notes && (
          <span className="hidden rounded-full bg-[#f0eeec] px-2 py-1 text-[9px] text-[#777777] md:inline-block max-w-[120px] truncate" title={holding.notes}>
            {holding.notes}
          </span>
        )}
      </div>
    </div>
  )
}
