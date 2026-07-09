#!/usr/bin/env node

/**
 * Hermes Packet Validator CLI v0.1
 *
 * Validates Hermes packet files against the documented schema.
 * Returns PASS / WARN / FAIL with exit codes 0 / 1 / 2.
 *
 * Usage:
 *   node scripts/hermes-validate-packet.mjs <packet-file>
 */

import { readFileSync, existsSync } from 'fs'

const EXIT_PASS = 0
const EXIT_WARN = 1
const EXIT_FAIL = 2

const REQUIRED_HEADINGS = [
  'Mission',
  'Allowed Files',
  'Forbidden Files',
  'Evidence',
  'Approval',
  'Closeout',
]

/**
 * Check for a markdown heading (## or ###) with the given title.
 */
function hasHeading(text, title) {
  const re = new RegExp(`^#{1,3}\\s+${escapeRegex(title)}\\s*$`, 'm')
  return re.test(text)
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract lines between a heading and the next heading (or end of file).
 * Returns trimmed lines or empty array.
 */
function getSectionLines(text, heading) {
  const re = new RegExp(`^#{1,3}\\s+${escapeRegex(heading)}\\s*$`, 'm')
  const match = re.exec(text)
  if (!match) return []
  const start = match.index + match[0].length
  const afterHeading = text.slice(start)
  const nextRe = /^#{1,3}\s+\S/m
  const nextMatch = nextRe.exec(afterHeading)
  const end = nextMatch ? nextMatch.index : afterHeading.length
  const section = afterHeading.slice(0, end).trim()
  return section ? section.split('\n').map(l => l.trim()).filter(Boolean) : []
}

/**
 * Check if a section has any content (non-empty lines beyond placeholders).
 */
function hasContent(lines) {
  return lines.some(l =>
    l &&
    !l.startsWith('<') &&
    !l.startsWith('```') &&
    l !== '-' &&
    l !== ''
  )
}

/**
 * Check if a section exists but only has placeholder content.
 */
function isOnlyPlaceholder(lines) {
  if (!lines.length) return false
  return lines.every(l =>
    !l ||
    l.startsWith('<') ||
    l.startsWith('```') ||
    l === '-' ||
    l === ''
  )
}

function validate(filePath) {
  const issues = []
  const warnings = []
  const passed = []

  if (!existsSync(filePath)) {
    return { verdict: 'FAIL', issues: [`File not found: ${filePath}`], warnings, passed }
  }

  const text = readFileSync(filePath, 'utf-8')

  // --- Packet title ---
  const titleMatch = text.match(/^#\s+(.+)/m)
  if (titleMatch) {
    passed.push(`Packet title: ${titleMatch[1].trim()}`)
  } else {
    warnings.push('Packet title (# heading) is missing or empty')
  }

  // --- Required headings ---
  for (const heading of REQUIRED_HEADINGS) {
    if (hasHeading(text, heading)) {
      const lines = getSectionLines(text, heading)
      if (!lines.length) {
        issues.push(`${heading} section is empty`)
      } else if (isOnlyPlaceholder(lines)) {
        warnings.push(`${heading} section contains only placeholder content`)
      } else {
        passed.push(heading)
      }
    } else {
      issues.push(`${heading} section is missing`)
    }
  }

  // --- Determine verdict ---
  let verdict
  if (issues.length > 0) {
    verdict = 'FAIL'
  } else if (warnings.length > 0) {
    verdict = 'WARN'
  } else {
    verdict = 'PASS'
  }

  return { verdict, issues, warnings, passed }
}

function printResult(result) {
  for (const p of result.passed) {
    console.log(`  ✔ ${p}`)
  }
  for (const w of result.warnings) {
    console.log(`  ⚠ ${w}`)
  }
  for (const i of result.issues) {
    console.log(`  ✘ ${i}`)
  }

  console.log('')
  console.log(`Result:`)
  console.log(`  ${result.verdict}`)
}

// --- CLI ---
const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: node scripts/hermes-validate-packet.mjs <packet-file>')
  process.exit(EXIT_FAIL)
}

const result = validate(filePath)
printResult(result)

switch (result.verdict) {
  case 'PASS':
    process.exit(EXIT_PASS)
  case 'WARN':
    process.exit(EXIT_WARN)
  case 'FAIL':
    process.exit(EXIT_FAIL)
}
