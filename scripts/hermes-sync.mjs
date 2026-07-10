#!/usr/bin/env node

/**
 * Hermes Sync Runtime v1
 *
 * Reads a Closeout Packet v3 markdown file and produces
 * local mission state in .hermes/state/current-missions.json
 *
 * Usage:
 *   node scripts/hermes-sync.mjs <closeout-file>
 *
 * Output:
 *   .hermes/state/current-missions.json  (append/replace mission)
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { appendHistory, getMission, initializeRuntime, saveMission, updateMissionState } from './hermes-runtime-store.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATE_DIR = join(__dirname, '..', '.hermes', 'state')
const STATE_FILE = join(STATE_DIR, 'current-missions.json')

const EXIT_OK = 0
const EXIT_ERR = 1

// --- helpers ---

function getFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const data = {}
  for (const line of m[1].split('\n')) {
    const sep = line.indexOf(': ')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    let val = line.slice(sep + 2).trim()
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    data[key] = val
  }
  return data
}

function getSection(text, title) {
  const re = new RegExp(`## ${escapeRe(title)}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`)
  const m = re.exec(text)
  if (!m) return ''
  return m[1].trim()
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractTableValue(text, field) {
  const re = new RegExp(`\\|\\s*\\*\\*${escapeRe(field)}\\*\\*\\s*\\|\\s*([^|]+?)\\s*\\|`)
  const m = re.exec(text)
  return m ? m[1].trim() : ''
}

function extractCheck(text, field) {
  const re = new RegExp(`\\|\\s*\\*\\*${escapeRe(field)}\\*\\*\\s*\\|\\s*(✅|❌|Yes|No)\\s*\\|`)
  const m = re.exec(text)
  if (!m) return 'unknown'
  return m[1] === '✅' || m[1] === 'Yes' ? true : false
}

function extractBuild(text) {
  const sec = getSection(text, 'Validation')
  const m = sec.match(/Build.*?([✅❌])\s*(PASS|FAIL)/)
  if (m) return m[1] === '✅' ? 'PASS' : 'FAIL'
  return 'unknown'
}

function extractLint(text) {
  const sec = getSection(text, 'Validation')
  const m = sec.match(/Lint.*?([✅❌])\s*(PASS|FAIL)/)
  if (m) return m[1] === '✅' ? 'PASS' : 'FAIL'
  return 'unknown'
}

function extractGitCommit(text) {
  const sec = getSection(text, 'Git Confirmation')
  if (!sec) return 'unknown'
  const m = sec.match(/\*\*Commit hash\*\*\s*\|\s*([a-f0-9]+)/)
  if (m) return m[1]
  const m2 = sec.match(/Commit hash\s*\|\s*([a-f0-9]+)/)
  if (m2) return m2[1]
  return 'unknown'
}

function extractReview(text) {
  const sec = getSection(text, 'Review Recommendation')
  if (!sec) return 'unknown'
  const m = sec.match(/\*\*(AUTO ACCEPT|ACCEPT WITH WARNINGS|APPROVE|REVISE|NEEDS REWORK|HOLD FOR EVIDENCE|BLOCKED|FAILED|REJECT)\*\*/)
  return m ? m[1] : 'unknown'
}

function extractNext(text) {
  const sec = getSection(text, 'Suggested Next Mission')
  if (!sec) return ''
  return sec.replace(/^<.*>$/m, '').trim().slice(0, 200)
}

// --- main ---

export function resolveSyncedState(existingState, review, { completionReady = false } = {}) {
  if (['FAILED', 'BLOCKED', 'NEEDS_REWORK'].includes(existingState)) return existingState
  if (['FAILED', 'REJECT'].includes(review)) return 'FAILED'
  if (['BLOCKED', 'HOLD FOR EVIDENCE'].includes(review)) return 'BLOCKED'
  if (['NEEDS REWORK', 'REVISE'].includes(review)) return 'NEEDS_REWORK'
  if (existingState === 'COMPLETED') return 'COMPLETED'
  if (['AUTO ACCEPT', 'ACCEPT WITH WARNINGS', 'APPROVE'].includes(review)) return completionReady ? 'COMPLETED' : 'WAITING_APPROVAL'
  return 'WAITING_REVIEW'
}

export function syncCloseout(filePath, { completionEvidence = null, legacyStateFile = STATE_FILE } = {}) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const text = readFileSync(filePath, 'utf-8')
  const meta = getFrontmatter(text)

  const mission = {
    mission_id: meta.mission_id || 'unknown',
    closeout_id: meta.closeout_id || 'unknown',
    session_id: meta.session_id || 'unknown',
    agent: meta.agent || 'unknown',
    branch: meta.branch || 'unknown',
    status: classifyStatus(extractReview(text)),
    risk: classifyRisk(meta.risk || getSection(text, 'Risk Score')),
    executor: meta.agent || 'unknown',
    commit: extractGitCommit(text),
    build: extractBuild(text),
    lint: extractLint(text),
    review_recommendation: extractReview(text),
    review_required: true,
    push_required: true,
    next_mission: extractNext(text),
    updated_at: new Date().toISOString(),
  }

  // write state
  mkdirSync(dirname(legacyStateFile), { recursive: true })

  let state = []
  if (existsSync(legacyStateFile)) {
    try {
      state = JSON.parse(readFileSync(legacyStateFile, 'utf-8'))
    } catch { state = [] }
  }

  // replace existing mission or append
  const idx = state.findIndex(m => m.mission_id === mission.mission_id)
  if (idx >= 0) state[idx] = mission
  else state.push(mission)

  writeFileSync(legacyStateFile, JSON.stringify(state, null, 2) + '\n')

  // Phase 7.7 centralized runtime state. Keep the legacy snapshot above for
  // compatibility while making the runtime store authoritative for orchestration.
  initializeRuntime()
  const existing = getMission(mission.mission_id)
  const syncedState = resolveSyncedState(existing?.state, mission.review_recommendation, { completionReady: completionEvidence?.ready === true })
  saveMission({
    ...(existing || {}),
    mission_id: mission.mission_id,
    mission: existing?.mission || `Synced closeout ${mission.closeout_id}`,
    state: syncedState === 'COMPLETED' && existing?.state !== 'COMPLETED' ? (existing?.state || 'WAITING_REVIEW') : syncedState,
    closeout_id: mission.closeout_id,
    session_id: mission.session_id,
    agent_role: mission.agent,
    branch: mission.branch,
    risk: mission.risk,
    build: mission.build,
    lint: mission.lint,
    review_recommendation: mission.review_recommendation,
    updated_at: mission.updated_at,
  })
  if (syncedState === 'COMPLETED' && existing?.state !== 'COMPLETED') {
    updateMissionState(mission.mission_id, 'COMPLETED', { completed_at: mission.updated_at, completion_evidence: completionEvidence })
  }
  appendHistory('CLOSEOUT_SYNCED', mission.mission_id, { closeout_id: mission.closeout_id, state: syncedState })

  console.log(`Synced mission ${mission.mission_id} → ${legacyStateFile}`)
  console.log(`Status: ${mission.status} | Risk: ${mission.risk} | Build: ${mission.build}`)
  return { ...mission, runtime_state: syncedState, synced: true }
}

function classifyStatus(review) {
  switch (review) {
    case 'APPROVE': return 'approval'
    case 'REVISE': return 'revision'
    case 'HOLD FOR EVIDENCE': return 'hold'
    case 'REJECT': return 'rejected'
    default: return 'review'
  }
}

function classifyRisk(text) {
  const t = text.toUpperCase()
  if (t.includes('CRITICAL')) return 'CRITICAL'
  if (t.includes('HIGH')) return 'HIGH'
  if (t.includes('MEDIUM')) return 'MEDIUM'
  if (t.includes('LOW')) return 'LOW'
  return 'unknown'
}

// --- CLI ---
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node scripts/hermes-sync.mjs <closeout.md>')
    process.exit(EXIT_ERR)
  }
  try { syncCloseout(file) }
  catch (error) { console.error(`Hermes sync error: ${error.message}`); process.exit(EXIT_ERR) }
}
