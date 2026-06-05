import type { BackupRecord } from './types'

const BACKUP_PREFIX = 'beblank_os_bridge_backup_'

export function getBackupKey(resourceId: string): string {
  return `${BACKUP_PREFIX}${resourceId}`
}

export function createBackup(
  resourceId: string,
  resourceName: string,
  data: unknown[],
  reason: string,
): BackupRecord | null {
  const record: BackupRecord = {
    id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    resourceId,
    resourceName,
    data: JSON.parse(JSON.stringify(data)),
    createdAt: new Date().toISOString(),
    reason,
  }

  try {
    localStorage.setItem(getBackupKey(resourceId), JSON.stringify(record))
    return record
  } catch {
    console.warn(`[SheetBridge] Failed to persist backup for ${resourceId}`)
    return null
  }
}

export function loadBackup(resourceId: string): BackupRecord | null {
  try {
    const stored = localStorage.getItem(getBackupKey(resourceId))
    if (stored) {
      return JSON.parse(stored) as BackupRecord
    }
  } catch {
    console.warn(`[SheetBridge] Failed to load backup for ${resourceId}`)
  }
  return null
}

export function removeBackup(resourceId: string): void {
  try {
    localStorage.removeItem(getBackupKey(resourceId))
  } catch {
    console.warn(`[SheetBridge] Failed to remove backup for ${resourceId}`)
  }
}
