#!/usr/bin/env node

/**
 * Hermes File Lock / Conflict Guard v1
 *
 * Reads a task packet's allowed files, compares against active locks,
 * and reports SAFE / WARN / BLOCKED.
 *
 * Usage:
 *   node scripts/hermes-lock-check.mjs <task-packet.md>
 */

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LOCKS_DIR = join(ROOT, '.hermes', 'locks')
const LOCKS_EXAMPLE_DIR = join(ROOT, '.hermes.example', 'locks')

const EXIT_SAFE = 0
const EXIT_WARN = 1
const EXIT_BLOCKED = 2

const PROTECTED_PATTERNS = [
  { pattern: /src\/core\/auth/, label: 'auth' },
  { pattern: /src\/finance/, label: 'finance/trading' },
  { pattern: /src\/trading/, label: 'trading' },
  { pattern: /src\/creator/, label: 'creator' },
  { pattern: /firebase/i, label: 'firebase config' },
  { pattern: /\.env/, label: 'env/secrets' },
]

// --- Helpers ---

function getSection(text, title) {
  const re = new RegExp(`## ${escapeRe(title)}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`)
  const m = re.exec(text)
  return m ? m[1].trim() : ''
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sectionToList(text) {
  return text.split('\n').map(l => l.replace(/^[-*\s]+/, '').trim()).filter(Boolean)
}

function getFilePaths(text) {
  const result = []
  // Parse allowed files section
  const allowed = sectionToList(getSection(text, 'Allowed Files'))
  const forbidden = sectionToList(getSection(text, 'Forbidden Files'))
  result.push(...allowed.map(p => ({ path: p, type: 'allowed' })))
  result.push(...forbidden.map(p => ({ path: p, type: 'forbidden' })))

  // Also parse inline file listings (backtick blocks or bullet lists in mission/scope)
  const mission = getSection(text, 'Mission')
  for (const line of mission.split('\n')) {
    const m = line.match(/`([^`]+)`/)
    if (m && (m[1].includes('/') || m[1].includes('.'))) {
      result.push({ path: m[1], type: 'referenced' })
    }
  }
  return result
}

// --- Check logic ---

function loadLocks() {
  const locks = []
  const dirs = [LOCKS_DIR, LOCKS_EXAMPLE_DIR]
  for (const d of dirs) {
    if (!existsSync(d)) continue
    for (const f of readdirSync(d)) {
      if (!f.endsWith('.json')) continue
      try {
        const data = JSON.parse(readFileSync(join(d, f), 'utf-8'))
        locks.push({ file: f, ...data })
      } catch {}
    }
  }
  return locks
}

function check(filePath) {
  const text = readFileSync(filePath, 'utf-8')
  const files = getFilePaths(text)
  const locks = loadLocks()
  const warnings = []
  const blocks = []

  // Check protected paths
  for (const f of files) {
    for (const pp of PROTECTED_PATTERNS) {
      if (pp.pattern.test(f.path)) {
        blocks.push(`${f.path} → protected path: ${pp.label}. Await Por/ChatGPT approval.`)
      }
    }
  }

  // Check lock conflicts
  for (const f of files) {
    if (f.type === 'forbidden') continue
    for (const lock of locks) {
      if (!lock.files) continue
      for (const lf of lock.files) {
        if (f.path === lf || f.path.endsWith(lf) || lf.endsWith(f.path)) {
          warnings.push(`${f.path} is locked by ${lock.mission_id || lock.file} (${lock.agent || 'unknown'})`)
        }
      }
    }
  }

  // Determine verdict
  let verdict
  if (blocks.length > 0) {
    verdict = 'BLOCKED'
  } else if (warnings.length > 0) {
    verdict = 'WARN'
  } else {
    verdict = 'SAFE'
  }

  return { verdict, warnings, blocks, files_count: files.length, locks_count: locks.length }
}

function printResult(r) {
  console.log('')
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║     HERMES FILE LOCK CHECK — CONFLICT REPORT   ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log('')
  console.log(`  Files in packet: ${r.files_count}`)
  console.log(`  Active locks:    ${r.locks_count}`)
  console.log('')

  if (r.blocks.length) {
    console.log('  ❌ BLOCKED:')
    for (const b of r.blocks) console.log(`    - ${b}`)
    console.log('')
  }
  if (r.warnings.length) {
    console.log('  ⚠ WARN:')
    for (const w of r.warnings) console.log(`    - ${w}`)
    console.log('')
  }
  if (r.verdict === 'SAFE') {
    console.log('  ✅ SAFE — no conflicts detected.')
    console.log('')
  }

  console.log(`  Verdict: ${r.verdict}`)
  console.log('')
}

// --- CLI ---
const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: node scripts/hermes-lock-check.mjs <task-packet.md>')
  process.exit(EXIT_BLOCKED)
}
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(EXIT_BLOCKED)
}

const result = check(filePath)
printResult(result)

switch (result.verdict) {
  case 'SAFE': process.exit(EXIT_SAFE); break
  case 'WARN': process.exit(EXIT_WARN); break
  case 'BLOCKED': process.exit(EXIT_BLOCKED); break
}
