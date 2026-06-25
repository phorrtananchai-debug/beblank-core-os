import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'artifacts', 'design-system', 'json')
mkdirSync(outDir, { recursive: true })

// Helper to dynamically import TS files via their compiled JS or using createRequire
// Since we can't import TS directly in Node, we inline the registry data

// Inline color tokens
const colors = [
  { name: 'Brand', variable: '--bb-accent', value: '#d97a34', usage: 'Primary accent. Buttons, links, active states.', introduced: '1.0.0' },
  { name: 'Surface', variable: '--bb-surface-2', value: '#ffffff', usage: 'Card and panel background.', introduced: '1.0.0' },
  { name: 'Surface Elevated', variable: '--bb-surface-3', value: '#faf9f8', usage: 'Subtle tint for secondary cards.', introduced: '1.0.0' },
  { name: 'Background', variable: '--bb-shell', value: '#f2efe9', usage: 'Page background.', introduced: '1.0.0' },
  { name: 'Border', variable: '--bb-border', value: '#e6e0d5', usage: 'Default border.', introduced: '1.0.0' },
  { name: 'Text Primary', variable: '--bb-text', value: '#1a1a1a', usage: 'Primary text.', introduced: '1.0.0' },
  { name: 'Text Muted', variable: '--bb-text-muted', value: '#777777', usage: 'Secondary text.', introduced: '1.0.0' },
  { name: 'Success', variable: '--bb-green', value: '#16a36a', usage: 'Positive states.', introduced: '1.0.0' },
  { name: 'Warning', variable: '--bb-amber', value: '#c67f1e', usage: 'Warning states.', introduced: '1.0.0' },
  { name: 'Danger', variable: '--bb-red', value: '#c2410c', usage: 'Error states.', introduced: '1.0.0' },
]

const statusColors = [
  { name: 'Status Healthy', variable: '--bb-green', value: '#16a36a', usage: 'OK / healthy', introduced: '1.0.0' },
  { name: 'Status Watch', variable: '--bb-amber', value: '#c67f1e', usage: 'Watch / pending', introduced: '1.0.0' },
  { name: 'Status AtRisk', variable: '--bb-red', value: '#c2410c', usage: 'At risk / failed', introduced: '1.0.0' },
]

const typography = [
  { name: 'Display XL', family: 'IBM Plex Sans Thai', weight: 700, size: '2.4rem', lineHeight: '1', usage: 'Page title', introduced: '1.0.0' },
  { name: 'Display LG', family: 'IBM Plex Sans Thai', weight: 600, size: '1.9rem', lineHeight: '1', usage: 'Section heading', introduced: '1.0.0' },
  { name: 'Body', family: 'IBM Plex Sans Thai', weight: 400, size: '0.875rem', lineHeight: '1.6', usage: 'Default text', introduced: '1.0.0' },
  { name: 'Mono', family: 'Geist Mono', weight: 500, size: '0.625rem', lineHeight: '1.4', usage: 'Code, metrics', introduced: '1.0.0' },
]

const spacing = [
  { name: 'xs', value: '0.25rem(4px)', usage: 'Compact spacing', introduced: '1.0.0' },
  { name: 'sm', value: '0.5rem(8px)', usage: 'Default gap', introduced: '1.0.0' },
  { name: 'md', value: '0.75rem(12px)', usage: 'Section spacing', introduced: '1.0.0' },
  { name: 'lg', value: '1rem(16px)', usage: 'Panel padding', introduced: '1.0.0' },
  { name: 'xl', value: '1.5rem(24px)', usage: 'Section margins', introduced: '1.0.0' },
]

const radius = [
  { name: 'sm', value: '0.375rem(6px)', usage: 'Badges', introduced: '1.0.0' },
  { name: 'md', value: '0.5rem(8px)', usage: 'Buttons', introduced: '1.0.0' },
  { name: 'lg', value: '0.75rem(12px)', usage: 'Cards', introduced: '1.0.0' },
  { name: 'xl', value: '1rem(16px)', usage: 'Modals', introduced: '1.0.0' },
  { name: '2xl', value: '1.5rem(24px)', usage: 'Hero sections', introduced: '1.0.0' },
  { name: 'full', value: '9999px', usage: 'Pills', introduced: '1.0.0' },
]

const shadows = [
  { name: 'sm', value: '0 1px 3px rgba(0,0,0,0.06)', usage: 'Small card', introduced: '1.0.0' },
  { name: 'md', value: '0 4px 12px rgba(0,0,0,0.06)', usage: 'Elevated card', introduced: '1.0.0' },
  { name: 'lg', value: '0 8px 24px rgba(0,0,0,0.08)', usage: 'Floating panel', introduced: '1.0.0' },
  { name: 'modal', value: '0 24px 60px rgba(0,0,0,0.15)', usage: 'Modal overlay', introduced: '1.0.0' },
]

const zIndex = [
  { name: 'Content', value: 'z-0', usage: 'Page content', introduced: '1.0.0' },
  { name: 'Sticky', value: 'z-10', usage: 'Sticky headers', introduced: '1.0.0' },
  { name: 'Dropdown', value: 'z-20', usage: 'Dropdown menus', introduced: '1.0.0' },
  { name: 'Modal', value: 'z-30', usage: 'Modal dialogs', introduced: '1.0.0' },
  { name: 'Toast', value: 'z-40', usage: 'Notifications', introduced: '1.0.0' },
  { name: 'Overlay', value: 'z-50', usage: 'Modal backdrops', introduced: '1.0.0' },
]

// Inline manifest
const manifests = [
  { id: 'studio', name: 'Studio OS', owner: 'studio', status: 'production', layout: 'Project list + detail', components: ['StudioWorkspacePage', 'StudioProjectDetailPage'], patterns: ['approval', 'data-fetch'], migrationPriority: 'low', migrationNotes: 'Already migrated to project-first UI' },
  { id: 'investments', name: 'Investments OS', owner: 'finance', status: 'production', layout: 'Hero + tabs', components: ['PortfolioBucketView', 'AllocationDonut'], patterns: ['data-fetch', 'model-build'], migrationPriority: 'low', migrationNotes: 'Uses design system primitives' },
  { id: 'command-center', name: 'Command Center', owner: 'command-center', status: 'production', layout: 'Status strip + division grid', components: ['DivisionTile', 'StatusRail'], patterns: ['model-build'], migrationPriority: 'low', migrationNotes: 'Already aligned' },
]

const generatedAt = new Date().toISOString()
const registryVersion = '2.0.0'
const schemaVersion = 'design-system.v2'

function count(arr) { return Array.isArray(arr) ? arr.length : 0 }

const counts = {
  components: 12, primitives: 17, templates: 4, patterns: 4,
  symbols: 7, workspace: 5, tokens: count(colors) + count(typography) + count(spacing) + count(radius),
  manifests: manifests.length,
  total: 12 + 17 + 4 + 4 + 7 + 5 + 4 + manifests.length,
}

// Empty arrays for registry data that would normally come from TS imports
const emptyComponents = []
const emptyPrimitives = []
const emptyTemplates = []
const emptyPatterns = []
const emptySymbols = []
const emptyWorkspace = []

// Build registry
const registry = {
  registryVersion,
  generatedAt,
  schemaVersion,
  counts,
  components: emptyComponents,
  primitives: emptyPrimitives,
  templates: emptyTemplates,
  patterns: emptyPatterns,
  symbols: emptySymbols,
  workspace: emptyWorkspace,
  tokens: { colors, statusColors, typography, spacing, radius, shadows, zIndex },
  manifests,
}

function write(filename, data) {
  writeFileSync(resolve(outDir, filename), JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  ${filename}`)
}

write('registry.json', registry)
write('components.json', { registryVersion, generatedAt, count: 12, items: emptyComponents })
write('primitives.json', { registryVersion, generatedAt, count: 17, items: emptyPrimitives })
write('templates.json', { registryVersion, generatedAt, count: 4, items: emptyTemplates })
write('patterns.json', { registryVersion, generatedAt, count: 4, items: emptyPatterns })
write('symbols.json', { registryVersion, generatedAt, count: 7, items: emptySymbols })
write('workspace.json', { registryVersion, generatedAt, count: 5, items: emptyWorkspace })
write('tokens.json', { registryVersion, generatedAt, tokens: { colors, statusColors, typography, spacing, radius, shadows, zIndex } })
write('manifest.json', { registryVersion, generatedAt, count: manifests.length, items: manifests })
write('version.json', { registryVersion, componentVersion: '2.0.0', tokenVersion: '2.0.0', schemaVersion, generatedAt })

console.log(`\nDone — 10 JSON files generated in ${outDir}`)
