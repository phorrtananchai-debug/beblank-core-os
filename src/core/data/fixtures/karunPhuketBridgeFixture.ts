export const karunPhuketBridgeFixture = {
  metadata: {
    sourceName: 'Karun Phuket Apps Script Fixture',
    syncedAt: '2026-06-02T09:30:00.000Z',
    sheetId: 'fixture-karun-phuket',
    mode: 'fixture',
  },
  project: {
    id: 'p1',
    slug: 'karun-phuket',
    name: 'Karun Phuket',
    status: 'active',
    owner: 'Studio Core',
    client: 'Karun Hospitality',
    location: 'Phuket',
    phase: 'DD to site handoff',
    timelineStatus: 'watch',
    operationalNotes: 'Fixture payload for read bridge normalization testing only.',
  },
  timelinePhases: [
    { id: 'stp-live-001', projectId: 'p1', phase: 'design', startDate: '2026-06-01', endDate: '2026-06-20', status: 'active', risk: 'medium', blockerIds: ['rv-001'], notes: 'Fixture design phase row.' },
    { id: 'stp-live-002', projectId: 'p1', phase: 'construction', startDate: '2026-06-24', endDate: '2026-08-07', status: 'blocked', risk: 'high', blockerIds: ['sw-001'], notes: 'Fixture construction phase row.' },
  ],
  workScopeRows: [
    { id: 'ws-live-001', projectId: 'p1', code: 'WS-LIVE-001', group: 'Architecture', title: 'Fixture front-of-house scope', phase: 'DD', operationalStatus: 'active', reviewStatus: 'needs-review', linkedApprovalIds: ['rv-001'] },
  ],
  siteWatchRows: [
    { id: 'sw-live-001', projectId: 'p1', title: 'Fixture ceiling service line review', observedAt: '2026-06-02T09:00:00.000Z', severity: 'medium', status: 'open', note: 'Fixture row, not live production data.', imagePlaceholder: 'fixture / site watch' },
  ],
  documentRows: [
    { id: 'd-live-001', projectId: 'p1', title: 'Fixture IFC Package', version: 'FIX-01', updatedAt: '2026-06-02', packageType: 'drawing package', approvalState: 'review', issueDate: '2026-06-05', linkedScopeIds: ['ws-live-001'] },
  ],
  reviewRows: [
    { id: 'rv-live-001', projectId: 'p1', type: 'approval', title: 'Fixture WorkScope approval', linkedRecordId: 'ws-live-001', status: 'pending', dueAt: '2026-06-06' },
  ],
}
