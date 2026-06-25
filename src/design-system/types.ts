export type ComponentStatus = 'production' | 'beta' | 'deprecated'
export type ComponentCategory = 'primitive' | 'composite' | 'workspace' | 'page'
export type ComponentOwner = 'ds-team' | 'studio' | 'finance' | 'command-center'

export interface ComponentVersionMeta {
  introduced: string
  deprecated?: string
  breaking?: boolean
  compatibleWith?: string[]
}

export interface ComponentMeta {
  id: string
  name: string
  category: ComponentCategory
  status: ComponentStatus
  owner: ComponentOwner
  version: string
  source: string
  usedIn: string[]
  description: string
  usageRule: string
  do: string[]
  doNot: string[]
  tags: string[]
  introduced?: string
  deprecated?: string
  breaking?: boolean
  compatibleWith?: string[]
}

export interface SymbolDef {
  id: string
  label: string
  meaning: string
  usage: string
  introduced?: string
}

export interface TemplateDef {
  title: string
  description: string
  layout: string
  components: string[]
  futurePages: string[]
  introduced?: string
}

export interface PatternDef {
  workflow: string
  recommendedComponents: string[]
  rules: string[]
  introduced?: string
}

export interface ColorToken {
  name: string
  variable: string
  value: string
  usage: string
  introduced?: string
}

export interface TypographyToken {
  name: string
  family: string
  weight: number
  size: string
  lineHeight: string
  usage: string
  introduced?: string
}

export interface SpacingToken {
  name: string
  value: string
  usage: string
  introduced?: string
}

export interface RegistryVersion {
  registryVersion: string
  componentVersion: string
  tokenVersion: string
  schemaVersion: string
  generatedAt: string
}

export interface Counts {
  components: number
  primitives: number
  templates: number
  patterns: number
  symbols: number
  workspace: number
  tokens: number
  manifests: number
  total: number
}

export interface MasterRegistry {
  registryVersion: string
  generatedAt: string
  schemaVersion: string
  counts: Counts
  components: ComponentMeta[]
  primitives: ComponentMeta[]
  templates: TemplateDef[]
  patterns: PatternDef[]
  symbols: SymbolDef[]
  workspace: ComponentMeta[]
  tokens: {
    colors: ColorToken[]
    statusColors: ColorToken[]
    typography: TypographyToken[]
    spacing: SpacingToken[]
    radius: SpacingToken[]
  }
  manifests: import('./manifest').PageManifest[]
}
