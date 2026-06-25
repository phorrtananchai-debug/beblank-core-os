import type { ComponentMeta } from './types'
import { components, primitives } from './index'
import { templates } from './registry/templates'
import { patterns } from './registry/patterns'
import { workspaceComponents } from './registry/workspace'

const allComponents: ComponentMeta[] = [...components, ...primitives]

export interface UsageGraph {
  nodes: Array<{ id: string; type: 'component' | 'template' | 'pattern' | 'workspace'; label: string }>
  edges: Array<{ from: string; to: string; type: string }>
}

export function buildComponentUsageGraph(): UsageGraph {
  const nodes: UsageGraph['nodes'] = []
  const edges: UsageGraph['edges'] = []
  const added = new Set<string>()

  for (const c of allComponents) {
    if (!added.has(c.id)) {
      nodes.push({ id: c.id, type: 'component', label: c.name })
      added.add(c.id)
    }
    for (const used of c.usedIn) {
      if (used === 'every page') continue
      const targetId = used.toLowerCase().replace(/\s+/g, '-')
      if (!added.has(targetId)) {
        nodes.push({ id: targetId, type: 'workspace', label: used })
        added.add(targetId)
      }
      edges.push({ from: c.id, to: targetId, type: 'used-in' })
    }
  }

  for (const t of templates) {
    const tid = t.title.toLowerCase().replace(/\s+/g, '-')
    if (!added.has(tid)) {
      nodes.push({ id: tid, type: 'template', label: t.title })
      added.add(tid)
    }
    for (const comp of t.components) {
      const match = allComponents.find((c) => c.name === comp || c.id === comp)
      if (match) edges.push({ from: match.id, to: tid, type: 'template-includes' })
    }
  }

  for (const p of patterns) {
    const pid = p.workflow.slice(0, 40)
    if (!added.has(pid)) {
      nodes.push({ id: pid, type: 'pattern', label: p.workflow.slice(0, 40) })
      added.add(pid)
    }
    for (const comp of p.recommendedComponents) {
      const match = allComponents.find((c) => c.name === comp || c.id === comp)
      if (match) edges.push({ from: match.id, to: pid, type: 'pattern-recommends' })
    }
  }

  return { nodes, edges }
}

export function buildPageDependencyGraph(): UsageGraph {
  return buildComponentUsageGraph()
}

export function getComponentDependents(componentId: string): Array<{ id: string; type: string }> {
  const result: Array<{ id: string; type: string }> = []
  const component = allComponents.find((c) => c.id === componentId)
  if (!component) return result

  for (const used of component.usedIn) {
    if (used === 'every page') continue
    result.push({ id: used.toLowerCase().replace(/\s+/g, '-'), type: 'workspace' })
  }

  for (const t of templates) {
    if (t.components.some((c) => c === component.name || c === component.id)) {
      result.push({ id: t.title.toLowerCase().replace(/\s+/g, '-'), type: 'template' })
    }
  }

  for (const p of patterns) {
    if (p.recommendedComponents.some((c) => c === component.name || c === component.id)) {
      result.push({ id: p.workflow.slice(0, 40), type: 'pattern' })
    }
  }

  return result
}

export function getPageDependencies(pageId: string): Array<{ id: string; type: string }> {
  const result: Array<{ id: string; type: string }> = []
  const workspace = workspaceComponents.find((w) => w.id === pageId || w.name.toLowerCase().includes(pageId.toLowerCase()))
  if (!workspace) return result

  for (const c of allComponents) {
    if (c.usedIn.includes('every page') || c.usedIn.some((u) => u.toLowerCase().includes(pageId.toLowerCase()))) {
      result.push({ id: c.id, type: 'component' })
    }
  }

  for (const t of templates) {
    if (t.components.some((c) => workspace.usedIn.some((u) => c.toLowerCase().includes(u.toLowerCase())))) {
      result.push({ id: t.title.toLowerCase().replace(/\s+/g, '-'), type: 'template' })
    }
  }

  return result
}
