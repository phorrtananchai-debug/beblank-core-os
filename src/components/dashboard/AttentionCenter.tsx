import type { ActionRequest, Holding, DcaRecord, SiteIssue, SourceStatus, TimelineItem } from '../../types/models'
import { loadWriteHistory } from '../../core/sheetBridge/writeback'
import { getStatusVisual } from '../../design/visual-language'

interface AttentionItem {
  id: string
  label: string
  detail: string
  category: 'action' | 'review' | 'healthy'
}

const ChipGroup = ({ items, bg }: { items: AttentionItem[]; bg: string }) => {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <div key={item.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${bg}`}>
          <span>{item.label}</span>
          <span className="text-[10px] opacity-60">{item.detail}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  pendingApprovals: ActionRequest[]
  holdings: Holding[]
  dcaRecords: DcaRecord[]
  timeline: TimelineItem[]
  siteIssues: SiteIssue[]
  sourceStatuses: Record<string, SourceStatus>
}

export const AttentionCenter = ({ pendingApprovals, holdings, dcaRecords, timeline, siteIssues, sourceStatuses }: Props) => {
  const writeHistory = loadWriteHistory()
  const bridgeLastFailed = writeHistory.find((h) => h.status === 'failed')
  const driftCount = holdings.filter((h) => Math.abs((h.allocationPercent ?? 0) - (h.targetAllocationPercent ?? 0)) >= 2).length
  const dcaDue = dcaRecords.filter((r) => r.status === 'planned' || r.status === 'review').length
  const highIssues = siteIssues.filter((i) => i.severity === 'high')
  const atRiskTimeline = timeline.filter((t) => t.state === 'at-risk')
  const staleSources = Object.values(sourceStatuses).filter((s) => s.isStale)
  const a = getStatusVisual('atRisk')
  const w = getStatusVisual('watch')
  const h = getStatusVisual('healthy')

  const items: AttentionItem[] = []

  if (pendingApprovals.length > 0) {
    items.push({ id: 'approvals', label: `${a.icon} ${pendingApprovals.length} pending approvals`, detail: pendingApprovals[0].description.slice(0, 50), category: 'action' })
  }
  if (dcaDue > 0) {
    items.push({ id: 'dca', label: `${a.icon} ${dcaDue} DCA items due`, detail: 'Planned or pending review', category: 'action' })
  }
  if (atRiskTimeline.length > 0) {
    items.push({ id: 'at-risk', label: `${a.icon} ${atRiskTimeline.length} timeline items at risk`, detail: atRiskTimeline[0].label, category: 'action' })
  }
  if (highIssues.length > 0) {
    items.push({ id: 'issues', label: `${a.icon} ${highIssues.length} high-severity issues`, detail: highIssues[0].issue, category: 'action' })
  }
  if (bridgeLastFailed) {
    items.push({ id: 'bridge-failed', label: `${a.icon} Bridge write failed`, detail: bridgeLastFailed.errorMessage ?? 'Last write failed', category: 'action' })
  }

  if (driftCount > 0) {
    items.push({ id: 'drift', label: `${w.icon} ${driftCount} holdings drifted`, detail: 'Review allocation', category: 'review' })
  }
  if (staleSources.length > 0) {
    items.push({ id: 'stale', label: `${w.icon} ${staleSources.length} stale sources`, detail: staleSources.map((s) => s.sourceName).join(', '), category: 'review' })
  }
  if (timeline.filter((t) => t.state !== 'completed').length > 5) {
    items.push({ id: 'timeline', label: `${w.icon} Active timeline`, detail: 'Review deadlines', category: 'review' })
  }

  if (pendingApprovals.length === 0) {
    items.push({ id: 'no-approvals', label: `${h.icon} Approvals clear`, detail: 'No pending', category: 'healthy' })
  }
  if (driftCount === 0 && holdings.length > 0) {
    items.push({ id: 'no-drift', label: `${h.icon} Allocation on target`, detail: 'All within 2%', category: 'healthy' })
  }
  if (atRiskTimeline.length === 0 && highIssues.length === 0) {
    items.push({ id: 'no-risks', label: `${h.icon} No open risks`, detail: 'Operating normally', category: 'healthy' })
  }

  const actionItems = items.filter((i) => i.category === 'action')
  const reviewItems = items.filter((i) => i.category === 'review')
  const healthyItems = items.filter((i) => i.category === 'healthy')

  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      {actionItems.length > 0 && <ChipGroup items={actionItems} bg="bg-red/[0.06] text-red/90" />}
      {reviewItems.length > 0 && <ChipGroup items={reviewItems} bg="bg-[var(--bb-amber)]/[0.06] text-[var(--bb-amber)]/90" />}
      {healthyItems.length > 0 && <ChipGroup items={healthyItems} bg="bg-[var(--bb-green)]/[0.04] text-[var(--bb-green)]/70" />}
    </div>
  )
}
