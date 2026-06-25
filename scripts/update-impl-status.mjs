import { readFileSync, writeFileSync } from 'fs'

const path = 'src/design-system/registry/components.ts'
let content = readFileSync(path, 'utf8')

const lines = content.split('\n')
let currentId = ''
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/id:\s+'([^']+)'/)
  if (m) currentId = m[1]
  if (lines[i].includes("implementationStatus: 'documented'") && 
      ['status-rail', 'metric-strip', 'activity-feed', 'data-list', 'filter-bar', 'notice-banner', 'loading-state'].includes(currentId)) {
    lines[i] = lines[i].replace("'documented'", "'standalone'")
  }
}

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('Done')
