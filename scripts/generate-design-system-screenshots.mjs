#!/usr/bin/env node
/**
 * BBH Design System — Screenshot Generator
 *
 * This script generates PNG screenshots of the static HTML review pages.
 *
 * Prerequisites:
 *   - Playwright: npm install --save-dev playwright
 *   - Browser: npx playwright install chromium
 *
 * Usage:
 *   node scripts/generate-design-system-screenshots.mjs
 *
 * Input:
 *   artifacts/design-system-review/*.html
 *
 * Output:
 *   artifacts/design-system-review/screenshots/*.png
 *
 * Expected files:
 *   - 00-index.html        → 00-index.png
 *   - 01-primitives.html   → 01-primitives.png
 *   - 02-workspace.html    → 02-workspace.png
 *   - 03-symbols.html      → 03-symbols.png
 *   - 04-patterns.html     → 04-patterns.png
 *   - 05-templates.html    → 05-templates.png
 *   - 06-states.html       → 06-states.png
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const reviewDir = resolve(__dirname, '..', 'artifacts', 'design-system-review')
const screenshotDir = resolve(reviewDir, 'screenshots')

const htmlFiles = [
  '00-index.html',
  '01-primitives.html',
  '02-workspace.html',
  '03-symbols.html',
  '04-patterns.html',
  '05-templates.html',
  '06-states.html',
  '07-anatomy.html',
  '08-scale.html',
  '09-recipes.html',
  '10-blueprints.html',
  '11-interactions.html',
  '12-responsive.html',
  '13-accessibility.html',
  '14-relationships.html',
  '15-migration.html',
  '16-color-tokens.html',
  '17-typography-tokens.html',
  '18-spacing-tokens.html',
  '19-radius-shadow.html',
  '20-layering-zindex.html',
  '21-spatial-grid.html',
]

async function run() {
  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    console.log('Playwright not installed. To generate screenshots:')
    console.log('  npm install --save-dev playwright')
    console.log('  npx playwright install chromium')
    console.log('  node scripts/generate-design-system-screenshots.mjs')
    console.log('')
    console.log('Expected output:')
    for (const file of htmlFiles) {
      const png = file.replace('.html', '.png')
      console.log(`  ${screenshotDir}/${png}`)
    }
    return
  }

  mkdirSync(screenshotDir, { recursive: true })
  const browser = await playwright.chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

  for (const file of htmlFiles) {
    const htmlPath = `file://${resolve(reviewDir, file)}`
    const pngPath = resolve(screenshotDir, file.replace('.html', '.png'))
    const page = await context.newPage()
    await page.goto(htmlPath, { waitUntil: 'networkidle' })
    await page.screenshot({ path: pngPath, fullPage: true })
    await page.close()
    console.log(`  ${pngPath}`)
  }

  await browser.close()
  console.log(`\\nDone — ${htmlFiles.length} screenshots generated in ${screenshotDir}`)
}

run()
