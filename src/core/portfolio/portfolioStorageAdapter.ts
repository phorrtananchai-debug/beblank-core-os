import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { firebaseMissingEnv, getFirebaseRuntime, isFirebaseConfigured } from '../firebase/firebaseClient'
import type { HomepagePortfolioItem, PortfolioLayoutSnapshot } from './types'

export interface PortfolioStorageAdapter {
  mode: 'firebase' | 'local/mock'
  warning?: string
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
  mode: 'local/mock',
  warning: 'Firebase env is missing. Portfolio layout is saved only in this browser.',

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
  mode: 'firebase',

  async load() {
    const firebase = getFirebaseRuntime()
    if (!firebase) return null

    const [projectDocs, itemDocs] = await Promise.all([
      getDocs(query(collection(firebase.db, 'portfolioProjects'), orderBy('title'))),
      getDocs(query(collection(firebase.db, 'homepagePortfolioItems'), orderBy('zIndex'))),
    ])

    if (projectDocs.empty && itemDocs.empty) return null

    return {
      projects: projectDocs.docs.map((entry) => entry.data() as PortfolioLayoutSnapshot['projects'][number]),
      homepageItems: itemDocs.docs.map((entry) => entry.data() as HomepagePortfolioItem),
      source: 'firebase',
      updatedAt: new Date().toISOString(),
    }
  },

  async save(snapshot) {
    const firebase = getFirebaseRuntime()
    if (!firebase) throw new Error('Firebase portfolio adapter is not configured.')

    const batch = writeBatch(firebase.db)
    snapshot.projects.forEach((project) => {
      batch.set(doc(firebase.db, 'portfolioProjects', project.id), {
        ...project,
        updatedAt: serverTimestamp(),
      })
    })
    snapshot.homepageItems.forEach((item) => {
      batch.set(doc(firebase.db, 'homepagePortfolioItems', item.id), {
        ...item,
        updatedAt: item.updatedAt,
        serverUpdatedAt: serverTimestamp(),
      })
    })
    await batch.commit()

    return {
      ...snapshot,
      source: 'firebase',
      updatedAt: new Date().toISOString(),
    }
  },

  async reset() {
    const firebase = getFirebaseRuntime()
    if (!firebase) return

    const itemDocs = await getDocs(collection(firebase.db, 'homepagePortfolioItems'))
    await Promise.all(itemDocs.docs.map((entry) => deleteDoc(doc(firebase.db, 'homepagePortfolioItems', entry.id))))
  },

  async uploadImage(file) {
    const firebase = getFirebaseRuntime()
    if (!firebase) throw new Error('Firebase portfolio adapter is not configured.')

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const imageStoragePath = `portfolio/homepage/${Date.now()}-${safeName}`
    const imageRef = ref(firebase.storage, imageStoragePath)
    await uploadBytes(imageRef, file, { contentType: file.type })
    const imageUrl = await getDownloadURL(imageRef)
    return { imageUrl, imageStoragePath }
  },
}

export const getPortfolioStorageAdapter = (): PortfolioStorageAdapter => {
  if (isFirebaseConfigured) return firebasePortfolioStorageAdapter
  return {
    ...localPortfolioStorageAdapter,
    warning: `Firebase env missing: ${firebaseMissingEnv.join(', ')}. Using local/mock portfolio storage.`,
  }
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
