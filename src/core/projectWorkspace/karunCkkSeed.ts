import type { ProjectWorkspaceData } from './types'
import { normalizeProjectWorkspace } from './migration.ts'

const projectId = 'karun-central-khon-kaen-campus'
const createdAt = '2026-07-01T09:00:00.000Z'
const updatedAt = '2026-07-18T08:30:00.000Z'
const meta = (id: string, changedAt = updatedAt) => ({ id, projectId, createdAt, updatedAt: changedAt, createdBy: 'BeBlank Studio', source: 'seed' as const })

export const karunCkkProjectId = projectId

export const createKarunCkkSeed = (): ProjectWorkspaceData => normalizeProjectWorkspace(({
  schemaVersion: 'project-workspace.v1',
  project: {
    id: projectId,
    slug: projectId,
    code: 'KRN-CKK-CAMPUS',
    name: 'Karun Thai Tea — Central Khon Kaen Campus',
    client: 'Karun Thai Tea',
    locationLabel: 'Central Khon Kaen, Campus area',
    summary: 'Island kiosk fit-out coordinating design, mall approvals, fabrication, site installation, handover, and opening readiness.',
    status: 'active',
    phase: 'Construction and mall coordination',
    startDate: '2026-06-16',
    targetHandoverDate: '2026-08-05',
    targetOpeningDate: '2026-08-10',
    plannedProgress: 72,
    actualProgress: 64,
    approvedBudget: 2450000,
    currency: 'THB',
    coverAssetId: 'asset-approved-render',
    members: [
      { id: 'member-por', name: 'Por', role: 'Project director', responsibility: 'Design direction and final approvals' },
      { id: 'member-nok', name: 'Nok', role: 'Project coordinator', responsibility: 'Mall coordination, programme, and records' },
      { id: 'member-site', name: 'Site supervisor', role: 'Site supervisor', company: 'Fit-out contractor', responsibility: 'Daily site safety, labour, and progress' },
    ],
    locations: [
      { id: 'loc-campus', name: 'Campus concourse', kind: 'site' },
      { id: 'loc-kiosk', name: 'Island kiosk', parentId: 'loc-campus', kind: 'zone' },
      { id: 'loc-back-counter', name: 'Back counter', parentId: 'loc-kiosk', kind: 'workface' },
      { id: 'loc-ceiling', name: 'Ceiling and services zone', parentId: 'loc-kiosk', kind: 'workface' },
    ],
    workSections: [
      { id: 'ws-prelim', code: '01', name: 'Preliminaries and mall coordination' },
      { id: 'ws-floor', code: '05', name: 'Flooring and finishes' },
      { id: 'ws-ceiling', code: '07', name: 'Ceiling and overhead services' },
      { id: 'ws-joinery', code: '09', name: 'Joinery and counters' },
      { id: 'ws-mep', code: '12', name: 'MEP and equipment connections' },
    ],
    createdAt,
    updatedAt,
    source: 'seed',
  },
  tasks: [
    {
      ...meta('task-flooring', '2026-07-17T11:20:00.000Z'), title: 'Complete kiosk flooring installation', description: 'Install approved floor finish and close perimeter details before joinery positioning.', phase: 'Construction', workSectionId: 'ws-floor', locationId: 'loc-kiosk', responsibleMemberId: 'member-site', contractor: 'Fit-out contractor', plannedStart: '2026-07-13', plannedFinish: '2026-07-16', actualStart: '2026-07-14', dependencies: [], progress: 70, priority: 'critical', status: 'blocked', timeImpactDays: 3, costImpact: 18000,
      checklist: [{ id: 'check-floor-1', label: 'Substrate level checked', complete: true }, { id: 'check-floor-2', label: 'Mall finish inspection passed', complete: false }], commentIds: [], assetIds: ['asset-floor-before', 'asset-floor-progress'], boqItemIds: ['boq-floor'], siteReportIds: ['report-2026-07-17'], decisionIds: ['decision-floor-joint'], drawingReferenceIds: [],
    },
    {
      ...meta('task-ceiling'), title: 'Coordinate ceiling service openings', description: 'Confirm sprinkler, detector, lighting, and sign suspension points against the coordinated ceiling reference.', phase: 'Construction', workSectionId: 'ws-ceiling', locationId: 'loc-ceiling', responsibleMemberId: 'member-nok', contractor: 'MEP contractor', plannedStart: '2026-07-18', plannedFinish: '2026-07-21', dependencies: [], progress: 35, priority: 'high', status: 'in-progress', timeImpactDays: 1, costImpact: 0,
      checklist: [{ id: 'check-ceiling-1', label: 'Mall MEP comments incorporated', complete: true }, { id: 'check-ceiling-2', label: 'Final suspension points marked', complete: false }], commentIds: [], assetIds: ['asset-ceiling-drawing'], boqItemIds: ['boq-ceiling'], siteReportIds: [], decisionIds: [], drawingReferenceIds: ['asset-ceiling-drawing'],
    },
    {
      ...meta('task-joinery'), title: 'Install back counter joinery', description: 'Position factory-finished modules after flooring release.', phase: 'Construction', workSectionId: 'ws-joinery', locationId: 'loc-back-counter', responsibleMemberId: 'member-site', contractor: 'Joinery contractor', plannedStart: '2026-07-19', plannedFinish: '2026-07-24', dependencies: [{ taskId: 'task-joinery', dependsOnTaskId: 'task-flooring', type: 'finish-to-start' }], progress: 10, priority: 'high', status: 'blocked', timeImpactDays: 2, costImpact: 0,
      checklist: [{ id: 'check-joinery-1', label: 'Modules delivered and inspected', complete: true }, { id: 'check-joinery-2', label: 'Flooring workface released', complete: false }], commentIds: [], assetIds: ['asset-approved-render'], boqItemIds: ['boq-joinery'], siteReportIds: [], decisionIds: [], drawingReferenceIds: [],
    },
    {
      ...meta('task-equipment'), title: 'Connect tea equipment and test loads', description: 'Complete water, waste, and electrical connections with witnessed commissioning.', phase: 'Commissioning', workSectionId: 'ws-mep', locationId: 'loc-back-counter', responsibleMemberId: 'member-site', contractor: 'MEP contractor', plannedStart: '2026-07-25', plannedFinish: '2026-07-28', dependencies: [{ taskId: 'task-equipment', dependsOnTaskId: 'task-joinery', type: 'finish-to-start' }], progress: 0, priority: 'high', status: 'ready', timeImpactDays: 0, costImpact: 0,
      checklist: [{ id: 'check-equipment-1', label: 'Equipment schedule confirmed', complete: true }, { id: 'check-equipment-2', label: 'Commissioning forms prepared', complete: false }], commentIds: [], assetIds: ['asset-equipment-spec'], boqItemIds: ['boq-mep'], siteReportIds: [], decisionIds: [], drawingReferenceIds: [],
    },
    {
      ...meta('task-handover'), title: 'Mall joint inspection and handover', description: 'Close inspection comments and issue opening-readiness record.', phase: 'Handover', workSectionId: 'ws-prelim', locationId: 'loc-campus', responsibleMemberId: 'member-nok', plannedStart: '2026-08-03', plannedFinish: '2026-08-05', dependencies: [{ taskId: 'task-handover', dependsOnTaskId: 'task-equipment', type: 'finish-to-start' }], progress: 0, priority: 'critical', status: 'backlog', timeImpactDays: 0, costImpact: 0,
      checklist: [{ id: 'check-handover-1', label: 'As-built package compiled', complete: false }, { id: 'check-handover-2', label: 'Mall inspection booked', complete: true }], commentIds: [], assetIds: [], boqItemIds: [], siteReportIds: [], decisionIds: [], drawingReferenceIds: [],
    },
  ],
  assets: [
    { ...meta('asset-approved-render', '2026-07-02T10:00:00.000Z'), name: 'Approved kiosk render', fileName: 'KRN-CKK-approved-render-r03.jpg', mimeType: 'image/jpeg', sizeBytes: 2840000, category: 'approved-render', revision: 'R03', approvalStatus: 'approved', caption: 'Approved design reference for finishes and kiosk identity.', storage: { kind: 'seed-url', key: 'render-r03' }, relationships: [{ id: 'rel-render-project', assetId: 'asset-approved-render', targetType: 'project', targetId: projectId, relation: 'approval' }] },
    { ...meta('asset-floor-before', '2026-07-14T09:10:00.000Z'), name: 'Floor substrate before works', fileName: 'site-floor-before-01.jpg', mimeType: 'image/jpeg', sizeBytes: 1820000, category: 'site-photo', locationId: 'loc-kiosk', workSectionId: 'ws-floor', approvalStatus: 'not-required', caption: 'Substrate condition before floor finish installation.', storage: { kind: 'seed-url', key: 'floor-before' }, relationships: [{ id: 'rel-floor-before-task', assetId: 'asset-floor-before', targetType: 'task', targetId: 'task-flooring', relation: 'evidence' }, { id: 'rel-floor-before-report', assetId: 'asset-floor-before', targetType: 'site-report', targetId: 'report-2026-07-17', relation: 'attachment' }] },
    { ...meta('asset-floor-progress', '2026-07-17T15:30:00.000Z'), name: 'Floor finish progress', fileName: 'site-floor-progress-02.jpg', mimeType: 'image/jpeg', sizeBytes: 2150000, category: 'site-photo', locationId: 'loc-kiosk', workSectionId: 'ws-floor', approvalStatus: 'pending', caption: 'Installation progress and perimeter joint requiring direction.', storage: { kind: 'seed-url', key: 'floor-progress' }, relationships: [{ id: 'rel-floor-progress-task', assetId: 'asset-floor-progress', targetType: 'task', targetId: 'task-flooring', relation: 'evidence' }, { id: 'rel-floor-progress-boq', assetId: 'asset-floor-progress', targetType: 'boq-item', targetId: 'boq-floor', relation: 'evidence' }, { id: 'rel-floor-progress-report', assetId: 'asset-floor-progress', targetType: 'site-report', targetId: 'report-2026-07-17', relation: 'attachment' }] },
    { ...meta('asset-ceiling-drawing', '2026-07-16T12:00:00.000Z'), name: 'Coordinated reflected ceiling reference', fileName: 'KRN-CKK-RCP-coordination-R02.pdf', mimeType: 'application/pdf', sizeBytes: 940000, category: 'construction-drawing', locationId: 'loc-ceiling', workSectionId: 'ws-ceiling', revision: 'R02', approvalStatus: 'pending', caption: 'Provisional coordination issue for mall MEP review.', storage: { kind: 'seed-url', key: 'rcp-r02' }, relationships: [{ id: 'rel-rcp-task', assetId: 'asset-ceiling-drawing', targetType: 'task', targetId: 'task-ceiling', relation: 'reference' }] },
    { ...meta('asset-equipment-spec', '2026-07-10T08:30:00.000Z'), name: 'Tea equipment connection schedule', fileName: 'KRN-equipment-connections-R01.pdf', mimeType: 'application/pdf', sizeBytes: 610000, category: 'equipment-specification', workSectionId: 'ws-mep', revision: 'R01', approvalStatus: 'approved', storage: { kind: 'seed-url', key: 'equipment-r01' }, relationships: [{ id: 'rel-equipment-task', assetId: 'asset-equipment-spec', targetType: 'task', targetId: 'task-equipment', relation: 'reference' }] },
  ],
  siteReports: [
    { ...meta('report-2026-07-17', '2026-07-17T17:40:00.000Z'), date: '2026-07-17', shift: 'full-day', teams: ['Fit-out contractor', 'Flooring installer'], workerCount: 8, workScope: 'Floor finish installation and back-counter set-out.', locationIds: ['loc-kiosk', 'loc-back-counter'], materialsArriving: ['Floor finish batch 02', 'Joinery protection sheets'], equipment: ['Laser level', 'Wet saw', 'Industrial vacuum'], permitRequirements: ['Mall work permit', 'Material delivery pass'], hotWork: false, workAtHeight: false, supervisor: 'Site supervisor', beforeAssetIds: ['asset-floor-before'], duringAssetIds: ['asset-floor-progress'], afterAssetIds: [], completedToday: 'Approximately 70% of floor finish installed; counter datum marked.', issues: 'Perimeter joint alignment conflicts with the approved render intent and needs a decision before closure.', planTomorrow: 'Confirm joint direction, close flooring, and release the back-counter workface.', taskIds: ['task-flooring', 'task-joinery'], boqItemIds: ['boq-floor', 'boq-joinery'], assetIds: ['asset-floor-before', 'asset-floor-progress'], status: 'submitted' },
  ],
  boqItems: [
    { ...meta('boq-floor'), code: '05-010', workSectionId: 'ws-floor', description: 'Kiosk floor finish including bedding and perimeter trims', specification: 'Sample finish, provisional pending final mall inspection', unit: 'm²', quantity: 42, materialRate: 1850, labourRate: 520, approvedAmount: 99540, variation: 12000, actualCost: 72000, forecastCost: 111540, supplier: 'Sample local supplier', contractor: 'Fit-out contractor', drawingReferenceIds: [], taskIds: ['task-flooring'], assetIds: ['asset-floor-before', 'asset-floor-progress'], procurementState: 'delivered', paymentState: 'part-paid', installationProgress: 70, valueStatus: 'provisional' },
    { ...meta('boq-ceiling'), code: '07-020', workSectionId: 'ws-ceiling', description: 'Ceiling frame, finish, service openings, and access panels', specification: 'Coordinated to provisional RCP R02', unit: 'lot', quantity: 1, materialRate: 148000, labourRate: 62000, approvedAmount: 210000, variation: 18000, actualCost: 85000, forecastCost: 228000, supplier: 'Sample ceiling supplier', contractor: 'MEP contractor', drawingReferenceIds: ['asset-ceiling-drawing'], taskIds: ['task-ceiling'], assetIds: ['asset-ceiling-drawing'], procurementState: 'delivered', paymentState: 'pending', installationProgress: 35, valueStatus: 'provisional' },
    { ...meta('boq-joinery'), code: '09-100', workSectionId: 'ws-joinery', description: 'Front and back counter joinery package', specification: 'Factory finished modules, sample budget data', unit: 'lot', quantity: 1, materialRate: 640000, labourRate: 115000, approvedAmount: 755000, variation: 0, actualCost: 410000, forecastCost: 755000, supplier: 'Sample joinery supplier', contractor: 'Joinery contractor', drawingReferenceIds: [], taskIds: ['task-joinery'], assetIds: ['asset-approved-render'], procurementState: 'delivered', paymentState: 'part-paid', installationProgress: 10, valueStatus: 'sample-estimate' },
    { ...meta('boq-mep'), code: '12-060', workSectionId: 'ws-mep', description: 'Equipment power, water, and waste connections', specification: 'Connection schedule R01', unit: 'lot', quantity: 1, materialRate: 92000, labourRate: 76000, approvedAmount: 168000, variation: 0, actualCost: 0, forecastCost: 176000, supplier: 'Quotation pending', contractor: 'MEP contractor', drawingReferenceIds: ['asset-equipment-spec'], taskIds: ['task-equipment'], assetIds: ['asset-equipment-spec'], procurementState: 'quoting', paymentState: 'not-due', installationProgress: 0, valueStatus: 'provisional' },
  ],
  decisions: [
    { ...meta('decision-floor-joint'), title: 'Confirm flooring perimeter joint direction', description: 'Choose whether the perimeter joint follows the kiosk datum or the mall tile grid before the finish is closed.', status: 'pending', dueDate: '2026-07-19', owner: 'Por', originType: 'site-report', originId: 'report-2026-07-17', impact: 'high' },
  ],
  risks: [
    { ...meta('risk-floor-delay'), title: 'Flooring blocks joinery installation', description: 'The unresolved perimeter joint prevents final floor closure and release of the back-counter workface.', status: 'mitigating', severity: 'high', owner: 'Nok', dueDate: '2026-07-19', relatedEntityType: 'task', relatedEntityId: 'task-flooring' },
    { ...meta('risk-mep-approval'), title: 'Mall MEP coordination approval pending', description: 'Ceiling service opening positions remain provisional until the mall reviewer confirms R02.', status: 'open', severity: 'medium', owner: 'Nok', dueDate: '2026-07-21', relatedEntityType: 'asset', relatedEntityId: 'asset-ceiling-drawing' },
  ],
  activities: [],
}) as ProjectWorkspaceData, 'sp-kcc-main')
