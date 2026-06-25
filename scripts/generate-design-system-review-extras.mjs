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

// === 16-color-tokens.html ===
writeFileSync(resolve(outDir, '16-color-tokens.html'), H('16 Color Tokens') + `
<h1>Color Tokens</h1><p class="subtitle">Semantic color tokens with CSS variables, Tailwind classes, and usage.</p>
<div class="section" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">
${[
['Brand','--bb-accent','#d97a34','bg-[var(--bb-accent)]','Primary accent. Buttons, links, active states. Max 10-15% of any surface.'],
['Surface','--bb-surface-2','#ffffff','bg-[var(--bb-surface-2)]','Card and panel background. Default white.'],
['Surface Elevated','--bb-surface-3','#faf9f8','bg-[var(--bb-surface-3)]','Subtle tint for secondary cards and hover states.'],
['Background','--bb-shell','#f2efe9','bg-[var(--bb-shell)]','Page background. Warm off-white.'],
['Border','--bb-border','#e6e0d5','border-[var(--bb-border)]','Default border. Cards, panels, dividers.'],
['Divider','--bb-border','#e6e0d5','border-[var(--bb-border)]','Horizontal and vertical dividers between sections.'],
['Text Primary','--bb-text','#1a1a1a','text-[var(--bb-text)]','Primary text on light surfaces. High contrast.'],
['Text Muted','--bb-text-muted','#777777','text-[var(--bb-text-muted)]','Secondary text, labels, metadata.'],
['Text Soft','--bb-text-soft','#666666','text-[var(--bb-text-soft)]','Body text on tinted surfaces.'],
['Text Faint','--bb-text-faint','#999999','text-[var(--bb-text-faint)]','Placeholder and disabled text.'],
['Success','--bb-green','#16a36a','text-[var(--bb-green)] bg-[var(--bb-green)]/10','Positive states, healthy status, completed.'],
['Warning','--bb-amber','#c67f1e','text-[var(--bb-amber)] bg-[var(--bb-amber)]/10','Warning, pending review, medium risk.'],
['Danger','--bb-red','#c2410c','text-[var(--bb-red)] bg-[var(--bb-red)]/10','Error, high risk, blocked, failed.'],
['Info','--bb-blue','#2563eb','text-[var(--bb-blue)] bg-[var(--bb-blue)]/10','Informational states, external links.'],
['Disabled','—','#d4cdc2','text-black/[0.25] bg-black/[0.05]','Disabled buttons, inputs, and controls.'],
['Overlay','—','rgba(0,0,0,0.3)','bg-black/30','Modal and drawer backdrops.'],
].map(t => `<div class="card" style="padding:0.75rem"><div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem"><div style="width:2rem;height:2rem;border-radius:0.375rem;border:1px solid #e6e0d5;background:${t[2]}"></div><div><div style="font-size:0.75rem;font-weight:600">${t[0]}</div><div class="meta">${t[1]}</div></div></div><div style="display:flex;gap:0.375rem;flex-wrap:wrap;margin-bottom:0.375rem"><span class="tag">${t[2]}</span><span class="tag">${t[3].split(' ')[0]}</span></div><div style="font-size:0.6875rem;color:#666">${t[4]}</div></div>`).join('\n')}
</div>` + F)
console.log('16-color-tokens.html')

// === 17-typography-tokens.html ===
writeFileSync(resolve(outDir, '17-typography-tokens.html'), H('17 Typography Tokens') + `
<h1>Typography Tokens</h1><p class="subtitle">Complete typography scale. Font: IBM Plex Sans Thai. Mono: Geist Mono.</p>
<div class="section">
<table><tr><th>Token</th><th>Size</th><th>Weight</th><th>Line H</th><th>Letter Spacing</th><th>Usage</th></tr>
<tr><td style="font-size:1.5rem;font-weight:700;font-family:'IBM Plex Sans Thai'">Display XL</td><td>2.4rem</td><td>700</td><td>1</td><td>-0.04em</td><td>Page hero title</td></tr>
<tr><td style="font-size:1.25rem;font-weight:600;font-family:'IBM Plex Sans Thai'">Display LG</td><td>1.9rem</td><td>600</td><td>1</td><td>-0.03em</td><td>Section heading</td></tr>
<tr><td style="font-size:1rem;font-weight:600;font-family:'IBM Plex Sans Thai'">Heading XL</td><td>1.1rem</td><td>600</td><td>1.3</td><td>0</td><td>Card title</td></tr>
<tr><td style="font-size:0.875rem;font-weight:600;font-family:'IBM Plex Sans Thai'">Heading</td><td>0.875rem</td><td>600</td><td>1.4</td><td>0</td><td>Section header</td></tr>
<tr><td style="font-size:0.875rem;font-weight:400;font-family:'IBM Plex Sans Thai'">Body</td><td>0.875rem</td><td>400</td><td>1.6</td><td>0</td><td>Default text</td></tr>
<tr><td style="font-size:0.75rem;font-weight:400;font-family:'IBM Plex Sans Thai'">Body Small</td><td>0.75rem</td><td>400</td><td>1.5</td><td>0</td><td>Secondary, metadata</td></tr>
<tr><td style="font-size:0.625rem;font-weight:500;font-family:'IBM Plex Sans Thai'">Caption</td><td>0.625rem</td><td>500</td><td>1.4</td><td>0.08em</td><td>Labels, uppercase</td></tr>
<tr><td style="font-size:0.625rem;font-family:'Geist Mono',monospace">Mono</td><td>0.625rem</td><td>500</td><td>1.4</td><td>0</td><td>Code, metrics</td></tr>
<tr><td style="font-size:0.5rem;font-family:'Geist Mono',monospace">Mono Small</td><td>0.5rem</td><td>500</td><td>1.3</td><td>0</td><td>Tiny data, %</td></tr>
</table></div>` + F)
console.log('17-typography-tokens.html')

// === 18-spacing-tokens.html ===
writeFileSync(resolve(outDir, '18-spacing-tokens.html'), H('18 Spacing Tokens') + `
<h1>Spacing Tokens</h1><p class="subtitle">Complete spacing scale with padding, gap, and margin examples.</p>
<div class="section">
<table><tr><th>Token</th><th>Value</th><th>Padding Example</th><th>Gap Example</th><th>Margin Example</th></tr>
${[
['2xs','0.125rem(2px)','p-0.5','gap-0.5','m-0.5'],
['xs','0.25rem(4px)','p-1','gap-1','m-1'],
['sm','0.375rem(6px)','p-1.5','gap-1.5','m-1.5'],
['md','0.5rem(8px)','p-2','gap-2','m-2'],
['lg','0.75rem(12px)','p-3','gap-3','m-3'],
['xl','1rem(16px)','p-4','gap-4','m-4'],
['2xl','1.5rem(24px)','p-6','gap-6','m-6'],
['3xl','2rem(32px)','p-8','gap-8','m-8'],
['4xl','2.5rem(40px)','p-10','gap-10','m-10'],
['5xl','3rem(48px)','p-12','gap-12','m-12'],
['6xl','4rem(64px)','p-16','—','m-16'],
].map(r => `<tr><td style="font-weight:600">${r[0]}</td><td class="meta">${r[1]}</td><td><div style="display:inline-block;background:#f0eeec;border-radius:2px"><div style="background:#d4cdc2;width:1.5rem;height:1.5rem"></div></div></td><td><div style="display:flex"><div style="width:0.75rem;height:0.75rem;background:#d4cdc2;border-radius:2px"></div><div style="width:0.375rem"></div><div style="width:0.75rem;height:0.75rem;background:#d4cdc2;border-radius:2px"></div></div></td><td class="meta">${r[4]}</td></tr>`).join('\n')}
</table></div>` + F)
console.log('18-spacing-tokens.html')

// === 19-radius-shadow.html ===
writeFileSync(resolve(outDir, '19-radius-shadow.html'), H('19 Radius + Shadow') + `
<h1>Radius & Shadow Tokens</h1><p class="subtitle">Border radius scale and shadow elevation tokens.</p>
<div class="section"><h2>Radius</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1rem">
${[
['xs','0.25rem(4px)','border-radius:0.25rem'],
['sm','0.375rem(6px)','border-radius:0.375rem'],
['md','0.5rem(8px)','border-radius:0.5rem'],
['lg','0.75rem(12px)','border-radius:0.75rem'],
['xl','1rem(16px)','border-radius:1rem'],
['2xl','1.5rem(24px)','border-radius:1.5rem'],
['pill','9999px','border-radius:9999px'],
].map(r => `<div style="border:1px solid #e6e0d5;border-radius:0.75rem;padding:1.5rem;text-align:center;background:#fff"><div style="width:4rem;height:3rem;margin:0 auto 0.75rem;background:#f0eeec;${r[2]}"></div><div style="font-size:0.75rem;font-weight:600">${r[0]}</div><div class="meta">${r[1]}</div></div>`).join('\n')}
</div></div>
<div class="section"><h2>Shadow</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">
${[
['sm','0 1px 3px rgba(0,0,0,0.06)','Small card elevation'],
['md','0 4px 12px rgba(0,0,0,0.06)','Elevated card'],
['lg','0 8px 24px rgba(0,0,0,0.08)','Floating panel'],
['floating','0 12px 40px rgba(0,0,0,0.1)','Drawer'],
['modal','0 24px 60px rgba(0,0,0,0.15)','Modal overlay'],
].map(r => `<div style="border-radius:0.75rem;padding:1rem;background:#fff;box-shadow:${r[1]}"><div style="font-size:0.75rem;font-weight:600">${r[0]}</div><div class="meta" style="margin-top:0.25rem">${r[1]}</div><div style="font-size:0.6875rem;color:#666;margin-top:0.375rem">${r[2]}</div></div>`).join('\n')}
</div></div>` + F)
console.log('19-radius-shadow.html')

// === 20-layering-zindex.html ===
writeFileSync(resolve(outDir, '20-layering-zindex.html'), H('20 Layering & Z-Index') + `
<h1>Layering & Z-Index</h1><p class="subtitle">Z-index hierarchy and layer visualization for BBH OS.</p>
<div class="section">
<div style="display:flex;flex-direction:column-reverse;gap:0.125rem">
${[
['Overlay / Backdrop','z-50','rgba(0,0,0,0.3)'],
['Toast / Notification','z-40','#1a1a1a'],
['Modal','z-30','#ffffff'],
['Drawer','z-30','#ffffff'],
['Popover / Tooltip','z-20','#ffffff'],
['Dropdown','z-20','#ffffff'],
['Sticky Header','z-10','#ffffff'],
['Toolbar','z-10','#faf9f8'],
['Content','z-0','#f2efe9'],
].map((r,i) => `<div style="display:flex;align-items:center;gap:1rem;padding:0.75rem 1rem;background:${r[2]};border:1px solid #e6e0d5;border-radius:0.375rem;position:relative"><span class="tag" style="min-width:3rem">${r[1]}</span><span style="font-size:0.75rem;font-weight:600">${r[0]}</span><span style="font-size:0.625rem;color:#666;margin-left:auto">layer ${i+1}</span></div>`).join('\n')}
</div>
<pre style="margin-top:1.5rem;font-size:0.6875rem;line-height:1.8">
Layer 8  Overlay        z-50  (modal backdrop)
Layer 7  Toast          z-40  (notifications)
Layer 6  Modal          z-30  (dialog + backdrop)
Layer 5  Drawer         z-30  (slide-over panel)
Layer 4  Popover        z-20  (tooltips, dropdowns)
Layer 3  Sticky/Toolbar z-10  (sticky nav, action bars)
Layer 2  Content        z-0   (page content)
Layer 1  Background     auto  (shell)
</pre></div>` + F)
console.log('20-layering-zindex.html')

// === 21-spatial-grid.html ===
writeFileSync(resolve(outDir, '21-spatial-grid.html'), H('21 Spatial Grid') + `
<h1>Spatial Grid Language</h1><p class="subtitle">Grid tokens, variants, and layout reference for BBH OS.</p>

<div class="section"><h2>Grid Variants</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem">
${[
['Architect','0.05','Layout composition','repeating-linear-gradient(0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 8px)'],
['Operation','0.03','Daily workspace','repeating-linear-gradient(0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 8px)'],
['Presentation','0.015','Client view','repeating-linear-gradient(0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 8px)'],
['Print','0.08','Documentation','repeating-linear-gradient(0deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 1px, transparent 1px, transparent 8px)'],
].map(v => `<div style="border:1px solid #e6e0d5;border-radius:0.75rem;overflow:hidden;background:#fff">
<div style="height:100px;background:#faf9f8;background-image:${v[3]};background-size:8px 8px;opacity:${v[1]}"></div>
<div style="padding:0.75rem"><div style="font-size:0.75rem;font-weight:600">${v[0]}</div><div class="meta">opacity ${v[1]}</div><div style="font-size:0.6875rem;color:#666;margin-top:0.25rem">${v[2]}</div></div></div>`).join('\n')}
</div></div>

<div class="section"><h2>Grid Tokens</h2>
<table><tr><th>Token</th><th>Default</th><th>CSS Variable</th></tr>
<tr><td>Major grid</td><td>64px</td><td class="meta">--bb-grid-major</td></tr>
<tr><td>Minor grid</td><td>8px</td><td class="meta">--bb-grid-minor</td></tr>
<tr><td>Opacity</td><td>0.03</td><td class="meta">--bb-grid-opacity</td></tr>
<tr><td>Line thickness</td><td>1px</td><td class="meta">--bb-grid-line</td></tr>
<tr><td>Fade distance</td><td>120px</td><td class="meta">--bb-grid-fade</td></tr>
</table></div>

<div class="section"><h2>Opacity Comparison</h2>
<div style="display:flex;flex-direction:column;gap:0.5rem">
${[
['0.01 (Minimal)','0.01'],
['0.03 (Operation)','0.03'],
['0.05 (Architect)','0.05'],
['0.08 (Print)','0.08'],
['0.10 (Maximum)','0.10'],
].map(o => `<div style="display:flex;align-items:center;gap:1rem"><span class="meta" style="min-width:8rem">${o[0]}</span><div style="flex:1;height:2rem;border-radius:0.25rem;background:#faf9f8;background-image:repeating-linear-gradient(0deg,rgba(0,0,0,0.06),rgba(0,0,0,0.06)1px,transparent 1px,transparent 8px),repeating-linear-gradient(90deg,rgba(0,0,0,0.06),rgba(0,0,0,0.06)1px,transparent 1px,transparent 8px);background-size:8px 8px;opacity:${o[1]}"></div></div>`).join('\n')}
</div></div>

<div class="section"><h2>Grid Rules</h2>
<ul style="font-size:0.75rem;color:#666;margin-top:0.5rem;padding-left:1.25rem">
<li>Grid is structural — never decorative</li>
<li>Grid always renders below content</li>
<li>Grid never blocks mouse events</li>
<li>Opacity stays between 0.01 and 0.10</li>
<li>Four variants: architect, operation, presentation, print</li>
<li>GridCanvas wrapper injects GridOverlay automatically</li>
</ul></div>
` + F)
console.log('21-spatial-grid.html')

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
</div>

<h2 style="margin-top:3rem">Design Tokens</h2>
<div class="grid cols-3">
  <a href="16-color-tokens.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">16 · Color Tokens</h3></div><p style="font-size:0.75rem;color:#666">Semantic color tokens — brand, surface, text, status, overlay</p><div style="margin-top:0.5rem"><span class="tag">16 tokens</span></div></a>
  <a href="17-typography-tokens.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">17 · Typography Tokens</h3></div><p style="font-size:0.75rem;color:#666">Type scale — Display XL through Mono Small</p><div style="margin-top:0.5rem"><span class="tag">9 tokens</span></div></a>
  <a href="18-spacing-tokens.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">18 · Spacing Tokens</h3></div><p style="font-size:0.75rem;color:#666">Spacing scale — 2px through 64px with examples</p><div style="margin-top:0.5rem"><span class="tag">12 tokens</span></div></a>
  <a href="19-radius-shadow.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">19 · Radius & Shadow</h3></div><p style="font-size:0.75rem;color:#666">Border radius scale + shadow elevation tokens</p><div style="margin-top:0.5rem"><span class="tag">12 tokens</span></div></a>
  <a href="20-layering-zindex.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">20 · Layering & Z-Index</h3></div><p style="font-size:0.75rem;color:#666">Z-index hierarchy — content through overlay</p><div style="margin-top:0.5rem"><span class="tag">8 layers</span></div></a>
  <a href="21-spatial-grid.html" class="card" style="text-decoration:none;color:inherit"><div class="card-header"><span class="dot dot-gray"></span><h3 style="margin:0">21 · Spatial Grid</h3></div><p style="font-size:0.75rem;color:#666">Grid tokens, variants, opacity comparison, layout rules</p><div style="margin-top:0.5rem"><span class="tag">grid</span></div></a>
</div>`

indexHtml = headerEnd + newGrid + footerStart
writeFileSync(indexPath, indexHtml)
console.log('Updated 00-index.html with 15 page links')

console.log('\\nDone — 9 new HTML pages generated + 00-index.html updated')
