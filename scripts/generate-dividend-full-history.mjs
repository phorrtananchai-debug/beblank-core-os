import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

const csvPath = resolve(repoRoot, 'data/dividends/DividendRecordsFullHistory_extracted.csv')
const outPath = resolve(repoRoot, 'src/core/dividends/fullHistoryData.ts')

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => {
      const raw = values[idx] ?? ''
      const num = parseFloat(raw)
      row[h] = Number.isFinite(num) && raw !== '' ? num : raw
    })
    rows.push(row)
  }
  return rows
}

function toTsValue(val) {
  if (typeof val === 'number') return val
  if (val === 'true') return true
  if (val === 'false') return false
  if (val === '') return 'undefined'
  return `'${String(val).replace(/'/g, "\\'")}'`
}

try {
  const csvText = readFileSync(csvPath, 'utf-8')
  const rows = parseCsv(csvText)

  let tsContent = `// Auto-generated from data/dividends/DividendRecordsFullHistory_extracted.csv
// Run: node scripts/generate-dividend-full-history.mjs
import type { DividendRecord } from '../../types/models'

export const fullHistoryDividendRecords: DividendRecord[] = [
`
  for (const row of rows) {
    tsContent += `  {\n`
    for (const [key, val] of Object.entries(row)) {
      if (val === undefined || val === null || val === '') continue
      tsContent += `    ${key}: ${toTsValue(val)},\n`
    }
    if (!row.sourceScope) tsContent += `    sourceScope: 'full-dime-history',\n`
    if (!row.sourceDocument) tsContent += `    sourceDocument: 'Binder1(1).pdf',\n`
    if (!row.status) tsContent += `    status: 'received',\n`
    tsContent += `  },\n`
  }

  tsContent += `]\n`

  writeFileSync(outPath, tsContent, 'utf-8')
  console.log(`Generated ${rows.length} dividend records → ${outPath}`)
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('CSV not found at', csvPath, '— skipping generation')
    writeFileSync(outPath, `// No CSV data found. Run after populating data/dividends/DividendRecordsFullHistory_extracted.csv\nimport type { DividendRecord } from '../../types/models'\nexport const fullHistoryDividendRecords: DividendRecord[] = []\n`, 'utf-8')
  } else {
    throw err
  }
}
