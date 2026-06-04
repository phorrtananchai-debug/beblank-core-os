# Be Blank OS Design System

> Reference direction: Clean modern OS dashboard — warm white base, soft cards, icon badges, progress bars, circular indicators, orange active accent.
> Adapt the direction calmly — not literal copy, premium editorial, not cartoon or colorful.

---

## 1. Overview-First Layout

Every page follows this visual priority:

```
L1: Hero Summary Row    (4–5 metric cards, glanceable)
L2: Operations          (primary panels — focus queue, projects, financials)
L3: Reference           (quiet rail — source status, logs, AI tools)
```

- A user must understand today's priorities within 5 seconds
- Metric cards answer: What needs attention? What's pending? Financial posture? AI flags?
- Desktop-first. Exception: responsive stacking on mobile.

---

## 2. Color System

### Base

| Token | Value | Usage |
|---|---|---|
| `--bb-bg` | `#FAF8F4` | Page background |
| `--bb-surface` | `#FFFFFF` | Card/panel backgrounds |
| `--bb-surface-warm` | `#FFF9EF` | Warm card, sidebar |
| `--bb-border` | `#E7DED2` | Card borders |
| `--bb-text` | `#171412` | Body text |
| `--bb-text-soft` | `#4E463E` | Secondary text |
| `--bb-text-muted` | `#817468` | Helper/label text |

### Accent / Active

| Token | Value | Usage |
|---|---|---|
| `--bb-accent` | `#FF8800` | Active nav, primary buttons, accent indicators |
| `--bb-accent-strong` | `#E66F00` | Hover states |
| `--bb-accent-soft` | `#FFF0D9` | Hover/active backgrounds |
| `--bb-accent-border` | `#FFC978` | Borders for accent states |

### Semantic

| Color | Soft BG | Usage |
|---|---|---|
| Green `#16A36A` | `#E8F8EF` | Positive, healthy, complete |
| Amber `#D99100` | `#FFF4D8` | Warning, pending, review |
| Red `#D94A3A` | `#FDEAE7` | Danger, at-risk, blocked |
| Blue `#2F7DEB` | `#EAF2FF` | Information, AI |
| Purple `#8756E8` | `#F1EAFE` | AI, analysis |

---

## 3. Icon / Symbol Language

Use Unicode symbols for lightweight icon badges:

| Symbol | Meaning |
|---|---|
| `!` | Attention, alert |
| `✓` | Approval, complete |
| `◇` | Studio, project |
| `◎` | Finance, capital |
| `◆` | Investment, portfolio |
| `○` | Reserve, cash |
| `△` | Trading, signals |
| `✦` | AI, intelligence |
| `⊞` | Command Center, dashboard |
| `≡` | Work scope, sections |
| `▶` | Phase, next |
| `☆` | Dividend, income |
| `↓` | Inflow, DCA |
| `↑` | Outflow |

Do not add icon libraries. Do not use emoji. Use these symbols in `os-icon-badge` containers.

---

## 4. CSS Components

### `.os-sidebar-link`
Flex row with icon + label. Active state: orange accent background + white text + shadow. Hover: orange soft background + accent text.

### `.os-sidebar-icon`
28×28px rounded box with soft bg. Active state inverts to white-on-accent.

### `.os-hero-grid`
Responsive 4-column grid at `md:` breakpoint. 2-column on mobile.

### `.os-hero-metric`
Premium card with subtle shadow, rounded 24px, optional top-right radial glow (`.os-hero-metric-{color}`). Contains: icon badge, label, value, helper, optional progress bar.

### `.os-hero-value`, `.os-hero-sub`
Typography for metric card value (large bold) and helper (small muted).

### `.os-icon-badge`
40×40px rounded container for symbol. Paired with color class: `.os-icon-badge-{color}`.

### `.os-progress-rail` / `.os-progress-fill-{color}`
6px height, rounded, muted rail. Fill uses semantic color.

### `.os-donut`
52×52px CSS circle. Fill via `clip-path` + inline style. For allocation charts (no chart library).

### `.os-section-card`
Standard operation card. White bg, border, shadow, hover lift.

### `.os-reference-card`
Quieter reference card. Transparent white bg, thin border, smaller padding. For Level 3 content.

### `.os-tab`
Rounded pill tab button. Active: accent bg. Hover: accent soft.

---

## 5. Page Patterns

### Command Center
- **Hero**: Title "ศูนย์ควบคุมวันนี้", helper "Command Center", 4 metric cards: needs attention, pending approvals, financial posture, AI suggestions
- **Main**: Focus Queue (left) + Project Pulse (right), Financial summary, Pending Approvals, Timeline, AI suggestions (subdued)
- **Rail**: Alerts, Source Status, AI export/import, logs

### Capital
- **Hero**: Breadcrumb + title, 4 metric cards with progress bars: inflow, outflow, reserve, runway
- **Tabs**: Overview, Studio Office, Family
- **Overview**: Cash Flow Bar, Runway Gauge, Reserve Health bars, Obligations

### Investments
- **Hero**: Breadcrumb + title, 5 metric cards with progress bars: portfolio value, cash reserve, DCA target, dividends, drift count
- **Tabs**: Overview, Portfolio, Holdings, Allocation, Transactions, DCA, Dividends, Watchlist, Research, AI

### Studio Project Detail
- **Hero**: Back link, breadcrumb, title, 5 metric cards: status, phase, timeline, inspection items, work scope
- **Sections**: Overview, WorkScope, Timeline, Site Watch, Documents, Reviews, AI context (bottom)

---

## 6. Language Rules

- **Navigation labels**: English (Command Center, Studio, Capital, Investments, Reserves, Trading Lab, AI Workspace, Settings)
- **Content panels / operational info**: Thai-first
- **Avoid**: "operating surface", "Quiet operational reading", "พื้นผิวปฏิบัติการของ Por"
- **Do not use**: giant text-only hero statements, AI cards in hero position

---

## 7. Visual Guidelines

- Not all cards equal weight — hero metrics > section cards > reference cards
- Use semantic color accents (green/amber/red/blue/purple) for state at a glance
- Progress bars on metric cards where proportional data exists
- Orange accent for active/selected states only
- Avoid dusty haze that lowers contrast
- Avoid black-heavy blocks
- AI is reference, not hero
- Do not cover every card with heavy gradients — use radial glow accents sparingly
- No icon libraries — use Unicode symbols in icon badge containers

---

## 8. UI Patterns Not To Use

- No giant text-only hero (max text-2xl for hero titles)
- No equal-weight card grids across all sections
- No AI suggestions or alerts competing with core operating metrics
- No source sheet status as hero content (move to reference rail)
- No "Quiet operational reading" or similar filler cards
