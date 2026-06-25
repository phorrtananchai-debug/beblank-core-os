export type ComponentStatus = 'production' | 'beta' | 'deprecated'
export type ComponentCategory = 'primitive' | 'composite' | 'workspace' | 'page'
export type ComponentOwner = 'ds-team' | 'studio' | 'finance' | 'command-center'

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
}

export interface SymbolDef {
  id: string
  label: string
  meaning: string
  usage: string
}

export interface TemplateDef {
  title: string
  description: string
  layout: string
  components: string[]
  futurePages: string[]
}

export interface PatternDef {
  workflow: string
  recommendedComponents: string[]
  rules: string[]
}

export interface ColorToken {
  name: string
  variable: string
  value: string
  usage: string
}

export interface TypographyToken {
  name: string
  family: string
  weight: number
  size: string
  lineHeight: string
  usage: string
}

export interface SpacingToken {
  name: string
  value: string
  usage: string
}
