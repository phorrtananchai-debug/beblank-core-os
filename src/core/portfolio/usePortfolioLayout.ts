import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Project } from '../../types/models'
import { createBlankHomepageItem, getPortfolioStorageAdapter } from './portfolioStorageAdapter'
import { buildSeedPortfolioLayout, type HomepagePortfolioItem, type PortfolioLayoutSnapshot } from './types'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export const usePortfolioLayout = (projects: Project[]) => {
  const seed = useMemo(() => buildSeedPortfolioLayout(projects), [projects])
  const adapter = useMemo(() => getPortfolioStorageAdapter(), [])
  const [snapshot, setSnapshot] = useState<PortfolioLayoutSnapshot>(seed)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    let mounted = true
    adapter.load().then((stored) => {
      if (!mounted) return
      if (stored) {
        const nextProjects = stored.projects.length > 0 ? stored.projects : seed.projects
        const projectIds = new Set(nextProjects.map((project) => project.id))
        setSnapshot({
          ...stored,
          projects: nextProjects,
          homepageItems: stored.homepageItems.filter((item) => projectIds.has(item.projectId)),
        })
      } else {
        setSnapshot(seed)
      }
    })
    return () => {
      mounted = false
    }
  }, [adapter, seed])

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
      const saved = await adapter.save(snapshot)
      setSnapshot(saved)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }, [adapter, snapshot])

  const reset = useCallback(async () => {
    await adapter.reset()
    setSnapshot(seed)
    setSaveState('idle')
  }, [adapter, seed])

  const uploadImage = useCallback(async (itemId: string, file: File) => {
    try {
      const upload = await adapter.uploadImage(file)
      updateItem(itemId, upload)
    } catch {
      setSaveState('error')
    }
  }, [adapter, updateItem])

  return {
    adapterMode: adapter.mode,
    adapterWarning: adapter.warning,
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
