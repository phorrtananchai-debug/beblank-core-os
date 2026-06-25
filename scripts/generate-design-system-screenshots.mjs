#!/usr/bin/env node
/**
 * BBH Design System — Visual Review Artifact Generator
 *
 * Generates:
 *   - Full PNG screenshots (1920x3000)
 *   - Thumbnails (320px width)
 *   - Contact sheet (4-column mosaic)
 *   - index.json
 *   - HTML copy
 *   - README.md
 *
 * Usage: npm run design:screenshots
 * Requires: playwright (npm install --save-dev playwright + npx playwright install chromium)
 */

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const srcDir = resolve(root, 'artifacts', 'design-system-review')
const outDir = resolve(root, 'artifacts', 'design-review')
const screenshotDir = resolve(outDir, 'screenshots')
const thumbnailDir = resolve(outDir, 'thumbnails')
const htmlDir = resolve(outDir, 'html')
const contactDir = resolve(outDir, 'contact-sheet')

for (const d of [outDir, screenshotDir, thumbnailDir, htmlDir, contactDir]) {
  mkdirSync(d, { recursive: true })
}

const SCREENSHOT_WIDTH = 1920
const SCREENSHOT_HEIGHT = 3000
const THUMBNAIL_WIDTH = 320

const htmlFiles = [
  '00-index', '01-primitives', '02-workspace', '03-symbols', '04-patterns',
  '05-templates', '06-states', '07-anatomy', '08-scale', '09-recipes',
  '10-blueprints', '11-interactions', '12-responsive', '13-accessibility',
  '14-relationships', '15-migration', '16-color-tokens', '17-typography-tokens',
  '18-spacing-tokens', '19-radius-shadow', '20-layering-zindex',   '21-spatial-grid',
  '22-spatial-runtime',
]

const pageMeta = {
  '00-index': { title: 'Design System Index', id: '00' },
  '01-primitives': { title: 'Primitives', id: '01' },
  '02-workspace': { title: 'Workspace', id: '02' },
  '03-symbols': { title: 'Symbols', id: '03' },
  '04-patterns': { title: 'Patterns', id: '04' },
  '05-templates': { title: 'Templates', id: '05' },
  '06-states': { title: 'States', id: '06' },
  '07-anatomy': { title: 'Anatomy', id: '07' },
  '08-scale': { title: 'Scale', id: '08' },
  '09-recipes': { title: 'Recipes', id: '09' },
  '10-blueprints': { title: 'Blueprints', id: '10' },
  '11-interactions': { title: 'Interactions', id: '11' },
  '12-responsive': { title: 'Responsive', id: '12' },
  '13-accessibility': { title: 'Accessibility', id: '13' },
  '14-relationships': { title: 'Relationships', id: '14' },
  '15-migration': { title: 'Migration', id: '15' },
  '16-color-tokens': { title: 'Color Tokens', id: '16' },
  '17-typography-tokens': { title: 'Typography', id: '17' },
  '18-spacing-tokens': { title: 'Spacing', id: '18' },
  '19-radius-shadow': { title: 'Radius & Shadow', id: '19' },
  '20-layering-zindex': { title: 'Layering & Z-Index', id: '20' },
  '21-spatial-grid': { title: 'Spatial Grid', id: '21' },
  '22-spatial-runtime': { title: 'Spatial Runtime', id: '22' },
}

async function generateArtifacts() {
  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    console.log('Playwright not installed. Run:')
    console.log('  npm install --save-dev playwright')
    console.log('  npx playwright install chromium')
    process.exit(1)
  }

  console.log('Launching browser...')
  const browser = await playwright.chromium.launch()
  const context = await browser.newContext({
    viewport: { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
    deviceScaleFactor: 2,
  })

  const pages = []

  for (const name of htmlFiles) {
    const meta = pageMeta[name]
    const htmlSrc = resolve(srcDir, `${name}.html`)
    const htmlDst = resolve(htmlDir, `${name}.html`)
    const pngDst = resolve(screenshotDir, `${name}.png`)
    const thumbDst = resolve(thumbnailDir, `${name}.png`)

    if (!existsSync(htmlSrc)) {
      console.log(`  SKIP ${name}.html — not found`)
      continue
    }

    // Copy HTML
    copyFileSync(htmlSrc, htmlDst)

    // Full screenshot
    const page = await context.newPage()
    await page.goto(`file://${htmlSrc}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: pngDst, fullPage: true })
    console.log(`  SCREENSHOT ${name}.png`)

    // Thumbnail
    await page.setViewportSize({ width: THUMBNAIL_WIDTH, height: Math.round(SCREENSHOT_HEIGHT * (THUMBNAIL_WIDTH / SCREENSHOT_WIDTH)) })
    await page.waitForTimeout(200)
    await page.screenshot({ path: thumbDst, fullPage: true })
    console.log(`  THUMBNAIL  ${name}.png`)

    await page.close()

    pages.push({
      id: meta.id,
      title: meta.title,
      html: `html/${name}.html`,
      png: `screenshots/${name}.png`,
      thumbnail: `thumbnails/${name}.png`,
      updatedAt: new Date().toISOString(),
    })
  }

  // Generate contact sheet
  console.log('\nGenerating contact sheet...')
  const contactPage = await context.newPage()
  await contactPage.setViewportSize({ width: 1600, height: 900 })

  const cols = 4
  const thumbW = 340
  const thumbH = 200
  const gap = 12
  const margin = 40
  const totalW = cols * (thumbW + gap) + margin * 2 - gap
  const rows = Math.ceil(pages.length / cols)
  const totalH = rows * (thumbH + gap + 30) + margin * 2 + 60

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" style="background:#f2efe9">`
  svg += `<text x="${margin}" y="36" font-family="Geist Mono,monospace" font-size="14" font-weight="600" fill="#1a1a1a">BBH Design System — Contact Sheet</text>`
  svg += `<text x="${margin}" y="54" font-family="Geist Mono,monospace" font-size="9" fill="#999">${pages.length} pages · ${new Date().toISOString().slice(0,10)}</text>`

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = margin + col * (thumbW + gap)
    const y = 70 + row * (thumbH + gap + 30)
    const thumbPath = resolve(thumbnailDir, `${p.id === '00' ? '00-index' : p.id === '01' ? '01-primitives' : ''}`)
    const imgFile = htmlFiles.find(f => f.startsWith(p.id)) || `${p.id}`
    const imgPath = resolve(thumbnailDir, `${imgFile}.png`)

    svg += `<rect x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" rx="8" fill="#fff" stroke="#e6e0d5" stroke-width="1"/>`

    try {
      const imgData = readFileSync(imgPath)
      const base64 = imgData.toString('base64')
      svg += `<image href="data:image/png;base64,${base64}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" clip-path="inset(0 round 8px)"/>`
    } catch {}

    svg += `<text x="${x + 8}" y="${y + thumbH + 16}" font-family="Geist Mono,monospace" font-size="9" fill="#666">${p.id} · ${p.title}</text>`
  }

  svg += `</svg>`

  const contactPage2 = await context.newPage()
  await contactPage2.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#f2efe9">${svg}</body></html>`)
  await contactPage2.waitForTimeout(300)
  const contactPng = resolve(contactDir, 'design-system-contact-sheet.png')
  await contactPage2.screenshot({ path: contactPng, fullPage: true })
  await contactPage2.close()
  console.log(`  CONTACT SHEET contact-sheet/design-system-contact-sheet.png`)

  // Generate index.json
  const indexJson = {
    generatedAt: new Date().toISOString(),
    total: pages.length,
    pages,
  }
  writeFileSync(resolve(outDir, 'index.json'), JSON.stringify(indexJson, null, 2))
  console.log('  INDEX       index.json')

  // Generate README.md
  const readme = `# BBH Design System — Visual Review Artifacts

## Structure

\`\`\`
artifacts/design-review/
├── index.json              — Machine-readable index of all pages
├── README.md               — This file
├── html/                   — Static HTML copies of all review pages
├── screenshots/            — Full-page PNG screenshots (1920×3000 @2x)
├── thumbnails/             — Thumbnail PNG (320px width)
└── contact-sheet/          — Contact sheet mosaic
    └── design-system-contact-sheet.png
\`\`\`

## Pages

| # | Page | Screenshot | Thumbnail |
|---|------|------------|-----------|
${pages.map(p => `| ${p.id} | ${p.title} | [PNG](screenshots/${basename(p.png)}) | [THUMB](thumbnails/${basename(p.thumbnail)}) |`).join('\n')}

## Generation

Generated on ${new Date().toISOString().slice(0, 10)}.

\`\`\`bash
npm run design:screenshots
\`\`\`

Requires Playwright. Install:

\`\`\`bash
npm install --save-dev playwright
npx playwright install chromium
\`\`\`

## Review Workflow

1. Open \`00-index\` in screenshots/ to see the full catalog
2. Browse individual PNGs for detailed visual review
3. Use thumbnails/ for quick scanning
4. Open contact-sheet/ for the full mosaic overview
5. Check index.json for machine-readable metadata
`

  writeFileSync(resolve(outDir, 'README.md'), readme)
  console.log('  README      README.md')

  await contactPage.close()
  await browser.close()

  console.log(`\nDone — ${pages.length} pages processed`)
  console.log(`  HTML:        ${htmlDir}`)
  console.log(`  Screenshots: ${screenshotDir}`)
  console.log(`  Thumbnails:  ${thumbnailDir}`)
  console.log(`  Contact:     ${contactDir}/design-system-contact-sheet.png`)
  console.log(`  Index:       ${outDir}/index.json`)
}

generateArtifacts().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
