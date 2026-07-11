export type AIUsageProviderStatus = 'healthy' | 'watch' | 'limited' | 'manual'

export interface AIUsageModelCost {
  model: string
  costUsd: number
  tokens: number
}

export interface AIUsageHistoryPoint {
  date: string
  label: string
  spendUsd: number
  tokens: number
}

export interface AIUsageProvider {
  id: string
  name: string
  planType: string
  usageLabel: string
  usagePercent: number
  remainingLabel: string
  monthlySpendUsd: number
  resetLabel: string
  status: AIUsageProviderStatus
  statusLabel: string
  lastSyncLabel: string
  todayUsage: string
  weekUsage: string
  monthUsage: string
  inputTokens: number
  outputTokens: number
  costByModel: AIUsageModelCost[]
  balanceLabel: string
  sourceDetails: string
  warningState: string
  history: AIUsageHistoryPoint[]
}

export const aiUsageProviders: AIUsageProvider[] = [
  {
    id: 'codex-subscription',
    name: 'Codex Subscription',
    planType: 'Team seat, monthly allowance',
    usageLabel: '68% of monthly work sessions',
    usagePercent: 68,
    remainingLabel: '12 focused sessions remaining',
    monthlySpendUsd: 20,
    resetLabel: 'Renews Aug 1, 2026',
    status: 'healthy',
    statusLabel: 'On track',
    lastSyncLabel: 'Manual snapshot, Jul 11, 2026 09:10',
    todayUsage: '2 sessions',
    weekUsage: '9 sessions',
    monthUsage: '21 sessions',
    inputTokens: 880000,
    outputTokens: 214000,
    costByModel: [
      { model: 'GPT-5 Codex', costUsd: 14.4, tokens: 812000 },
      { model: 'GPT-5 Mini', costUsd: 5.6, tokens: 282000 },
    ],
    balanceLabel: 'Subscription active, no prepaid balance',
    sourceDetails: 'Entered from account usage screen. No API access is configured.',
    warningState: 'Watch long refactor sessions near renewal week.',
    history: [
      { date: '2026-07-05', label: 'Sat', spendUsd: 2.1, tokens: 122000 },
      { date: '2026-07-06', label: 'Sun', spendUsd: 1.8, tokens: 98000 },
      { date: '2026-07-07', label: 'Mon', spendUsd: 3.4, tokens: 186000 },
      { date: '2026-07-08', label: 'Tue', spendUsd: 2.6, tokens: 141000 },
    ],
  },
  {
    id: 'deepseek-api',
    name: 'DeepSeek API',
    planType: 'Prepaid API credit',
    usageLabel: '34% of credit used',
    usagePercent: 34,
    remainingLabel: '$16.48 credit remaining',
    monthlySpendUsd: 8.52,
    resetLabel: 'No reset, prepaid balance',
    status: 'healthy',
    statusLabel: 'Low burn',
    lastSyncLabel: 'Manual snapshot, Jul 10, 2026 22:30',
    todayUsage: '$0.38',
    weekUsage: '$2.15',
    monthUsage: '$8.52',
    inputTokens: 1640000,
    outputTokens: 312000,
    costByModel: [
      { model: 'deepseek-chat', costUsd: 5.21, tokens: 1420000 },
      { model: 'deepseek-reasoner', costUsd: 3.31, tokens: 532000 },
    ],
    balanceLabel: '$16.48 prepaid credit',
    sourceDetails: 'Copied from provider console by hand. No token or billing key is stored.',
    warningState: 'No current warning.',
    history: [
      { date: '2026-07-05', label: 'Sat', spendUsd: 0.44, tokens: 92000 },
      { date: '2026-07-06', label: 'Sun', spendUsd: 0.21, tokens: 54000 },
      { date: '2026-07-07', label: 'Mon', spendUsd: 0.88, tokens: 193000 },
      { date: '2026-07-08', label: 'Tue', spendUsd: 0.62, tokens: 126000 },
    ],
  },
  {
    id: 'openai-api',
    name: 'OpenAI API',
    planType: 'Pay as you go API',
    usageLabel: '76% of monthly budget',
    usagePercent: 76,
    remainingLabel: '$24.00 budget headroom',
    monthlySpendUsd: 76,
    resetLabel: 'Budget window resets Aug 1, 2026',
    status: 'watch',
    statusLabel: 'Budget watch',
    lastSyncLabel: 'Manual snapshot, Jul 11, 2026 08:45',
    todayUsage: '$4.70',
    weekUsage: '$22.35',
    monthUsage: '$76.00',
    inputTokens: 3120000,
    outputTokens: 740000,
    costByModel: [
      { model: 'gpt-4.1', costUsd: 42.2, tokens: 1710000 },
      { model: 'gpt-4.1-mini', costUsd: 18.9, tokens: 1540000 },
      { model: 'embeddings', costUsd: 14.9, tokens: 610000 },
    ],
    balanceLabel: '$100 monthly working budget, $24 remaining',
    sourceDetails: 'Manual budget ledger. No project key, organization ID, or endpoint is stored.',
    warningState: 'Slow nonessential batch jobs until the next reset.',
    history: [
      { date: '2026-07-05', label: 'Sat', spendUsd: 3.2, tokens: 168000 },
      { date: '2026-07-06', label: 'Sun', spendUsd: 2.4, tokens: 112000 },
      { date: '2026-07-07', label: 'Mon', spendUsd: 6.8, tokens: 334000 },
      { date: '2026-07-08', label: 'Tue', spendUsd: 4.9, tokens: 241000 },
    ],
  },
  {
    id: 'claude-api',
    name: 'Claude API',
    planType: 'Console API billing',
    usageLabel: '51% of monthly cap',
    usagePercent: 51,
    remainingLabel: '$49.20 cap remaining',
    monthlySpendUsd: 50.8,
    resetLabel: 'Cap review Jul 31, 2026',
    status: 'healthy',
    statusLabel: 'Normal',
    lastSyncLabel: 'Manual snapshot, Jul 9, 2026 18:15',
    todayUsage: '$0.00',
    weekUsage: '$11.80',
    monthUsage: '$50.80',
    inputTokens: 2280000,
    outputTokens: 518000,
    costByModel: [
      { model: 'Claude Sonnet', costUsd: 39.6, tokens: 2050000 },
      { model: 'Claude Haiku', costUsd: 11.2, tokens: 748000 },
    ],
    balanceLabel: '$49.20 below soft cap',
    sourceDetails: 'Manual monthly cap tracker. No console credential is connected.',
    warningState: 'No current warning.',
    history: [
      { date: '2026-07-05', label: 'Sat', spendUsd: 1.2, tokens: 68000 },
      { date: '2026-07-06', label: 'Sun', spendUsd: 0.9, tokens: 42000 },
      { date: '2026-07-07', label: 'Mon', spendUsd: 5.7, tokens: 268000 },
      { date: '2026-07-08', label: 'Tue', spendUsd: 4, tokens: 196000 },
    ],
  },
  {
    id: 'gemini-api',
    name: 'Gemini API',
    planType: 'Free tier plus API billing',
    usageLabel: '89% of free tier',
    usagePercent: 89,
    remainingLabel: '11% free tier remaining',
    monthlySpendUsd: 3.4,
    resetLabel: 'Free tier resets Aug 1, 2026',
    status: 'limited',
    statusLabel: 'Near limit',
    lastSyncLabel: 'Manual snapshot, Jul 11, 2026 07:20',
    todayUsage: '$0.22',
    weekUsage: '$1.10',
    monthUsage: '$3.40',
    inputTokens: 1940000,
    outputTokens: 366000,
    costByModel: [
      { model: 'Gemini 2.5 Pro', costUsd: 2.35, tokens: 820000 },
      { model: 'Gemini 2.5 Flash', costUsd: 1.05, tokens: 1486000 },
    ],
    balanceLabel: 'Free tier nearly exhausted',
    sourceDetails: 'Manual note from billing console. No Google Cloud project data is stored.',
    warningState: 'Use only for comparison checks until reset.',
    history: [
      { date: '2026-07-05', label: 'Sat', spendUsd: 0.16, tokens: 74000 },
      { date: '2026-07-06', label: 'Sun', spendUsd: 0.08, tokens: 39000 },
      { date: '2026-07-07', label: 'Mon', spendUsd: 0.44, tokens: 188000 },
      { date: '2026-07-08', label: 'Tue', spendUsd: 0.42, tokens: 172000 },
    ],
  },
  {
    id: 'manual-provider',
    name: 'Manual Provider',
    planType: 'Offline ledger estimate',
    usageLabel: '18% of planned allowance',
    usagePercent: 18,
    remainingLabel: '$82.00 unallocated',
    monthlySpendUsd: 18,
    resetLabel: 'Reviewed manually each Friday',
    status: 'manual',
    statusLabel: 'Manual only',
    lastSyncLabel: 'Manual entry, Jul 8, 2026 17:00',
    todayUsage: '$0.00',
    weekUsage: '$4.00',
    monthUsage: '$18.00',
    inputTokens: 520000,
    outputTokens: 94000,
    costByModel: [
      { model: 'Research assistant', costUsd: 12, tokens: 430000 },
      { model: 'Transcription pool', costUsd: 6, tokens: 184000 },
    ],
    balanceLabel: '$82 reserved in planning ledger',
    sourceDetails: 'Owner-entered estimate for tools without exportable usage screens.',
    warningState: 'Reconcile invoices before month close.',
    history: [
      { date: '2026-07-05', label: 'Sat', spendUsd: 0, tokens: 0 },
      { date: '2026-07-06', label: 'Sun', spendUsd: 2, tokens: 68000 },
      { date: '2026-07-07', label: 'Mon', spendUsd: 0, tokens: 0 },
      { date: '2026-07-08', label: 'Tue', spendUsd: 2, tokens: 72000 },
    ],
  },
]
