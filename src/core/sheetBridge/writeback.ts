import { generateId } from '../../app/utils'
import type { SheetResourceDef } from './types'

export interface WriteHistoryRecord {
  id: string
  resourceId: string
  resourceName: string
  recordId: string
  status: 'success' | 'failed'
  endpointLabel: string
  payloadSummary: string
  writtenAt: string
  errorMessage?: string
  errorCode?: string
}

const HISTORY_STORAGE_KEY = 'beblank_os_bridge_write_history_v1'
const STATUS_STORAGE_KEY = 'beblank_os_bridge_write_status_v1'

export interface WriteStatusSummary {
  pending: number
  approved: number
  failed: number
  updatedAt: string
}

export function loadWriteStatusSummary(): WriteStatusSummary {
  try {
    const stored = localStorage.getItem(STATUS_STORAGE_KEY)
    if (stored) return JSON.parse(stored) as WriteStatusSummary
  } catch { /* ignore */ }
  return { pending: 0, approved: 0, failed: 0, updatedAt: new Date().toISOString() }
}

export function saveWriteStatusSummary(summary: WriteStatusSummary): void {
  try {
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(summary))
  } catch { /* ignore */ }
}

export function computeWriteStatusSummary(pendingWrites: PendingWriteRow[]): WriteStatusSummary {
  return {
    pending: pendingWrites.filter((w) => w.status === 'draft').length,
    approved: pendingWrites.filter((w) => w.status === 'approved').length,
    failed: pendingWrites.filter((w) => w.status === 'failed').length,
    updatedAt: new Date().toISOString(),
  }
}

export function loadWriteHistory(): WriteHistoryRecord[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (stored) return JSON.parse(stored) as WriteHistoryRecord[]
  } catch { /* ignore */ }
  return []
}

export function saveWriteHistory(history: WriteHistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch { /* ignore */ }
}

export function appendWriteHistory(record: WriteHistoryRecord): WriteHistoryRecord[] {
  const current = loadWriteHistory()
  const updated = [record, ...current]
  saveWriteHistory(updated)
  return updated
}

export function buildPayloadSummary(row: Record<string, unknown>): string {
  const name = (row as Record<string, unknown>).name ?? (row as Record<string, unknown>).label ?? (row as Record<string, unknown>).title ?? (row as Record<string, unknown>).assetId ?? ''
  return String(name).slice(0, 60)
}

export interface PendingWriteRow {
  id: string
  resourceId: string
  resourceName: string
  row: Record<string, unknown>
  createdAt: string
  approvedAt: string | null
  writtenAt: string | null
  writeError: string | null
  status: 'draft' | 'approved' | 'exported' | 'written' | 'failed'
}

export function buildStudioProjectRow(fields: {
  slug: string
  name: string
  status: string
  owner: string
  client?: string
  location?: string
  phase?: string
}): Record<string, unknown> {
  return {
    id: generateId('proj'),
    slug: fields.slug,
    name: fields.name,
    status: fields.status,
    owner: fields.owner,
    client: fields.client ?? '',
    location: fields.location ?? '',
    phase: fields.phase ?? '',
  }
}

export function buildCapitalRecordRow(fields: {
  label: string
  amountTHB: number
  direction: string
  category: string
  occurredAt?: string
  status?: string
}): Record<string, unknown> {
  return {
    id: generateId('cap'),
    label: fields.label,
    amountTHB: fields.amountTHB,
    direction: fields.direction,
    category: fields.category,
    occurredAt: fields.occurredAt ?? new Date().toISOString().slice(0, 10),
    status: fields.status ?? 'draft',
  }
}

export function buildHoldingRow(fields: {
  assetId: string
  quantity?: number
  averageCost?: number
  allocationPercent?: number
  targetAllocationPercent?: number
  currentPosture?: string
}): Record<string, unknown> {
  return {
    id: generateId('hold'),
    assetId: fields.assetId,
    quantity: fields.quantity ?? 0,
    averageCost: fields.averageCost ?? 0,
    allocationPercent: fields.allocationPercent ?? 0,
    targetAllocationPercent: fields.targetAllocationPercent ?? 0,
    currentPosture: fields.currentPosture ?? 'watch',
  }
}

export function buildAIContextRow(fields: {
  module: string
  title: string
  body?: string
}): Record<string, unknown> {
  return {
    id: generateId('ctx'),
    module: fields.module,
    title: fields.title,
    body: fields.body ?? '',
    createdAt: new Date().toISOString(),
  }
}

export function buildTransactionRow(fields: {
  assetId: string
  transactionType: string
  quantity: number
  amountTHB: number
  pricePerUnitTHB?: number
  notes?: string
}): Record<string, unknown> {
  return {
    id: generateId('txn'),
    assetId: fields.assetId,
    description: `${fields.transactionType} ${fields.assetId}`,
    amountTHB: fields.amountTHB,
    type: fields.transactionType === 'dividend' ? 'income' : fields.transactionType === 'deposit' ? 'income' : 'expense',
    quantity: fields.quantity,
    pricePerUnitTHB: fields.pricePerUnitTHB ?? 0,
    occurredAt: new Date().toISOString().slice(0, 10),
    notes: fields.notes ?? '',
  }
}

export function buildRowForResource(
  resource: SheetResourceDef,
  fields: Record<string, unknown>,
): Record<string, unknown> {
  switch (resource.id) {
    case 'studio-projects':
      return buildStudioProjectRow(fields as Parameters<typeof buildStudioProjectRow>[0])
    case 'capital-records':
      return buildCapitalRecordRow(fields as Parameters<typeof buildCapitalRecordRow>[0])
    case 'investment-holdings':
      return buildHoldingRow(fields as Parameters<typeof buildHoldingRow>[0])
    case 'ai-context-logs':
      return buildAIContextRow(fields as Parameters<typeof buildAIContextRow>[0])
    default:
      throw new Error(`No write-back builder for resource: ${resource.id}`)
  }
}
