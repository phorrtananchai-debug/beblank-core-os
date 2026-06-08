import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useOs } from '../../core/os/useOs'

const usd = (value = 0) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
const statusClass = (status: string) => {
  if (['blocked', 'high', 'at-risk', 'open', 'failed'].includes(status)) return 'text-[var(--bb-red)]'
  if (['review', 'pending', 'medium', 'active', 'watching'].includes(status)) return 'text-[var(--bb-amber)]'
  return 'text-[var(--bb-green)]'
}

export const DividendHistoryPage = () => {
  const { data } = useOs()
  const allRecords = useMemo(() => [...data.dividendRecords, ...data.dividendRecordsFullHistory], [data.dividendRecords, data.dividendRecordsFullHistory])
  const sortedRecords = useMemo(() => [...allRecords].sort((a, b) => b.payDate.localeCompare(a.payDate)), [allRecords])

  const totals = useMemo(() => {
    return sortedRecords.reduce((acc, r) => {
      acc.grossUsd += r.grossAmount
      acc.netUsd += r.netAmount
      acc.taxUsd += r.taxAmount ?? 0
      return acc
    }, { grossUsd: 0, netUsd: 0, taxUsd: 0 })
  }, [sortedRecords])

  const visibleRecords = sortedRecords

  return (
    <section className="space-y-5">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <Link
          className="inline-block rounded-full bg-white/70 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--bb-text)]"
          to="/os/finance/investments"
        >
          &larr; Back to Investments
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold leading-[0.92]">Dividend Full History</h2>
        <p className="mt-1 text-sm text-[var(--bb-text-soft)]">{sortedRecords.length} records &middot; {usd(totals.grossUsd)} gross &middot; {usd(totals.taxUsd)} tax &middot; {usd(totals.netUsd)} net</p>
      </header>

      <div className="rounded-2xl border border-black/[0.04] bg-white/70">
        <div className="flex items-center justify-between border-b border-black/[0.04] px-4 py-2.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">History</p>
          <span className="pill">{sortedRecords.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Tax</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2">Currency</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {visibleRecords.map((r) => (
                <tr key={r.id} className="hover:bg-black/[0.02]">
                  <td className="px-3 py-1.5 text-xs">{r.payDate.slice(0, 10)}</td>
                  <td className="px-3 py-1.5 text-xs font-semibold">{r.symbol}</td>
                  <td className="px-3 py-1.5 text-right text-xs">{usd(r.grossAmount)}</td>
                  <td className="px-3 py-1.5 text-right text-xs">{usd(r.taxAmount ?? 0)}</td>
                  <td className="px-3 py-1.5 text-right text-xs font-semibold">{usd(r.netAmount)}</td>
                  <td className="px-3 py-1.5 text-xs">{r.currency}</td>
                  <td className="px-3 py-1.5 text-[10px] text-[var(--bb-text-muted)]">{r.source}</td>
                  <td className="px-3 py-1.5 text-[10px]">{(r.sourceScope ?? 'imported-ledger') === 'full-dime-history' ? <span className="text-[var(--bb-amber)]">full</span> : <span className="text-[var(--bb-green)]">ledger</span>}</td>
                  <td className="px-3 py-1.5"><span className={`font-mono text-[9px] font-semibold uppercase ${statusClass(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
