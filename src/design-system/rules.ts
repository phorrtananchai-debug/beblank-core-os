import type { ComponentMeta, TemplateDef } from './types'
import { components, primitives } from './index'
import { templates } from './registry/templates'
import { patterns } from './registry/patterns'
import { workspaceComponents } from './registry/workspace'

const allComponents: ComponentMeta[] = [...components, ...primitives]

export function canUseComponent(pageId: string, componentId: string): boolean {
  const component = allComponents.find((c) => c.id === componentId)
  if (!component) return false
  if (component.usedIn.includes('every page')) return true
  const workspace = workspaceComponents.find((w) => w.id === pageId)
  if (workspace && component.usedIn.includes(workspace.name)) return true
  return component.usedIn.some((used) => used.toLowerCase().includes(pageId.toLowerCase()))
}

export function getComponentWarnings(component: ComponentMeta): string[] {
  const warnings: string[] = []
  if (!component.id) warnings.push('Missing id')
  if (!component.name) warnings.push('Missing name')
  if (!component.status) warnings.push('Missing status')
  if (!component.owner) warnings.push('Missing owner')
  if (!component.version) warnings.push('Missing version')
  if (!component.usageRule) warnings.push('Missing usageRule')
  if (!component.do || component.do.length === 0) warnings.push('Missing do list')
  if (!component.doNot || component.doNot.length === 0) warnings.push('Missing doNot list')
  if (!component.usedIn || component.usedIn.length === 0) warnings.push('Empty usedIn')
  return warnings
}

export function validateComponentMeta(component: ComponentMeta): { valid: boolean; warnings: string[] } {
  const warnings = getComponentWarnings(component)
  return { valid: warnings.length === 0, warnings }
}

export function validateTemplate(template: TemplateDef): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  if (!template.title) warnings.push('Missing title')
  if (!template.description) warnings.push('Missing description')
  if (!template.layout) warnings.push('Missing layout')
  if (!template.components || template.components.length === 0) warnings.push('No components listed')
  return { valid: warnings.length === 0, warnings }
}

export function validateWorkspace(workspace: ComponentMeta): { valid: boolean; warnings: string[] } {
  return validateComponentMeta(workspace)
}

export function validateRegistry(): {
  total: number
  valid: number
  invalid: number
  warnings: Array<{ id: string; issues: string[] }>
} {
  const all: Array<{ id: string; issues: string[] }> = []

  for (const c of allComponents) {
    const { warnings } = validateComponentMeta(c)
    if (warnings.length > 0) all.push({ id: c.id, issues: warnings })
  }

  for (const t of templates) {
    const { warnings } = validateTemplate(t)
    if (warnings.length > 0) all.push({ id: t.title, issues: warnings })
  }

  for (const p of patterns) {
    if (!p.workflow) all.push({ id: p.workflow || 'unknown-pattern', issues: ['Missing workflow'] })
    if (!p.recommendedComponents || p.recommendedComponents.length === 0)
      all.push({ id: p.workflow, issues: ['No recommended components'] })
    if (!p.rules || p.rules.length === 0)
      all.push({ id: p.workflow, issues: ['No rules defined'] })
  }

  const total = allComponents.length + templates.length + patterns.length
  const invalid = all.length
  return { total, valid: total - invalid, invalid, warnings: all }
}
