import type { OsData, SourceStatus } from '../types/models'

export const mockSourceStatuses: Record<string, SourceStatus> = {
  commandCenter: {
    sourceName: 'Core Summary Sheet',
    lastSyncedAt: '2026-06-02T04:55:00.000Z',
    isStale: false,
    mode: 'mock',
  },
  studio: {
    sourceName: 'Studio Ops Sheet',
    lastSyncedAt: '2026-06-02T04:49:00.000Z',
    isStale: false,
    mode: 'mock',
  },
  investments: {
    sourceName: 'Investments Sheet',
    lastSyncedAt: '2026-06-02T04:45:00.000Z',
    isStale: false,
    mode: 'mock',
  },
  familyOffice: {
    sourceName: 'Family Office Sheet',
    lastSyncedAt: '2026-06-02T04:44:00.000Z',
    isStale: false,
    mode: 'mock',
  },
  tradingLab: {
    sourceName: 'Trading Lab Sheet',
    lastSyncedAt: '2026-06-02T04:43:00.000Z',
    isStale: true,
    mode: 'mock',
  },
  aiWorkflow: {
    sourceName: 'AI Workflow Sheet',
    lastSyncedAt: '2026-06-02T04:41:00.000Z',
    isStale: false,
    mode: 'mock',
  },
  settings: {
    sourceName: 'Connector Registry Sheet',
    lastSyncedAt: '2026-06-02T04:38:00.000Z',
    isStale: false,
    mode: 'mock',
  },
}

export const mockOsData: OsData = {
  projects: [
    { id: 'p1', slug: 'serene-residence', name: 'Serene Residence', status: 'active', owner: 'Studio Core' },
    { id: 'p2', slug: 'blank-gallery', name: 'Blank Gallery Pop-up', status: 'planning', owner: 'Creative Team' },
  ],
  tasks: [
    { id: 't0', projectId: 'p1', title: 'Today Focus: approve Studio source review', status: 'doing' },
    { id: 't1', projectId: 'p1', title: 'Finalize WorkScope v1', status: 'doing' },
    { id: 't2', projectId: 'p1', title: 'Site watch checklist', status: 'todo' },
    { id: 't3', projectId: 'p2', title: 'Artwork brief draft', status: 'todo' },
    { id: 't4', projectId: 'p2', title: 'Journal entry outline for public archive', status: 'todo' },
  ],
  timeline: [
    { id: 'tl0', projectId: 'p1', label: 'Morning operating review', dueDate: '2026-06-02', state: 'planned' },
    { id: 'tl1', projectId: 'p1', label: 'Design Freeze', dueDate: '2026-06-20', state: 'planned' },
    { id: 'tl2', projectId: 'p1', label: 'Client Review', dueDate: '2026-06-12', state: 'at-risk' },
  ],
  documents: [
    { id: 'd1', projectId: 'p1', title: 'Contract Addendum', version: 'v1.2', updatedAt: '2026-05-30' },
    { id: 'd2', projectId: 'p1', title: 'Material Schedule', version: 'v0.8', updatedAt: '2026-05-29' },
  ],
  siteIssues: [
    { id: 's0', projectId: 'p1', issue: 'Client review packet needs final QA before sending', severity: 'high' },
    { id: 's1', projectId: 'p1', issue: 'HVAC shaft alignment check', severity: 'medium' },
    { id: 's2', projectId: 'p1', issue: 'Marble lot sample variance', severity: 'low' },
  ],
  financeAssets: [
    { id: 'a1', name: 'PTT', currency: 'THB', category: 'stock' },
    { id: 'a2', name: 'SCB Dividend Fund', currency: 'THB', category: 'fund' },
    { id: 'a3', name: 'Emergency Cash', currency: 'THB', category: 'cash' },
  ],
  holdings: [
    { id: 'h1', assetId: 'a1', quantity: 320, averageCost: 31.2 },
    { id: 'h2', assetId: 'a2', quantity: 180, averageCost: 14.8 },
  ],
  thaiNavAssets: [
    { id: 'n1', symbol: 'B-INNOTECH', nav: 12.2, updatedAt: '2026-06-01' },
    { id: 'n2', symbol: 'K-STAR', nav: 9.7, updatedAt: '2026-06-01' },
    { id: 'n3', symbol: 'SCBLEQ', nav: 15.4, updatedAt: '2026-06-01' },
  ],
  transactions: [
    { id: 'tx1', description: 'DCA PTT', amountTHB: 5000, type: 'buy', occurredAt: '2026-05-31' },
    { id: 'tx2', description: 'Dividend SCB Fund', amountTHB: 850, type: 'income', occurredAt: '2026-05-30' },
  ],
  familyFinanceRecords: [
    { id: 'ff1', bucket: 'cashflow', label: 'Monthly Income', amountTHB: 180000 },
    { id: 'ff2', bucket: 'bill', label: 'Utilities Bundle', amountTHB: 7400, dueDate: '2026-06-10' },
    { id: 'ff3', bucket: 'reserve', label: '6M Reserve', amountTHB: 620000 },
  ],
  tradingSignals: [
    { id: 'sig1', symbol: 'AOT', signal: 'watch', confidence: 63, note: 'Range compression' },
    { id: 'sig2', symbol: 'CPALL', signal: 'enter', confidence: 51, note: 'Paper-only breakout test' },
  ],
  tradingStrategyNotes: [
    { id: 'sn1', title: 'Momentum Thai SET50', note: 'Only paper entries, max 3 open signals.', riskLevel: 'high' },
    { id: 'sn2', title: 'Mean Reversion Basket', note: 'Deploy after 3-signal confirmation.', riskLevel: 'medium' },
  ],
  aiContexts: [
    {
      id: 'ctx1',
      module: 'Command Center',
      title: 'Daily Command Context',
      body: 'Studio deadlines are tightening, client review is at risk, THB reserve is healthy, and trading lab remains paper-only with one stale signal.',
      createdAt: '2026-06-02T03:50:00.000Z',
    },
  ],
  aiSuggestions: [
    {
      id: 'ai0',
      module: 'Command Center',
      title: 'Stabilize Today Focus',
      recommendation: 'Review the client packet first, then approve one Studio source update before touching finance notes.',
      riskNotes: 'Context switching between Studio and Trading Lab could delay the at-risk client review.',
      createdAt: '2026-06-02T04:02:00.000Z',
      status: 'imported',
    },
    {
      id: 'ai1',
      module: 'Finance',
      title: 'Rebalance DCA Weights',
      recommendation: 'Shift 10% from fund to reserve this month to protect liquidity.',
      riskNotes: 'Could reduce upside during short rallies.',
      createdAt: '2026-06-02T03:53:00.000Z',
      status: 'imported',
    },
  ],
}

export const futureConnectors = [
  'Google Sheets',
  'Apps Script',
  'Gmail',
  'LINE OA inbox',
  'Calendar',
  'GitHub',
  'Hermes',
  'OpenClaw',
  'MCP',
]

