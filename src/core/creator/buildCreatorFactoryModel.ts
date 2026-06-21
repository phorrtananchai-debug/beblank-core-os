type AgentState = 'running' | 'waiting-review' | 'completed'
type DivisionMood = 'calm' | 'busy' | 'review-needed' | 'offline'
type DataConfidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock'
type FreshnessState = 'Fresh' | 'Stale' | 'Unknown'
type CreatorSnapshotStatus = 'Real' | 'Stale' | 'Fallback'

type CreatorEpisodeStatus =
  | 'idea'
  | 'outline'
  | 'script'
  | 'scenes'
  | 'images'
  | 'voice'
  | 'capcut'
  | 'ready'
  | 'published'
  | 'archived'

type CreatorEpisodeRecord = {
  id: string
  title?: string
  status?: string
  updatedAt?: string
}

type CreatorImportHistoryEntry = {
  id: string
  timestamp?: string
  type?: string
  itemCount?: number
  status?: 'success' | 'fail'
}

export type CreatorFactorySnapshot = {
  episodes: CreatorEpisodeRecord[]
  ideasCount: number
  importHistory: CreatorImportHistoryEntry[]
  updatedAt?: string
  sourceLabel: string
  source: 'window' | 'localStorage' | 'indexedDB' | 'unavailable'
  confidence: DataConfidence
}

export type CreatorFactorySnapshotMeta = {
  status: CreatorSnapshotStatus
  sourceLabel: string
  source: CreatorFactorySnapshot['source']
  lastImported: string
  ageLabel: string
  ageMs: number | null
  updatedAt?: string
}

export type CreatorFactoryAgentModel = {
  id: string
  name: string
  role: string
  state: AgentState
  currentTask: string
  progress: number
  updatedAt: string
}

export type CreatorFactoryModel = {
  integrationMode: 'read-only'
  division: {
    mood: DivisionMood
    activeAgents: number
    runningTasks: number
    waitingReviews: number
    completedToday: number
    summary: string
  }
  pipeline: {
    totalEpisodes: number
    needsStory: number
    needsScript: number
    needsScenes: number
    needsImages: number
    needsVoice: number
    needsCapCut: number
    ready: number
    published: number
    archived: number
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  readiness: {
    readyToProduce: number
    readyForCapCut: number
    readyToPublish: number
    confidence: DataConfidence
    freshness: FreshnessState
    emptyState?: string
  }
  operations: {
    importHistoryCount: number
    lastUpdated: string
    freshness: FreshnessState
    confidence: DataConfidence
    sourceLabel: string
    emptyState?: string
  }
  snapshotMeta: CreatorFactorySnapshotMeta
  agents: {
    items: CreatorFactoryAgentModel[]
    confidence: 'Inferred'
    freshness: FreshnessState
    emptyState?: string
  }
  snapshot: CreatorFactorySnapshot
  lastUpdated: string
  overallFreshness: FreshnessState
}

const CREATOR_DB_NAME = 'creator-os'
const CREATOR_DB_STORES = ['episodes', 'ideas', 'importHistory'] as const
const CREATOR_LOCAL_STORAGE_KEYS = [
  'beblank_creator_os_snapshot_v1',
  'beblank_creator_factory_snapshot_v1',
  'creator_os_snapshot_v1',
  'creator-os-snapshot',
] as const

declare global {
  interface Window {
    __BEBLANK_CREATOR_OS__?: unknown
    __BEBLANK_CREATOR_OS_SNAPSHOT__?: unknown
    __CREATOR_OS_SNAPSHOT__?: unknown
  }
}

const statusOrder: CreatorEpisodeStatus[] = [
  'idea',
  'outline',
  'script',
  'scenes',
  'images',
  'voice',
  'capcut',
  'ready',
  'published',
  'archived',
]

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

const formatAgeLabel = (timestamp?: string) => {
  if (!timestamp) return 'Unavailable'

  const updatedAt = new Date(timestamp)
  if (Number.isNaN(updatedAt.getTime())) return 'Unavailable'

  const diffMs = Math.max(0, Date.now() - updatedAt.getTime())
  const diffMinutes = Math.floor(diffMs / (60 * 1000))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffHours < 1) return `${diffMinutes}m ago`
  if (diffDays < 1) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const resolveFreshness = (timestamp?: string): FreshnessState => {
  if (!timestamp) return 'Unknown'
  const updatedAt = new Date(timestamp)
  if (Number.isNaN(updatedAt.getTime())) return 'Unknown'
  return Date.now() - updatedAt.getTime() > 36 * 60 * 60 * 1000 ? 'Stale' : 'Fresh'
}

const getLatestTimestamp = (timestamps: Array<string | undefined>) => {
  const valid = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  return valid[0]?.toISOString()
}

const normalizeStatus = (value?: string): CreatorEpisodeStatus => {
  if (!value) return 'idea'
  if ((statusOrder as string[]).includes(value)) return value as CreatorEpisodeStatus

  if (value === 'publish' || value === 'analytics') return 'published'
  if (value === 'image-prompts') return 'images'
  if (value === 'edit') return 'capcut'

  return 'idea'
}

const toEpisodeRecords = (value: unknown): CreatorEpisodeRecord[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id ?? `episode-${index + 1}`),
      title: typeof item.title === 'string' ? item.title : undefined,
      status: typeof item.status === 'string' ? item.status : undefined,
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    }))
}

const toImportHistory = (value: unknown): CreatorImportHistoryEntry[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id ?? `import-${index + 1}`),
      timestamp: typeof item.timestamp === 'string' ? item.timestamp : undefined,
      type: typeof item.type === 'string' ? item.type : undefined,
      itemCount: typeof item.itemCount === 'number' ? item.itemCount : undefined,
      status: item.status === 'success' || item.status === 'fail' ? item.status : undefined,
    }))
}

const getSnapshotTimestamp = (snapshot: CreatorFactorySnapshot | null) => {
  if (!snapshot) return 0
  const sourceTime = snapshot.updatedAt
  const parsed = sourceTime ? Date.parse(sourceTime) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

const chooseNewestSnapshot = (snapshots: Array<CreatorFactorySnapshot | null>) =>
  snapshots
    .filter((snapshot): snapshot is CreatorFactorySnapshot => Boolean(snapshot))
    .sort((a, b) => getSnapshotTimestamp(b) - getSnapshotTimestamp(a))[0] ?? null

const extractSnapshot = (value: unknown, source: CreatorFactorySnapshot['source'], sourceLabel: string): CreatorFactorySnapshot | null => {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const episodes = toEpisodeRecords(record.episodes ?? record.episodeRows ?? record.items)
  const importHistory = toImportHistory(record.importHistory ?? record.history ?? record.imports)
  const ideasCount =
    typeof record.ideasCount === 'number'
      ? record.ideasCount
      : Array.isArray(record.ideas)
        ? record.ideas.length
        : 0
  const updatedAt =
    typeof record.updatedAt === 'string'
      ? record.updatedAt
      : typeof record.exportedAt === 'string'
        ? record.exportedAt
        : undefined

  if (episodes.length === 0 && importHistory.length === 0 && ideasCount === 0) return null

  return {
    episodes,
    ideasCount,
    importHistory,
    updatedAt,
    source,
    sourceLabel,
    confidence: 'Real',
  }
}

const loadFromWindow = (): CreatorFactorySnapshot | null => {
  if (typeof window === 'undefined') return null

  return (
    extractSnapshot(window.__BEBLANK_CREATOR_OS_SNAPSHOT__, 'window', 'Creator OS window snapshot') ??
    extractSnapshot(window.__BEBLANK_CREATOR_OS__, 'window', 'Creator OS window bridge') ??
    extractSnapshot(window.__CREATOR_OS_SNAPSHOT__, 'window', 'Creator OS window snapshot')
  )
}

const loadFromLocalStorage = (): CreatorFactorySnapshot | null => {
  if (typeof window === 'undefined') return null

  for (const key of CREATOR_LOCAL_STORAGE_KEYS) {
    try {
      const stored = window.localStorage.getItem(key)
      if (!stored) continue

      const parsed = JSON.parse(stored) as unknown
      const snapshot = extractSnapshot(parsed, 'localStorage', `Creator OS local snapshot (${key})`)
      if (snapshot) return snapshot
    } catch {
      // Ignore malformed or unavailable snapshots and continue probing.
    }
  }

  return null
}

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const loadFromIndexedDb = async (): Promise<CreatorFactorySnapshot | null> => {
  if (typeof window === 'undefined' || !window.indexedDB) return null

  try {
    const openRequest = window.indexedDB.open(CREATOR_DB_NAME)
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = () => resolve(openRequest.result)
      openRequest.onerror = () => reject(openRequest.error)
      openRequest.onblocked = () => reject(new Error('Creator OS IndexedDB is blocked'))
      openRequest.onupgradeneeded = () => {
        openRequest.transaction?.abort()
        reject(new Error('Creator OS IndexedDB is not initialized on this origin'))
      }
    })

    const availableStores = CREATOR_DB_STORES.filter((store) => db.objectStoreNames.contains(store))
    if (availableStores.length === 0) {
      db.close()
      return null
    }

    const tx = db.transaction(availableStores, 'readonly')
    const episodes = availableStores.includes('episodes')
      ? toEpisodeRecords(await requestToPromise(tx.objectStore('episodes').getAll()))
      : []
    const ideasCount = availableStores.includes('ideas')
      ? await requestToPromise(tx.objectStore('ideas').count())
      : 0
    const importHistory = availableStores.includes('importHistory')
      ? toImportHistory(await requestToPromise(tx.objectStore('importHistory').getAll()))
      : []

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })

    db.close()

    if (episodes.length === 0 && importHistory.length === 0 && ideasCount === 0) {
      return {
        episodes,
        ideasCount,
        importHistory,
        source: 'indexedDB',
        sourceLabel: 'Creator OS IndexedDB',
        confidence: 'Real',
      }
    }

    return {
      episodes,
      ideasCount,
      importHistory,
      updatedAt: getLatestTimestamp([
        ...episodes.map((episode) => episode.updatedAt),
        ...importHistory.map((entry) => entry.timestamp),
      ]),
      source: 'indexedDB',
      sourceLabel: 'Creator OS IndexedDB',
      confidence: 'Real',
    }
  } catch {
    return null
  }
}

export const loadCreatorFactorySnapshot = async (): Promise<CreatorFactorySnapshot> => {
  const [windowSnapshot, localSnapshot, indexedDbSnapshot] = await Promise.all([
    Promise.resolve(loadFromWindow()),
    Promise.resolve(loadFromLocalStorage()),
    loadFromIndexedDb(),
  ])

  const newestSnapshot = chooseNewestSnapshot([windowSnapshot, localSnapshot, indexedDbSnapshot])
  if (newestSnapshot) return newestSnapshot

  return {
    episodes: [],
    ideasCount: 0,
    importHistory: [],
    source: 'unavailable',
    sourceLabel: 'Creator OS adapter fallback',
    confidence: 'Fallback',
  }
}

const buildAgent = (
  id: string,
  name: string,
  role: string,
  workload: number,
  totalEpisodes: number,
  updatedAt: string,
  detail: string,
): CreatorFactoryAgentModel => {
  const state: AgentState =
    workload > 0
      ? 'running'
      : totalEpisodes > 0
        ? 'completed'
        : 'waiting-review'

  const baseline = totalEpisodes > 0 ? Math.max(totalEpisodes, workload, 1) : Math.max(workload, 1)
  const progress = state === 'completed' ? 100 : Math.max(18, Math.min(92, Math.round((workload / baseline) * 100)))

  return {
    id,
    name,
    role,
    state,
    currentTask: detail,
    progress,
    updatedAt,
  }
}

export const buildCreatorFactoryModel = (snapshot: CreatorFactorySnapshot): CreatorFactoryModel => {
  // Manual verification guide for this pure adapter:
  // 1. A same-origin Creator OS IndexedDB should surface Real confidence even when episode count is zero.
  // 2. Missing snapshots should fall back cleanly without introducing mocked episode rows.
  // 3. Derived agent states should track pipeline counts instead of inventing automation.
  const episodes = snapshot.episodes.map((episode) => ({
    ...episode,
    status: normalizeStatus(episode.status),
  }))

  const counts = {
    idea: episodes.filter((episode) => episode.status === 'idea').length,
    outline: episodes.filter((episode) => episode.status === 'outline').length,
    script: episodes.filter((episode) => episode.status === 'script').length,
    scenes: episodes.filter((episode) => episode.status === 'scenes').length,
    images: episodes.filter((episode) => episode.status === 'images').length,
    voice: episodes.filter((episode) => episode.status === 'voice').length,
    capcut: episodes.filter((episode) => episode.status === 'capcut').length,
    ready: episodes.filter((episode) => episode.status === 'ready').length,
    published: episodes.filter((episode) => episode.status === 'published').length,
    archived: episodes.filter((episode) => episode.status === 'archived').length,
  }

  const totalEpisodes = episodes.length
  const lastUpdatedRaw = getLatestTimestamp([
    ...episodes.map((episode) => episode.updatedAt),
    ...snapshot.importHistory.map((entry) => entry.timestamp),
  ])
  const freshness = resolveFreshness(lastUpdatedRaw)
  const waitingReviews = freshness === 'Stale' ? 1 : snapshot.source === 'unavailable' ? 1 : 0
  const completedToday = snapshot.importHistory.filter((entry) => entry.status === 'success').length
  const sourceUpdatedAt = snapshot.updatedAt ?? lastUpdatedRaw
  const snapshotAgeMs = sourceUpdatedAt ? Math.max(0, Date.now() - new Date(sourceUpdatedAt).getTime()) : null
  const snapshotMeta: CreatorFactorySnapshotMeta = {
    status:
      snapshot.source === 'unavailable'
        ? 'Fallback'
        : freshness === 'Stale'
          ? 'Stale'
          : 'Real',
    sourceLabel: snapshot.sourceLabel,
    source: snapshot.source,
    lastImported: formatBangkokTime(sourceUpdatedAt),
    ageLabel: formatAgeLabel(sourceUpdatedAt),
    ageMs: snapshotAgeMs !== null && Number.isFinite(snapshotAgeMs) ? snapshotAgeMs : null,
    updatedAt: sourceUpdatedAt,
  }

  const readiness = {
    readyToProduce: totalEpisodes - counts.idea - counts.outline,
    readyForCapCut: counts.capcut + counts.ready + counts.published + counts.archived,
    readyToPublish: counts.ready + counts.published + counts.archived,
  }

  const updatedAtLabel = formatBangkokTime(lastUpdatedRaw)
  const confidence = snapshot.confidence

  const agents: CreatorFactoryAgentModel[] = [
    buildAgent(
      'topic-hunter',
      'Topic Hunter',
      'Idea intake',
      counts.idea + snapshot.ideasCount,
      Math.max(totalEpisodes, snapshot.ideasCount),
      updatedAtLabel,
      snapshot.ideasCount > 0
        ? `Reviewing ${snapshot.ideasCount} ideas and ${counts.idea} episodes that still need story direction`
        : counts.idea > 0
          ? `Resolving story direction for ${counts.idea} episodes still at the idea stage`
          : 'Idea intake is clear from the current Creator OS feed',
    ),
    buildAgent(
      'script-writer',
      'Script Writer',
      'Narrative drafting',
      counts.outline + counts.script,
      totalEpisodes,
      updatedAtLabel,
      counts.outline + counts.script > 0
        ? `Working through ${counts.outline + counts.script} episodes that still need scripts or structured scene drafts`
        : 'No script backlog is visible in the current Creator OS feed',
    ),
    buildAgent(
      'thumbnail-artist',
      'Thumbnail Artist',
      'Visual packaging',
      counts.scenes + counts.images,
      totalEpisodes,
      updatedAtLabel,
      counts.scenes + counts.images > 0
        ? `Covering ${counts.scenes + counts.images} episodes waiting on image or packaging-ready assets`
        : 'No image or thumbnail backlog is visible in the current Creator OS feed',
    ),
    buildAgent(
      'publishing-agent',
      'Publishing Agent',
      'Production handoff',
      counts.voice + counts.capcut + counts.ready,
      totalEpisodes,
      updatedAtLabel,
      counts.voice + counts.capcut + counts.ready > 0
        ? `Monitoring ${counts.voice + counts.capcut + counts.ready} episodes moving through voice, CapCut, or publish handoff`
        : 'Publish handoff is quiet in the current Creator OS feed',
    ),
    buildAgent(
      'analytics-agent',
      'Analytics Agent',
      'Post-publish tracking',
      counts.published,
      Math.max(totalEpisodes, 1),
      updatedAtLabel,
      counts.published > 0
        ? `Watching ${counts.published} published episodes for post-release performance feedback`
        : 'No published Creator OS episodes are available for analytics yet',
    ),
  ]

  const mood: DivisionMood =
    snapshot.source === 'unavailable'
      ? 'offline'
      : waitingReviews > 0
        ? 'review-needed'
        : counts.idea + counts.outline + counts.script + counts.scenes + counts.images + counts.voice > 0
          ? 'busy'
          : totalEpisodes > 0
            ? 'calm'
            : 'offline'

  return {
    integrationMode: 'read-only',
    division: {
      mood,
      activeAgents: agents.filter((agent) => agent.state !== 'completed').length,
      runningTasks: counts.idea + counts.outline + counts.script + counts.scenes + counts.images + counts.voice + counts.capcut,
      waitingReviews,
      completedToday,
      summary:
        snapshot.source === 'unavailable'
          ? 'Creator Factory is wired as a read-only adapter, but no Creator OS snapshot is exposed to Core OS on this origin yet.'
          : `Read-only Creator Factory view over ${snapshot.sourceLabel.toLowerCase()} with episode pipeline, readiness, and import history summarized for Command Center.`,
    },
    pipeline: {
      totalEpisodes,
      needsStory: counts.idea,
      needsScript: counts.outline,
      needsScenes: counts.script,
      needsImages: counts.scenes,
      needsVoice: counts.images,
      needsCapCut: counts.voice,
      ready: counts.ready,
      published: counts.published,
      archived: counts.archived,
      confidence,
      freshness,
      emptyState:
        snapshot.source === 'unavailable'
          ? 'No Creator OS snapshot is available yet, so pipeline counts are waiting on a read-only source.'
          : totalEpisodes === 0
            ? 'Creator OS is reachable, but there are no episodes in the current read-only feed yet.'
            : undefined,
    },
    readiness: {
      ...readiness,
      confidence: confidence === 'Real' ? 'Inferred' : confidence,
      freshness,
      emptyState:
        snapshot.source === 'unavailable'
          ? 'Readiness cannot be derived until a Creator OS episode feed is exposed.'
          : totalEpisodes === 0
            ? 'No episode rows are available, so readiness remains empty.'
            : undefined,
    },
    operations: {
      importHistoryCount: snapshot.importHistory.length,
      lastUpdated: updatedAtLabel,
      freshness,
      confidence,
      sourceLabel: snapshot.sourceLabel,
      emptyState:
        snapshot.importHistory.length === 0
          ? snapshot.source === 'unavailable'
            ? 'Import history is unavailable because the Creator OS source has not been exposed to Core OS yet.'
            : 'No Creator OS import history entries were found in the current read-only source.'
          : undefined,
    },
    snapshotMeta,
    agents: {
      items: agents,
      confidence: 'Inferred',
      freshness,
      emptyState:
        snapshot.source === 'unavailable'
          ? 'Agent activity is derived from fallback pipeline counts only until Creator OS data is exposed.'
          : undefined,
    },
    snapshot,
    lastUpdated: updatedAtLabel,
    overallFreshness: freshness,
  }
}
