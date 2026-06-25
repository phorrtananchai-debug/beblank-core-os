import type { PatternDef } from '../types'

export const patterns: PatternDef[] = [
  {
    workflow: 'Data fetching → normalization → merge → display',
    recommendedComponents: ['SheetResourceDef', 'normalizeRows', 'bulkMergeData', 'EmptyState'],
    rules: [
      'Always use the sheet bridge for external data, never direct API calls.',
      'Normalize rows through adapters.ts before merging into OsData.',
      'Show EmptyState when data arrays are empty — never show raw null/undefined.',
      'Use SourceHealthMonitor for debugging data source issues.',
    ],
  },
  {
    workflow: 'User action → createActionRequest → approval → execution',
    recommendedComponents: ['StudioActionButton', 'PendingApprovalPanel', 'ApprovalWorkflow'],
    rules: [
      'Every destructive or irreversible action must go through the approval workflow.',
      'Use createActionRequest for all user-initiated mutations.',
      'Show pending approvals in the PendingApprovalPanel.',
      'Do not auto-approve — always require explicit user confirmation.',
    ],
  },
  {
    workflow: 'Page load → useOs() → memoized model build → render',
    recommendedComponents: ['buildJarvisBModel', 'buildAequitasCapitalModel', 'buildStudioModel', 'buildLifeModel'],
    rules: [
      'Models are pure functions — no side effects, no API calls.',
      'Wrap model builders in useMemo to prevent unnecessary recomputation.',
      'Models should handle empty input gracefully with emptyState strings.',
      'Confidence and freshness should be derived from source statuses, not hardcoded.',
    ],
  },
  {
    workflow: 'Navigation → route guard → layout → tab/content',
    recommendedComponents: ['ProtectedRoute', 'OSLayout', 'WorkspaceDrawer'],
    rules: [
      'All OS routes are protected by ProtectedRoute.',
      'Use WorkspaceDrawer for secondary content — avoid deep route nesting.',
      'Tab navigation within a page uses activeTab state, not routes.',
      'Page headers should include breadcrumb navigation back to parent.',
    ],
  },
]
