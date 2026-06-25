import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'artifacts', 'studio-migration', 'v1.2')
mkdirSync(outDir, { recursive: true })

const BASE_URL = 'http://localhost:5173'

async function run() {
  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    console.log('Playwright not installed. Run: npm install --save-dev playwright && npx playwright install chromium')
    process.exit(1)
  }

  const browser = await playwright.chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 3000 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // Step 1: Navigate to login
  console.log('1. Navigating to /login...')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(500)

  // Step 2: Click "Continue to Core OS" button
  console.log('2. Authenticating...')
  const loginBtn = page.locator('button', { hasText: 'Continue to Core OS' })
  await loginBtn.waitFor({ state: 'visible', timeout: 5000 })
  await loginBtn.click()

  // Step 3: Wait for redirect to /os
  console.log('3. Waiting for authentication...')
  await page.waitForURL('**/os/**', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(500)

  // Step 4: Navigate to /os/studio/projects
  console.log('4. Navigating to /os/studio/projects...')
  await page.goto(`${BASE_URL}/os/studio/projects`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(1500)

  // Step 5: Verify critical elements exist
  console.log('5. Verifying page elements...')
  const checks = [
    { name: 'OS Sidebar', selector: '.os-sidebar, aside' },
    { name: 'Project cards', selector: 'a[href*="/os/studio/projects/"]' },
    { name: 'Karun Central Khon Kaen', selector: 'text=Karun Central' },
    { name: 'Studio Control Room header', selector: 'text=Studio' },
  ]

  let allFound = true
  for (const check of checks) {
    const count = await page.locator(check.selector).count()
    const found = count > 0
    if (!found) {
      console.log(`  ❌ MISSING: ${check.name}`)
      allFound = false
    } else {
      console.log(`  ✅ Found: ${check.name} (${count})`)
    }
  }

  if (!allFound) {
    console.error('\n❌ CRITICAL: Some expected elements are missing. Aborting screenshot.')
    // Take debug screenshot anyway
    await page.screenshot({ path: resolve(outDir, 'studio-current.png'), fullPage: true })
    console.log('Debug screenshot saved for diagnosis.')
    await browser.close()
    process.exit(1)
  }

  // Step 6: Take main screenshot
  console.log('6. Taking screenshot...')
  await page.screenshot({ path: resolve(outDir, 'studio-current.png'), fullPage: true })
  console.log('   Saved: studio-current.png')

  // Step 7: Generate annotated screenshot via overlay HTML
  console.log('7. Creating annotated version...')
  const annotations = [
    { label: 'Route: /os/studio/projects', x: 20, y: 20, color: '#d97a34' },
    { label: 'Grid mode: operation', x: 20, y: 40, color: '#16a36a' },
    { label: 'WorkspaceShell', x: 300, y: 100, color: '#2563eb' },
    { label: 'WorkspaceHeader', x: 300, y: 300, color: '#7c3aed' },
    { label: 'WorkspaceSection', x: 300, y: 360, color: '#c2410c' },
    { label: 'WorkspaceCard', x: 300, y: 700, color: '#16a36a' },
  ]

  const labelsSvg = annotations.map(a =>
    `<text x="${a.x}" y="${a.y}" fill="${a.color}" font-family="Geist Mono,monospace" font-size="12" font-weight="600">${a.label}</text>`
  ).join('\n')

  // We'll create an annotated overlay and composite it
  // Simple approach: take a new screenshot with the overlay rendered on top
  const screenshotPath = resolve(outDir, 'studio-current.png')
  const annotatePath = resolve(outDir, 'studio-current-annotated.png')

  // Read the screenshot and create an SVG annotation page
  const imgData = readFileSync(screenshotPath)
  const base64 = imgData.toString('base64')

  const annotateHtml = `<!DOCTYPE html>
<html>
<head><style>
body { margin: 0; background: #f2efe9; font-family: 'Geist Mono', monospace; }
.annotation { position: absolute; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 3px; background: rgba(0,0,0,0.75); color: #fff; }
</style></head>
<body style="position:relative;display:inline-block">
  <img src="data:image/png;base64,${base64}" style="display:block;max-width:1920px" />
  <div class="annotation" style="top:10px;left:10px;background:#d97a34">Route: /os/studio/projects</div>
  <div class="annotation" style="top:32px;left:10px;background:#16a36a">Grid mode: operation</div>
  <div class="annotation" style="top:70px;left:260px;background:#2563eb">WorkspaceShell (entire frame)</div>
  <div class="annotation" style="top:265px;left:270px;background:#7c3aed">▲ WorkspaceHeader</div>
  <div class="annotation" style="top:330px;left:270px;background:#c2410c">▲ WorkspaceSection</div>
  <div class="annotation" style="top:480px;left:270px;background:#16a36a">▲ WorkspaceCard</div>
</body></html>`

  const annotatePage = await context.newPage()
  await annotatePage.setContent(annotateHtml, { waitUntil: 'networkidle' })
  await annotatePage.waitForTimeout(300)
  await annotatePage.screenshot({ path: annotatePath, fullPage: true })
  await annotatePage.close()
  console.log('   Saved: studio-current-annotated.png')

  await browser.close()
  console.log('\n✅ Done — all screenshots captured successfully.')
}

run().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
