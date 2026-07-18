import test from 'node:test'
import assert from 'node:assert/strict'
import { createKarunCkkSeed } from '../../src/core/projectWorkspace/karunCkkSeed.ts'
import { synchronizeProjectWorkspaceToOsData } from '../../src/core/projectWorkspace/legacyAdapter.ts'
import { normalizeProjectWorkspace } from '../../src/core/projectWorkspace/migration.ts'
import {
  MemoryProjectBlobStore,
  MemoryProjectMetadataStore,
  ProjectWorkspaceRepository,
} from '../../src/core/projectWorkspace/repository.ts'
import {
  getAssetRelationships,
  getAssetsForEntity,
  getBoqBaseAmount,
  getBoqRevisedAmount,
  getCostSummary,
  getProjectEvents,
  getProjectIntelligence,
  getTasksInRange,
} from '../../src/core/projectWorkspace/selectors.ts'

const mockOsData = { studioProjects: [{ id: 'sp-kcc-main', slug: 'karun-central-khon-kaen', name: 'Karun Central Khon Kaen', client: 'Karun', location: 'Khon Kaen', phase: 'Construction', status: 'active', projectHealth: 'watch', processState: 'on-site', owner: 'Por', trade: 'Fit-out', priority: 'high', startDate: '2026-05-08', endDate: '2026-08-05', progress: 64, siteCheck: 'scheduled', progressBillingGateIds: [] }], studioTasks: [] }

const setup = async () => {
  const metadata = new MemoryProjectMetadataStore()
  const blobs = new MemoryProjectBlobStore()
  const repository = new ProjectWorkspaceRepository(metadata, blobs)
  await repository.hydrate('sp-kcc-main', mockOsData)
  return { repository, metadata, blobs, data: () => repository.getSnapshot('sp-kcc-main').data }
}

const taskRecord = (data, id = `task-${crypto.randomUUID()}`) => ({ ...data.tasks[0], id, title: 'Shared acceptance task', status: 'ready', progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'local' })
const assetRecord = (data, id = `asset-${crypto.randomUUID()}`) => ({ id, projectId: data.project.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Test', source: 'local', name: 'Lifecycle asset', fileName: 'lifecycle.txt', mimeType: 'text/plain', sizeBytes: 4, category: 'meeting-document', approvalStatus: 'pending', storage: { kind: 'indexed-db', key: '' } })
const relationsFor = (data, assetId) => [
  { id: `rel-p-${assetId}`, assetId, targetType: 'project', targetId: data.project.id, relation: 'attachment' },
  { id: `rel-t-${assetId}`, assetId, targetType: 'task', targetId: data.tasks[0].id, relation: 'attachment' },
  { id: `rel-b-${assetId}`, assetId, targetType: 'boq-item', targetId: data.boqItems[0].id, relation: 'attachment' },
  { id: `rel-r-${assetId}`, assetId, targetType: 'site-report', targetId: data.siteReports[0].id, relation: 'attachment' },
]

test('v1 seed migrates to canonical Studio identity and normalized relationships', () => {
  const data = createKarunCkkSeed()
  assert.equal(data.schemaVersion, 'project-workspace.v2')
  assert.equal(data.project.id, 'sp-kcc-main')
  assert.ok(data.assetRelationships.length > 0)
  assert.equal(data.assets.some((asset) => asset.relationships?.length), false)
})

test('desktop-created task is returned by the mobile-compatible OsData projection', async () => {
  const { repository, data } = await setup()
  const task = taskRecord(data())
  await repository.upsertTask('sp-kcc-main', task)
  const projected = synchronizeProjectWorkspaceToOsData(mockOsData, data())
  assert.ok(projected.studioTasks.some((item) => item.id === task.id && item.projectId === 'sp-kcc-main'))
})

test('mobile-compatible mutation is visible to the desktop repository reader', async () => {
  const { repository, data } = await setup()
  const task = taskRecord(data())
  await repository.upsertTask('sp-kcc-main', task)
  await repository.upsertTask('sp-kcc-main', { ...task, status: 'done', progress: 100, updatedAt: new Date().toISOString() })
  assert.equal(data().tasks.find((item) => item.id === task.id).status, 'done')
})

test('task and Schedule resolve the same task record', async () => {
  const { repository, data } = await setup()
  const task = { ...taskRecord(data()), plannedStart: '2030-01-10', plannedFinish: '2030-01-12' }
  await repository.upsertTask('sp-kcc-main', task)
  assert.strictEqual(getTasksInRange(data().tasks, '2030-01-11', '2030-01-11').find((item) => item.id === task.id), data().tasks.find((item) => item.id === task.id))
})

test('asset creation writes metadata, blob, and normalized relations', async () => {
  const { repository, blobs, data } = await setup()
  const asset = assetRecord(data())
  await repository.createAsset('sp-kcc-main', asset, new Blob(['test']), relationsFor(data(), asset.id))
  assert.ok(data().assets.some((item) => item.id === asset.id))
  assert.equal(blobs.records.size, 1)
  assert.equal(getAssetRelationships(data(), asset.id).length, 4)
})

test('failed blob write leaves no successful metadata or event', async () => {
  const { repository, blobs, data } = await setup()
  const asset = assetRecord(data()); blobs.failPut = true
  await assert.rejects(repository.createAsset('sp-kcc-main', asset, new Blob(['fail']), relationsFor(data(), asset.id)), /No metadata was created/)
  assert.equal(data().assets.some((item) => item.id === asset.id), false)
  assert.equal(getProjectEvents(data()).some((event) => event.entityId === asset.id), false)
})

test('failed metadata write compensates by deleting the newly written blob', async () => {
  const { repository, metadata, blobs, data } = await setup()
  const asset = assetRecord(data()); metadata.failSave = true
  await assert.rejects(repository.createAsset('sp-kcc-main', asset, new Blob(['fail']), relationsFor(data(), asset.id)), /rollback was attempted/)
  assert.equal(blobs.records.size, 0)
  assert.equal(data().assets.some((item) => item.id === asset.id), false)
})

test('inverse asset lookup resolves task, BOQ, and site report', async () => {
  const { repository, data } = await setup(); const asset = assetRecord(data())
  await repository.createAsset('sp-kcc-main', asset, new Blob(['test']), relationsFor(data(), asset.id))
  assert.ok(getAssetsForEntity(data(), 'task', data().tasks[0].id).some((item) => item.id === asset.id))
  assert.ok(getAssetsForEntity(data(), 'boq-item', data().boqItems[0].id).some((item) => item.id === asset.id))
  assert.ok(getAssetsForEntity(data(), 'site-report', data().siteReports[0].id).some((item) => item.id === asset.id))
})

test('asset unlink updates both query directions', async () => {
  const { repository, data } = await setup(); const asset = assetRecord(data())
  await repository.createAsset('sp-kcc-main', asset, new Blob(['test']), relationsFor(data(), asset.id))
  await repository.unlinkAsset('sp-kcc-main', asset.id, 'task', data().tasks[0].id)
  assert.equal(getAssetsForEntity(data(), 'task', data().tasks[0].id).some((item) => item.id === asset.id), false)
  assert.equal(getAssetRelationships(data(), asset.id).some((relation) => relation.targetType === 'task'), false)
})

test('asset deletion removes blob and all relationships', async () => {
  const { repository, blobs, data } = await setup(); const asset = assetRecord(data())
  await repository.createAsset('sp-kcc-main', asset, new Blob(['test']), relationsFor(data(), asset.id))
  await repository.deleteAsset('sp-kcc-main', asset.id)
  assert.equal(data().assets.some((item) => item.id === asset.id), false)
  assert.equal(data().assetRelationships.some((item) => item.assetId === asset.id), false)
  assert.equal(blobs.records.size, 0)
})

test('asset blob replacement publishes new metadata then removes the prior blob', async () => {
  const { repository, blobs, data } = await setup(); const asset = assetRecord(data())
  await repository.createAsset('sp-kcc-main', asset, new Blob(['old']), relationsFor(data(), asset.id))
  const oldKey = data().assets.find((item) => item.id === asset.id).storage.key
  await repository.replaceAssetBlob('sp-kcc-main', asset.id, new Blob(['replacement']), 'replacement.txt', 'text/plain')
  const updated = data().assets.find((item) => item.id === asset.id)
  assert.equal(updated.fileName, 'replacement.txt')
  assert.notEqual(updated.storage.key, oldKey)
  assert.equal(blobs.records.has(oldKey), false)
  assert.equal(blobs.records.has(updated.storage.key), true)
})

test('failed old-blob cleanup keeps the successful replacement recoverable', async () => {
  const { repository, blobs, data } = await setup(); const asset = assetRecord(data())
  await repository.createAsset('sp-kcc-main', asset, new Blob(['old']), relationsFor(data(), asset.id)); const oldKey = data().assets.find((item) => item.id === asset.id).storage.key; blobs.failDelete = true
  await assert.rejects(repository.replaceAssetBlob('sp-kcc-main', asset.id, new Blob(['new']), 'new.txt', 'text/plain'), /pending reconciliation/)
  const newKey = data().assets.find((item) => item.id === asset.id).storage.key
  assert.equal(blobs.records.has(newKey), true); assert.equal(blobs.records.has(oldKey), true)
  blobs.failDelete = false; const report = await repository.reconcile('sp-kcc-main', true)
  assert.ok(report.orphanBlobKeys.includes(oldKey)); assert.equal(blobs.records.has(oldKey), false)
})

test('deleting one linked entity preserves an asset linked elsewhere', async () => {
  const { repository, data } = await setup(); const asset = assetRecord(data()); const taskId = data().tasks[0].id
  await repository.createAsset('sp-kcc-main', asset, new Blob(['test']), relationsFor(data(), asset.id))
  await repository.deleteEntity('sp-kcc-main', 'task', taskId)
  assert.ok(data().assets.some((item) => item.id === asset.id))
  assert.equal(getAssetRelationships(data(), asset.id).some((relation) => relation.targetType === 'task'), false)
  assert.ok(getAssetRelationships(data(), asset.id).some((relation) => relation.targetType === 'boq-item'))
})

test('orphan blob reconciliation removes untracked project blobs', async () => {
  const { repository, blobs } = await setup(); await blobs.put('sp-kcc-main/orphan/file.txt', new Blob(['orphan']))
  const report = await repository.reconcile('sp-kcc-main', true)
  assert.deepEqual(report.orphanBlobKeys, ['sp-kcc-main/orphan/file.txt'])
  assert.equal(blobs.records.size, 0)
})

test('orphan metadata reconciliation removes missing-blob metadata and relations', async () => {
  const { repository, blobs, data } = await setup(); const asset = assetRecord(data())
  await repository.createAsset('sp-kcc-main', asset, new Blob(['test']), relationsFor(data(), asset.id)); blobs.records.clear()
  const report = await repository.reconcile('sp-kcc-main', true)
  assert.deepEqual(report.missingBlobAssetIds, [asset.id])
  assert.equal(data().assets.some((item) => item.id === asset.id), false)
})

test('dangling relationship reconciliation removes invalid targets', async () => {
  const { repository, data } = await setup(); const dangling = { id: 'dangling', assetId: data().assets[0].id, targetType: 'task', targetId: 'missing-task', relation: 'attachment' }
  await repository.save({ ...data(), assetRelationships: [...data().assetRelationships, dangling] })
  const report = await repository.reconcile('sp-kcc-main', true)
  assert.deepEqual(report.danglingRelationshipIds, ['dangling'])
  assert.equal(data().assetRelationships.some((item) => item.id === 'dangling'), false)
})

test('hydration failure preserves the last valid snapshot and does not reset seed', async () => {
  const { repository, metadata, data } = await setup(); const before = data(); metadata.failLoad = true
  await repository.hydrate('sp-kcc-main', mockOsData, true)
  assert.strictEqual(data(), before)
  assert.equal(repository.getSnapshot('sp-kcc-main').status, 'error')
})

test('date intelligence uses an injected deterministic clock', () => {
  const data = createKarunCkkSeed(); const intelligence = getProjectIntelligence(data, '2026-07-18')
  assert.ok(intelligence.lateTasks.some((item) => item.id === 'task-flooring'))
  assert.ok(intelligence.dueThisWeekTasks.length > 0)
  assert.ok(intelligence.nextMilestone)
  assert.equal(typeof intelligence.scheduleRiskDays, 'number')
})

test('overdue, today, this-week, and upcoming milestone calculations are distinct', () => {
  const data = createKarunCkkSeed(); const today = '2026-07-21'; const intelligence = getProjectIntelligence(data, today)
  assert.ok(intelligence.lateTasks.every((task) => task.plannedFinish < today))
  assert.ok(intelligence.dueTodayTasks.every((task) => task.plannedFinish === today))
  assert.ok(intelligence.dueThisWeekTasks.every((task) => task.plannedFinish >= today))
  assert.ok(!intelligence.nextMilestone || intelligence.nextMilestone.plannedFinish >= today)
})

test('development seed never overwrites existing persisted mutations', async () => {
  const metadata = new MemoryProjectMetadataStore(); const blobs = new MemoryProjectBlobStore(); const first = new ProjectWorkspaceRepository(metadata, blobs)
  await first.hydrate('sp-kcc-main', mockOsData); const task = taskRecord(first.getSnapshot('sp-kcc-main').data); await first.upsertTask('sp-kcc-main', task)
  const second = new ProjectWorkspaceRepository(metadata, blobs); await second.hydrate('sp-kcc-main', mockOsData)
  assert.ok(second.getSnapshot('sp-kcc-main').data.tasks.some((item) => item.id === task.id))
})

test('BOQ calculations remain derived from one formula', () => {
  const data = createKarunCkkSeed(); const flooring = data.boqItems.find((item) => item.id === 'boq-floor')
  assert.equal(getBoqBaseAmount(flooring), 99540); assert.equal(getBoqRevisedAmount(flooring), 111540)
  const summary = getCostSummary(data); assert.equal(summary.revisedAmount, data.boqItems.reduce((total, item) => total + item.approvedAmount + item.variation, 0))
})

test('timeline events are derived and only appear after successful metadata mutation', async () => {
  const { repository, data } = await setup(); const task = taskRecord(data()); const before = getProjectEvents(data()).length
  await repository.upsertTask('sp-kcc-main', task)
  const events = getProjectEvents(data()); assert.ok(events.length > before); assert.ok(events.some((event) => event.entityId === task.id)); assert.deepEqual(events, [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)))
})

test('legacy v1 normalization is non-destructive and creates a backup on hydration', async () => {
  const metadata = new MemoryProjectMetadataStore(); const blobs = new MemoryProjectBlobStore(); const v1 = { ...createKarunCkkSeed(), schemaVersion: 'project-workspace.v1' }; metadata.records.set('sp-kcc-main', v1)
  const repository = new ProjectWorkspaceRepository(metadata, blobs); await repository.hydrate('sp-kcc-main', mockOsData)
  assert.equal(metadata.backups.length, 1); assert.equal(repository.getSnapshot('sp-kcc-main').data.schemaVersion, 'project-workspace.v2')
  assert.equal(normalizeProjectWorkspace(v1, 'sp-kcc-main').project.id, 'sp-kcc-main')
})
