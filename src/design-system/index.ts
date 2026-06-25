// BBH Design System — Central Entry Point
// All foundations, registries, types, and engine utilities export from here.

// Types
export type * from './types'

// Foundations
export { colors, statusColorTokens } from './foundations/colors'
export { typography } from './foundations/typography'
export { spacing, radius } from './foundations/spacing'

// Registry
export { components } from './registry/components'
export { primitives } from './registry/primitives'
export { symbols } from './registry/symbols'
export { templates } from './registry/templates'
export { patterns } from './registry/patterns'
export { workspaceComponents } from './registry/workspace'

// Engine
export {
  resolveComponent,
  resolveTemplate,
  resolvePattern,
  resolveWorkspace,
  getComponentsByStatus,
  getComponentsByCategory,
  getTemplatesByFuturePage,
  getPatternsByComponent,
} from './resolvers'

export {
  canUseComponent,
  validateComponentMeta,
  validateTemplate,
  validateWorkspace,
  validateRegistry,
  getComponentWarnings,
} from './rules'

export {
  buildComponentUsageGraph,
  buildPageDependencyGraph,
  getComponentDependents,
  getPageDependencies,
} from './graph'

export { pageManifests, getManifest, getManifestsByPriority } from './manifest'

export { getRegistryVersion, isCompatible, REGISTRY_VERSION, COMPONENT_VERSION, TOKEN_VERSION, SCHEMA_VERSION } from './version'
