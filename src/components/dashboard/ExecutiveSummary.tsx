import { OperationalStatusChip } from '../../components/shared/OperationalStatusChip'

interface HealthMetric {
  label: string
  status: 'healthy' | 'watch' | 'atRisk' | 'empty'
  detail: string
}

const StatusBadge = ({ status }: { status: HealthMetric['status'] }) => {
  if (status === 'empty') return <span className="rounded-full bg-black/[0.05] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--bb-text-muted)]">No Data</span>
  return <OperationalStatusChip status={status} size="sm" />
}

const Card = ({ metric }: { metric: HealthMetric }) => {
  const dotMap: Record<HealthMetric['status'], string> = {
    healthy: 'bg-[var(--bb-green)]',
    watch: 'bg-[var(--bb-amber)]',
    atRisk: 'bg-red',
    empty: 'bg-black/[0.15]',
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white p-3">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotMap[metric.status]}`} />
      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--bb-text)]">{metric.label}</p>
      <p className="hidden truncate text-xs text-[var(--bb-text-muted)] sm:block">{metric.detail}</p>
      <StatusBadge status={metric.status} />
    </div>
  )
}

interface Props {
  studio: HealthMetric
  capital: HealthMetric
  investment: HealthMetric
  bridge: HealthMetric
}

export const ExecutiveSummary = ({ studio, capital, investment, bridge }: Props) => (
  <div className="space-y-2">
    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
      <Card metric={studio} />
      <Card metric={capital} />
      <Card metric={investment} />
      <Card metric={bridge} />
    </div>
  </div>
)
