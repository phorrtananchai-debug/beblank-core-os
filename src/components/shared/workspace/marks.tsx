import type { ReactNode } from 'react'
import { normalizeWorkspaceStatus, statusTone, type WorkspaceStatus } from './status'

const markBase = 'inline-flex shrink-0 items-center justify-center font-mono font-semibold uppercase tracking-[0.12em]'

const glyphMap = {
  approval: 'AP',
  blocker: 'BK',
  bridge: 'BR',
  command: 'CC',
  evidence: 'EV',
  operating: 'OP',
  project: 'PR',
  route: 'RT',
  source: 'SC',
  status: 'ST',
} as const

export type MarkKind = keyof typeof glyphMap

export const ReferenceMark = ({
  children,
  kind = 'operating',
  label,
}: {
  children?: ReactNode
  kind?: MarkKind
  label?: string
}) => (
  <span className={`${markBase} bbh-reference-mark bbh-reference-mark-${kind}`} aria-label={label}>
    {children ?? glyphMap[kind]}
  </span>
)

export const SectionIndex = ({ value }: { value: number | string }) => (
  <span className={`${markBase} bbh-section-index`}>
    {String(value).padStart(2, '0')}
  </span>
)

export const RouteMark = ({ label }: { label: string }) => (
  <ReferenceMark kind="route" label={`${label} route`}>
    {label.slice(0, 2).toUpperCase()}
  </ReferenceMark>
)

export const SourceMark = ({ live = false }: { live?: boolean }) => (
  <ReferenceMark kind={live ? 'source' : 'bridge'} label={live ? 'Live source' : 'Manual source'}>
    {live ? 'LV' : 'SC'}
  </ReferenceMark>
)

export const StatusMark = ({
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
      className={`${markBase} bbh-status-mark`}
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.border,
        color: tone.text,
      }}
    >
      {label ?? normalized.slice(0, 2)}
    </span>
  )
}

export const EvidenceMark = () => <ReferenceMark kind="evidence" label="Evidence packet" />

export const ApprovalMark = () => <ReferenceMark kind="approval" label="Approval required" />

export const BlockerMark = () => <ReferenceMark kind="blocker" label="Blocker" />

export const OperatingMarker = ({
  children,
  index,
}: {
  children: ReactNode
  index?: number | string
}) => (
  <span className="bbh-operating-marker">
    {index ? <SectionIndex value={index} /> : <ReferenceMark kind="operating" />}
    <span>{children}</span>
  </span>
)

export const MiniLegend = ({
  items,
}: {
  items: Array<{ label: string; mark: ReactNode }>
}) => (
  <div className="bbh-mini-legend">
    {items.map((item) => (
      <span key={item.label} className="bbh-mini-legend-item">
        {item.mark}
        <span>{item.label}</span>
      </span>
    ))}
  </div>
)
