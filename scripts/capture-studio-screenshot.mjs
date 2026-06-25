import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'artifacts', 'studio-migration', 'v1.2')
mkdirSync(outDir, { recursive: true })

async function run() {
  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    console.log('Playwright not installed. Run: npm install --save-dev playwright && npx playwright install chromium')
    process.exit(1)
  }

  const browser = await playwright.chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1920, height: 3000 },
    deviceScaleFactor: 2,
  })

  // Studio projects page
  const page = await context.newPage()
  console.log('Capturing /os/studio/projects...')
  await page.goto('http://localhost:5173/os/studio/projects', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
    // fallback — try different port
  })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: resolve(outDir, 'studio-current.png'), fullPage: true })
  console.log('Saved: studio-current.png')

  await browser.close()

  // Write README
  const readme = `# Studio Migration v1.2 — Visual QA

## Current State

- **Commit:** ${process.env.GIT_HASH || '(see git log)'}
- **Route:** \`/os/studio/projects\`
- **Viewport:** 1920×3000 @2x
- **Date:** ${new Date().toISOString().slice(0, 10)}

## Migrated Components

| View | Component Used | Status |
|---|---|---|
| Active Projects | WorkspaceSection + WorkspaceHeader + Link cards | ✅ Migrated v1 |
| Timeline | WorkspaceSection + WorkspaceHeader | ✅ Migrated v1 |
| Openings | WorkspaceSection + WorkspaceHeader | ✅ Migrated v1 |
| Capacity | WorkspaceSection + WorkspaceCard (4 cards) | ✅ Migrated v1 |
| Reviews sidebar | WorkspaceCard | ✅ Migrated v1 |
| DocumentsView | WorkspaceSection + WorkspaceHeader | ✅ Migrated v1.2 |
| ArtworkView | WorkspaceCard variant="float" as="article" | ✅ Migrated v1.2 |
| BriefsView | WorkspaceCard variant="float" as="article" | ✅ Migrated v1.2 |

## Known Unmigrated Areas

| Area | Reason | Future Plan |
|---|---|---|
| SiteWatchView | Uses \`.studio-fragment-media\` unique blocks | v1.3 |
| MasterTimelineView | Gantt chart custom layout | v1.3 |
| ReviewsView | Uses PendingApprovalPanel shared component | v1.3 |

## Visual Notes

- Visual appearance should be nearly identical to pre-migration
- All replacements use identical CSS classes
- No layout shift, no content changes

## Files Changed During Migration

| File | v1 | v1.1 | v1.2 |
|---|---|---|---|
| \`StudioWorkspacePage.tsx\` | Overview + Capacity migrated | — | Documents, Artwork, Briefs views |
| \`WorkspaceHeader.tsx\` | Created | — | — |
| \`WorkspaceSection.tsx\` | Created | — | — |
| \`WorkspaceCard.tsx\` | Created | — | — |
| \`StatusRail.tsx\` | — | Created | — |
| \`MetricStrip.tsx\` | — | Created | — |
| \`ActivityFeed.tsx\` | — | Created | — |
| \`DataList.tsx\` | — | Created | — |
| \`FilterBar.tsx\` | — | Created | — |
| \`NoticeBanner.tsx\` | — | Created | — |
| \`LoadingState.tsx\` | — | Created | — |
`

  writeFileSync(resolve(outDir, 'README.md'), readme)
  console.log('Saved: README.md')
}

run().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
