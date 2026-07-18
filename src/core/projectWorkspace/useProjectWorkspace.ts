import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { OsData } from '../../types/models'
import { projectWorkspaceRepository, projectWorkspaceStorageKey, type ProjectWorkspaceRepository } from './repository'
import { resolveCanonicalProjectId } from './migration'

export const useProjectWorkspace = (projectId: string, osData: OsData, repository: ProjectWorkspaceRepository = projectWorkspaceRepository) => {
  const canonicalId = resolveCanonicalProjectId(projectId)
  const subscribe = useCallback((listener: () => void) => repository.subscribe(canonicalId, listener), [canonicalId, repository])
  const getSnapshot = useCallback(() => repository.getSnapshot(canonicalId), [canonicalId, repository])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const retry = useCallback(() => repository.hydrate(canonicalId, osData, true), [canonicalId, osData, repository])

  useEffect(() => {
    if (snapshot.status === 'idle') void repository.hydrate(canonicalId, osData)
  }, [canonicalId, osData, repository, snapshot.status])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === projectWorkspaceStorageKey(canonicalId)) void retry()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [canonicalId, retry])

  return { ...snapshot, retry, repository, projectId: canonicalId }
}
