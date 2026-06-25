import type { TemplateDef } from '../types'

export const templates: TemplateDef[] = [
  {
    title: 'Command Center',
    description: 'Top-level system operations board. Status strip, division matrix, agent queue, activity feed.',
    layout: 'Single column with up to 6 status cards, 2-column division grid, 3-column agent queue, 3-column activity feed.',
    components: ['StatusRail', 'DivisionTile', 'AgentQueueBoard', 'ActivityFeed', 'CommandHeader'],
    futurePages: ['CommandCenterSettingsPage', 'AgentDetailPage', 'SystemLogPage'],
  },
  {
    title: 'Investments OS',
    description: 'Portfolio overview with hero metrics, bucket view, dividend dashboard, and allocation tools.',
    layout: 'Hero strip, tabbed content (overview / portfolio / thai-funds / allocation / dca / dividends), sidebar drawers.',
    components: ['OsHeroMetric', 'PortfolioBucketView', 'AllocationDonut', 'AllocationComparison', 'RebalancePreview', 'PortfolioDecisionStrip', 'DividendDashboard', 'FxRateControl', 'TransactionForm'],
    futurePages: ['DividendHistoryPage', 'PortfolioAnalyticsPage', 'TaxOptimizationPage'],
  },
  {
    title: 'Studio OS',
    description: 'Project workspace with section navigation, timeline, site watch, document control, and reviews.',
    layout: 'Project list (cards) → Project detail (sticky section nav, tabbed content). Max width 5xl.',
    components: ['StudioWorkspacePage', 'StudioProjectDetailPage', 'StudioTimelineBoard', 'ExecutiveDashboard', 'OperatingRhythm'],
    futurePages: ['StudioMobilePage', 'ProjectMediaPage', 'BillingGatesPage', 'DecisionLogPage'],
  },
  {
    title: 'Bridge Settings',
    description: 'Google Sheet bridge configuration, resource management, and write-back workflow.',
    layout: 'Section panels: connection config, sheet resources, import preview, write-back queue, backups, source health, diagnostics.',
    components: ['BridgeDiagnostics', 'SourceHealthMonitorFull', 'ImportPreviewPanel', 'ExportPreviewPanel'],
    futurePages: ['MultiSheetConfigPage', 'AutomationRulesPage'],
  },
]
