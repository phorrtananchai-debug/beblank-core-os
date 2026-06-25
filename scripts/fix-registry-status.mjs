import { readFileSync, writeFileSync } from 'fs'

const path = 'src/design-system/registry/components.ts'
let content = readFileSync(path, 'utf8')

const conceptualIds = [
  'workspace-header', 'workspace-card', 'status-rail', 'metric-strip',
  'activity-feed', 'data-list', 'filter-bar', 'notice-banner', 'loading-state',
]

for (const id of conceptualIds) {
  // Find the closing '  },' after this component's id line
  const idPattern = new RegExp(`(\\s*\\{\\n\\s*id: '${id}',[\\s\\S]*?\\n\\s*\\}\\n\\s*)(\\},\\n\\s*\\{)`)
  const match = content.match(idPattern)
  if (match) {
    // Check if implementationStatus already exists
    if (!match[1].includes('implementationStatus')) {
      // Insert before the closing '  },' of this component
      const before = match[1].trimEnd()
      const after = '\n    implementationStatus: \'documented\',\n  },'
      const fullMatch = match[0]
      content = content.replace(fullMatch, before + after + '\n  {\n')
    }
  }
}

writeFileSync(path, content, 'utf8')
console.log('Done — updated registry with implementationStatus: documented')
