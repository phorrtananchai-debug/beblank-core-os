import { generateId } from '../../app/utils'
import type { SheetResourceDef } from './types'

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
