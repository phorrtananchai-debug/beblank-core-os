import type { Project } from '../../types/models'

export interface PortfolioProject {
  id: string
  slug: string
  title: string
  client: string
  location: string
  status: string
  category: string
  year: string
  summary: string
  coverImageUrl: string
  galleryImageUrls: string[]
  isPublished: boolean
}

export interface HomepagePortfolioItem {
  id: string
  projectId: string
  title: string
  imageUrl: string
  imageStoragePath: string
  caption: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  rotation: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface PortfolioLayoutSnapshot {
  projects: PortfolioProject[]
  homepageItems: HomepagePortfolioItem[]
  updatedAt: string
  source: 'seed' | 'local' | 'firebase'
}

const seedLayouts = [
  { x: 6, y: 12, width: 22, height: 28, zIndex: 2, rotation: -1.4 },
  { x: 58, y: 8, width: 28, height: 18, zIndex: 3, rotation: 1.1 },
  { x: 34, y: 36, width: 18, height: 34, zIndex: 4, rotation: -0.6 },
  { x: 70, y: 52, width: 20, height: 30, zIndex: 5, rotation: 0.8 },
]

export const toPortfolioProjects = (projects: Project[]): PortfolioProject[] =>
  projects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.name,
    client: project.client ?? project.owner,
    location: project.location ?? 'Thailand',
    status: project.status,
    category: project.phase ?? 'Studio',
    year: '2026',
    summary: project.operationalNotes ?? 'Public project profile from BeBlank Studio OS.',
    coverImageUrl: project.coverImageUrl ?? '',
    galleryImageUrls: project.mediaImageUrls ?? [],
    isPublished: true,
  }))

export const buildSeedPortfolioLayout = (projects: Project[]): PortfolioLayoutSnapshot => {
  const portfolioProjects = toPortfolioProjects(projects)
  const now = new Date().toISOString()
  const homepageItems = portfolioProjects.slice(0, 4).map((project, index) => {
    const layout = seedLayouts[index % seedLayouts.length]
    return {
      id: `home-${project.id}-${index}`,
      projectId: project.id,
      title: project.title,
      imageUrl: project.coverImageUrl,
      imageStoragePath: '',
      caption: `${project.status} / ${project.category}`,
      isVisible: true,
      createdAt: now,
      updatedAt: now,
      ...layout,
    }
  })

  return {
    projects: portfolioProjects,
    homepageItems,
    updatedAt: now,
    source: 'seed',
  }
}

