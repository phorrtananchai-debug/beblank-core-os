#!/usr/bin/env node

import {
  appendHistory,
  atomicWrite,
  getMission,
  initializeRuntime,
  normalizeMission,
  parseTaskPacket,
  readState,
  saveMission,
  updateMissionState,
} from './hermes-runtime-store.mjs'

const TRANSITIONS = Object.freeze({
  PENDING: ['RUNNING', 'BLOCKED', 'PAUSED', 'FAILED'],
  RUNNING: ['WAITING_REVIEW', 'WAITING_APPROVAL', 'BLOCKED', 'PAUSED', 'COMPLETED', 'FAILED'],
  WAITING_REVIEW: ['WAITING_APPROVAL', 'RUNNING', 'BLOCKED', 'COMPLETED', 'FAILED'],
  WAITING_APPROVAL: ['RUNNING', 'BLOCKED', 'COMPLETED', 'FAILED'],
  BLOCKED: ['PENDING', 'RUNNING', 'PAUSED', 'FAILED'],
  PAUSED: ['PENDING', 'RUNNING', 'FAILED'],
  COMPLETED: ['ARCHIVED'],
  FAILED: ['PENDING', 'ARCHIVED'],
  ARCHIVED: [],
})

function usage() {
  console.log('Usage: hermes:queue <init|list|enqueue|next|start|block|pause|resume|review|approval|complete|fail|archive|status> [packet|mission-id]')
}

function ensure() { initializeRuntime() }

function transition(id, target, extra = {}) {
  const mission = getMission(id)
  if (!mission) throw new Error(`Mission not found: ${id}`)
  if (!TRANSITIONS[mission.state]?.includes(target)) throw new Error(`Invalid transition: ${mission.state} -> ${target}`)
  return updateMissionState(id, target, extra)
}

function enqueue(packetPath) {
  const packet = parseTaskPacket(packetPath)
  const mission = normalizeMission(packet)
  saveMission(mission, { create: true })
  const queue = readState('queue.json')
  if (queue.items.some(item => item.mission_id === mission.mission_id)) throw new Error(`Duplicate queue mission rejected: ${mission.mission_id}`)
  queue.items.push({ mission_id: mission.mission_id, enqueued_at: mission.created_at, priority: 0 })
  atomicWrite('queue.json', queue)
  appendHistory('MISSION_ENQUEUED', mission.mission_id, { packet_path: mission.packet_path })
  return mission
}

function nextMission() {
  const missions = readState('mission-store.json').missions
  return readState('queue.json').items.map(item => missions.find(mission => mission.mission_id === item.mission_id)).find(mission => mission?.state === 'PENDING') || null
}

function removeFromQueue(id) {
  const queue = readState('queue.json')
  queue.items = queue.items.filter(item => item.mission_id !== id)
  atomicWrite('queue.json', queue)
}

function print(value) { console.log(JSON.stringify(value, null, 2)) }

try {
  const [command, arg, ...rest] = process.argv.slice(2)
  if (!command) { usage(); process.exit(2) }
  ensure()
  switch (command) {
    case 'init': print(initializeRuntime()); break
    case 'list': print(readState('mission-store.json').missions); break
    case 'enqueue': if (!arg) throw new Error('enqueue requires a packet path'); print(enqueue(arg)); break
    case 'next': print(nextMission()); break
    case 'start': print(transition(arg, 'RUNNING', { started_at: new Date().toISOString() })); break
    case 'block': print(transition(arg, 'BLOCKED', { block_reason: rest.join(' ') || 'unspecified' })); break
    case 'pause': print(transition(arg, 'PAUSED', { pause_reason: rest.join(' ') || 'manual pause' })); break
    case 'resume': {
      const mission = getMission(arg)
      if (!mission) throw new Error(`Mission not found: ${arg}`)
      const target = mission.started_at ? 'RUNNING' : 'PENDING'
      print(transition(arg, target, { resumed_at: new Date().toISOString() }))
      break
    }
    case 'review': print(transition(arg, 'WAITING_REVIEW')); break
    case 'approval': print(transition(arg, 'WAITING_APPROVAL')); break
    case 'complete': removeFromQueue(arg); print(transition(arg, 'COMPLETED', { completed_at: new Date().toISOString() })); break
    case 'fail': removeFromQueue(arg); print(transition(arg, 'FAILED', { failure_reason: rest.join(' ') || 'unspecified', failed_at: new Date().toISOString() })); break
    case 'archive': removeFromQueue(arg); print(transition(arg, 'ARCHIVED', { archived_at: new Date().toISOString() })); break
    case 'status': print(getMission(arg)); break
    default: throw new Error(`Unknown queue command: ${command}`)
  }
} catch (error) {
  console.error(`Hermes queue error: ${error.message}`)
  process.exit(2)
}
