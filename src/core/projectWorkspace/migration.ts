import type { AssetRelationship, PersistedProjectWorkspace, ProjectWorkspaceData } from './types'

const canonicalKarunId = 'sp-kcc-main'
const karunAliases = new Set(['sp-kcc-main', 'karun-central-khon-kaen', 'karun-central-khon-kaen-campus', 'karun-ckk'])

export const resolveCanonicalProjectId = (projectId: string) => karunAliases.has(projectId) ? canonicalKarunId : projectId

export const getProjectAliases = (projectId: string) => resolveCanonicalProjectId(projectId) === canonicalKarunId
  ? [...karunAliases]
  : [projectId]

const uniqueRelationships = (relationships: AssetRelationship[]) => {
  const seen = new Set<string>()
  return relationships.filter((relationship) => {
    const key = `${relationship.assetId}:${relationship.targetType}:${relationship.targetId}:${relationship.relation}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Non-destructively upgrades v1 nested/inverse relationships to the v2 normalized model. */
export const normalizeProjectWorkspace = (input: ProjectWorkspaceData, requestedProjectId = input.project.id): PersistedProjectWorkspace => {
  const canonicalId = resolveCanonicalProjectId(requestedProjectId)
  const remapTarget = (targetId: string) => karunAliases.has(targetId) ? canonicalId : targetId
  const nestedRelationships = input.assets.flatMap((asset) => asset.relationships ?? [])
  const relationships = uniqueRelationships([...(input.assetRelationships ?? []), ...nestedRelationships].map((relationship) => ({
    ...relationship,
    targetId: relationship.targetType === 'project' ? remapTarget(relationship.targetId) : relationship.targetId,
  })))
  const tasks = input.tasks.map((task) => { const normalized = { ...task, projectId: canonicalId }; delete normalized.assetIds; return normalized })
  const assets = input.assets.map((asset) => { const normalized = { ...asset, projectId: canonicalId }; delete normalized.relationships; return normalized })
  const siteReports = input.siteReports.map((report) => { const normalized = { ...report, projectId: canonicalId, beforeAssetIds: [], duringAssetIds: [], afterAssetIds: [] }; delete normalized.assetIds; return normalized })
  const boqItems = input.boqItems.map((item) => { const normalized = { ...item, projectId: canonicalId }; delete normalized.assetIds; return normalized })

  return {
    ...input,
    schemaVersion: 'project-workspace.v2',
    project: { ...input.project, id: canonicalId, slug: input.project.slug || requestedProjectId },
    tasks,
    assets,
    siteReports,
    boqItems,
    decisions: input.decisions.map((record) => ({ ...record, projectId: canonicalId })),
    risks: input.risks.map((record) => ({ ...record, projectId: canonicalId })),
    activities: input.activities.map((record) => ({ ...record, projectId: canonicalId })),
    assetRelationships: relationships,
  }
}
