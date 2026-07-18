import type { OsData } from '../../types/models'
import { getInitialProjectWorkspace } from './legacyAdapter.ts'
import { getProjectAliases, normalizeProjectWorkspace, resolveCanonicalProjectId } from './migration.ts'
import type {
  AssetRelationship,
  BOQItem,
  PersistedProjectWorkspace,
  ProjectAsset,
  ProjectRepositoryErrorShape,
  ProjectTask,
  ProjectWorkspaceData,
  ProjectWorkspaceSnapshot,
  SiteReport,
} from './types'

const storagePrefix = 'beblank.project-workspace.v2:'
const legacyStoragePrefix = 'beblank.project-workspace.v1:'
const blobDbName = 'beblank-project-workspace-assets'
const blobStoreName = 'asset-blobs'

export const projectWorkspaceStorageKey = (projectId: string) => `${storagePrefix}${resolveCanonicalProjectId(projectId)}`

export interface ProjectMetadataStore {
  load(projectId: string): Promise<unknown | null>
  save(projectId: string, data: PersistedProjectWorkspace): Promise<void>
  backup(projectId: string, data: unknown): Promise<void>
}

export interface ProjectBlobStore {
  put(key: string, blob: Blob): Promise<void>
  get(key: string): Promise<Blob | undefined>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
}

export class ProjectRepositoryError extends Error implements ProjectRepositoryErrorShape {
  code: ProjectRepositoryErrorShape['code']
  operationId?: string
  recoverable: boolean
  cause?: unknown

  constructor(shape: ProjectRepositoryErrorShape) {
    super(shape.message)
    this.name = 'ProjectRepositoryError'
    this.code = shape.code
    this.operationId = shape.operationId
    this.recoverable = shape.recoverable
    this.cause = shape.cause
  }
}

const toErrorShape = (error: unknown, fallback: ProjectRepositoryErrorShape): ProjectRepositoryErrorShape => error instanceof ProjectRepositoryError
  ? { code: error.code, message: error.message, operationId: error.operationId, recoverable: error.recoverable, cause: error.cause }
  : { ...fallback, cause: error }

const isWorkspace = (value: unknown): value is ProjectWorkspaceData => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProjectWorkspaceData>
  return (candidate.schemaVersion === 'project-workspace.v1' || candidate.schemaVersion === 'project-workspace.v2')
    && Boolean(candidate.project?.id)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.assets)
    && Array.isArray(candidate.siteReports)
    && Array.isArray(candidate.boqItems)
}

export class BrowserProjectMetadataStore implements ProjectMetadataStore {
  async load(projectId: string) {
    const canonicalId = resolveCanonicalProjectId(projectId)
    const current = window.localStorage.getItem(projectWorkspaceStorageKey(canonicalId))
    if (current !== null) return JSON.parse(current) as unknown
    for (const alias of getProjectAliases(projectId)) {
      const legacy = window.localStorage.getItem(`${legacyStoragePrefix}${alias}`)
      if (legacy !== null) return JSON.parse(legacy) as unknown
    }
    return null
  }

  async save(projectId: string, data: PersistedProjectWorkspace) {
    window.localStorage.setItem(projectWorkspaceStorageKey(projectId), JSON.stringify(data))
  }

  async backup(projectId: string, data: unknown) {
    const key = `${projectWorkspaceStorageKey(projectId)}:backup:${new Date().toISOString()}`
    window.localStorage.setItem(key, JSON.stringify(data))
  }
}

const openBlobDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(blobDbName, 1)
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(blobStoreName)) request.result.createObjectStore(blobStoreName)
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const runBlobTransaction = async <T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void) => {
  const db = await openBlobDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(blobStoreName, mode)
      transaction.onabort = () => reject(transaction.error)
      transaction.onerror = () => reject(transaction.error)
      operation(transaction.objectStore(blobStoreName), resolve, reject)
    })
  } finally {
    db.close()
  }
}

export class IndexedDbProjectBlobStore implements ProjectBlobStore {
  put(key: string, blob: Blob) {
    return runBlobTransaction<void>('readwrite', (store, resolve, reject) => {
      const request = store.put(blob, key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  get(key: string) {
    return runBlobTransaction<Blob | undefined>('readonly', (store, resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result as Blob | undefined)
      request.onerror = () => reject(request.error)
    })
  }

  delete(key: string) {
    return runBlobTransaction<void>('readwrite', (store, resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  keys() {
    return runBlobTransaction<string[]>('readonly', (store, resolve, reject) => {
      const request = store.getAllKeys()
      request.onsuccess = () => resolve(request.result.map(String))
      request.onerror = () => reject(request.error)
    })
  }
}

type Listener = () => void

export interface ReconciliationReport {
  orphanBlobKeys: string[]
  missingBlobAssetIds: string[]
  danglingRelationshipIds: string[]
  repaired: boolean
}

export class ProjectWorkspaceRepository {
  private snapshots = new Map<string, ProjectWorkspaceSnapshot>()
  private listeners = new Map<string, Set<Listener>>()
  private metadata: ProjectMetadataStore
  private blobs: ProjectBlobStore

  constructor(metadata: ProjectMetadataStore, blobs: ProjectBlobStore) {
    this.metadata = metadata
    this.blobs = blobs
  }

  getSnapshot(projectId: string): ProjectWorkspaceSnapshot {
    const id = resolveCanonicalProjectId(projectId)
    const existing = this.snapshots.get(id)
    if (existing) return existing
    const initial: ProjectWorkspaceSnapshot = { status: 'idle', data: null, error: null }
    this.snapshots.set(id, initial)
    return initial
  }

  subscribe(projectId: string, listener: Listener) {
    const id = resolveCanonicalProjectId(projectId)
    const listeners = this.listeners.get(id) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(id, listeners)
    return () => { listeners.delete(listener) }
  }

  private publish(projectId: string, snapshot: ProjectWorkspaceSnapshot) {
    const id = resolveCanonicalProjectId(projectId)
    this.snapshots.set(id, snapshot)
    this.listeners.get(id)?.forEach((listener) => listener())
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('beblank:project-workspace-changed', { detail: { projectId: id } }))
  }

  async hydrate(projectId: string, osData: OsData, force = false) {
    const id = resolveCanonicalProjectId(projectId)
    const current = this.getSnapshot(id)
    if (!force && (current.status === 'ready' || current.status === 'loading')) return current.data
    this.publish(id, { status: 'loading', data: current.data, error: null })
    try {
      const stored = await this.metadata.load(id)
      let normalized: PersistedProjectWorkspace
      if (stored !== null) {
        if (!isWorkspace(stored)) throw new ProjectRepositoryError({ code: 'validation-failed', message: 'Saved project data is invalid. The last valid state was preserved.', recoverable: true })
        normalized = normalizeProjectWorkspace(stored, id)
        if (stored.schemaVersion !== 'project-workspace.v2' || stored.project.id !== id) {
          await this.metadata.backup(id, stored)
          await this.metadata.save(id, normalized)
        }
      } else {
        const initial = getInitialProjectWorkspace(id, osData)
        if (!initial) throw new ProjectRepositoryError({ code: 'not-found', message: `Project ${projectId} was not found.`, recoverable: false })
        normalized = normalizeProjectWorkspace(initial, id)
        await this.metadata.save(id, normalized)
      }
      this.publish(id, { status: 'ready', data: normalized, error: null })
      return normalized
    } catch (error) {
      const shape = toErrorShape(error, { code: 'hydrate-failed', message: 'Project data could not be loaded. Retry without clearing local data.', recoverable: true })
      this.publish(id, { status: 'error', data: current.data, error: shape })
      return current.data
    }
  }

  private requireData(projectId: string) {
    const snapshot = this.getSnapshot(projectId)
    if (!snapshot.data) throw new ProjectRepositoryError({ code: 'not-found', message: 'Project data is not hydrated.', recoverable: true })
    return snapshot.data
  }

  async save(data: PersistedProjectWorkspace) {
    const id = resolveCanonicalProjectId(data.project.id)
    try {
      await this.metadata.save(id, data)
      this.publish(id, { status: 'ready', data, error: null })
      return data
    } catch (error) {
      const shape = toErrorShape(error, { code: 'metadata-write-failed', message: 'The project change was not saved. Existing data was preserved.', recoverable: true })
      this.publish(id, { ...this.getSnapshot(id), status: 'error', error: shape })
      throw new ProjectRepositoryError(shape)
    }
  }

  upsertTask(projectId: string, task: ProjectTask) {
    const data = this.requireData(projectId)
    return this.save({ ...data, project: { ...data.project, updatedAt: task.updatedAt }, tasks: [...data.tasks.filter((item) => item.id !== task.id), { ...task, projectId: data.project.id }] })
  }

  upsertBoqItem(projectId: string, item: BOQItem) {
    const data = this.requireData(projectId)
    return this.save({ ...data, project: { ...data.project, updatedAt: item.updatedAt }, boqItems: [...data.boqItems.filter((row) => row.id !== item.id), { ...item, projectId: data.project.id }] })
  }

  upsertSiteReport(projectId: string, report: SiteReport) {
    const data = this.requireData(projectId)
    return this.save({ ...data, project: { ...data.project, updatedAt: report.updatedAt }, siteReports: [...data.siteReports.filter((row) => row.id !== report.id), { ...report, projectId: data.project.id }] })
  }

  async deleteEntity(projectId: string, type: 'task' | 'boq-item' | 'site-report', entityId: string) {
    const data = this.requireData(projectId)
    const next = {
      ...data,
      tasks: type === 'task' ? data.tasks.filter((item) => item.id !== entityId) : data.tasks,
      boqItems: type === 'boq-item' ? data.boqItems.filter((item) => item.id !== entityId) : data.boqItems,
      siteReports: type === 'site-report' ? data.siteReports.filter((item) => item.id !== entityId) : data.siteReports,
      assetRelationships: data.assetRelationships.filter((relation) => relation.targetType !== type || relation.targetId !== entityId),
    }
    return this.save(next)
  }

  async createAsset(projectId: string, asset: ProjectAsset, file: Blob, relationships: AssetRelationship[]) {
    const data = this.requireData(projectId)
    const operationId = crypto.randomUUID()
    const key = `${data.project.id}/${operationId}/${asset.fileName}`
    try {
      await this.blobs.put(key, file)
    } catch (error) {
      throw new ProjectRepositoryError({ code: 'blob-write-failed', message: `Could not store ${asset.fileName}. No metadata was created.`, operationId, recoverable: true, cause: error })
    }
    const normalizedAsset: ProjectAsset = { ...asset, projectId: data.project.id, storage: { kind: 'indexed-db', key }, relationships: undefined }
    const next: PersistedProjectWorkspace = {
      ...data,
      project: { ...data.project, updatedAt: asset.updatedAt },
      assets: [...data.assets.filter((item) => item.id !== asset.id), normalizedAsset],
      assetRelationships: [...data.assetRelationships.filter((relation) => relation.assetId !== asset.id), ...relationships],
    }
    try {
      return await this.save(next)
    } catch (error) {
      try { await this.blobs.delete(key) } catch { /* reconciliation reports any surviving orphan */ }
      throw new ProjectRepositoryError({ code: 'metadata-write-failed', message: `Metadata for ${asset.fileName} was not saved; blob rollback was attempted.`, operationId, recoverable: true, cause: error })
    }
  }

  async updateAsset(projectId: string, asset: ProjectAsset, relationships: AssetRelationship[]) {
    const data = this.requireData(projectId)
    if (!data.assets.some((item) => item.id === asset.id)) throw new ProjectRepositoryError({ code: 'not-found', message: 'Asset was not found.', recoverable: false })
    return this.save({
      ...data,
      project: { ...data.project, updatedAt: asset.updatedAt },
      assets: data.assets.map((item) => item.id === asset.id ? { ...asset, projectId: data.project.id, relationships: undefined } : item),
      assetRelationships: [...data.assetRelationships.filter((relation) => relation.assetId !== asset.id), ...relationships],
    })
  }

  async replaceAssetBlob(projectId: string, assetId: string, file: Blob, fileName: string, mimeType: string) {
    const data = this.requireData(projectId)
    const asset = data.assets.find((item) => item.id === assetId)
    if (!asset) throw new ProjectRepositoryError({ code: 'not-found', message: 'Asset was not found.', recoverable: false })
    const operationId = crypto.randomUUID()
    const key = `${data.project.id}/${operationId}/${fileName}`
    await this.blobs.put(key, file)
    let next: PersistedProjectWorkspace
    try {
      const nextAsset = { ...asset, fileName, mimeType, sizeBytes: file.size, storage: { kind: 'indexed-db' as const, key }, updatedAt: new Date().toISOString() }
      next = await this.updateAsset(projectId, nextAsset, data.assetRelationships.filter((relation) => relation.assetId === assetId))
    } catch (error) {
      try { await this.blobs.delete(key) } catch { /* reconciliation handles the orphan */ }
      throw error
    }
    if (asset.storage.kind === 'indexed-db') {
      try {
        await this.blobs.delete(asset.storage.key)
      } catch (error) {
        const failure = new ProjectRepositoryError({ code: 'blob-delete-failed', message: 'The replacement is active, but prior blob cleanup is pending reconciliation.', operationId, recoverable: true, cause: error })
        this.publish(data.project.id, { status: 'error', data: next, error: toErrorShape(failure, failure) })
        throw failure
      }
    }
    return next
  }

  async unlinkAsset(projectId: string, assetId: string, targetType: AssetRelationship['targetType'], targetId: string) {
    const data = this.requireData(projectId)
    return this.save({ ...data, assetRelationships: data.assetRelationships.filter((relation) => !(relation.assetId === assetId && relation.targetType === targetType && relation.targetId === targetId)) })
  }

  async deleteAsset(projectId: string, assetId: string) {
    const data = this.requireData(projectId)
    const asset = data.assets.find((item) => item.id === assetId)
    if (!asset) return data
    const next = await this.save({ ...data, assets: data.assets.filter((item) => item.id !== assetId), assetRelationships: data.assetRelationships.filter((relation) => relation.assetId !== assetId) })
    if (asset.storage.kind === 'indexed-db') {
      try {
        await this.blobs.delete(asset.storage.key)
      } catch (error) {
        const failure = new ProjectRepositoryError({ code: 'blob-delete-failed', message: 'Asset metadata was deleted, but blob cleanup is pending reconciliation.', recoverable: true, cause: error })
        this.publish(data.project.id, { status: 'error', data: next, error: toErrorShape(failure, failure) })
        throw failure
      }
    }
    return next
  }

  async getAssetBlobUrl(key: string) {
    const blob = await this.blobs.get(key)
    return blob ? URL.createObjectURL(blob) : undefined
  }

  async reconcile(projectId: string, repair = false): Promise<ReconciliationReport> {
    const data = this.requireData(projectId)
    const blobKeys = await this.blobs.keys()
    const metadataKeys = new Set(data.assets.filter((asset) => asset.storage.kind === 'indexed-db').map((asset) => asset.storage.key))
    const entityExists = (relationship: AssetRelationship) => relationship.targetType === 'project'
      ? relationship.targetId === data.project.id
      : relationship.targetType === 'task'
        ? data.tasks.some((item) => item.id === relationship.targetId)
        : relationship.targetType === 'boq-item'
          ? data.boqItems.some((item) => item.id === relationship.targetId)
          : relationship.targetType === 'site-report'
            ? data.siteReports.some((item) => item.id === relationship.targetId)
            : true
    const orphanBlobKeys = blobKeys.filter((key) => key.startsWith(`${data.project.id}/`) && !metadataKeys.has(key))
    const missingBlobAssetIds = data.assets.filter((asset) => asset.storage.kind === 'indexed-db' && !blobKeys.includes(asset.storage.key)).map((asset) => asset.id)
    const danglingRelationshipIds = data.assetRelationships.filter((relationship) => !data.assets.some((asset) => asset.id === relationship.assetId) || !entityExists(relationship)).map((relationship) => relationship.id)
    if (repair) {
      await Promise.all(orphanBlobKeys.map((key) => this.blobs.delete(key)))
      await this.save({
        ...data,
        assets: data.assets.filter((asset) => !missingBlobAssetIds.includes(asset.id)),
        assetRelationships: data.assetRelationships.filter((relationship) => !danglingRelationshipIds.includes(relationship.id) && !missingBlobAssetIds.includes(relationship.assetId)),
      })
    }
    return { orphanBlobKeys, missingBlobAssetIds, danglingRelationshipIds, repaired: repair }
  }
}

export class MemoryProjectMetadataStore implements ProjectMetadataStore {
  records = new Map<string, unknown>()
  backups: unknown[] = []
  failSave = false
  failLoad = false
  async load(projectId: string) { if (this.failLoad) throw new Error('injected load failure'); return this.records.get(resolveCanonicalProjectId(projectId)) ?? null }
  async save(projectId: string, data: PersistedProjectWorkspace) { if (this.failSave) throw new Error('injected save failure'); this.records.set(resolveCanonicalProjectId(projectId), structuredClone(data)) }
  async backup(_projectId: string, data: unknown) { this.backups.push(structuredClone(data)) }
}

export class MemoryProjectBlobStore implements ProjectBlobStore {
  records = new Map<string, Blob>()
  failPut = false
  failDelete = false
  async put(key: string, blob: Blob) { if (this.failPut) throw new Error('injected blob failure'); this.records.set(key, blob) }
  async get(key: string) { return this.records.get(key) }
  async delete(key: string) { if (this.failDelete) throw new Error('injected delete failure'); this.records.delete(key) }
  async keys() { return [...this.records.keys()] }
}

export const projectWorkspaceRepository = typeof window === 'undefined'
  ? new ProjectWorkspaceRepository(new MemoryProjectMetadataStore(), new MemoryProjectBlobStore())
  : new ProjectWorkspaceRepository(new BrowserProjectMetadataStore(), new IndexedDbProjectBlobStore())

// Pure compatibility helpers remain useful to selectors/tests but never persist by themselves.
export const upsertTask = (data: ProjectWorkspaceData, task: ProjectTask): ProjectWorkspaceData => ({ ...data, project: { ...data.project, updatedAt: task.updatedAt }, tasks: [...data.tasks.filter((item) => item.id !== task.id), task] })
export const upsertBoqItem = (data: ProjectWorkspaceData, item: BOQItem): ProjectWorkspaceData => ({ ...data, project: { ...data.project, updatedAt: item.updatedAt }, boqItems: [...data.boqItems.filter((row) => row.id !== item.id), item] })
export const upsertSiteReport = (data: ProjectWorkspaceData, report: SiteReport): ProjectWorkspaceData => ({ ...data, project: { ...data.project, updatedAt: report.updatedAt }, siteReports: [...data.siteReports.filter((row) => row.id !== report.id), report] })
