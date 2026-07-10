#!/usr/bin/env node

/**
 * Hermes Agent Registry Runtime v1
 *
 * Reads the agent registry and provides structured agent queries.
 *
 * Usage:
 *   node scripts/hermes-agent-registry.mjs list
 *   node scripts/hermes-agent-registry.mjs capabilities
 *   node scripts/hermes-agent-registry.mjs agent <id>
 *   node scripts/hermes-agent-registry.mjs route <capability>
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const REGISTRY_PATH = join(ROOT, '.hermes', 'state', 'agent-registry.json')
const EXAMPLE_PATH = join(ROOT, '.hermes.example', 'state', 'agent-registry.example.json')

// --- Load registry ---

function loadRegistry() {
  let registry
  if (existsSync(REGISTRY_PATH)) {
    registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
  } else if (existsSync(EXAMPLE_PATH)) {
    registry = JSON.parse(readFileSync(EXAMPLE_PATH, 'utf-8'))
    // Copy example to runtime location
    mkdirSync(join(ROOT, '.hermes', 'state'), { recursive: true })
    writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n')
  } else {
    console.error('No agent registry found. Create .hermes.example/state/agent-registry.example.json')
    process.exit(1)
  }
  return registry
}

// --- Commands ---

function cmdList(registry) {
  console.log('Available Agents:')
  console.log('')
  for (const a of registry.agents) {
    console.log(`  ${a.id.padEnd(20)} ${a.name.padEnd(30)} ${a.cost_class.padEnd(12)} risk: ${a.risk_limit}`)
  }
}

function cmdCapabilities(registry) {
  const caps = new Map()
  for (const a of registry.agents) {
    for (const c of a.capabilities) {
      if (!caps.has(c)) caps.set(c, [])
      caps.get(c).push(a.id)
    }
  }
  console.log('Capability → Agent Mapping:')
  console.log('')
  for (const [cap, agents] of [...caps.entries()].sort()) {
    console.log(`  ${cap.padEnd(28)} ${agents.join(', ')}`)
  }
}

function cmdAgent(registry, id) {
  const agent = registry.agents.find(a => a.id === id)
  if (!agent) {
    console.error(`Agent not found: ${id}`)
    process.exit(1)
  }
  console.log(JSON.stringify(agent, null, 2))
}

function cmdRoute(registry, cap) {
  const found = registry.agents.filter(a =>
    a.capabilities.some(c => c.toLowerCase().includes(cap.toLowerCase()))
  ).sort((a, b) => {
    const order = { free: 0, 'free-quota': 1, paid: 2, human: 3 }
    return (order[a.cost_class] ?? 99) - (order[b.cost_class] ?? 99)
  })
  if (!found.length) {
    console.error(`No agent found for capability: ${cap}`)
    process.exit(1)
  }
  console.log(`Agents capable of "${cap}":`)
  console.log('')
  for (const a of found) {
    const matched = a.capabilities.filter(c => c.toLowerCase().includes(cap.toLowerCase()))
    console.log(`  ${a.id.padEnd(20)} cost: ${a.cost_class.padEnd(12)} risk: ${a.risk_limit.padEnd(10)} matched: ${matched.join(', ')}`)
  }
}

// --- CLI ---
const cmd = process.argv[2]
const arg = process.argv[3]

if (!cmd) {
  console.log('Usage:')
  console.log('  node scripts/hermes-agent-registry.mjs list')
  console.log('  node scripts/hermes-agent-registry.mjs capabilities')
  console.log('  node scripts/hermes-agent-registry.mjs agent <id>')
  console.log('  node scripts/hermes-agent-registry.mjs route <capability>')
  process.exit(0)
}

const registry = loadRegistry()

switch (cmd) {
  case 'list': cmdList(registry); break
  case 'capabilities': cmdCapabilities(registry); break
  case 'agent':
    if (!arg) { console.error('Usage: agent <id>'); process.exit(1) }
    cmdAgent(registry, arg); break
  case 'route':
    if (!arg) { console.error('Usage: route <capability>'); process.exit(1) }
    cmdRoute(registry, arg); break
  default:
    console.error(`Unknown command: ${cmd}`)
    process.exit(1)
}
