# Production Seed Data — Preview

**Do not write to sheet yet.** This document is a preview for review and approval.

---

## StudioProjects

6 rows to append. Includes `timelineStatus` and `operationalNotes` columns for operational tracking.

| id | slug | name | status | owner | client | location | phase | timelineStatus | operationalNotes |
|---|---|---|---|---|---|---|---|---|---|
| `karun-phuket-old-town` | `karun-phuket-old-town` | Karun Phuket Old Town | `active` | `Por` | `Karun Hospitality` | `Phuket` | `site-handoff` | `steady` | |
| `karun-central-khonkaen` | `karun-central-khonkaen` | Karun Central Khon Kaen | `active` | `Por` | `Karun Hospitality` | `Khon Kaen` | `construction` | `watch` | `receive space: 1 Jun 13:30 / target opening: 1 Jul / mall requested decorative column +50 cm / counter setback 60 cm / bench privacy / low planting concern` |
| `karun-central-rama9` | `karun-central-rama9` | Karun Central Rama 9 | `active` | `Por` | `Karun Hospitality` | `Bangkok` | `concept-design` | `steady` | |
| `nakhon-phanom-hotel` | `nakhon-phanom-hotel` | Nakhon Phanom Hotel | `active` | `Por` | — | `Nakhon Phanom` | `feasibility` | `steady` | |
| `nakhon-pathom-house` | `nakhon-pathom-house` | Nakhon Pathom House | `active` | `Por` | — | `Nakhon Pathom` | `schematic-design` | `steady` | |
| `pattanakarn-house` | `pattanakarn-house` | Pattanakarn House | `active` | `Por` | — | `Bangkok` | `concept-design` | `steady` | |

**Source:** Karun Hospitality portfolio (3 active projects) + Be Blank Studio residential pipeline (3 projects).

**Status rationale:**
- Karun Phuket Old Town: furthest along, known site-handoff phase
- Karun Central Khon Kaen: construction phase, watch status — signage approval pending, furniture PO not confirmed
- Karun Central Rama 9: earlier stage, concept-design
- Nakhon Phanom Hotel: feasibility stage (early)
- Nakhon Pathom House: schematic-design
- Pattanakarn House: concept-design (early residential)

---

## TimelineItems

Operational timeline items for active projects. Maps to the `timeline` resource in the sheet bridge.

| id | projectId | label | dueDate | state |
|---|---|---|---|---|
| `tl-kk-mockup` | `karun-central-khonkaen` | Mockup inspection | `2026-06-12` | `planned` |
| `tl-kk-signage` | `karun-central-khonkaen` | Signage approval | `2026-06-20` | `at-risk` |
| `tl-kk-furniture` | `karun-central-khonkaen` | Furniture PO confirmation | `2026-06-18` | `at-risk` |
| `tl-kk-payment` | `karun-central-khonkaen` | Contractor payment | `2026-06-15` | `planned` |
| `tl-phuket-handover` | `karun-phuket-old-town` | Site handover walkthrough | `2026-06-10` | `planned` |
| `tl-phuket-closeout` | `karun-phuket-old-town` | Project closeout documentation | `2026-07-01` | `planned` |

At-risk items drive the Critical Path Engine (PR15D). Projects with at-risk timeline items show `risk` severity.

---

## StudioTimelinePhases

Project phase intervals for timeline visualization and opening pressure detection.

| id | projectId | phase | startDate | endDate | status | risk |
|---|---|---|---|---|---|---|
| `ph-kk-con` | `karun-central-khonkaen` | `construction` | `2026-05-15` | `2026-06-30` | `active` | `medium` |
| `ph-kk-handover` | `karun-central-khonkaen` | `handover` | `2026-07-01` | `2026-07-07` | `planned` | `medium` |
| `ph-pt-ho` | `karun-phuket-old-town` | `handover` | `2026-06-01` | `2026-06-15` | `active` | `low` |
| `ph-pt-ops` | `karun-phuket-old-town` | `opening` | `2026-06-16` | `2026-07-01` | `planned` | `low` |

The Khon Kaen handover phase (endDate 2026-07-01) drives the 23-day opening countdown and triggers `watch` severity in the operational timeline.

---

## Holdings

7 rows to append. All `quantity=0`, `averageCost=0`, `marketValueTHB=0`.

| id | assetId | quantity | averageCost | allocationPercent | targetAllocationPercent | currentPosture |
|---|---|---|---|---|---|---|
| `hold-voo` | `VOO` | `0` | `0` | `0` | `40` | `core` |
| `hold-schd` | `SCHD` | `0` | `0` | `0` | `15` | `income` |
| `hold-msft` | `MSFT` | `0` | `0` | `0` | `15` | `growth` |
| `hold-jepq` | `JEPQ` | `0` | `0` | `0` | `10` | `income` |
| `hold-pltr` | `PLTR` | `0` | `0` | `0` | `10` | `growth` |
| `hold-rbrk` | `RBRK` | `0` | `0` | `0` | `5` | `watch` |
| `hold-k-us500xrmf` | `K-US500XRMF` | `0` | `0` | `0` | `5` | `core` |

**Target allocation summary:**

| Posture | Total Target | Holdings |
|---|---|---|
| Core Wealth | 45% | VOO (40%) + K-US500XRMF (5%) |
| Growth Engine | 25% | MSFT (15%) + PLTR (10%) |
| Income Layer | 25% | SCHD (15%) + JEPQ (10%) |
| Watch / Sandbox | 5% | RBRK (5%) |
| **Total** | **100%** | |

**Rationale:**
- Core Wealth (45%): VOO S&P 500 as primary anchor, K-US500XRMF as Thai RMF tax wrapper
- Growth Engine (25%): MSFT as core compounder, PLTR as high-conviction innovation
- Income Layer (25%): SCHD dividend growth + JEPQ premium income
- Watch / Sandbox (5%): RBRK under observation, small experimental allocation
- Allocation matches the existing SYMBOL_BUCKET posture mapping in `PortfolioBucketView.tsx`

---

## CapitalRecords

3 rows to append. All `amountTHB=0`, `date=today`.

| id | label | amountTHB | direction | category | date | status |
|---|---|---|---|---|---|---|
| `cap-studio-reserve` | Studio Reserve | `0` | `income` | `Studio` | `2026-06-06` | `draft` |
| `cap-family-reserve` | Family Reserve | `0` | `income` | `Family` | `2026-06-06` | `draft` |
| `cap-personal-reserve` | Personal Reserve | `0` | `income` | `Personal` | `2026-06-06` | `draft` |

**Note:** Zero-amount placeholders. Update `amountTHB` and `date` with real values before first import. Categories mirror the `holdingsByCategory` groupings in `InvestmentsPage.tsx`.

---

## AIContexts

4 rows to append.

| id | module | title | body | createdAt |
|---|---|---|---|---|
| `ctx-studio` | `studio` | Studio Operations | Use this context for studio project planning and daily priorities. Active projects: Karun Phuket Old Town (site-handoff), Karun Central Khon Kaen (design-review), Karun Central Rama 9 (concept-design), Nakhon Phanom Hotel (feasibility), Nakhon Pathom House (schematic-design), Pattanakarn House (concept-design). | `2026-06-06T00:00:00.000Z` |
| `ctx-capital` | `capital` | Capital Planning | Use this context for cash flow, runway, reserve and commitments. Reserve categories: Studio Reserve, Family Reserve, Personal Reserve. Bridge mode: manual Google Sheet import/export. No autosync. No silent overwrite. | `2026-06-06T00:00:00.000Z` |
| `ctx-investments` | `investments` | Investment Review | Use this context for allocation, DCA, drift and rebalance review. Target allocation: Core Wealth 45%, Growth Engine 25%, Income Layer 25%, Watch 5%. Holdings: VOO, K-US500XRMF, MSFT, PLTR, SCHD, JEPQ, RBRK. | `2026-06-06T00:00:00.000Z` |
| `ctx-karun` | `studio` | Karun Workspace | Use this context for Karun Hospitality project coordination. Active Karun projects: Karun Phuket Old Town (site-handoff), Karun Central Khon Kaen (design-review), Karun Central Rama 9 (concept-design). | `2026-06-06T00:00:00.000Z` |

---

## Summary

| Tab | Rows | Type |
|---|---|---|
| StudioProjects | 6 | Real projects (3 Karun Hospitality + 3 Be Blank Studio) |
| TimelineItems | 6 | Operational timeline items with due dates and risk states |
| StudioTimelinePhases | 4 | Phase intervals with start/end dates, status, and risk |
| Holdings | 7 | Starter rows with target allocations only (zero quantities) |
| CapitalRecords | 3 | Category placeholders (zero amounts) |
| AIContexts | 4 | Context descriptions for AI module |
| **Total** | **30** | |

**All rows are safe to append:**
- ✅ No invented financial balances
- ✅ No fake project data (all derived from known portfolio)
- ✅ Zero-amount capital records (user fills in real values)
- ✅ Zero-quantity holdings (user fills in real positions)
- ✅ Holdings at 100% target allocation total
- ✅ Empty fields left blank where unknown
