import type { HomepagePortfolioItem, PortfolioLayoutSnapshot } from './types'

export interface PortfolioStorageAdapter {
  load: () => Promise<PortfolioLayoutSnapshot | null>
  save: (snapshot: PortfolioLayoutSnapshot) => Promise<PortfolioLayoutSnapshot>
  reset: () => Promise<void>
  uploadImage: (file: File) => Promise<{ imageUrl: string; imageStoragePath: string }>
}

const STORAGE_KEY = 'beblank.portfolio.layout.v1'

const canUseLocalStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const sanitizeSnapshotForLocalStorage = (snapshot: PortfolioLayoutSnapshot): PortfolioLayoutSnapshot => ({
  ...snapshot,
  source: 'local',
  updatedAt: new Date().toISOString(),
  homepageItems: snapshot.homepageItems.map((item) => ({
    ...item,
    imageUrl: item.imageUrl.startsWith('blob:') ? '' : item.imageUrl,
    imageStoragePath: item.imageUrl.startsWith('blob:') ? 'local-session-only' : item.imageStoragePath,
  })),
})

export const localPortfolioStorageAdapter: PortfolioStorageAdapter = {
  async load() {
    if (!canUseLocalStorage()) return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as PortfolioLayoutSnapshot
    } catch {
      return null
    }
  },

  async save(snapshot) {
    const next = sanitizeSnapshotForLocalStorage(snapshot)
    if (canUseLocalStorage()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    return next
  },

  async reset() {
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  },

  async uploadImage(file) {
    return {
      imageUrl: URL.createObjectURL(file),
      imageStoragePath: `local-session/${file.name}`,
    }
  },
}

export const firebasePortfolioStorageAdapter: PortfolioStorageAdapter = {
  async load() {
    throw new Error('Firebase portfolio adapter is not configured yet.')
  },
  async save() {
    throw new Error('Firebase portfolio adapter is not configured yet.')
  },
  async reset() {
    throw new Error('Firebase portfolio adapter is not configured yet.')
  },
  async uploadImage() {
    throw new Error('Firebase portfolio adapter is not configured yet.')
  },
}

export const createBlankHomepageItem = (projectId: string): HomepagePortfolioItem => {
  const now = new Date().toISOString()
  return {
    id: `home-custom-${Date.now()}`,
    projectId,
    title: 'New portfolio image',
    imageUrl: '',
    imageStoragePath: '',
    caption: 'draft / homepage',
    x: 16,
    y: 24,
    width: 24,
    height: 28,
    zIndex: 10,
    rotation: 0,
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  }
}
