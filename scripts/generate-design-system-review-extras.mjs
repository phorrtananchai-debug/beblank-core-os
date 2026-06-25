import { writeFileSync, readFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'artifacts', 'design-system-review')
mkdirSync(outDir, { recursive: true })

const CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'IBM Plex Sans Thai', system-ui, sans-serif; background: #f2efe9; color: #1a1a1a; padding: 2rem; }
.container { max-width: 1200px; margin: 0 auto; }
h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
h2 { font-size: 1.1rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem; }
h3 { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
.subtitle { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
.meta { font-family: 'Geist Mono', monospace; font-size: 0.625rem; color: #999; }
.card { border: 1px solid #e6e0d5; border-radius: 0.75rem; background: #fff; padding: 1rem; }
.grid { display: grid; gap: 1rem; }
.cols-2 { grid-template-columns: repeat(2, 1fr); }.cols-3 { grid-template-columns: repeat(3, 1fr); }.cols-4 { grid-template-columns: repeat(4, 1fr); }.cols-5 { grid-template-columns: repeat(5, 1fr); }
.badge { display: inline-flex; align-items: center; gap: 0.25rem; border-radius: 9999px; padding: 0.125rem 0.5rem; font-size: 0.625rem; font-weight: 600; border: 1px solid #e6e0d5; background: #fff; color: #1a1a1a; }
.tag { display: inline-block; background: #f0eeec; border-radius: 0.25rem; padding: 0.125rem 0.375rem; font-family: 'Geist Mono', monospace; font-size: 0.5rem; color: #666; }
.tag-green { background: #16a36a1a; color: #16a36a; }
.pill { display: inline-block; border-radius: 9999px; padding: 0.125rem 0.5rem; font-size: 0.625rem; font-weight: 600; background: #f0eeec; color: #666; border: 1px solid #e6e0d5; }
.pill-green { background: #16a36a1a; color: #16a36a; border-color: #16a36a33; }
.pill-amber { background: #c67f1e1a; color: #c67f1e; border-color: #c67f1e33; }
.dot { display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 9999px; }
.dot-green { background: #16a36a; }.dot-amber { background: #c67f1e; }.dot-red { background: #c2410c; }.dot-gray { background: #d4cdc2; }
.btn { display: inline-flex; align-items: center; gap: 0.375rem; border-radius: 0.5rem; padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 600; border: 1px solid #e6e0d5; background: #fff; color: #1a1a1a; }
.btn-primary { background: #d97a34; color: #fff; border-color: #d97a34; }
table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
th { text-align: left; padding: 0.5rem; font-weight: 600; color: #999; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e6e0d5; }
td { padding: 0.5rem; border-bottom: 1px solid #e6e0d5; }
pre { font-family: 'Geist Mono', monospace; font-size: 0.625rem; background: #faf9f8; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #e6e0d5; overflow-x: auto; }
.section { margin-top: 3rem; }
.step { display: flex; gap: 0.75rem; padding: 0.75rem; border: 1px solid #e6e0d5; border-radius: 0.5rem; background: #fff; margin-bottom: 0.5rem; }
.step-num { width: 1.5rem; height: 1.5rem; border-radius: 9999px; background: #f0eeec; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; color: #666; font-family: 'Geist Mono', monospace; }
.flow-arrow { text-align: center; font-size: 0.75rem; color: #999; padding: 0.25rem 0; }
.box { border: 1px solid #e6e0d5; border-radius: 0.375rem; padding: 0.5rem; background: #faf9f8; font-size: 0.625rem; font-family: 'Geist Mono', monospace; color: #666; }
`
const H = (t) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t} — BBH Design System</title><style>${CSS}</style></head><body><div class="container">`
const F = `</div></body></html>`

// === 07-anatomy.html ===
writeFileSync(resolve(outDir, '07-anatomy.html'), H('07 Anatomy') + `
<h1>Component Anatomy</h1><p class="subtitle">Structural breakdown of key BBH OS components.</p>

<div class="section"><h2>WorkspaceShell Anatomy</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────────┐
│  WorkspaceShell                                  │
│  ┌──────────┬───────────────────────────────┐    │
│  │ Sidebar  │  Main Content Area            │    │
│  │ (w-48)   │  (flex-1)                     │    │
│  │          │  ┌─────────────────────────┐   │    │
│  │ nav      │  │ WorkspaceHeader         │   │    │
│  │ meta     │  │ label / title / actions │   │    │
│  │ status   │  ├─────────────────────────┤   │    │
│  │          │  │ WorkspaceSection         │   │    │
│  │          │  │ cards, tables, lists     │   │    │
│  │          │  └─────────────────────────┘   │    │
│  └──────────┴───────────────────────────────┘    │
└──────────────────────────────────────────────────┘
</pre><p class="meta">Flexbox layout. Sidebar optional (border-right). Content area fills remaining space.</p></div>

<div class="section"><h2>DataList Anatomy</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────┐
│  &lt;thead&gt;  uppercase labels, letter-spacing   │
│  ├────────┬────────┬────────┬────────────────┤
│  &lt;tbody&gt;  Item A   │ Status │ Value          │
│  │        ├────────┼────────┼────────────────┤
│  │        │ Item B │ ⬤     │ 1,234          │
│  │        ├────────┼────────┼────────────────┤
│  │        │ Item C │ ⬤     │ 567            │
│  └────────┴────────┴────────┴────────────────┘
│  Text left · Numeric right · Status badges    │
└──────────────────────────────────────────────┘
</pre><p class="meta">HTML table. Left-align text, right-align numbers, pill/badge for status.</p></div>

<div class="section"><h2>ActivityFeed Anatomy</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────┐
│  ● Running   Agent Name                      │
│  │          Current task description         │
│  │          2 min ago                        │
│  ● Watch     Another Agent                   │
│  │          Waiting on review               │
│  │          5 min ago                        │
│  ○ Complete  Done Agent                      │
│             All tasks complete              │
│             15 min ago                       │
└──────────────────────────────────────────────┘
</pre><p class="meta">Status dot + agent name + task + timestamp. Dots colored by state.</p></div>

<div class="section"><h2>Modal/Sheet Anatomy</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────┐
│  Overlay (rgba(0,0,0,0.3))                  │
│  ┌──────────────────────────────────────┐    │
│  │  Modal Card (max-w-md)               │    │
│  │  Title            [Close]            │    │
│  │  ─────────────────────────────────   │    │
│  │  Body content                        │    │
│  │                                       │    │
│  │  [Cancel]  [Confirm]                 │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
</pre><p class="meta">Centered card on dark overlay. Title, body, action footer. Optional close button.</p></div>
` + F)

// === 08-scale.html ===
writeFileSync(resolve(outDir, '08-scale.html'), H('08 Scale') + `
<h1>Component Scale</h1><p class="subtitle">Size, density, and spacing scales across all BBH components.</p>

<div class="section"><h2>Button Sizes</h2>
<div class="grid cols-3">
  <div class="card"><div class="btn" style="padding:0.25rem 0.5rem;font-size:0.625rem">Small</div><p class="meta" style="margin-top:0.5rem">px-2 py-1 · 10px</p></div>
  <div class="card"><div class="btn">Default</div><p class="meta" style="margin-top:0.5rem">px-3 py-1.5 · 12px</p></div>
  <div class="card"><div class="btn btn-primary" style="padding:0.5rem 1rem;font-size:0.875rem">Large</div><p class="meta" style="margin-top:0.5rem">px-4 py-2 · 14px</p></div>
</div></div>

<div class="section"><h2>Card Density</h2>
<div class="grid cols-3">
  <div class="card" style="padding:0.5rem"><div style="font-size:0.75rem;font-weight:600">Compact</div><div class="meta" style="margin-top:0.25rem">p-2 · dense lists</div></div>
  <div class="card" style="padding:0.75rem"><div style="font-size:0.75rem;font-weight:600">Default</div><div class="meta" style="margin-top:0.25rem">p-3 · standard cards</div></div>
  <div class="card" style="padding:1rem"><div style="font-size:0.75rem;font-weight:600">Relaxed</div><div class="meta" style="margin-top:0.25rem">p-4 · detail views</div></div>
</div></div>

<div class="section"><h2>Typography Scale</h2>
<table><tr><th>Name</th><th>Size</th><th>Weight</th><th>Usage</th></tr>
<tr><td>Display 1</td><td>2.4rem</td><td>700</td><td>Page title</td></tr>
<tr><td>Display 2</td><td>1.9rem</td><td>600</td><td>Section heading</td></tr>
<tr><td>Heading 3</td><td>1.1rem</td><td>600</td><td>Card title</td></tr>
<tr><td>Body</td><td>0.875rem</td><td>400</td><td>Default text</td></tr>
<tr><td>Body Small</td><td>0.75rem</td><td>400</td><td>Secondary text</td></tr>
<tr><td>Caption</td><td>0.625rem</td><td>500</td><td>Labels, badges</td></tr>
<tr><td>Mono</td><td>0.625rem</td><td>500</td><td>Code, metrics</td></tr>
<tr><td>Mono Small</td><td>0.5rem</td><td>500</td><td>Tiny labels</td></tr>
</table></div>

<div class="section"><h2>Radius Scale</h2>
<div class="grid cols-3">
  <div style="border:1px solid #e6e0d5;border-radius:0.25rem;padding:1rem;text-align:center"><span class="meta">sm · 4px</span></div>
  <div style="border:1px solid #e6e0d5;border-radius:0.5rem;padding:1rem;text-align:center"><span class="meta">md · 8px</span></div>
  <div style="border:1px solid #e6e0d5;border-radius:0.75rem;padding:1rem;text-align:center"><span class="meta">lg · 12px</span></div>
  <div style="border:1px solid #e6e0d5;border-radius:1rem;padding:1rem;text-align:center"><span class="meta">xl · 16px</span></div>
  <div style="border:1px solid #e6e0d5;border-radius:1.5rem;padding:1rem;text-align:center"><span class="meta">2xl · 24px</span></div>
  <div style="border:1px solid #e6e0d5;border-radius:9999px;padding:1rem;text-align:center"><span class="meta">full · pill</span></div>
</div></div>

<div class="section"><h2>Table Density</h2>
<table><tr><th>Density</th><th>Padding</th><th>Usage</th></tr>
<tr><td>Compact</td><td>px-3 py-1.5</td><td>Dense data tables</td></tr>
<tr><td>Default</td><td>px-3 py-2.5</td><td>Standard list rows</td></tr>
<tr><td>Relaxed</td><td>px-4 py-3</td><td>Detail lists</td></tr>
</table></div>
` + F)

// === 09-recipes.html ===
writeFileSync(resolve(outDir, '09-recipes.html'), H('09 Recipes') + `
<h1>Composition Recipes</h1><p class="subtitle">Common page composition patterns using BBH components.</p>

<div class="section"><h2>Project List Recipe</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────┐
│  WorkspaceShell                              │
│  ├── WorkspaceHeader (Projects / N items)    │
│  ├── FilterBar (search + status tabs)        │
│  └── DataList (name · phase · status · due)  │
│       └── each row → Link to Project Detail  │
└──────────────────────────────────────────────┘
</pre><p class="meta">Components: WorkspaceShell, WorkspaceHeader, FilterBar, DataList, Link</p></div>

<div class="section"><h2>Approval Review Recipe</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────┐
│  WorkspaceShell                              │
│  ├── WorkspaceHeader (Review Queue)          │
│  ├── StatusRail (pending/approved/rejected)  │
│  └── DataList (item · requester · status)   │
│       └── DetailPanel on row click            │
│           ├── item details                   │
│           ├── approve button                 │
│           └── reject button                  │
└──────────────────────────────────────────────┘
</pre><p class="meta">Components: Shell, Header, StatusRail, DataList, DetailPanel, Button</p></div>

<div class="section"><h2>Bridge Monitor Recipe</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────┐
│  WorkspaceShell                              │
│  ├── WorkspaceHeader (Sheet Bridge)          │
│  ├── MetricStrip (resources/ok/warn/offline) │
│  ├── StatusRail (per-resource health)        │
│  └── DataList (resource · rows · status)     │
│       └── row action → fetch + preview       │
└──────────────────────────────────────────────┘
</pre><p class="meta">Components: Shell, Header, MetricStrip, StatusRail, DataList, ImportPreviewPanel</p></div>

<div class="section"><h2>Command Center Recipe</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────┐
│  WorkspaceShell                              │
│  ├── WorkspaceHeader (Command Center)        │
│  ├── MetricStrip (6 system KPIs)            │
│  ├── StatusRail (division moods)             │
│  ├── Division Matrix (2-col cards)           │
│  │    └── WorkspaceCard × 5 divisions        │
│  ├── ActivityFeed (agent activity)           │
│  └── DataList (top priorities)               │
└──────────────────────────────────────────────┘
</pre><p class="meta">Components: Shell, Header, MetricStrip, StatusRail, Card, ActivityFeed, DataList</p></div>
` + F)

// === 10-blueprints.html ===
writeFileSync(resolve(outDir, '10-blueprints.html'), H('10 Blueprints') + `
<h1>Layout Blueprints</h1><p class="subtitle">Wireframe-style page layouts for each BBH OS workspace.</p>

<div class="section"><h2>Studio OS Blueprint</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────────────────┐
│  ← Back to Projects               Project Detail        │
│  Karun Hospitality / Khon Kaen                          │
│  Karun Central Khon Kaen                                │
│  [status] [phase] [timeline] [inspection] [workscope]   │
├──────────────────────────────────────────────────────────┤
│  Overview │ Tasks │ Timeline │ Site │ Docs │ Reviews │ AI│
├──────────────────────────────────────────────────────────┤
│  Section content based on active tab                     │
│                                                          │
│  Overview: Summary cards + Today/This Week               │
│  Tasks: Work scope list with actions                     │
│  Timeline: Phases + milestones                           │
│  Site: Site watch + issues + billing gates               │
│  Docs: Document list with issue/approve/archive          │
│  Reviews: Review queue with approve/reject               │
│  AI Context: AI context cards                            │
└──────────────────────────────────────────────────────────┘
</pre></div>

<div class="section"><h2>Investments Blueprint</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────────────────┐
│  Total Portfolio  Invested  Dividends  Income  Return    │
├──────────────────────────────────────────────────────────┤
│  Overview │ Portfolio │ Funds │ Alloc │ DCA │ Dividends  │
├──────────────────────────────────────────────────────────┤
│  Tab content                                             │
│                                                          │
│  Overview: Summary + category breakdown                  │
│  Portfolio: Add asset form + Finnhub refresh             │
│  Funds: Thai fund bucket view + NAV table               │
│  Allocation: Donut chart + comparison + rebalance        │
│  DCA: DCA plan list with approve/skip                    │
│  Dividends: Summary + by-asset table + history           │
└──────────────────────────────────────────────────────────┘
</pre></div>

<div class="section"><h2>Command Center Blueprint</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
┌──────────────────────────────────────────────────────────┐
│  System Mood  │ Agents │ Tasks │ Reviews │ Done │ Updated│
├──────────────────────────────────────────────────────────┤
│  Division Matrix (2 columns)                             │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ Jarvis B HQ  │  │ Aequitas     │                     │
│  │ Active: 3    │  │ Watch: 2     │                     │
│  ├──────────────┤  ├──────────────┤                     │
│  │ Creator      │  │ BBH Studio   │                     │
│  │ Episodes: 5  │  │ Projects: 3  │                     │
│  ├──────────────┤  ├──────────────┤                     │
│  │ My House     │  │              │                     │
│  │ Offline      │  │              │                     │
│  └──────────────┘  └──────────────┘                     │
├──────────────────────────────────────────────────────────┤
│  Agent Queue (3 columns)                                │
│  Running  │  Waiting Review  │  Completed                │
└──────────────────────────────────────────────────────────┘
</pre></div>
` + F)

// === 11-interactions.html ===
writeFileSync(resolve(outDir, '11-interactions.html'), H('11 Interactions') + `
<h1>Interaction States & Flows</h1><p class="subtitle">State transition flows for common BBH OS patterns.</p>

<div class="section"><h2>Loading → Success → Idle</h2>
<div class="step"><span class="step-num">1</span><div><strong>Loading</strong><p class="meta">Spinner or skeleton appears</p></div></div>
<div class="flow-arrow">↓ fetch completes</div>
<div class="step"><span class="step-num">2</span><div><strong>Success</strong><p class="meta">Data rendered, EmptyState hidden</p></div></div>
<div class="flow-arrow">↓ timeout (30s no interaction)</div>
<div class="step"><span class="step-num">3</span><div><strong>Idle</strong><p class="meta">Data visible, no activity</p></div></div>
</div>

<div class="section"><h2>Draft → Review → Approved</h2>
<div class="step"><span class="step-num">1</span><div><strong>Draft</strong><p class="meta">User creates item. Status badge: draft</p></div></div>
<div class="flow-arrow">↓ submit for review</div>
<div class="step"><span class="step-num">2</span><div><strong>Review</strong><p class="meta">Pending approval. Badge: amber</p></div></div>
<div class="flow-arrow">↓ reviewer approves</div>
<div class="step"><span class="step-num">3</span><div><strong>Approved</strong><p class="meta">Item live. Badge: green</p></div></div>
</div>

<div class="section"><h2>Online → Stale → Offline</h2>
<div class="step"><span class="step-num">1</span><div><strong>Online</strong><p class="meta">Source connected, data fresh. Green dot.</p></div></div>
<div class="flow-arrow">↓ no sync for N hours</div>
<div class="step"><span class="step-num">2</span><div><strong>Stale</strong><p class="meta">Source connected but data outdated. Amber dot.</p></div></div>
<div class="flow-arrow">↓ connection lost</div>
<div class="step"><span class="step-num">3</span><div><strong>Offline</strong><p class="meta">Source disconnected. Gray dot. Fallback data shown.</p></div></div>
</div>

<div class="section"><h2>Empty → Create → Populated</h2>
<div class="step"><span class="step-num">1</span><div><strong>Empty</strong><p class="meta">EmptyState shown with CTA</p></div></div>
<div class="flow-arrow">↓ user clicks Create</div>
<div class="step"><span class="step-num">2</span><div><strong>Create</strong><p class="meta">Form or drawer opens</p></div></div>
<div class="flow-arrow">↓ form submitted</div>
<div class="step"><span class="step-num">3</span><div><strong>Populated</strong><p class="meta">Item appears in DataList. EmptyState hidden.</p></div></div>
</div>

<div class="section"><h2>Warning → Blocked → Resolved</h2>
<div class="step"><span class="step-num">1</span><div><strong>Warning</strong><p class="meta">Amber status · Needs attention</p></div></div>
<div class="flow-arrow">↓ issue escalates</div>
<div class="step"><span class="step-num">2</span><div><strong>Blocked</strong><p class="meta">Red status · Action required</p></div></div>
<div class="flow-arrow">↓ fix applied</div>
<div class="step"><span class="step-num">3</span><div><strong>Resolved</strong><p class="meta">Green status · Complete</p></div></div>
</div>
` + F)

// === 12-responsive.html ===
writeFileSync(resolve(outDir, '12-responsive.html'), H('12 Responsive') + `
<h1>Responsive Behavior</h1><p class="subtitle">Desktop, tablet, and mobile adaptation rules for BBH OS.</p>

<div class="section"><h2>Sidebar Collapse</h2>
<table><tr><th>Breakpoint</th><th>Sidebar</th><th>Content</th></tr>
<tr><td>>= 1280px (xl)</td><td>Visible (w-72)</td><td>Full width</td></tr>
<tr><td>768-1279px (md-lg)</td><td>Collapsed to icon</td><td>Full width</td></tr>
<tr><td>< 768px (sm)</td><td>Hidden (hamburger)</td><td>Full width</td></tr>
</table></div>

<div class="section"><h2>Card Grid Collapse</h2>
<table><tr><th>Breakpoint</th><th>Columns</th><th>Card Size</th></tr>
<tr><td>>= 1280px</td><td>4-6</td><td>Full with labels</td></tr>
<tr><td>768-1279px</td><td>2-3</td><td>Compact</td></tr>
<tr><td>< 768px</td><td>1</td><td>Full width</td></tr>
</table></div>

<div class="section"><h2>Table to List Behavior</h2>
<table><tr><th>Breakpoint</th><th>Display</th></tr>
<tr><td>>= 768px</td><td>HTML table with all columns</td></tr>
<tr><td>< 768px</td><td>Card list (label: value per row)</td></tr>
</table>
<p class="meta">Hide low-priority columns on tablet. Convert to stacked cards on mobile.</p></div>

<div class="section"><h2>Priority Content Order</h2>
<p style="font-size:0.75rem;color:#666">On mobile, content priority is:</p>
<ol style="font-size:0.75rem;color:#666;margin-top:0.5rem;padding-left:1.25rem">
  <li>Page title + back button</li>
  <li>Primary metric / status</li>
  <li>Core content (list/cards)</li>
  <li>Secondary actions</li>
  <li>Metadata / timestamps</li>
  <li>Sidebar / inspector content</li>
</ol></div>
` + F)

// === 13-accessibility.html ===
writeFileSync(resolve(outDir, '13-accessibility.html'), H('13 Accessibility') + `
<h1>Accessibility Rules</h1><p class="subtitle">Keyboard, focus, color, and motion accessibility standards.</p>

<div class="section"><h2>Keyboard Navigation</h2>
<table><tr><th>Element</th><th>Keyboard Behavior</th></tr>
<tr><td>Button, Link</td><td>Enter/Space to activate. Visible focus ring.</td></tr>
<tr><td>Input, Select</td><td>Tab to focus. Escape to blur.</td></tr>
<tr><td>Dropdown</td><td>Enter to open. Arrow keys to navigate. Escape to close.</td></tr>
<tr><td>Modal</td><td>Auto-focus first input. Tab cycle within modal. Escape to close.</td></tr>
<tr><td>Table</td><td>Tab into table. Arrow keys to navigate cells (if interactive).</td></tr>
</table></div>

<div class="section"><h2>Focus States</h2>
<div class="grid cols-2">
  <div style="border:1px solid #d97a34;border-radius:0.5rem;padding:0.5rem 0.75rem;outline:2px solid #d97a34;outline-offset:2px;font-size:0.75rem">Focused button with outline ring</div>
  <div style="border:1px solid #d97a33;border-radius:0.5rem;padding:0.5rem 0.75rem;box-shadow:0 0 0 2px #d97a34;font-size:0.75rem">Focused input with box-shadow ring</div>
</div>
<p class="meta">Focus indicator: 2px solid #d97a34 with 2px offset. Never remove outline without replacement.</p></div>

<div class="section"><h2>Color & Status</h2>
<ul style="font-size:0.75rem;color:#666;margin-top:0.5rem;padding-left:1.25rem">
  <li><strong>Color is not used alone</strong> — always pair with icon, text label, or badge</li>
  <li><strong>Status dots</strong> have visible labels next to them (e.g., dot + "Healthy")</li>
  <li><strong>Pills and badges</strong> have text labels, not just colors</li>
  <li><strong>Links</strong> are underlined or have a distinct visual (icon/color)</li>
</ul></div>

<div class="section"><h2>Reduced Motion</h2>
<ul style="font-size:0.75rem;color:#666;margin-top:0.5rem;padding-left:1.25rem">
  <li>All animations respect <code>prefers-reduced-motion</code></li>
  <li>Progress bar fills are instant when reduced motion is enabled</li>
  <li>Skeleton pulse animation is disabled</li>
  <li>Modal transitions are instant (no slide)</li>
</ul></div>

<div class="section"><h2>Hit Targets</h2>
<table><tr><th>Element</th><th>Minimum Size</th></tr>
<tr><td>Buttons</td><td>32px height</td></tr>
<tr><td>Input fields</td><td>36px height</td></tr>
<tr><td>Clickable list rows</td><td>40px height</td></tr>
<tr><td>Icon buttons</td><td>28px × 28px</td></tr>
</table></div>

<div class="section"><h2>Semantic Layout</h2>
<ul style="font-size:0.75rem;color:#666;margin-top:0.5rem;padding-left:1.25rem">
  <li>Use <code>&lt;nav&gt;</code> for navigation regions</li>
  <li>Use <code>&lt;main&gt;</code> for primary content</li>
  <li>Use <code>&lt;section&gt;</code> for content groupings</li>
  <li>Use <code>&lt;header&gt;</code> for page/panel headers</li>
  <li>Use <code>&lt;table&gt;</code> for tabular data (not divs)</li>
</ul></div>
` + F)

// === 14-relationships.html ===
writeFileSync(resolve(outDir, '14-relationships.html'), H('14 Relationships') + `
<h1>Component Relationship Map</h1><p class="subtitle">Dependency graph between components, templates, patterns, and pages.</p>

<div class="section"><h2>WorkspaceShell Tree</h2>
<pre style="font-size:0.6875rem;line-height:1.6">
WorkspaceShell
├── WorkspaceHeader
│   ├── Badge (pill)
│   └── Button (action)
├── WorkspaceSection
│   ├── WorkspaceCard
│   │   ├── Badge (status)
│   │   └── Tag (metadata)
│   ├── DataList
│   │   ├── Badge (status column)
│   │   └── Pill (count)
│   ├── ActivityFeed
│   │   └── Dot (status)
│   └── StatusRail
│       └── Badge (with dot)
├── WorkspaceToolbar
│   ├── Button
│   ├── FilterBar
│   └── SearchBar
└── WorkspaceSidebar
</pre></div>

<div class="section"><h2>Page Dependencies</h2>
<table><tr><th>Page</th><th>Primary Components</th><th>Templates</th><th>Patterns</th></tr>
<tr><td>Command Center</td><td>StatusRail, DivisionTile, ActivityFeed, MetricStrip</td><td>Command Center</td><td>model-build</td></tr>
<tr><td>Investments</td><td>PortfolioBucketView, AllocationDonut, RebalancePreview</td><td>Investments OS</td><td>data-fetch, model-build</td></tr>
<tr><td>Studio OS</td><td>StudioProjectDetailPage, StudioTimelineBoard</td><td>Studio OS</td><td>approval, data-fetch</td></tr>
<tr><td>Bridge</td><td>BridgeDiagnostics, ImportPreviewPanel, SourceHealthMonitor</td><td>Bridge</td><td>data-fetch</td></tr>
<tr><td>Capital</td><td>CapitalRhythm, CapitalCriticalPath, LedgerTable</td><td>—</td><td>data-fetch</td></tr>
</table></div>

<div class="section"><h2>Registry Summary</h2>
<table><tr><th>Category</th><th>Count</th></tr>
<tr><td>Primitive Components</td><td>17</td></tr>
<tr><td>Workspace Components</td><td>26</td></tr>
<tr><td>Page Templates</td><td>4</td></tr>
<tr><td>Operating Patterns</td><td>4</td></tr>
<tr><td>Symbol Groups</td><td>10</td></tr>
<tr><td><strong>Total</strong></td><td><strong>61</strong></td></tr>
</table></div>
` + F)

// === 15-migration.html ===
writeFileSync(resolve(outDir, '15-migration.html'), H('15 Migration') + `
<h1>Production Migration Manual</h1><p class="subtitle">Step-by-step migration checklists for each BBH OS workspace.</p>

<div class="section"><h2>Design Review Gate</h2>
<div style="border:1px solid #d97a34;border-radius:0.75rem;padding:1rem;background:#d97a340d">
<p style="font-size:0.75rem;font-weight:600;color:#d97a34">Pre-migration requirements</p>
<ul style="font-size:0.75rem;color:#666;margin-top:0.5rem;padding-left:1.25rem">
<li>All components exist in registry with metadata</li>
<li>Component examples render correctly in review pack</li>
<li>Screenshots approved by design team</li>
<li>Accessibility checklist passes</li>
<li>No visual regressions on existing pages</li>
</ul></div></div>

<div class="section"><h2>Release Criteria</h2>
<table><tr><th>Criteria</th><th>Required</th></tr>
<tr><td>Registry complete</td><td>✅ All 61 components</td></tr>
<tr><td>Review pack generated</td><td>✅ 16 pages + screenshots</td></tr>
<tr><td>Build passes</td><td>✅ 0 errors</td></tr>
<tr><td>Lint passes</td><td>✅ 0 errors</td></tr>
<tr><td>Accessibility reviewed</td><td>Pending</td></tr>
<tr><td>Production validation</td><td>Pending</td></tr>
</table></div>

<div class="section"><h2>Studio Migration Checklist</h2>
<div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.75rem">
<div><span class="pill-green">Done</span> Route /os/studio → /os/studio/projects</div>
<div><span class="pill-green">Done</span> Section navigation (7 tabs)</div>
<div><span class="pill-green">Done</span> Legacy preserved at /os/studio/legacy</div>
<div><span class="pill">Pending</span> StudioMobilePage route</div>
<div><span class="pill">Pending</span> Billing Gates section</div>
<div><span class="pill">Pending</span> Decision Log section</div>
</div></div>

<div class="section"><h2>Command Center Refinement Checklist</h2>
<div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.75rem">
<div><span class="pill-green">Done</span> Visual identity v1</div>
<div><span class="pill-green">Done</span> Division accent colors</div>
<div><span class="pill-green">Done</span> Activity feed</div>
<div><span class="pill-green">Done</span> Priority alerts</div>
<div><span class="pill-green">Done</span> Executive brief</div>
<div><span class="pill">Pending</span> Agent detail page</div>
<div><span class="pill">Pending</span> System log page</div>
</div></div>

<div class="section"><h2>AI Workspace Checklist</h2>
<div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.75rem">
<div><span class="pill">Pending</span> AI context panels</div>
<div><span class="pill">Pending</span> Suggestion import</div>
<div><span class="pill">Pending</span> Review queue</div>
<div><span class="pill">Pending</span> Memory browser</div>
</div></div>

<div class="section"><h2>Bridge Checklist</h2>
<div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.75rem">
<div><span class="pill-green">Done</span> Resources registered</div>
<div><span class="pill-green">Done</span> Diagnostics panel</div>
<div><span class="pill-green">Done</span> Source health monitor</div>
<div><span class="pill">Pending</span> Multi-sheet config</div>
<div><span class="pill">Pending</span> Automation rules</div>
</div></div>

<div class="section"><h2>Investments Checklist</h2>
<div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.75rem">
<div><span class="pill-green">Done</span> Hero metrics (5 cards)</div>
<div><span class="pill-green">Done</span> Bucket view</div>
<div><span class="pill-green">Done</span> Dividend dashboard</div>
<div><span class="pill-green">Done</span> Passive income estimate</div>
<div><span class="pill-green">Done</span> Portfolio reconciliation</div>
<div><span class="pill">Pending</span> Tax optimization</div>
</div></div>

<div class="section"><h2>Capital Checklist</h2>
<div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.75rem">
<div><span class="pill-green">Done</span> Capital rhythm</div>
<div><span class="pill-green">Done</span> Critical path</div>
<div><span class="pill-green">Done</span> Ledger table</div>
<div><span class="pill">Pending</span> Analytics cards</div>
</div></div>
` + F)

// === Update 00-index.html ===
const indexPath = resolve(outDir, '00-index.html')
let indexHtml = readFileSync(indexPath, 'utf-8')
// Replace the 6-card grid with a 9-card grid that includes all pages
const oldGrid = indexHtml.indexOf('<div class="grid cols-3 section">')
const afterGrid = indexHtml.indexOf('<div class="section">', oldGrid + 1)
const headerEnd = indexHtml.substring(0, oldGrid)
const footerStart = indexHtml.substring(afterGrid)

const newGrid = `<div class="grid cols-3 section">
  <a href="01-primitives.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">01 · Primitives</h3></div><p style="font-size:0.75rem;color:#666">Buttons, inputs, badges, pills, tables, tabs, dividers, skeletons, avatars</p><div style="margin-top:0.5rem"><span class="tag">17 components</span></div></a>
  <a href="02-workspace.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">02 · Workspace</h3></div><p style="font-size:0.75rem;color:#666">Shell, header, cards, panels, toolbar, sidebar, inspector, notice, empty, loading, data list</p><div style="margin-top:0.5rem"><span class="tag">26 components</span></div></a>
  <a href="03-symbols.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">03 · Symbols</h3></div><p style="font-size:0.75rem;color:#666">Status, priority, finance, AI, architecture symbols</p><div style="margin-top:0.5rem"><span class="tag">10 groups</span></div></a>
  <a href="04-patterns.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">04 · Patterns</h3></div><p style="font-size:0.75rem;color:#666">Data fetch, approval, model build, navigation</p><div style="margin-top:0.5rem"><span class="tag">4 patterns</span></div></a>
  <a href="05-templates.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">05 · Templates</h3></div><p style="font-size:0.75rem;color:#666">Command Center, Investments, Studio, Bridge</p><div style="margin-top:0.5rem"><span class="tag">4 templates</span></div></a>
  <a href="06-states.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">06 · States</h3></div><p style="font-size:0.75rem;color:#666">Loading, empty, error, success, disabled, offline</p><div style="margin-top:0.5rem"><span class="tag">10 states</span></div></a>
  <a href="07-anatomy.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">07 · Anatomy</h3></div><p style="font-size:0.75rem;color:#666">Component structure diagrams — Shell, DataList, Feed, Modal</p><div style="margin-top:0.5rem"><span class="tag">8 diagrams</span></div></a>
  <a href="08-scale.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">08 · Scale</h3></div><p style="font-size:0.75rem;color:#666">Button sizes, card density, typography, spacing, radius, table density</p><div style="margin-top:0.5rem"><span class="tag">6 scales</span></div></a>
  <a href="09-recipes.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">09 · Recipes</h3></div><p style="font-size:0.75rem;color:#666">Project list, approval review, bridge monitor, command center compositions</p><div style="margin-top:0.5rem"><span class="tag">4 recipes</span></div></a>
  <a href="10-blueprints.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">10 · Blueprints</h3></div><p style="font-size:0.75rem;color:#666">Studio OS, Investments, Command Center wireframe layouts</p><div style="margin-top:0.5rem"><span class="tag">3 blueprints</span></div></a>
  <a href="11-interactions.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">11 · Interactions</h3></div><p style="font-size:0.75rem;color:#666">Loading→Success, Draft→Approved, Online→Offline, Empty→Populated flows</p><div style="margin-top:0.5rem"><span class="tag">6 flows</span></div></a>
  <a href="12-responsive.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">12 · Responsive</h3></div><p style="font-size:0.75rem;color:#666">Sidebar collapse, grid adaptation, table-to-list, priority ordering</p><div style="margin-top:0.5rem"><span class="tag">4 breakpoints</span></div></a>
  <a href="13-accessibility.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">13 · Accessibility</h3></div><p style="font-size:0.75rem;color:#666">Keyboard nav, focus states, color usage, reduced motion, hit targets</p><div style="margin-top:0.5rem"><span class="tag">7 rules</span></div></a>
  <a href="14-relationships.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">14 · Relationships</h3></div><p style="font-size:0.75rem;color:#666">Component tree, page dependencies, registry summary</p><div style="margin-top:0.5rem"><span class="tag">map</span></div></a>
  <a href="15-migration.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">15 · Migration</h3></div><p style="font-size:0.75rem;color:#666">Production migration checklists for all 6 workspaces</p><div style="margin-top:0.5rem"><span class="tag">6 checklists</span></div></a>
</div>`

indexHtml = headerEnd + newGrid + footerStart
writeFileSync(indexPath, indexHtml)
console.log('Updated 00-index.html with 15 page links')

console.log('\\nDone — 9 new HTML pages generated + 00-index.html updated')
