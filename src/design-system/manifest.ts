export interface PageManifest {
  id: string
  name: string
  owner: string
  status: 'production' | 'beta' | 'planned'
  layout: string
  components: string[]
  patterns: string[]
  migrationPriority: 'high' | 'medium' | 'low'
  migrationNotes: string
}

export const pageManifests: PageManifest[] = [
  {
    id: 'studio',
    name: 'Studio OS',
    owner: 'studio',
    status: 'production',
    layout: 'Project list → Project detail with section nav. Max width 5xl. Sticky section tabs.',
    components: ['StudioWorkspacePage', 'StudioProjectDetailPage', 'StudioTimelineBoard', 'ExecutiveDashboard', 'OperatingRhythm', 'EmptyState', 'panel', 'pill', 'os-list-row'],
    patterns: ['data-fetch', 'approval', 'model-build'],
    migrationPriority: 'low',
    migrationNotes: 'Already migrated to project-first UI. Legacy workspace preserved at /os/studio/legacy.',
  },
  {
    id: 'ai-workspace',
    name: 'AI Workspace',
    owner: 'studio',
    status: 'production',
    layout: 'Tabbed page with AI context, suggestions, reviews, memory, exports, imports. Sidebar drawers.',
    components: ['AIContextExportPanel', 'AISuggestionImportPanel', 'ModuleAISummaryPanel', 'WorkspaceDrawer', 'panel', 'pill'],
    patterns: ['model-build'],
    migrationPriority: 'medium',
    migrationNotes: 'Currently uses legacy panel layout. Could benefit from workspace drawer standardization.',
  },
  {
    id: 'bridge',
    name: 'Bridge Settings',
    owner: 'ds-team',
    status: 'production',
    layout: 'Section panels: connection config, sheet resources, import preview, write-back, backups, source health, diagnostics.',
    components: ['BridgeDiagnostics', 'SourceHealthMonitorFull', 'ImportPreviewPanel', 'ExportPreviewPanel', 'panel', 'pill', 'os-list-row'],
    patterns: ['data-fetch'],
    migrationPriority: 'low',
    migrationNotes: 'Already uses design system components. No major migration needed.',
  },
  {
    id: 'capital',
    name: 'Capital OS',
    owner: 'finance',
    status: 'production',
    layout: 'Tabbed page with capital overview, studio office, family office. Ledger tables and rhythm panels.',
    components: ['CapitalRhythm', 'CapitalCriticalPath', 'CapitalAnalyticsCards', 'LedgerTable', 'panel', 'pill'],
    patterns: ['data-fetch', 'approval'],
    migrationPriority: 'low',
    migrationNotes: 'Stable page. Minimal design system touch points currently.',
  },
  {
    id: 'investments',
    name: 'Investments OS',
    owner: 'finance',
    status: 'production',
    layout: 'Hero strip + tabbed content (overview, portfolio, thai-funds, allocation, dca, dividends). Sidebar drawers.',
    components: ['OsHeroMetric', 'PortfolioBucketView', 'AllocationDonut', 'AllocationComparison', 'RebalancePreview', 'PortfolioDecisionStrip', 'DividendDashboard', 'FxRateControl', 'TransactionForm', 'EmptyState', 'panel', 'pill', 'os-progress', 'mini'],
    patterns: ['data-fetch', 'approval', 'model-build'],
    migrationPriority: 'low',
    migrationNotes: 'Heavily uses design system primitives. Migration is mostly about consolidating duplicate styles.',
  },
  {
    id: 'command-center',
    name: 'Command Center',
    owner: 'command-center',
    status: 'production',
    layout: 'Status strip + division matrix (2-col) + agent queue (3-col) + activity feed (3-col). Header with executive brief.',
    components: ['DivisionTile', 'AgentQueueBoard', 'ActivityFeed', 'StatusRail', 'CommandHeader', 'os-hero-metric', 'os-progress', 'panel', 'pill', 'mini'],
    patterns: ['model-build', 'navigation'],
    migrationPriority: 'low',
    migrationNotes: 'Already aligned with design system visual identity. DivisionTile and queue components use registry patterns.',
  },
]

export function getManifest(id: string): PageManifest | undefined {
  return pageManifests.find((m) => m.id === id)
}

export function getManifestsByPriority(priority: 'high' | 'medium' | 'low'): PageManifest[] {
  return pageManifests.filter((m) => m.migrationPriority === priority)
}
