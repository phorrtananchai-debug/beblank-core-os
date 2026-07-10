#!/usr/bin/env node

/**
 * Hermes Task Router v1
 *
 * Reads a task packet, infers required capabilities, classifies risk,
 * recommends an agent, and outputs a structured routing plan.
 *
 * Usage:
 *   node scripts/hermes-route-task.mjs <task-packet.md>
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const REGISTRY_PATH = join(ROOT, '.hermes', 'state', 'agent-registry.json')
const EXAMPLE_PATH = join(ROOT, '.hermes.example', 'state', 'agent-registry.example.json')
const RUNTIME_PATH = join(ROOT, '.hermes', 'runtime', 'agents.json')

// --- Load registry ---

function loadRegistry() {
  let p = RUNTIME_PATH
  if (!existsSync(p)) p = REGISTRY_PATH
  if (!existsSync(p)) p = EXAMPLE_PATH
  if (!existsSync(p)) {
    console.error('No agent registry found')
    process.exit(1)
  }
  return JSON.parse(readFileSync(p, 'utf-8'))
}

// --- Helpers ---

function getSection(text, title) {
  const re = new RegExp(`## ${escapeRe(title)}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`)
  const m = re.exec(text)
  return m ? m[1].trim() : ''
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const data = {}
  for (const line of m[1].split('\n')) {
    const sep = line.indexOf(': ')
    if (sep === -1) continue
    data[line.slice(0, sep).trim()] = line.slice(sep + 2).trim().replace(/^['"]|['"]$/g, '')
  }
  return data
}

function sectionToList(text) {
  return text.split('\n').map(l => l.replace(/^[-*\s]+/, '').trim()).filter(Boolean)
}

// --- Analysis ---

const KEYWORD_CAP_MAP = [
  { keywords: ['docs', 'readme', 'documentation', 'report', 'closeout', 'summary'], cap: 'documentation', risk: 'LOW' },
  { keywords: ['inspect', 'inspection', 'read-only', 'scan', 'audit'], cap: 'repo-inspection', risk: 'LOW' },
  { keywords: ['build', 'compile', 'verify build'], cap: 'build-verification', risk: 'LOW' },
  { keywords: ['lint'], cap: 'lint-verification', risk: 'LOW' },
  { keywords: ['review', 'qa', 'quality'], cap: 'qa-review', risk: 'LOW' },
  { keywords: ['architecture', 'design', 'refactor', 'plan'], cap: 'architecture-review', risk: 'MEDIUM' },
  { keywords: ['deep', 'complex', 'multi-file', 'reasoning'], cap: 'deep-reasoning', risk: 'MEDIUM' },
  { keywords: ['ui', 'component', 'page', 'layout', 'style', 'css', 'stabilize'], cap: 'ui-implementation', risk: 'MEDIUM' },
  { keywords: ['draft', 'fast', 'quick', 'scaffold'], cap: 'fast-draft', risk: 'LOW' },
  { keywords: ['sandbox', 'test', 'experiment', 'prototype'], cap: 'sandbox-execution', risk: 'LOW' },
  { keywords: ['debt', 'cleanup', 'optimize', 'dead code'], cap: 'technical-debt-scan', risk: 'MEDIUM' },
  { keywords: ['auth', 'authentication', 'login', 'permission'], cap: 'code-review', risk: 'HIGH' },
  { keywords: ['finance', 'trading', 'investment', 'portfolio'], cap: 'code-review', risk: 'HIGH' },
  { keywords: ['firebase', 'deploy', 'production', 'api key'], cap: 'code-review', risk: 'CRITICAL' },
  { keywords: ['memory', 'remember', 'save context'], cap: 'memory-update', risk: 'LOW' },
]

const FORBIDDEN_PATTERNS = [
  /src\/core\/auth/, /src\/finance/, /src\/trading/, /src\/creator/,
  /firebase.*config/, /\.env/, /package\.json/,
]

function analyze(text, registry) {
  const meta = getFrontmatter(text)
  const mission = getSection(text, 'Mission')
  const allowedText = getSection(text, 'Allowed Files')
  const forbiddenText = getSection(text, 'Forbidden Files')
  const allowedFiles = sectionToList(allowedText)
  const forbiddenFiles = sectionToList(forbiddenText)
  const allText = (mission + ' ' + allowedText + ' ' + forbiddenText + ' ' + (meta.mission || '')).toLowerCase()

  // Infer capabilities
  const matchedCaps = new Set()
  let maxRisk = 'LOW'
  for (const entry of KEYWORD_CAP_MAP) {
    if (entry.keywords.some(kw => allText.includes(kw))) {
      matchedCaps.add(entry.cap)
      const riskOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      if (riskOrder.indexOf(entry.risk) > riskOrder.indexOf(maxRisk)) {
        maxRisk = entry.risk
      }
    }
  }

  // Check for forbidden patterns
  const humanRequired = []
  for (const fp of FORBIDDEN_PATTERNS) {
    if (allowedText.match(fp) || forbiddenText.match(fp) || allText.match(fp)) {
      let label = fp.source
      if (label.includes('auth')) label = 'auth'
      else if (label.includes('finance')) label = 'finance/trading'
      else if (label.includes('trading')) label = 'trading'
      else if (label.includes('creator')) label = 'creator'
      else if (label.includes('firebase')) label = 'firebase'
      else if (label.includes('.env')) label = 'env/secrets'
      else if (label.includes('package')) label = 'package.json'
      humanRequired.push(label)
    }
  }

  // Find best agent
  const candidates = registry.agents
    .filter(a => {
      // Must have at least one matching capability
      const hasCap = [...matchedCaps].some(c => a.capabilities.includes(c))
      // Must be within risk limit
      const riskOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      return hasCap && riskOrder.indexOf(a.risk_limit) >= riskOrder.indexOf(maxRisk)
    })
    .sort((a, b) => {
      const order = { free: 0, 'free-quota': 1, paid: 2, human: 3 }
      return (order[a.cost_class] || 99) - (order[b.cost_class] || 99)
    })

  const recommended = candidates[0] || null
  const requiresHuman = humanRequired.length > 0 || maxRisk === 'CRITICAL'

  return {
    mission_id: meta.mission_id || 'unknown',
    risk: maxRisk,
    capabilities: [...matchedCaps],
    requires_human: requiresHuman,
    human_required_reason: requiresHuman ? (humanRequired.length ? `Protected paths: ${humanRequired.join(', ')}` : 'Critical risk level') : null,
    candidates: candidates.map(a => ({ id: a.id, name: a.name, cost: a.cost_class })),
    recommended: recommended ? { id: recommended.id, name: recommended.name, cost: recommended.cost_class } : null,
    forbidden_paths_detected: humanRequired,
  }
}

// --- Output ---

function printHuman(out) {
  console.log('')
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║        HERMES TASK ROUTER — ROUTING PLAN       ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log('')
  console.log(`  Mission ID:    ${out.mission_id}`)
  console.log(`  Risk Level:    ${out.risk}`)
  console.log(`  Capabilities:  ${out.capabilities.join(', ') || 'none detected'}`)
  console.log('')
  if (out.requires_human) {
    console.log('  ⛔ HUMAN REQUIRED')
    console.log(`  Reason: ${out.human_required_reason}`)
    console.log('')
  }
  if (out.recommended) {
    console.log(`  Recommended:   ${out.recommended.name} (${out.recommended.cost})`)
    if (out.candidates.length > 1) {
      console.log(`  Alternatives:  ${out.candidates.slice(1).map(c => `${c.name} (${c.cost})`).join(', ')}`)
    }
  } else {
    console.log('  No suitable agent found.')
  }
  if (out.forbidden_paths_detected.length) {
    console.log('')
    console.log('  ⚠ Protected paths detected:')
    for (const p of out.forbidden_paths_detected) {
      console.log(`    - ${p}`)
    }
  }
  console.log('')
}

// --- CLI ---
const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: node scripts/hermes-route-task.mjs <task-packet.md>')
  process.exit(1)
}
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

const text = readFileSync(filePath, 'utf-8')
const registry = loadRegistry()
const result = analyze(text, registry)

printHuman(result)
console.log('--- JSON ---')
console.log(JSON.stringify(result, null, 2))
