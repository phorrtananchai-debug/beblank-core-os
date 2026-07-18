import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const base = 'http://127.0.0.1:5174'
const project = '/os/studio/projects/karun-central-khon-kaen-campus'
const storageKey = 'beblank.project-workspace.v2:sp-kcc-main'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
await context.addInitScript(() => localStorage.setItem('beblank_os_auth_v1', 'true'))
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('ERR_NETWORK_ACCESS_DENIED')) errors.push(`console: ${message.text()}`) })

const go = async (path) => {
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  if (!response?.ok()) throw new Error(`${path} returned ${response?.status()}`)
}
const readData = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey)
const navigateSection = (name) => page.getByRole('button', { name, exact: true }).click()
const countBlobs = () => page.evaluate(async () => new Promise((resolve, reject) => {
  const open = indexedDB.open('beblank-project-workspace-assets', 1)
  open.onerror = () => reject(open.error)
  open.onsuccess = () => {
    const request = open.result.transaction('asset-blobs').objectStore('asset-blobs').count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }
}))

try {
  await go('/')
  await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('beblank.project-workspace.')) localStorage.removeItem(key) })
  await go('/os/studio')
  await page.getByRole('link', { name: /Open Karun CKK/i }).click()
  await page.waitForURL(`**${project}`)

  await navigateSection('Tasks')
  await page.getByRole('button', { name: 'Add task', exact: true }).click()
  let dialog = page.getByRole('dialog')
  const title = 'Shared browser task'
  await dialog.locator('[name=title]').fill(title)
  await dialog.locator('[name=description]').fill('Desktop to mobile acceptance task')
  await dialog.locator('[name=plannedStart]').fill('2026-07-18')
  await dialog.locator('[name=plannedFinish]').fill('2026-07-18')
  await dialog.locator('form').getByRole('button', { name: 'Add task' }).click()
  await page.getByRole('row').filter({ hasText: title }).waitFor()

  await go('/m')
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByText('Karun Thai Tea — Central Khon Kaen Campus', { exact: true }).click()
  const taskArticle = page.locator('article').filter({ hasText: title })
  const mobileSeesTask = await taskArticle.count() === 1
  await taskArticle.getByRole('button', { name: 'Mark done' }).click()
  await taskArticle.getByRole('button', { name: 'Reopen task' }).waitFor()

  await go(`${project}/tasks`)
  await page.getByRole('row').filter({ hasText: title }).click()
  dialog = page.getByRole('dialog')
  const desktopSeesMobileUpdate = await dialog.locator('[name=status]').inputValue() === 'done' && await dialog.locator('[name=progress]').inputValue() === '100'
  await dialog.locator('.project-dialog-head button').click()

  await navigateSection('Site')
  await page.getByRole('button', { name: 'Add site report' }).click()
  dialog = page.getByRole('dialog')
  for (const [name, value] of Object.entries({ date: '2026-07-18', supervisor: 'Browser reviewer', workerCount: '2', workScope: 'Shared mobile site context', completedToday: 'Shared site report persisted', planTomorrow: 'Continue shared validation' })) await dialog.locator(`[name=${name}]`).fill(value)
  await dialog.locator('[name=taskIds]').selectOption({ label: title })
  await dialog.getByRole('button', { name: 'Submit site report' }).click()
  await page.getByText('Shared mobile site context', { exact: true }).waitFor()

  await go('/m')
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByText('Karun Thai Tea — Central Khon Kaen Campus', { exact: true }).click()
  const mobileSeesSiteReport = await page.getByText('Shared mobile site context', { exact: true }).count() === 1
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: fileURLToPath(new URL('./screenshots/07-existing-mobile-route.png', import.meta.url)), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })

  await go(`${project}/files`)
  await page.getByRole('button', { name: 'Upload files' }).click()
  dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles([
    { name: 'lifecycle-a.txt', mimeType: 'text/plain', buffer: Buffer.from('alpha') },
    { name: 'lifecycle-b.txt', mimeType: 'text/plain', buffer: Buffer.from('beta') },
  ])
  await dialog.locator('[name=category]').selectOption('meeting-document')
  await dialog.locator('[name=taskId]').selectOption({ label: title })
  const boqId = await dialog.locator('[name=boqItemId] option').nth(1).getAttribute('value')
  await dialog.locator('[name=boqItemId]').selectOption(boqId)
  await dialog.getByRole('button', { name: /Upload 2 files/ }).click()
  await dialog.waitFor({ state: 'hidden' })
  await page.getByText('lifecycle-a.txt', { exact: true }).waitFor()

  let stored = await readData()
  const uploaded = stored.assets.filter((asset) => asset.fileName.startsWith('lifecycle-'))
  const taskId = stored.tasks.find((task) => task.title === title).id
  const inverseTask = stored.assetRelationships.filter((relation) => relation.targetType === 'task' && relation.targetId === taskId).length === 2
  const inverseBoq = stored.assetRelationships.filter((relation) => relation.targetType === 'boq-item' && relation.targetId === boqId).length >= 2
  const blobsBefore = await countBlobs()

  await page.getByText('lifecycle-a.txt', { exact: true }).click()
  dialog = page.getByRole('dialog')
  await dialog.locator('[name=name]').fill('Edited lifecycle asset')
  await dialog.locator('[name=caption]').fill('Metadata edit persisted')
  await dialog.getByRole('button', { name: 'Save asset changes' }).click()
  await page.waitForTimeout(150)
  stored = await readData()
  const target = stored.assets.find((asset) => asset.id === uploaded[0].id)
  const editPersisted = target.name === 'Edited lifecycle asset' && target.caption === 'Metadata edit persisted'
  await dialog.locator('.project-related p').filter({ hasText: title }).getByRole('button', { name: 'Unlink' }).click()
  await page.waitForTimeout(100)
  stored = await readData()
  const unlinkPersisted = !stored.assetRelationships.some((relation) => relation.assetId === target.id && relation.targetType === 'task')
  await dialog.getByRole('button', { name: 'Delete asset' }).click()
  await dialog.waitFor({ state: 'hidden' })
  stored = await readData()
  const deleteClean = !stored.assets.some((asset) => asset.id === target.id) && !stored.assetRelationships.some((relation) => relation.assetId === target.id)
  const blobCleanup = await countBlobs() === blobsBefore - 1

  await navigateSection('Tasks')
  await page.getByRole('row').filter({ hasText: title }).click()
  dialog = page.getByRole('dialog')
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    window.__restoreSetItem = () => { Storage.prototype.setItem = original }
    Storage.prototype.setItem = function injectedFailure() { throw new DOMException('Injected quota failure', 'QuotaExceededError') }
  })
  await dialog.locator('[name=status]').selectOption('review')
  await dialog.getByRole('button', { name: 'Save task changes' }).click()
  const visibleFailure = await dialog.getByRole('alert').count() === 1
  await page.evaluate(() => window.__restoreSetItem())
  await dialog.locator('.project-dialog-head button').click()

  await navigateSection('Schedule')
  await page.getByRole('button', { name: 'Daily site plan' }).click()
  const expectedDate = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
  const currentDateSchedule = await page.getByText(expectedDate, { exact: true }).count() === 1
  await page.reload({ waitUntil: 'networkidle' })
  stored = await readData()
  const refreshPersistence = stored.tasks.some((task) => task.title === title) && stored.assets.some((asset) => asset.fileName === 'lifecycle-b.txt')

  const result = { routeEntry: true, desktopCreated: true, mobileSeesTask, mobileMutation: true, desktopSeesMobileUpdate, mobileSeesSiteReport, multiFileUpload: uploaded.length, inverseTask, inverseBoq, editPersisted, unlinkPersisted, deleteClean, blobCleanup, visibleFailure, currentDateSchedule, refreshPersistence, errors }
  if (Object.entries(result).some(([key, value]) => key !== 'errors' && (value === false || value === 0)) || errors.length) throw new Error(JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ result: 'PASS', ...result }, null, 2))
} finally {
  await browser.close()
}
