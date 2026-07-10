#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import {
  getMission,
  initializeRuntime,
  MISSION_STATES,
  readState,
  RUNTIME_DIR,
  statePath,
  STATE_FILES,
  validateState,
} from './hermes-runtime-store.mjs'

function doctor() {
  const issues = []
  const warnings = []
  const states = {}
  for (const name of STATE_FILES) {
    const path = statePath(name)
    if (!existsSync(path)) { issues.push(`Missing runtime file: ${name}`); continue }
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8'))
      const errors = validateState(name, raw)
      if (errors.length) issues.push(...errors.map(error => `${name}: ${error}`))
      else states[name] = raw
    } catch (error) { issues.push(`Malformed JSON in ${name}: ${error.message}`) }
  }
  const missions = states['mission-store.json']?.missions || []
  const queue = states['queue.json']?.items || []
  const locks = states['locks.json']?.locks || []
  const runtime = states['runtime.json'] || { active_assignments: {} }
  const ids = new Set(missions.map(mission => mission.mission_id))
  for (const item of queue) if (!ids.has(item.mission_id)) issues.push(`Orphan queue entry: ${item.mission_id}`)
  for (const item of queue) {
    const mission = missions.find(candidate => candidate.mission_id === item.mission_id)
    if (mission && ['COMPLETED', 'FAILED', 'ARCHIVED'].includes(mission.state)) issues.push(`Terminal mission still queued: ${item.mission_id} (${mission.state})`)
  }
  for (const mission of missions) {
    const queued = queue.some(item => item.mission_id === mission.mission_id)
    if (mission.state === 'PENDING' && !queued) warnings.push(`Pending mission missing from queue: ${mission.mission_id}`)
    if (!MISSION_STATES.includes(mission.state)) issues.push(`Invalid state: ${mission.mission_id} -> ${mission.state}`)
    if (mission.state === 'RUNNING' && !runtime.active_assignments[mission.mission_id]) warnings.push(`Active mission without worker: ${mission.mission_id}`)
    if (mission.state === 'COMPLETED' && locks.some(lock => lock.mission_id === mission.mission_id && lock.status !== 'released')) issues.push(`Completed mission still locked: ${mission.mission_id}`)
  }
  const now = Date.now()
  for (const lock of locks) {
    if (!ids.has(lock.mission_id)) warnings.push(`Orphan lock: ${lock.mission_id}`)
    if (lock.status !== 'released' && lock.acquired && now - Date.parse(lock.acquired) > 24 * 60 * 60 * 1000) warnings.push(`Stale lock: ${lock.mission_id}`)
  }
  const exit_code = issues.length ? 2 : warnings.length ? 1 : 0
  return { healthy: exit_code === 0, exit_code, runtime_dir: RUNTIME_DIR, issues, warnings }
}

try {
  const [command, arg] = process.argv.slice(2)
  if (!command) throw new Error('Usage: hermes:runtime <init|summary|doctor|mission|history> [id]')
  if (command === 'init') console.log(JSON.stringify(initializeRuntime(), null, 2))
  else if (command === 'doctor') { const result = doctor(); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.exit_code }
  else {
    initializeRuntime()
    if (command === 'summary') {
      const missions = readState('mission-store.json').missions
      const by_state = Object.fromEntries(MISSION_STATES.map(state => [state, missions.filter(mission => mission.state === state).length]))
      console.log(JSON.stringify({ runtime_dir: RUNTIME_DIR, missions: missions.length, by_state, queued: readState('queue.json').items.length, locks: readState('locks.json').locks.filter(lock => lock.status !== 'released').length }, null, 2))
    } else if (command === 'mission') {
      if (!arg) throw new Error('mission requires an id')
      console.log(JSON.stringify(getMission(arg), null, 2))
    } else if (command === 'history') {
      const events = readState('history.json').events.filter(event => !arg || event.mission_id === arg)
      console.log(JSON.stringify(events, null, 2))
    } else throw new Error(`Unknown runtime command: ${command}`)
  }
} catch (error) {
  console.error(`Hermes runtime error: ${error.message}`)
  process.exit(2)
}
