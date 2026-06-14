import type { OsData, SourceStatus } from '../../types/models'

type AgentState = 'running' | 'waiting-review' | 'completed'
type DivisionMood = 'calm' | 'busy' | 'review-needed' | 'offline'
type DataConfidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock'
type FreshnessState = 'Fresh' | 'Stale' | 'Unknown'

export type LifeAgentModel = {
  id: string
  name: string
  role: string
  state: AgentState
  currentTask: string
  progress: number
  updatedAt: string
}

export type LifeModel = {
  integrationMode: 'read-only'
  division: {
    mood: DivisionMood
    activeAgents: number
    runningTasks: number
    waitingReviews: number
    completedToday: number
    summary: string
  }
  health: {
    runningPlanStatus: string
    weeklySessions: number
    currentPace: string
    goalPace: string
    recoveryStatus: string
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  finance: {
    dcaStatus: string
    passiveIncomeGoal: string
    emergencyFundStatus: string
    personalFinanceHealth: string
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  learning: {
    englishToeic: string
    aiCourses: string
    coding: string
    studyQueue: number
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  mook: {
    trainingStatus: string
    kneeRecoveryStatus: string
    weeklyProgress: string
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  agents: {
    items: LifeAgentModel[]
    confidence: 'Inferred' | 'Fallback'
    freshness: FreshnessState
    emptyState?: string
  }
  statuses: {
    finance: SourceStatus | null
  }
  lastUpdated: string
  overallFreshness: FreshnessState
}

const formatBangkokTime = (value?: string) => {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resolveLatestTimestamp = (timestamps: Array<string | undefined>) => {
  const valid = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  return valid[0]?.toISOString()
}

const getFreshness = (status?: SourceStatus | null): FreshnessState => {
  if (!status?.lastSyncedAt) return 'Unknown'
  return status.isStale ? 'Stale' : 'Fresh'
}

const getConfidenceLabel = (status?: SourceStatus | null, fallback: DataConfidence = 'Fallback'): DataConfidence => {
  if (!status) return 'Fallback'
  if (status.mode === 'live') return 'Real'
  if (status.mode === 'mock') return 'Mock'
  return fallback
}

const buildAgent = (
  id: string,
  name: string,
  role: string,
  workload: number,
  baseline: number,
  updatedAt: string,
  detail: string,
): LifeAgentModel => {
  const state: AgentState =
    workload > 0
      ? 'running'
      : baseline > 0
        ? 'completed'
        : 'waiting-review'

  const divisor = Math.max(workload, baseline, 1)
  const progress = state === 'completed' ? 100 : Math.max(14, Math.min(88, Math.round((workload / divisor) * 100)))

  return { id, name, role, state, currentTask: detail, progress, updatedAt }
}

export const buildLifeModel = (
  data: OsData,
  sourceStatuses: Record<string, SourceStatus>,
): LifeModel => {
  // Manual verification guide for this pure adapter:
  // 1. Missing life trackers should stay in fallback mode without inventing health or training records.
  // 2. Finance-derived summaries should use existing family/DCA/reserve rows only and never mutate them.
  // 3. My House should remain tracking-only language with no medical advice or diagnosis.
  const financeStatus = sourceStatuses.finance ?? null
  const financeFreshness = getFreshness(financeStatus)

  const dcaActive = data.dcaRecords.filter((record) => record.status === 'planned' || record.status === 'approved')
  const dcaReview = data.dcaRecords.filter((record) => record.status === 'review')
  const dcaPaused = data.dcaRecords.filter((record) => record.status === 'paused')
  const reserveWatch = data.reserveRows.filter((row) => row.status === 'watch' || row.status === 'low')
  const familyReview = data.familyFinanceRecords.filter((row) => row.risk === 'high')
  const passiveIncomeRows = data.dividendRecords.length
  const completedToday =
    data.dividendRecords.filter((record) => record.status === 'received').length +
    data.dcaRecords.filter((record) => record.status === 'approved').length

  const lastUpdatedRaw = resolveLatestTimestamp([
    financeStatus?.lastSyncedAt,
    ...data.dcaRecords.map((record) => record.lastUpdated),
    ...data.familyFinanceRecords.map((record) => record.lastUpdated),
    ...data.reserveRows.map((row) => row.lastUpdated),
    ...data.dividendRecords.map((record) => record.lastUpdated),
    ...data.financeLedgerRows.map((row) => row.lastUpdated),
  ]) ?? financeStatus?.lastSyncedAt

  const hasFinanceRows =
    data.dcaRecords.length > 0 ||
    data.familyFinanceRecords.length > 0 ||
    data.reserveRows.length > 0 ||
    data.financeLedgerRows.length > 0 ||
    data.dividendRecords.length > 0

  const healthConfidence: DataConfidence = 'Fallback'
  const learningConfidence: DataConfidence = 'Fallback'
  const mookConfidence: DataConfidence = 'Fallback'
  const financeConfidence: DataConfidence =
    hasFinanceRows
      ? getConfidenceLabel(financeStatus, 'Inferred')
      : financeStatus
        ? 'Fallback'
        : 'Mock'

  const dcaStatus =
    dcaReview.length > 0
      ? `${dcaReview.length} DCA item${dcaReview.length === 1 ? '' : 's'} need review`
      : dcaActive.length > 0
        ? `${dcaActive.length} DCA plan${dcaActive.length === 1 ? '' : 's'} active`
        : dcaPaused.length > 0
          ? `${dcaPaused.length} DCA plan${dcaPaused.length === 1 ? '' : 's'} paused`
          : hasFinanceRows
            ? 'No DCA plan exposed'
            : 'Finance source not exposed'

  const emergencyFundStatus =
    data.reserveRows.length > 0
      ? reserveWatch.length > 0
        ? `${reserveWatch.length} reserve item${reserveWatch.length === 1 ? '' : 's'} below target`
        : 'Reserve status stable'
      : hasFinanceRows
        ? 'No reserve row exposed'
        : 'Reserve source not exposed'

  const passiveIncomeGoal =
    passiveIncomeRows > 0
      ? `Tracking ${passiveIncomeRows} passive income row${passiveIncomeRows === 1 ? '' : 's'}`
      : hasFinanceRows
        ? 'Passive income goal not exposed'
        : 'Passive income source not exposed'

  const personalFinanceHealth =
    !hasFinanceRows
      ? 'Finance source not exposed'
      : dcaReview.length > 0 || reserveWatch.length > 0 || familyReview.length > 0
        ? 'Watch'
        : 'Stable'

  const runningFinanceTasks = dcaActive.length + dcaReview.length + reserveWatch.length + familyReview.length
  const waitingReviews = dcaReview.length + reserveWatch.length + familyReview.length

  const health = {
    runningPlanStatus: 'No health tracker exposed',
    weeklySessions: 0,
    currentPace: 'Unknown',
    goalPace: 'Not exposed',
    recoveryStatus: 'No recovery tracker exposed',
    confidence: healthConfidence,
    freshness: 'Unknown' as FreshnessState,
    emptyState: 'Health tracking is not yet exposed to Core OS. Command Center stays in read-only status mode only.',
  }

  const learning = {
    englishToeic: 'No TOEIC tracker exposed',
    aiCourses: 'No course tracker exposed',
    coding: 'No coding tracker exposed',
    studyQueue: 0,
    confidence: learningConfidence,
    freshness: 'Unknown' as FreshnessState,
    emptyState: 'Learning queues are not yet exposed to Core OS. Command Center only shows fallback tracking state.',
  }

  const mook = {
    trainingStatus: 'No training tracker exposed',
    kneeRecoveryStatus: 'No recovery tracker exposed',
    weeklyProgress: 'Unknown',
    confidence: mookConfidence,
    freshness: 'Unknown' as FreshnessState,
    emptyState: 'Mook support tracking is not yet exposed to Core OS. Command Center does not provide medical advice or diagnosis.',
  }

  const agents: LifeAgentModel[] = [
    buildAgent(
      'life-health-agent',
      'Health Agent',
      'Routine tracking',
      0,
      0,
      formatBangkokTime(lastUpdatedRaw),
      'Waiting for a health tracker to be exposed to Core OS. Tracking-only mode is reserved for future read-only summaries.',
    ),
    buildAgent(
      'life-finance-agent',
      'Finance Agent',
      'Personal finance tracking',
      runningFinanceTasks,
      Math.max(data.dcaRecords.length + data.reserveRows.length + data.familyFinanceRecords.length, 1),
      formatBangkokTime(lastUpdatedRaw),
      hasFinanceRows
        ? `Tracking ${data.dcaRecords.length} DCA rows, ${data.reserveRows.length} reserve rows, and ${data.familyFinanceRecords.length} family finance rows in read-only mode`
        : 'Waiting for personal finance rows to be exposed to Core OS.',
    ),
    buildAgent(
      'life-learning-agent',
      'Learning Agent',
      'Study queue tracking',
      0,
      0,
      formatBangkokTime(lastUpdatedRaw),
      'No learning tracker is exposed yet, so the study queue stays in fallback tracking mode.',
    ),
    buildAgent(
      'life-mook-support-agent',
      'Mook Support Agent',
      'Support tracking',
      0,
      0,
      formatBangkokTime(lastUpdatedRaw),
      'Waiting for support and recovery tracking data to be exposed. No diagnosis or training advice is provided here.',
    ),
  ]

  const mood: DivisionMood =
    !hasFinanceRows && !financeStatus
      ? 'offline'
      : waitingReviews > 0 || financeStatus?.isStale
        ? 'review-needed'
        : runningFinanceTasks > 0
          ? 'busy'
          : hasFinanceRows
            ? 'calm'
            : 'offline'

  return {
    integrationMode: 'read-only',
    division: {
      mood,
      activeAgents: agents.filter((agent) => agent.state !== 'completed').length,
      runningTasks: runningFinanceTasks,
      waitingReviews,
      completedToday,
      summary:
        hasFinanceRows
          ? 'My House is a read-only life adapter. Personal finance signals are partially derived from existing Core OS finance rows while health, learning, and Mook tracking remain fallback-only.'
          : 'My House is wired as a read-only life adapter, but dedicated life tracking sources are not yet exposed to Core OS.',
    },
    health,
    finance: {
      dcaStatus,
      passiveIncomeGoal,
      emergencyFundStatus,
      personalFinanceHealth,
      confidence: financeConfidence,
      freshness: financeFreshness,
      emptyState:
        hasFinanceRows
          ? undefined
          : 'No personal finance rows are exposed yet, so finance health remains in fallback mode.',
    },
    learning,
    mook,
    agents: {
      items: agents,
      confidence: hasFinanceRows ? 'Inferred' : 'Fallback',
      freshness: hasFinanceRows ? financeFreshness : 'Unknown',
      emptyState:
        hasFinanceRows
          ? undefined
          : 'Agent activity is mostly fallback until dedicated life sources are exposed to Core OS.',
    },
    statuses: {
      finance: financeStatus,
    },
    lastUpdated: formatBangkokTime(lastUpdatedRaw),
    overallFreshness: hasFinanceRows ? financeFreshness : 'Unknown',
  }
}
