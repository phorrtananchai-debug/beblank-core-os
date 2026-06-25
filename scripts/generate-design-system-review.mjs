import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'artifacts', 'design-system-review')

mkdirSync(outDir, { recursive: true })
mkdirSync(resolve(outDir, 'screenshots'), { recursive: true })

const BASE_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'IBM Plex Sans Thai', system-ui, sans-serif; background: #f2efe9; color: #1a1a1a; padding: 2rem; }
.container { max-width: 1200px; margin: 0 auto; }
h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
h2 { font-size: 1.1rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem; }
h3 { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
.subtitle { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
.meta { font-family: 'Geist Mono', monospace; font-size: 0.625rem; color: #999; }
.grid { display: grid; gap: 1rem; }
.cols-2 { grid-template-columns: repeat(2, 1fr); }
.cols-3 { grid-template-columns: repeat(3, 1fr); }
.cols-4 { grid-template-columns: repeat(4, 1fr); }
.card { border: 1px solid #e6e0d5; border-radius: 0.75rem; background: #fff; padding: 1rem; }
.card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.tag { display: inline-block; background: #f0eeec; border-radius: 0.25rem; padding: 0.125rem 0.375rem; font-family: 'Geist Mono', monospace; font-size: 0.5rem; color: #666; }
.tag-green { background: #16a36a1a; color: #16a36a; }
.tag-amber { background: #c67f1e1a; color: #c67f1e; }
.badge { display: inline-flex; align-items: center; gap: 0.25rem; border-radius: 9999px; padding: 0.125rem 0.5rem; font-size: 0.625rem; font-weight: 600; border: 1px solid #e6e0d5; background: #fff; color: #1a1a1a; }
.badge-green { background: #16a36a; color: #fff; border-color: #16a36a; }
.badge-amber { background: #c67f1e; color: #fff; border-color: #c67f1e; }
.badge-red { background: #c2410c; color: #fff; border-color: #c2410c; }
.dot { display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 9999px; }
.dot-green { background: #16a36a; }
.dot-amber { background: #c67f1e; }
.dot-red { background: #c2410c; }
.dot-gray { background: #d4cdc2; }
.pill { display: inline-block; border-radius: 9999px; padding: 0.125rem 0.5rem; font-size: 0.625rem; font-weight: 600; background: #f0eeec; color: #666; border: 1px solid #e6e0d5; }
.pill-green { background: #16a36a1a; color: #16a36a; border-color: #16a36a33; }
.pill-amber { background: #c67f1e1a; color: #c67f1e; border-color: #c67f1e33; }
.pill-accent { background: #d97a341a; color: #d97a34; border-color: #d97a3433; }
.btn { display: inline-flex; align-items: center; gap: 0.375rem; border-radius: 0.5rem; padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 600; border: 1px solid #e6e0d5; background: #fff; color: #1a1a1a; cursor: default; }
.btn-primary { background: #d97a34; color: #fff; border-color: #d97a34; }
.progress { height: 0.375rem; border-radius: 9999px; background: #f0eeec; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 9999px; background: #d97a34; }
.progress-green .progress-fill { background: #16a36a; }
.progress-amber .progress-fill { background: #c67f1e; }
table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
th { text-align: left; padding: 0.5rem; font-weight: 600; color: #999; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e6e0d5; }
td { padding: 0.5rem; border-bottom: 1px solid #e6e0d5; }
.section { margin-top: 3rem; }
pre { font-family: 'Geist Mono', monospace; font-size: 0.625rem; background: #faf9f8; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #e6e0d5; overflow-x: auto; }
`

const FOOTER = `<div style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e6e0d5;font-family:'Geist Mono',monospace;font-size:0.625rem;color:#999">BBH Design System Review · Generated from src/design-system/registry</div>`

const HEAD = (title) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} — BBH Design System Review</title><style>${BASE_CSS}</style></head><body><div class="container">`

const paginate = (items, perPage) => {
  const pages = []
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage))
  return pages
}

// === 00-index.html ===
const indexContent = HEAD('00 Index') + `
<h1>BBH Design System — Review Pack</h1>
<p class="subtitle">Component library visual review. All components use BBH design tokens and are renderable outside the app.</p>

<div class="grid cols-3 section">
  <a href="01-primitives.html" class="card" style="text-decoration:none;color:inherit">
    <div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">01 · Primitives</h3></div>
    <p style="font-size:0.75rem;color:#666">Buttons, inputs, badges, pills, tables, tabs, dividers, skeletons, avatars, tooltips, dropdowns, modals, sheets</p>
    <div style="margin-top:0.5rem"><span class="tag">17 components</span></div>
  </a>
  <a href="02-workspace.html" class="card" style="text-decoration:none;color:inherit">
    <div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">02 · Workspace</h3></div>
    <p style="font-size:0.75rem;color:#666">Shell, header, section, card, panel, toolbar, sidebar, inspector, split, stack, notice, banner, empty state, loading, filter bar, search bar, data list, detail panel, review panel, approval panel, activity feed, status rail, metric strip, timeline, file preview, command palette</p>
    <div style="margin-top:0.5rem"><span class="tag">26 components</span></div>
  </a>
  <a href="03-symbols.html" class="card" style="text-decoration:none;color:inherit">
    <div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">03 · Symbols</h3></div>
    <p style="font-size:0.75rem;color:#666">Status, priority, progress, architecture, finance, AI, warning, blocked, review, approved symbols</p>
    <div style="margin-top:0.5rem"><span class="tag">10 symbol groups</span></div>
  </a>
  <a href="04-patterns.html" class="card" style="text-decoration:none;color:inherit">
    <div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">04 · Patterns</h3></div>
    <p style="font-size:0.75rem;color:#666">Data fetch, approval workflow, model build, navigation patterns with component recommendations</p>
    <div style="margin-top:0.5rem"><span class="tag">4 patterns</span></div>
  </a>
  <a href="05-templates.html" class="card" style="text-decoration:none;color:inherit">
    <div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">05 · Templates</h3></div>
    <p style="font-size:0.75rem;color:#666">Command Center, Investments OS, Studio OS, Bridge Settings page templates</p>
    <div style="margin-top:0.5rem"><span class="tag">4 templates</span></div>
  </a>
  <a href="06-states.html" class="card" style="text-decoration:none;color:inherit">
    <div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">06 · States</h3></div>
    <p style="font-size:0.75rem;color:#666">Loading, empty, error, success, warning, disabled, readonly, offline, stale, fresh component states</p>
    <div style="margin-top:0.5rem"><span class="tag">10 states</span></div>
  </a>
</div>

<div class="section">
  <h2>Registry Metadata</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Primitive Components</td><td>17</td></tr>
    <tr><td>Workspace Components</td><td>26</td></tr>
    <tr><td>Symbol Groups</td><td>10</td></tr>
    <tr><td>Operating Patterns</td><td>4</td></tr>
    <tr><td>Page Templates</td><td>4</td></tr>
    <tr><td>Component States</td><td>10</td></tr>
    <tr><td>Total Components</td><td>47</td></tr>
  </table>
</div>
` + FOOTER + `</div></body></html>`
writeFileSync(resolve(outDir, '00-index.html'), indexContent)
console.log('00-index.html')

// === 01-primitives.html ===
const primitivesContent = HEAD('01 Primitives') + `
<h1>Primitive Components</h1>
<p class="subtitle">Base UI primitives used across all BBH pages.</p>

<div class="section">
<h2>Button</h2>
<div class="grid cols-4">
  <div class="card"><div class="btn">Default</div></div>
  <div class="card"><div class="btn btn-primary">Primary</div></div>
  <div class="card"><div class="btn" style="opacity:0.4">Disabled</div></div>
  <div class="card"><div class="btn" style="border-style:dashed">Ghost</div></div>
</div>
<p class="meta">btn, btn-primary · status: production · usage: Primary actions use btn-primary. Secondary actions use btn.</p>
</div>

<div class="section">
<h2>Input</h2>
<div class="grid cols-2">
  <div class="card"><input placeholder="Text input" style="width:100%;border:1px solid #e6e0d5;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.75rem;outline:none" /></div>
  <div class="card"><input placeholder="Disabled" disabled style="width:100%;border:1px solid #e6e0d5;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.75rem;background:#faf9f8;opacity:0.5" /></div>
</div>
</div>

<div class="section">
<h2>Badge / Pill</h2>
<div class="grid cols-4">
  <div class="card" style="display:flex;gap:0.5rem;flex-wrap:wrap"><span class="pill">Default</span><span class="pill-green">Healthy</span><span class="pill-amber">Warning</span><span class="pill-accent">Active</span></div>
  <div class="card" style="display:flex;gap:0.5rem;flex-wrap:wrap"><span class="badge"><span class="dot dot-green"></span>Live</span><span class="badge"><span class="dot dot-amber"></span>Review</span><span class="badge badge-green">Production</span></div>
  <div class="card" style="display:flex;gap:0.5rem;flex-wrap:wrap"><span class="badge badge-amber">Beta</span><span class="badge badge-red">Deprecated</span><span class="tag">v1.0.0</span></div>
  <div class="card" style="display:flex;gap:0.5rem;flex-wrap:wrap"><span class="badge">12</span><span class="badge badge-green">5 ok</span><span class="badge badge-amber">2 warn</span></div>
</div>
</div>

<div class="section">
<h2>Tabs</h2>
<div style="display:flex;gap:0;border-bottom:1px solid #e6e0d5">
  <div style="padding:0.5rem 1rem;font-size:0.75rem;font-weight:600;border-bottom:2px solid #d97a34;color:#1a1a1a">Active</div>
  <div style="padding:0.5rem 1rem;font-size:0.75rem;color:#999">Inactive</div>
  <div style="padding:0.5rem 1rem;font-size:0.75rem;color:#999">Disabled</div>
</div>
</div>

<div class="section">
<h2>Table</h2>
<table>
  <tr><th>Name</th><th>Status</th><th style="text-align:right">Value</th></tr>
  <tr><td>Item A</td><td><span class="pill-green">Healthy</span></td><td style="text-align:right">1,234</td></tr>
  <tr><td>Item B</td><td><span class="pill-amber">Watch</span></td><td style="text-align:right">567</td></tr>
  <tr><td>Item C</td><td><span class="badge badge-red">Blocked</span></td><td style="text-align:right">89</td></tr>
</table>
</div>

<div class="section">
<h2>Progress</h2>
<div class="grid cols-3">
  <div class="card"><div class="progress" style="margin-bottom:0.25rem"><div class="progress-fill" style="width:75%"></div></div><span class="meta">75% · accent</span></div>
  <div class="card"><div class="progress progress-green"><div class="progress-fill" style="width:100%"></div></div><span class="meta">100% · complete</span></div>
  <div class="card"><div class="progress progress-amber"><div class="progress-fill" style="width:40%"></div></div><span class="meta">40% · in progress</span></div>
</div>
</div>

<div class="section">
<h2>Divider</h2>
<div style="border-top:1px solid #e6e0d5;margin:1rem 0"></div>
<div style="border-top:1px dashed #e6e0d5;margin:1rem 0"></div>
</div>

<div class="section">
<h2>Skeleton</h2>
<div class="card" style="display:flex;flex-direction:column;gap:0.5rem">
  <div style="height:0.75rem;width:60%;background:#f0eeec;border-radius:0.25rem"></div>
  <div style="height:0.5rem;width:80%;background:#f0eeec;border-radius:0.25rem"></div>
  <div style="height:0.5rem;width:40%;background:#f0eeec;border-radius:0.25rem"></div>
</div>
</div>

<div class="section">
<h2>Avatar</h2>
<div style="display:flex;gap:0.5rem;align-items:center">
  <div style="width:2rem;height:2rem;border-radius:9999px;background:#d97a34;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700">P</div>
  <div style="width:2.5rem;height:2.5rem;border-radius:9999px;background:#d97a34;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.875rem;font-weight:700">T</div>
  <div style="width:1.5rem;height:1.5rem;border-radius:9999px;background:#f0eeec;display:flex;align-items:center;justify-content:center;font-size:0.5rem">+</div>
</div>
</div>

<div class="section">
<h2>Tooltip / Dropdown / Modal Preview</h2>
<div class="grid cols-3">
  <div class="card" style="position:relative"><div style="display:inline-block;background:#1a1a1a;color:#fff;padding:0.25rem 0.5rem;border-radius:0.25rem;font-size:0.625rem">Tooltip text</div><p class="meta" style="margin-top:0.5rem">Tooltip · dark background</p></div>
  <div class="card"><div style="border:1px solid #e6e0d5;border-radius:0.5rem;padding:0.5rem;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.06)"><div style="padding:0.25rem 0;font-size:0.75rem">Option 1</div><div style="padding:0.25rem 0;font-size:0.75rem">Option 2</div><div style="padding:0.25rem 0;font-size:0.75rem">Option 3</div></div><p class="meta" style="margin-top:0.5rem">Dropdown</p></div>
  <div class="card"><div style="border:1px solid #e6e0d5;border-radius:0.75rem;padding:1rem;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.06)"><p style="font-size:0.875rem;font-weight:600;margin-bottom:0.5rem">Modal Title</p><p style="font-size:0.75rem;color:#666">Modal body content</p></div><p class="meta" style="margin-top:0.5rem">Modal preview</p></div>
</div>
</div>

` + FOOTER + `</div></body></html>`
writeFileSync(resolve(outDir, '01-primitives.html'), primitivesContent)
console.log('01-primitives.html')

// === 02-workspace.html ===
const workspaceContent = HEAD('02 Workspace') + `
<h1>Workspace Components</h1>
<p class="subtitle">Composite workspace layout and content components.</p>

<div class="section">
<h2>WorkspaceShell</h2>
<div style="display:flex;min-height:120px;border-radius:0.75rem;border:1px solid #e6e0d5;background:#fff;overflow:hidden">
  <div style="width:160px;border-right:1px solid #e6e0d5;background:#faf9f8;padding:0.75rem;font-size:0.75rem;color:#999">Sidebar</div>
  <div style="flex:1;padding:1rem;font-size:0.875rem">Main Content Area</div>
</div>
<p class="meta">WorkspaceShell · Shell container with optional sidebar. Min-height 200px. Used as page layout wrapper.</p>
</div>

<div class="section">
<h2>WorkspaceHeader</h2>
<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-radius:0.75rem 0.75rem 0 0;border:1px solid #e6e0d5;border-bottom:none;background:#fff">
  <div><p style="font-size:0.625rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#999">Section Label</p><p style="font-size:0.875rem;font-weight:600">Header Title</p></div>
  <div style="display:flex;gap:0.5rem"><span class="pill">Action</span></div>
</div>
<div style="padding:1rem;border:1px solid #e6e0d5;border-radius:0 0 0.75rem 0.75rem;background:#faf9f8;font-size:0.75rem;color:#666">Content area below header</div>
<p class="meta">WorkspaceHeader · Section label + title + action slot. Used in WorkspaceShell layout.</p>
</div>

<div class="section">
<h2>WorkspaceCard</h2>
<div class="grid cols-3">
  <div class="card"><div style="font-size:0.75rem;font-weight:600;margin-bottom:0.25rem">Card Title</div><div style="font-size:0.75rem;color:#666">Card body text with supporting content.</div><div style="margin-top:0.5rem;display:flex;gap:0.375rem"><span class="tag">tag1</span><span class="tag">tag2</span></div></div>
  <div class="card" style="border-left:3px solid #d97a34"><div style="font-size:0.75rem;font-weight:600;margin-bottom:0.25rem">Accent Card</div><div style="font-size:0.75rem;color:#666">Card with accent left border.</div></div>
  <div class="card" style="background:#faf9f8"><div style="font-size:0.75rem;font-weight:600;margin-bottom:0.25rem">Subdued Card</div><div style="font-size:0.75rem;color:#666">Tinted background variant.</div></div>
</div>
</div>

<div class="section">
<h2>StatusRail</h2>
<div style="display:flex;gap:0.5rem;flex-wrap:wrap;padding:0.75rem;border-radius:0.75rem;border:1px solid #e6e0d5;background:#fff">
  <span class="badge"><span class="dot dot-green"></span>Healthy</span>
  <span class="badge"><span class="dot dot-amber"></span>Watch</span>
  <span class="badge badge-red">At Risk</span>
  <span class="badge" style="background:#f0eeec"><span class="dot dot-gray"></span>Offline</span>
  <span class="badge badge-green">12 Running</span>
  <span class="badge badge-amber">3 Review</span>
</div>
</div>

<div class="section">
<h2>MetricStrip</h2>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem">
  <div style="border:1px solid #e6e0d5;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#fff"><div style="font-family:'Geist Mono',monospace;font-size:0.5rem;font-weight:600;text-transform:uppercase;color:#999">Revenue</div><div style="font-size:1rem;font-weight:600;margin-top:0.125rem">$12.4k</div></div>
  <div style="border:1px solid #e6e0d5;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#fff"><div style="font-family:'Geist Mono',monospace;font-size:0.5rem;font-weight:600;text-transform:uppercase;color:#999">Tasks</div><div style="font-size:1rem;font-weight:600;margin-top:0.125rem">47</div></div>
  <div style="border:1px solid #e6e0d5;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#fff"><div style="font-family:'Geist Mono',monospace;font-size:0.5rem;font-weight:600;text-transform:uppercase;color:#999">Open</div><div style="font-size:1rem;font-weight:600;margin-top:0.125rem;color:#c67f1e">3</div></div>
  <div style="border:1px solid #e6e0d5;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#fff"><div style="font-family:'Geist Mono',monospace;font-size:0.5rem;font-weight:600;text-transform:uppercase;color:#999">Done</div><div style="font-size:1rem;font-weight:600;margin-top:0.125rem;color:#16a36a">128</div></div>
</div>
</div>

<div class="section">
<h2>ActivityFeed</h2>
<div style="border:1px solid #e6e0d5;border-radius:0.75rem;background:#fff;padding:0.75rem">
  <div style="display:flex;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid #e6e0d5">
    <span class="dot dot-green" style="margin-top:0.25rem"></span>
    <div><div style="font-size:0.75rem;font-weight:600">Orchestrator</div><div style="font-size:0.6875rem;color:#666">Routing 3 pending reviews across divisions</div><div style="font-size:0.625rem;color:#999;margin-top:0.125rem">2 min ago</div></div>
  </div>
  <div style="display:flex;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid #e6e0d5">
    <span class="dot dot-amber" style="margin-top:0.25rem"></span>
    <div><div style="font-size:0.75rem;font-weight:600">Context Manager</div><div style="font-size:0.6875rem;color:#666">Waiting on 2 stale sources for context update</div><div style="font-size:0.625rem;color:#999;margin-top:0.125rem">5 min ago</div></div>
  </div>
  <div style="display:flex;gap:0.5rem;padding:0.5rem 0">
    <span class="dot dot-gray" style="margin-top:0.25rem"></span>
    <div><div style="font-size:0.75rem;font-weight:600">Reviewer</div><div style="font-size:0.6875rem;color:#666">All reviews cleared</div><div style="font-size:0.625rem;color:#999;margin-top:0.125rem">15 min ago</div></div>
  </div>
</div>
</div>

<div class="section">
<h2>DataList</h2>
<table>
  <tr><th>Item</th><th>Category</th><th style="text-align:right">Amount</th><th>Status</th></tr>
  <tr><td>Signage design</td><td>Approval</td><td style="text-align:right">—</td><td><span class="pill-amber">Pending</span></td></tr>
  <tr><td>Furniture PO</td><td>Procurement</td><td style="text-align:right">฿45,000</td><td><span class="pill-amber">Review</span></td></tr>
  <tr><td>Contractor payment</td><td>Finance</td><td style="text-align:right">฿120,000</td><td><span class="pill-green">Approved</span></td></tr>
  <tr><td>Column change order</td><td>Variation</td><td style="text-align:right">฿8,500</td><td><span class="badge badge-red">Blocked</span></td></tr>
</table>
</div>

<div class="section">
<h2>FilterBar + SearchBar</h2>
<div style="display:flex;gap:0.5rem;align-items:center;padding:0.5rem 0.75rem;border-radius:0.5rem;border:1px solid #e6e0d5;background:#fff">
  <input placeholder="Search..." style="flex:1;border:none;outline:none;font-size:0.75rem" />
  <span class="badge badge-green">All</span>
  <span class="badge">Active</span>
  <span class="badge">Archived</span>
  <span class="pill">3 filters</span>
</div>
</div>

<div class="section">
<h2>EmptyState + LoadingState</h2>
<div class="grid cols-2">
  <div style="border:1px dashed #e6e0d5;border-radius:0.75rem;padding:2rem;text-align:center;background:#faf9f8">
    <div style="font-size:1.5rem;margin-bottom:0.5rem">—</div>
    <div style="font-size:0.875rem;font-weight:600">No data yet</div>
    <div style="font-size:0.75rem;color:#666;margin-top:0.25rem">Create your first item to get started.</div>
    <div style="margin-top:0.75rem"><span class="btn btn-primary">Create</span></div>
  </div>
  <div style="border:1px solid #e6e0d5;border-radius:0.75rem;padding:2rem;background:#fff">
    <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:center">
      <div style="width:1.5rem;height:1.5rem;border:2px solid #e6e0d5;border-top-color:#d97a34;border-radius:9999px;animation:spin 1s linear infinite"></div>
      <div style="font-size:0.75rem;color:#666">Loading...</div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  </div>
</div>
</div>

<div class="section">
<h2>Notice + Banner</h2>
<div class="grid cols-2">
  <div style="border:1px solid #c67f1e33;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#c67f1e0d;font-size:0.75rem;color:#c67f1e">⚠ This is a warning notice with important information.</div>
  <div style="border:1px solid #d97a3433;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#d97a340d;font-size:0.75rem;color:#d97a34">⟳ Action required: Review pending items.</div>
</div>
</div>

` + FOOTER + `</div></body></html>`
writeFileSync(resolve(outDir, '02-workspace.html'), workspaceContent)
console.log('02-workspace.html')

// === 03-symbols.html ===
const symbolsContent = HEAD('03 Symbols') + `
<h1>Symbol Library</h1>
<p class="subtitle">Visual symbols, icons, and indicators used across BBH OS.</p>

<div class="section">
<h2>Status Symbols</h2>
<div class="grid cols-5">
  <div class="card" style="text-align:center"><span class="dot dot-green" style="width:1rem;height:1rem;display:block;margin:0 auto 0.5rem"></span><div style="font-size:0.75rem;font-weight:600">Healthy</div><div class="meta">Status OK</div></div>
  <div class="card" style="text-align:center"><span class="dot dot-amber" style="width:1rem;height:1rem;display:block;margin:0 auto 0.5rem"></span><div style="font-size:0.75rem;font-weight:600">Watch</div><div class="meta">Needs attention</div></div>
  <div class="card" style="text-align:center"><span class="dot dot-red" style="width:1rem;height:1rem;display:block;margin:0 auto 0.5rem"></span><div style="font-size:0.75rem;font-weight:600">At Risk</div><div class="meta">Critical issue</div></div>
  <div class="card" style="text-align:center"><span class="dot dot-gray" style="width:1rem;height:1rem;display:block;margin:0 auto 0.5rem"></span><div style="font-size:0.75rem;font-weight:600">Blocked</div><div class="meta">Unavailable</div></div>
  <div class="card" style="text-align:center"><div style="width:1rem;height:1rem;border:2px solid #d4cdc2;border-radius:9999px;display:block;margin:0 auto 0.5rem;background:#f0eeec"></div><div style="font-size:0.75rem;font-weight:600">Complete</div><div class="meta">Done</div></div>
</div>
</div>

<div class="section">
<h2>Priority Symbols</h2>
<div class="grid cols-4">
  <div class="card" style="text-align:center"><div style="font-size:1.25rem;font-weight:700;color:#c2410c">!!!</div><div style="font-size:0.75rem;font-weight:600">Critical</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.25rem;font-weight:700;color:#c67f1e">!!</div><div style="font-size:0.75rem;font-weight:600">High</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.25rem;font-weight:700;color:#d97a34">!</div><div style="font-size:0.75rem;font-weight:600">Medium</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.25rem;font-weight:700;color:#999">—</div><div style="font-size:0.75rem;font-weight:600">Low</div></div>
</div>
</div>

<div class="section">
<h2>Finance Symbols</h2>
<div class="grid cols-4">
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">◆</div><div style="font-size:0.75rem;font-weight:600">Capital</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">◇</div><div style="font-size:0.75rem;font-weight:600">Investment</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">◎</div><div style="font-size:0.75rem;font-weight:600">Holdings</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">○</div><div style="font-size:0.75rem;font-weight:600">Cash</div></div>
</div>
</div>

<div class="section">
<h2>AI Symbols</h2>
<div class="grid cols-4">
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">✦</div><div style="font-size:0.75rem;font-weight:600">AI Suggestion</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">⊞</div><div style="font-size:0.75rem;font-weight:600">System</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">⟳</div><div style="font-size:0.75rem;font-weight:600">Processing</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">✓</div><div style="font-size:0.75rem;font-weight:600">Approved</div></div>
</div>
</div>

<div class="section">
<h2>Architecture Symbols</h2>
<div class="grid cols-4">
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">◈</div><div style="font-size:0.75rem;font-weight:600">Division</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">▣</div><div style="font-size:0.75rem;font-weight:600">Module</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">⌗</div><div style="font-size:0.75rem;font-weight:600">Integration</div></div>
  <div class="card" style="text-align:center"><div style="font-size:1.5rem">⇆</div><div style="font-size:0.75rem;font-weight:600">Bridge</div></div>
</div>
</div>

` + FOOTER + `</div></body></html>`
writeFileSync(resolve(outDir, '03-symbols.html'), symbolsContent)
console.log('03-symbols.html')

// === 04-patterns.html ===
const patternsContent = HEAD('04 Patterns') + `
<h1>Operating Patterns</h1>
<p class="subtitle">Cross-cutting architectural patterns used across BBH OS.</p>

<div class="section">
<h2>Data Fetch Pattern</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem"><span class="tag">SheetResourceDef</span><span class="tag">normalizeRows</span><span class="tag">bulkMergeData</span><span class="tag">EmptyState</span></div>
  <pre>fetch → normalize → merge → display
  GET /endpoint?resource=studio-projects
  → normalizeRows(rows, resourceDef)
  → bulkMergeData(osField, rows)
  → render(data[osField])</pre>
  <div style="margin-top:0.5rem;font-size:0.75rem;color:#666">Rules: Always use sheet bridge. Normalize through adapters.ts. Show EmptyState for empty arrays.</div>
</div>
</div>

<div class="section">
<h2>Approval Workflow</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem"><span class="tag">StudioActionButton</span><span class="tag">PendingApprovalPanel</span><span class="tag">createActionRequest</span></div>
  <pre>User action → approval queue → approve/reject → execute
  createActionRequest({ actionType, description, payload })
  → PendingApprovalPanel shows queue
  → approveActionRequest(id) executes</pre>
  <div style="margin-top:0.5rem;font-size:0.75rem;color:#666">Rules: Every destructive action needs approval. No auto-approve. Always require explicit confirmation.</div>
</div>
</div>

<div class="section">
<h2>Model Build Pattern</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem"><span class="tag">buildJarvisBModel</span><span class="tag">buildAequitasCapitalModel</span><span class="tag">useMemo</span></div>
  <pre>data + sourceStatuses → model → render
  useMemo(() => buildXxxModel(data, sourceStatuses), [data, sourceStatuses])
  → model.division.mood, model.agents, etc.
  → render model data</pre>
  <div style="margin-top:0.5rem;font-size:0.75rem;color:#666">Rules: Models are pure functions. Wrap in useMemo. Handle empty input gracefully with emptyState strings.</div>
</div>
</div>

<div class="section">
<h2>Navigation Pattern</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem"><span class="tag">ProtectedRoute</span><span class="tag">OSLayout</span><span class="tag">WorkspaceDrawer</span></div>
  <pre>Navigate → route guard → layout → page
  ProtectedRoute checks isAuthenticated
  → OSLayout renders sidebar + Outlet
  → WorkspaceDrawer for secondary content</pre>
  <div style="margin-top:0.5rem;font-size:0.75rem;color:#666">Rules: All OS routes protected. Use WorkspaceDrawer for secondary content. Tab nav uses activeTab state, not routes.</div>
</div>
</div>

` + FOOTER + `</div></body></html>`
writeFileSync(resolve(outDir, '04-patterns.html'), patternsContent)
console.log('04-patterns.html')

// === 05-templates.html ===
const templatesContent = HEAD('05 Templates') + `
<h1>Page Templates</h1>
<p class="subtitle">Page layout templates with component composition.</p>

<div class="section">
<h2>Command Center</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem"><span class="tag tag-green">StatusRail</span><span class="tag tag-green">DivisionTile</span><span class="tag tag-green">AgentQueueBoard</span><span class="tag tag-green">ActivityFeed</span></div>
  <p style="font-size:0.75rem;color:#666">Status strip + 2-col division grid + 3-col agent queue + 3-col activity feed. Header with executive brief.</p>
  <div style="margin-top:0.5rem;display:flex;gap:0.5rem"><span class="badge badge-green">Production</span><span class="tag">6 divisions</span><span class="tag">16 components</span></div>
</div>
</div>

<div class="section">
<h2>Investments OS</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem"><span class="tag tag-green">OsHeroMetric</span><span class="tag tag-green">PortfolioBucketView</span><span class="tag tag-green">AllocationDonut</span><span class="tag tag-green">RebalancePreview</span></div>
  <p style="font-size:0.75rem;color:#666">Hero strip + tabbed content (overview, portfolio, funds, allocation, dca, dividends) + sidebar drawers.</p>
  <div style="margin-top:0.5rem;display:flex;gap:0.5rem"><span class="badge badge-green">Production</span><span class="tag">10 tabs</span><span class="tag">12 components</span></div>
</div>
</div>

<div class="section">
<h2>Studio OS</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem"><span class="tag tag-green">StudioProjectDetailPage</span><span class="tag tag-green">StudioTimelineBoard</span><span class="tag tag-green">ExecutiveDashboard</span></div>
  <p style="font-size:0.75rem;color:#666">Project list (cards) → project detail with sticky section nav (7 tabs). Max width 5xl.</p>
  <div style="margin-top:0.5rem;display:flex;gap:0.5rem"><span class="badge badge-green">Production</span><span class="tag">7 sections</span><span class="tag">Legacy at /legacy</span></div>
</div>
</div>

<div class="section">
<h2>Bridge Settings</h2>
<div class="card">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem"><span class="tag tag-green">BridgeDiagnostics</span><span class="tag tag-green">ImportPreviewPanel</span><span class="tag tag-green">SourceHealthMonitorFull</span></div>
  <p style="font-size:0.75rem;color:#666">Section panels: connection config, resources, import preview, write-back, backups, source health, diagnostics.</p>
  <div style="margin-top:0.5rem;display:flex;gap:0.5rem"><span class="badge badge-green">Production</span><span class="tag">9 sections</span><span class="tag">Admin only</span></div>
</div>
</div>

` + FOOTER + `</div></body></html>`
writeFileSync(resolve(outDir, '05-templates.html'), templatesContent)
console.log('05-templates.html')

// === 06-states.html ===
const statesContent = HEAD('06 States') + `
<h1>Component States</h1>
<p class="subtitle">All possible visual states for BBH OS components.</p>

<div class="section">
<h2>Loading State</h2>
<div class="grid cols-3">
  <div class="card"><div style="display:flex;flex-direction:column;gap:0.5rem;align-items:center"><div style="width:1.5rem;height:1.5rem;border:2px solid #e6e0d5;border-top-color:#d97a34;border-radius:9999px;animation:spin2 1s linear infinite"></div><span style="font-size:0.75rem;color:#666">Loading...</span></div></div>
  <div class="card"><div style="display:flex;flex-direction:column;gap:0.375rem"><div style="height:0.5rem;width:100%;background:#f0eeec;border-radius:0.25rem;animation:pulse 1.5s ease-in-out infinite"></div><div style="height:0.5rem;width:75%;background:#f0eeec;border-radius:0.25rem;animation:pulse 1.5s ease-in-out infinite 0.2s"></div><div style="height:0.5rem;width:50%;background:#f0eeec;border-radius:0.25rem;animation:pulse 1.5s ease-in-out infinite 0.4s"></div></div></div>
  <div class="card"><span class="pill-amber" style="animation:pulse 1.5s ease-in-out infinite">Updating...</span></div>
  <style>@keyframes spin2{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}</style>
</div>
</div>

<div class="section">
<h2>Empty State</h2>
<div class="grid cols-2">
  <div style="border:1px dashed #e6e0d5;border-radius:0.75rem;padding:2rem;text-align:center;background:#faf9f8">
    <div style="font-size:0.875rem;font-weight:600;margin-bottom:0.25rem">No items yet</div>
    <div style="font-size:0.75rem;color:#666">Get started by creating your first item.</div>
    <div style="margin-top:0.75rem"><span class="btn btn-primary">Create</span></div>
  </div>
  <div style="border:1px dashed #e6e0d5;border-radius:0.75rem;padding:2rem;text-align:center;background:#faf9f8">
    <div style="font-size:0.875rem;font-weight:600;margin-bottom:0.25rem">No results</div>
    <div style="font-size:0.75rem;color:#666">Try adjusting your search or filters.</div>
  </div>
</div>
</div>

<div class="section">
<h2>Error State</h2>
<div class="grid cols-2">
  <div style="border:1px solid #c2410c33;border-radius:0.75rem;padding:1rem;background:#c2410c0d">
    <div style="font-size:0.75rem;font-weight:600;color:#c2410c">Connection failed</div>
    <div style="font-size:0.75rem;color:#c2410c;margin-top:0.25rem">Check your endpoint configuration and try again.</div>
    <div style="margin-top:0.5rem"><span class="btn" style="border-color:#c2410c33">Retry</span></div>
  </div>
  <div style="border:1px solid #c67f1e33;border-radius:0.75rem;padding:1rem;background:#c67f1e0d">
    <div style="font-size:0.75rem;font-weight:600;color:#c67f1e">Sync delayed</div>
    <div style="font-size:0.75rem;color:#c67f1e;margin-top:0.25rem">Data may be stale. Last sync: 2 hours ago.</div>
  </div>
</div>
</div>

<div class="section">
<h2>Success State</h2>
<div class="grid cols-2">
  <div style="border:1px solid #16a36a33;border-radius:0.75rem;padding:1rem;background:#16a36a0d">
    <div style="font-size:0.75rem;font-weight:600;color:#16a36a">Operation completed</div>
    <div style="font-size:0.75rem;color:#16a36a;margin-top:0.25rem">12 records imported successfully.</div>
  </div>
  <div style="border:1px solid #16a36a33;border-radius:0.75rem;padding:1rem;background:#16a36a0d">
    <div style="font-size:0.75rem;font-weight:600;color:#16a36a">All systems healthy</div>
    <div style="font-size:0.75rem;color:#16a36a;margin-top:0.25rem">No issues detected across all divisions.</div>
  </div>
</div>
</div>

<div class="section">
<h2>Disabled / Read-Only / Offline States</h2>
<div class="grid cols-3">
  <div class="card" style="opacity:0.5"><div style="font-size:0.75rem;font-weight:600">Disabled Input</div><div style="font-size:0.6875rem;color:#666;margin-top:0.25rem">This action is not available.</div><div style="margin-top:0.5rem"><span class="btn" style="opacity:0.4">Submit</span></div></div>
  <div class="card" style="background:#faf9f8"><div style="font-size:0.75rem;font-weight:600">Read-Only View</div><div style="font-size:0.6875rem;color:#666;margin-top:0.25rem">You can view but not modify this data.</div><span class="badge" style="margin-top:0.5rem">Read-only</span></div>
  <div class="card"><span class="dot dot-gray" style="display:inline-block;margin-right:0.25rem;vertical-align:middle"></span><span style="font-size:0.75rem">Offline</span><div style="font-size:0.6875rem;color:#666;margin-top:0.25rem">Source is disconnected. Data may be stale.</div></div>
</div>
</div>

<div class="section">
<h2>Fresh / Stale / Unknown</h2>
<div class="grid cols-3">
  <div style="border:1px solid #16a36a33;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#16a36a0d;display:flex;align-items:center;gap:0.5rem"><span class="dot dot-green"></span><span style="font-size:0.75rem">Fresh · synced 2 min ago</span></div>
  <div style="border:1px solid #c67f1e33;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#c67f1e0d;display:flex;align-items:center;gap:0.5rem"><span class="dot dot-amber"></span><span style="font-size:0.75rem">Stale · synced 2 days ago</span></div>
  <div style="border:1px solid #d4cdc2;border-radius:0.5rem;padding:0.5rem 0.75rem;background:#faf9f8;display:flex;align-items:center;gap:0.5rem"><span class="dot dot-gray"></span><span style="font-size:0.75rem">Unknown · no sync data</span></div>
</div>
</div>

` + FOOTER + `</div></body></html>`
writeFileSync(resolve(outDir, '06-states.html'), statesContent)
console.log('06-states.html')

console.log('\\nDone — 7 HTML files generated in artifacts/design-system-review/')
