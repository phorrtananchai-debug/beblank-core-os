import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Project } from '../../types/models'
import { createBlankHomepageItem, localPortfolioStorageAdapter } from './portfolioStorageAdapter'
import { buildSeedPortfolioLayout, type HomepagePortfolioItem, type PortfolioLayoutSnapshot } from './types'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export const usePortfolioLayout = (projects: Project[]) => {
  const seed = useMemo(() => buildSeedPortfolioLayout(projects), [projects])
  const [snapshot, setSnapshot] = useState<PortfolioLayoutSnapshot>(seed)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    let mounted = true
    localPortfolioStorageAdapter.load().then((stored) => {
      if (!mounted) return
      if (stored) {
        const projectIds = new Set(seed.projects.map((project) => project.id))
        setSnapshot({
          ...stored,
          projects: seed.projects,
          homepageItems: stored.homepageItems.filter((item) => projectIds.has(item.projectId)),
        })
      } else {
        setSnapshot(seed)
      }
    })
    return () => {
      mounted = false
    }
  }, [seed])

  const updateItem = useCallback((itemId: string, patch: Partial<HomepagePortfolioItem>) => {
    setSnapshot((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      homepageItems: current.homepageItems.map((item) =>
        item.id === itemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ),
    }))
    setSaveState('idle')
  }, [])

  const addItem = useCallback((projectId?: string) => {
    const targetProjectId = projectId ?? snapshot.projects[0]?.id ?? ''
    const item = createBlankHomepageItem(targetProjectId)
    setSnapshot((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      homepageItems: [...current.homepageItems, item],
    }))
    setSaveState('idle')
    return item.id
  }, [snapshot.projects])

  const deleteItem = useCallback((itemId: string) => {
    setSnapshot((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      homepageItems: current.homepageItems.filter((item) => item.id !== itemId),
    }))
    setSaveState('idle')
  }, [])

  const save = useCallback(async () => {
    setSaveState('saving')
    try {
      const saved = await localPortfolioStorageAdapter.save(snapshot)
      setSnapshot(saved)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }, [snapshot])

  const reset = useCallback(async () => {
    await localPortfolioStorageAdapter.reset()
    setSnapshot(seed)
    setSaveState('idle')
  }, [seed])

  const uploadImage = useCallback(async (itemId: string, file: File) => {
    const upload = await localPortfolioStorageAdapter.uploadImage(file)
    updateItem(itemId, upload)
  }, [updateItem])

  return {
    adapterMode: 'local/mock' as const,
    addItem,
    deleteItem,
    reset,
    save,
    saveState,
    snapshot,
    updateItem,
    uploadImage,
  }
}
