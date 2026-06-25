import { readFileSync, writeFileSync } from 'fs'

const path = 'src/design-system/registry/components.ts'
let content = readFileSync(path, 'utf8')

content = content.replace(
  "source: 'src/components/shared/workspace/WorkspaceHeader.tsx',\n    usedIn: ['DesignSystemPage', 'StudioWorkspacePage']",
  "source: 'src/components/shared/workspace/WorkspaceHeader.tsx',\n    usedIn: ['DesignSystemPage', 'StudioWorkspacePage', 'CommandCenterPage']"
)

writeFileSync(path, content, 'utf8')
console.log('Done')
