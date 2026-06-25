import type { RegistryVersion } from './types'

export const REGISTRY_VERSION = '2.0.0'
export const COMPONENT_VERSION = '2.0.0'
export const TOKEN_VERSION = '2.0.0'
export const SCHEMA_VERSION = 'design-system.v2'

export function getRegistryVersion(): RegistryVersion {
  return {
    registryVersion: REGISTRY_VERSION,
    componentVersion: COMPONENT_VERSION,
    tokenVersion: TOKEN_VERSION,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
  }
}

export function isCompatible(componentVersion: string, minVersion: string): boolean {
  const parse = (v: string) => v.split('.').map(Number)
  const c = parse(componentVersion)
  const m = parse(minVersion)
  if (c.length < 2 || m.length < 2) return false
  return c[0] >= m[0] && c[1] >= m[1]
}
