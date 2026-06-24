import type { CSSProperties, ReactNode } from 'react'
import { bbhTokens } from './tokens'
import { normalizeWorkspaceStatus, statusTone, type WorkspaceStatus } from './status'

const panelStyle: CSSProperties = {
  background: bbhTokens.colors.surface,
  borderColor: bbhTokens.colors.border,
  borderRadius: bbhTokens.radius.panel,
  boxShadow: bbhTokens.shadow.soft,
}

const labelStyle: CSSProperties = {
  fontFamily: bbhTokens.typography.technical,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

const headingStyle: CSSProperties = {
  fontFamily: bbhTokens.typography.interface,
  letterSpacing: '-0.03em',
}

export const PageHeader = ({
  actions,
  eyebrow,
  meta,
  summary,
  title,
}: {
  actions?: ReactNode
  eyebrow?: string
  meta?: ReactNode
  summary?: string
  title: string
}) => (
  <header
    className="grid gap-4 border border-[color:var(--bbh-border)]/70 bg-[color:var(--bbh-surface)] p-5 md:p-6"
    style={panelStyle}
  >
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="grid gap-3">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--bbh-text)] md:text-[2.7rem]" style={headingStyle}>
          {title}
        </h1>
        {summary ? <p className="max-w-3xl text-sm leading-6 text-[color:var(--bbh-text-soft)] md:text-[0.98rem]">{summary}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
    {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
  </header>
)

export const SectionHeader = ({
  actions,
  eyebrow,
  title,
  summary,
}: {
  actions?: ReactNode
  eyebrow?: string
  summary?: string
  title: string
}) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-[1.02rem] font-semibold tracking-tight text-[color:var(--bbh-text)]" style={headingStyle}>
        {title}
      </h2>
      {summary ? <p className="max-w-2xl text-sm leading-6 text-[color:var(--bbh-text-soft)]">{summary}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
)

export const WorkspacePanel = ({
  actions,
  children,
  className = '',
  eyebrow,
  highlight = false,
  summary,
  title,
}: {
  actions?: ReactNode
  children: ReactNode
  className?: string
  eyebrow?: string
  highlight?: boolean
  summary?: string
  title?: string
}) => (
  <article
    className={`grid gap-4 border bg-[color:var(--bbh-surface)] p-5 md:p-6 ${highlight ? 'border-[color:var(--bbh-accent)]/35' : 'border-[color:var(--bbh-border)]/70'} ${className}`}
    style={{
      ...panelStyle,
      boxShadow: highlight ? bbhTokens.shadow.panel : panelStyle.boxShadow,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {(title || eyebrow || summary || actions) ? (
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h3 className="text-[1.02rem] font-semibold tracking-tight text-[color:var(--bbh-text)]" style={headingStyle}>
              {title}
            </h3>
          ) : null}
          {summary ? <p className="max-w-2xl text-sm leading-6 text-[color:var(--bbh-text-soft)]">{summary}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
    ) : null}
    <div className="grid gap-4">{children}</div>
  </article>
)

export const StatusBadge = ({
  label,
  status,
}: {
  label?: string
  status: WorkspaceStatus | string
}) => {
  const normalized = normalizeWorkspaceStatus(status)
  const tone = statusTone(normalized)

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{
        ...labelStyle,
        backgroundColor: tone.bg,
        borderColor: tone.border,
        color: tone.text,
      }}
    >
      {label ?? normalized}
    </span>
  )
}

export const MetricLine = ({
  detail,
  label,
  status,
  value,
}: {
  detail?: string
  label: string
  status?: WorkspaceStatus | string
  value: ReactNode
}) => (
  <div className="grid gap-1 rounded-[22px] border border-[color:var(--bbh-border)]/60 bg-[color:var(--bbh-surface-muted)] px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
        {label}
      </p>
      {status ? <StatusBadge status={status} /> : null}
    </div>
    <div className="text-lg font-semibold text-[color:var(--bbh-text)]" style={headingStyle}>
      {value}
    </div>
    {detail ? <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{detail}</p> : null}
  </div>
)

export const TimelineRow = ({
  date,
  detail,
  meta,
  status,
  title,
}: {
  date: string
  detail?: string
  meta?: ReactNode
  status?: WorkspaceStatus | string
  title: string
}) => (
  <div className="flex items-start gap-4 rounded-[22px] border border-[color:var(--bbh-border)]/50 bg-[color:var(--bbh-surface-muted)] px-4 py-3">
    <div className="min-w-[4.25rem] shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
        {date}
      </p>
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-[color:var(--bbh-text)]" style={headingStyle}>
            {title}
          </p>
          {detail ? <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{detail}</p> : null}
          {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
    </div>
  </div>
)

export const DecisionCard = ({
  code,
  date,
  detail,
  owner,
  reason,
  status,
  title,
}: {
  code: string
  date: string
  detail?: string
  owner: string
  reason: string
  status?: WorkspaceStatus | string
  title: string
}) => (
  <article className="grid gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] px-4 py-4">
    <div className="flex items-start justify-between gap-3">
      <div className="grid gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
          {code}
        </p>
        <h4 className="text-[1rem] font-semibold tracking-tight text-[color:var(--bbh-text)]" style={headingStyle}>
          {title}
        </h4>
      </div>
      {status ? <StatusBadge status={status} /> : null}
    </div>
    <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
      <span className="font-semibold text-[color:var(--bbh-text)]">Reason: </span>
      {reason}
    </p>
    {detail ? <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{detail}</p> : null}
    <div className="flex flex-wrap items-center gap-2">
      <ReferenceLabel label="Owner" value={owner} />
      <ReferenceLabel label="Date" value={date} />
    </div>
  </article>
)

export const ProjectCard = ({
  actions,
  blocker,
  code,
  detail,
  owner,
  phase,
  progress,
  status,
  summary,
  title,
  trade,
}: {
  actions?: ReactNode
  blocker?: string
  code?: string
  detail?: ReactNode
  owner?: string
  phase?: string
  progress?: number
  status: WorkspaceStatus | string
  summary?: string
  title: string
  trade?: string
}) => (
  <article className="grid gap-4 rounded-[28px] border border-[color:var(--bbh-border)]/65 bg-[color:var(--bbh-surface)] p-5 shadow-[0_20px_60px_rgba(25,19,14,0.06)]">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid gap-1">
        {code ? <ReferenceLabel label="Project" value={code} /> : null}
        <h3 className="text-[1.15rem] font-semibold tracking-tight text-[color:var(--bbh-text)]" style={headingStyle}>
          {title}
        </h3>
        {summary ? <p className="max-w-2xl text-sm leading-6 text-[color:var(--bbh-text-soft)]">{summary}</p> : null}
      </div>
      <StatusBadge status={status} />
    </div>
    <div className="grid gap-2 md:grid-cols-3">
      {owner ? <MetricLine label="Owner" value={owner} /> : null}
      {trade ? <MetricLine label="Trade" value={trade} /> : null}
      {phase ? <MetricLine label="Phase" value={phase} /> : null}
    </div>
    {progress !== undefined ? (
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
            Progress
          </p>
          <span className="text-sm font-semibold text-[color:var(--bbh-text)]">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bbh-surface-soft)]">
          <div className="h-full rounded-full bg-[color:var(--bbh-accent)]" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      </div>
    ) : null}
    {blocker ? (
      <p className="rounded-[22px] border border-[color:var(--bbh-accent-border)] bg-[color:var(--bbh-accent-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--bbh-text-soft)]">
        {blocker}
      </p>
    ) : null}
    {detail ? <div className="grid gap-2">{detail}</div> : null}
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </article>
)

export const FilterBar = ({
  filters,
  onChange,
}: {
  filters: Array<{ active?: boolean; count?: number; label: string; key: string }>
  onChange?: (key: string) => void
}) => (
  <div className="flex flex-wrap gap-2 rounded-[24px] border border-[color:var(--bbh-border)]/60 bg-[color:var(--bbh-surface)] p-2">
    {filters.map((filter) => (
      <button
        key={filter.key}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
          filter.active
            ? 'bg-[color:var(--bbh-accent)] text-white'
            : 'bg-[color:var(--bbh-surface-muted)] text-[color:var(--bbh-text-muted)] hover:bg-[color:var(--bbh-accent-soft)] hover:text-[color:var(--bbh-text)]'
        }`}
        type="button"
        onClick={() => onChange?.(filter.key)}
      >
        <span style={labelStyle}>{filter.label}</span>
        {typeof filter.count === 'number' ? <span>({filter.count})</span> : null}
      </button>
    ))}
  </div>
)

export const DataTable = ({
  columns,
  emptyState,
  rows,
}: {
  columns: Array<{ align?: 'left' | 'center' | 'right'; key: string; label: string }>
  emptyState?: ReactNode
  rows: Array<{ cells: ReactNode[]; id: string }>
}) => {
  if (rows.length === 0) return <>{emptyState ?? null}</>

  return (
    <div className="overflow-hidden rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface)]">
      <table className="w-full border-collapse text-left">
        <thead className="bg-[color:var(--bbh-surface-muted)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)] ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                style={labelStyle}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[color:var(--bbh-border)]/55">
              {row.cells.map((cell, index) => {
                const column = columns[index]
                return (
                  <td
                    key={`${row.id}-${column.key}`}
                    className={`px-4 py-3 text-sm text-[color:var(--bbh-text-soft)] ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                  >
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const EmptyState = ({
  action,
  body,
  title,
}: {
  action?: ReactNode
  body: string
  title: string
}) => (
  <section className="grid gap-4 rounded-[28px] border border-dashed border-[color:var(--bbh-border)] bg-[color:var(--bbh-surface-muted)] px-6 py-8 text-center">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
      Empty workspace
    </p>
    <div className="grid gap-2">
      <h3 className="text-2xl font-semibold tracking-tight text-[color:var(--bbh-text)]" style={headingStyle}>
        {title}
      </h3>
      <p className="mx-auto max-w-2xl text-sm leading-6 text-[color:var(--bbh-text-soft)]">{body}</p>
    </div>
    {action ? <div className="flex justify-center">{action}</div> : null}
  </section>
)

export const ReferenceLabel = ({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--bbh-border)]/60 bg-[color:var(--bbh-surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={labelStyle}>
    <span>{label}</span>
    <span className="text-[color:var(--bbh-text)] normal-case tracking-normal">{value}</span>
  </span>
)
