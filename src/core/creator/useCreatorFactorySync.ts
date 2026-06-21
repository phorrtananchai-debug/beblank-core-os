import { useCallback, useEffect, useRef, useState } from 'react'
import { buildCreatorFactoryModel, loadCreatorFactorySnapshot, type CreatorFactoryModel } from './buildCreatorFactoryModel'

const creatorFallbackModel: CreatorFactoryModel = buildCreatorFactoryModel({
  episodes: [],
  ideasCount: 0,
  importHistory: [],
  source: 'unavailable',
  sourceLabel: 'Creator OS adapter fallback',
  confidence: 'Fallback',
})

const SNAPSHOT_REFRESH_KEYS = new Set([
  'beblank_creator_os_snapshot_v1',
  'beblank_creator_factory_snapshot_v1',
])

const getSnapshotStamp = (model: CreatorFactoryModel) => {
  const sourceTime = model.snapshotMeta.updatedAt ?? model.snapshot.updatedAt ?? model.lastUpdated
  const parsed = sourceTime ? Date.parse(sourceTime) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

export const useCreatorFactorySync = () => {
  const [creator, setCreator] = useState<CreatorFactoryModel>(creatorFallbackModel)
  const creatorRef = useRef(creatorFallbackModel)
  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  const applySnapshot = useCallback((next: CreatorFactoryModel) => {
    const current = creatorRef.current
    const currentStamp = getSnapshotStamp(current)
    const nextStamp = getSnapshotStamp(next)

    if (next.snapshotMeta.status === 'Fallback' && current.snapshotMeta.status !== 'Fallback' && nextStamp <= currentStamp) {
      return false
    }

    if (nextStamp < currentStamp) {
      return false
    }

    creatorRef.current = next
    setCreator(next)
    return true
  }, [])

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current

    refreshInFlightRef.current = (async () => {
      const snapshot = await loadCreatorFactorySnapshot()
      const nextModel = buildCreatorFactoryModel(snapshot)
      applySnapshot(nextModel)
    })().finally(() => {
      refreshInFlightRef.current = null
    })

    return refreshInFlightRef.current
  }, [applySnapshot])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || !SNAPSHOT_REFRESH_KEYS.has(event.key)) return
      void refresh()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    const handleFocus = () => {
      void refresh()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = window.setInterval(() => {
      void refresh()
    }, 5000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(interval)
    }
  }, [refresh])

  return {
    creator,
    refreshCreatorFactory: refresh,
  }
}
