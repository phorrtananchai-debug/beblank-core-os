import { useEffect, useMemo, useState } from 'react'
import { WorkspaceDrawer } from '../../components/shared/WorkspaceDrawer'
import { aiUsageProviders } from '../../data/aiUsageMonitorMock'
import type { AIUsageProvider, AIUsageProviderStatus } from '../../data/aiUsageMonitorMock'

const currency = (value: number) => `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`
const number = (value: number) => value.toLocaleString('en-US')

const statusClass: Record<AIUsageProviderStatus, string> = {
  healthy: 'bg-[var(--bb-green)]/10 text-[var(--bb-green)]',
  watch: 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]',
  limited: 'bg-red/10 text-red',
  manual: 'bg-black/[0.05] text-[var(--bb-text-muted)]',
}

export const AIUsageMonitorPage = () => {
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const selectedProvider = useMemo(
    () => aiUsageProviders.find((provider) => provider.id === selectedProviderId) ?? null,
    [selectedProviderId],
  )

  const totalSpend = aiUsageProviders.reduce((sum, provider) => sum + provider.monthlySpendUsd, 0)
  const watchedProviders = aiUsageProviders.filter((provider) => provider.status === 'watch' || provider.status === 'limited').length
  const averageUsage = Math.round(aiUsageProviders.reduce((sum, provider) => sum + provider.usagePercent, 0) / aiUsageProviders.length)

  useEffect(() => {
    if (!selectedProvider) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedProviderId('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedProvider])

  return (
    <section className="space-y-5">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">AI Usage Monitor / local-first ledger</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">Provider spend without live credentials.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--bb-text-soft)]">
              Manual usage snapshots for AI subscriptions and APIs. This page uses mock data only: no provider calls, no keys, no background sync.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <SummaryTile label="Monthly Spend" value={currency(totalSpend)} detail="mock ledger total" />
            <SummaryTile label="Average Usage" value={`${averageUsage}%`} detail={`${aiUsageProviders.length} providers`} />
            <SummaryTile label="Warnings" value={String(watchedProviders)} detail="budget or limit watch" />
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {aiUsageProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} onSelect={() => setSelectedProviderId(provider.id)} />
        ))}
      </section>

      <section className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
        <div className="panel-header">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Source policy</p>
            <h3>Local mock model</h3>
          </div>
          <span className="pill">no network</span>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-[var(--bb-text-soft)]">
          Values are normalized in `aiUsageMonitorMock.ts` and rendered directly. The MVP does not use provider APIs, credentials, localStorage, Firebase, backend services, polling, or scheduled jobs.
        </p>
      </section>

      <WorkspaceDrawer open={selectedProvider !== null} onClose={() => setSelectedProviderId('')} title={selectedProvider?.name ?? 'Provider usage'}>
        {selectedProvider ? <ProviderDetail provider={selectedProvider} /> : null}
      </WorkspaceDrawer>
    </section>
  )
}

const SummaryTile = ({ detail, label, value }: { detail: string; label: string; value: string }) => (
  <div className="rounded-2xl border border-black/[0.05] bg-white/75 p-4">
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">{label}</p>
    <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    <p className="mt-1 text-xs text-[var(--bb-text-muted)]">{detail}</p>
  </div>
)

const ProviderCard = ({ onSelect, provider }: { onSelect: () => void; provider: AIUsageProvider }) => (
  <button
    type="button"
    className="surface-hover rounded-[24px] border border-black/[0.05] bg-white/85 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--bb-accent-border)]"
    onClick={onSelect}
    aria-label={`Open ${provider.name} usage details`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-lg font-bold tracking-tight">{provider.name}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--bb-text-muted)]">{provider.planType}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${statusClass[provider.status]}`}>
        {provider.statusLabel}
      </span>
    </div>

    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[var(--bb-text-soft)]">{provider.usageLabel}</span>
        <span className="font-mono text-[10px] font-semibold text-[var(--bb-text-muted)]">{provider.usagePercent}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full bg-[var(--bb-accent)]" style={{ width: `${provider.usagePercent}%` }} />
      </div>
    </div>

    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
      <Metric label="Remaining" value={provider.remainingLabel} />
      <Metric label="Spend" value={currency(provider.monthlySpendUsd)} />
      <Metric label="Reset" value={provider.resetLabel} />
      <Metric label="Last Sync" value={provider.lastSyncLabel} />
    </dl>
  </button>
)

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">{label}</dt>
    <dd className="mt-1 text-xs font-semibold leading-5 text-[var(--bb-text)]">{value}</dd>
  </div>
)

const ProviderDetail = ({ provider }: { provider: AIUsageProvider }) => {
  const maxHistorySpend = Math.max(...provider.history.map((point) => point.spendUsd), 1)

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-black/[0.05] bg-[#faf9f8] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Usage window</p>
            <h3 className="mt-1 text-xl font-bold">{provider.planType}</h3>
          </div>
          <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${statusClass[provider.status]}`}>{provider.statusLabel}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Today" value={provider.todayUsage} detail="current day" />
          <SummaryTile label="Week" value={provider.weekUsage} detail="rolling 7 days" />
          <SummaryTile label="Month" value={provider.monthUsage} detail="current period" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-black/[0.05] bg-white p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Token counts</p>
          <dl className="mt-3 space-y-3">
            <DetailRow label="Input tokens" value={number(provider.inputTokens)} />
            <DetailRow label="Output tokens" value={number(provider.outputTokens)} />
            <DetailRow label="Balance" value={provider.balanceLabel} />
            <DetailRow label="Reset" value={provider.resetLabel} />
          </dl>
        </div>
        <div className="rounded-[24px] border border-black/[0.05] bg-white p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Cost by model</p>
          <div className="mt-3 space-y-3">
            {provider.costByModel.map((item) => (
              <div key={item.model}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">{item.model}</span>
                  <span className="font-mono text-xs text-[var(--bb-text-muted)]">{currency(item.costUsd)}</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--bb-text-muted)]">{number(item.tokens)} tokens</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-black/[0.05] bg-white p-4">
        <div className="panel-header">
          <h3 className="text-base font-bold">History</h3>
          <span className="pill">mock points</span>
        </div>
        <div className="mt-4 grid h-36 grid-cols-4 items-end gap-3" aria-label={`${provider.name} spend history`}>
          {provider.history.map((point) => (
            <div key={point.date} className="flex h-full flex-col justify-end gap-2">
              <div className="rounded-t-xl bg-[var(--bb-accent)]/80" style={{ height: `${Math.max(8, (point.spendUsd / maxHistorySpend) * 100)}%` }} title={`${point.date}: ${currency(point.spendUsd)}`} />
              <div>
                <p className="text-center font-mono text-[10px] font-semibold text-[var(--bb-text-muted)]">{point.label}</p>
                <p className="text-center text-[10px] text-[var(--bb-text-faint)]">{currency(point.spendUsd)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--bb-amber)]/20 bg-[var(--bb-amber)]/5 p-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-amber)]">Warning state</p>
        <p className="mt-2 text-sm font-semibold text-[var(--bb-text)]">{provider.warningState}</p>
        <p className="mt-3 text-xs leading-5 text-[var(--bb-text-muted)]">Source: {provider.sourceDetails}</p>
      </section>
    </div>
  )
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 border-t border-black/[0.05] pt-3 first:border-t-0 first:pt-0">
    <dt className="text-sm text-[var(--bb-text-muted)]">{label}</dt>
    <dd className="text-right text-sm font-semibold">{value}</dd>
  </div>
)
