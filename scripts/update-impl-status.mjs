import { readFileSync, writeFileSync } from 'fs'

const path = 'src/design-system/registry/components.ts'
let content = readFileSync(path, 'utf8')

const lines = content.split('\n')
let inWorkspaceHeader = false
let inWorkspaceCard = false
let inWorkspaceSection = false
let sectionInserted = false

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("id: 'workspace-header'")) inWorkspaceHeader = true
  if (lines[i].includes("id: 'workspace-card'")) inWorkspaceCard = true

  if (inWorkspaceHeader && lines[i].includes("implementationStatus:")) {
    lines[i] = lines[i].replace("'documented'", "'standalone'")
    inWorkspaceHeader = false
  }

  if (inWorkspaceCard && lines[i].includes("implementationStatus:")) {
    lines[i] = lines[i].replace("'documented'", "'standalone'")
    inWorkspaceCard = false
  }
}

// Add workspace-section entry before status-rail
for (let i = 0; i < lines.length; i++) {
  if (!sectionInserted && lines[i].includes("id: 'status-rail'")) {
    lines.splice(i, 0,
      "  {",
      "    id: 'workspace-section',",
      "    name: 'WorkspaceSection',",
      "    category: 'workspace',",
      "    status: 'production',",
      "    owner: 'ds-team',",
      "    version: '1.0.0',",
      "    source: 'src/components/shared/workspace/WorkspaceSection.tsx',",
      "    usedIn: ['StudioWorkspacePage'],",
      "    description: 'Section wrapper with panel styling. Supports card, float, and plain variants.',",
      "    usageRule: 'Use as section container for grouped content. Pass header as prop for consistent section headers.',",
      "    do: ['Use variant=\"float\" for elevated sections', 'Pass WorkspaceHeader as header prop'],",
      "    doNot: ['Do not nest more than 2 levels deep'],",
      "    tags: ['section', 'panel', 'layout'],",
      "    introduced: '2.0.0',",
      "    implementationStatus: 'standalone',",
      "  },",
    )
    sectionInserted = true
    break
  }
}

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('Done')
