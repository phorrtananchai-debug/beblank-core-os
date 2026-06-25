import type { ComponentMeta, ComponentStatus, ComponentCategory, TemplateDef, PatternDef } from './types'
import { components, primitives } from './index'
import { templates } from './registry/templates'
import { patterns } from './registry/patterns'
import { workspaceComponents } from './registry/workspace'

const allComponents: ComponentMeta[] = [...components, ...primitives]

export function resolveComponent(id: string): ComponentMeta | null {
  return allComponents.find((c) => c.id === id) ?? null
}

export function resolveTemplate(id: string): TemplateDef | null {
  return templates.find((t) => t.title.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase()) ?? null
}

export function resolvePattern(id: string): PatternDef | null {
  return patterns.find((p) => p.workflow.toLowerCase().includes(id.toLowerCase())) ?? null
}

export function resolveWorkspace(id: string): ComponentMeta | null {
  return workspaceComponents.find((w) => w.id === id) ?? null
}

export function getComponentsByStatus(status: ComponentStatus): ComponentMeta[] {
  return allComponents.filter((c) => c.status === status)
}

export function getComponentsByCategory(category: ComponentCategory): ComponentMeta[] {
  return allComponents.filter((c) => c.category === category)
}

export function getTemplatesByFuturePage(page: string): TemplateDef[] {
  return templates.filter((t) => t.futurePages.some((p) => p.toLowerCase().includes(page.toLowerCase())))
}

export function getPatternsByComponent(componentId: string): PatternDef[] {
  return patterns.filter((p) =>
    p.recommendedComponents.some((c) => c.toLowerCase().includes(componentId.toLowerCase())),
  )
}
