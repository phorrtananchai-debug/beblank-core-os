# BeBlank OS Studio Project Workspace Core — Repair Closeout

## Final verdict

**PASS WITH PRE-EXISTING BASELINE EXCEPTION**

All material Project Workspace acceptance failures are resolved. Desktop and `/m` share the same subscribed project repository; canonical Studio identity is preserved; legacy `OsData` receives a compatibility projection; normalized asset relationships resolve in both directions; asset create/edit/replace/unlink/delete and blob cleanup pass; cross-store failures are compensated or reconcilable; hydration failures preserve prior data and render visible errors; operational intelligence uses the current/injected clock rather than a July 2026 constant.

The only failing validation is the unchanged repository-wide ESLint baseline in unrelated pre-existing temporary, generated, and desktop files. Mission-owned lint, TypeScript, 23 lifecycle/integration tests, production build, and the expanded desktop/mobile browser workflow pass.

This closeout accompanies the approved mission commit. No push, deploy, Firebase write, production migration, or production-data mutation was performed.

## Canonical source of truth

The local Phase 1 source of truth is the `ProjectWorkspaceRepository` snapshot using schema `project-workspace.v2`.

- Canonical Karun CKK project ID: `sp-kcc-main` — the existing Studio project identity.
- Accepted URL/data aliases: `karun-central-khon-kaen`, `karun-central-khon-kaen-campus`, and `karun-ckk`.
- Metadata document: `localStorage` key `beblank.project-workspace.v2:sp-kcc-main`.
- Binary storage: IndexedDB database `beblank-project-workspace-assets`, store `asset-blobs`.
- Desktop and `/m` subscribe to the same in-memory repository snapshot and receive same-tab events plus cross-tab storage refresh.
- `OsProvider` subscribes to that repository and maps shared project/tasks into `OsData.studioProjects` and `OsData.studioTasks` so existing Studio and Command Center consumers do not retain an independent writable copy.
- Legacy data is an initialization/migration boundary, not the ongoing workspace mutation store.

```text
legacy Studio OsData ──initial adapter──┐
                                       v
URL alias ──canonical ID──> ProjectWorkspaceRepository v2
                              │ metadata + normalized relations: localStorage
                              │ blobs: IndexedDB
                              │
                 ┌────────────┼─────────────┐
                 v            v             v
          desktop workspace   /m      OsData compatibility projection
                                           │
                                           v
                              existing Studio / Command Center
```

## Repository and service boundary

`src/core/projectWorkspace/repository.ts` owns:

- hydration and last-known-valid snapshots;
- schema validation and migration backup;
- task, BOQ, and site-report upsert;
- linked-entity deletion with safe relation unlinking;
- asset metadata/blob create, metadata update, blob replacement, unlink, and delete;
- metadata/blob compensation;
- orphan blob, missing-blob metadata, and dangling-relation reconciliation;
- structured recoverable errors and subscriber notification.

`useProjectWorkspace.ts` exposes loading, ready, and error snapshots, retry, same-tab subscription, and cross-tab storage refresh. UI components call this single boundary; they no longer call local storage or IndexedDB directly.

`legacyAdapter.ts` remains the explicit compatibility boundary. Unsupported rich workspace fields do not get flattened into legacy `StudioTask`; the legacy projection maps only identity, title, dates, progress, priority, status/process state, owner/trade, description, and site-check context. BOQ, reports, assets, and normalized relations remain available through the shared project repository and mobile project context.

## Desktop/mobile data flow

- Desktop task create/edit commits to the shared repository and publishes a new snapshot.
- `/m` reads workspace tasks directly; it no longer substitutes stale canonical-project fixture tasks.
- The supported mobile task mutation toggles done/reopen through the same repository method.
- Desktop receives the mobile mutation immediately and after refresh.
- Mobile project detail reads shared site reports and resolves linked asset counts through normalized relationships.
- Other legacy mobile projects continue through the legacy adapter until migrated; the canonical workspace project replaces only its matching `sp-kcc-main` record.

Browser proof:

- desktop-created `Shared browser task` appeared in `/m`;
- mobile “Mark done” produced desktop status `done`, progress `100`;
- desktop-created `Shared mobile site context` appeared in mobile project detail;
- refresh on both routes retained the mutations.

## Asset relationship strategy

`assetRelationships` is the single normalized relationship source in v2. Asset/entity inverse lists are not maintained as competing writable arrays.

Supported resolution:

- Asset ↔ Project
- Asset ↔ Task
- Asset ↔ BOQ item
- Asset ↔ Site report
- Asset → Location and work section through the asset’s scoped metadata fields

`getAssetRelationships` resolves outward from an asset. `getAssetsForEntity` resolves inward from task, BOQ item, or site report. Deleting a linked entity removes only its relationship records; assets linked elsewhere remain intact.

## Asset lifecycle and consistency rules

1. **Create:** write required blob first, then atomically save metadata plus normalized relations in the v2 document.
2. **Create compensation:** if blob write fails, publish no metadata; if metadata fails, delete the newly written blob and report the operation failure.
3. **Edit:** metadata and the complete normalized relation set save in one metadata write.
4. **Replace:** write the new blob, publish metadata referencing it, then delete the prior blob. Metadata failure deletes the new blob. Old-blob cleanup failure leaves the valid replacement active and marks the old blob for reconciliation.
5. **Unlink:** delete only the matching normalized relationship; inverse queries update from the same record set.
6. **Delete asset:** remove metadata and every relationship, then remove its IndexedDB blob. Blob cleanup failure is visible and recoverable by reconciliation.
7. **Delete entity:** unlink relations targeting the task/BOQ/report without deleting an asset still used elsewhere.

Timeline events remain derived from committed entity state. Failed mutations never create a successful entity record and therefore cannot emit a success event.

## Atomicity, compensation, and reconciliation

- Metadata plus normalized relationships are atomic within one local-storage document write.
- Individual IndexedDB blob operations use read/write transactions and close the database in `finally`.
- IndexedDB and local storage cannot share a browser transaction, so cross-store operations use stable operation IDs, ordered publication, compensation, and deterministic reconciliation.
- `reconcile(projectId, repair)` reports and optionally repairs:
  - blobs with no metadata;
  - metadata whose required IndexedDB blob is missing;
  - relationships whose asset or supported target no longer exists.
- Reconciliation never deletes a valid shared asset merely because one target entity was removed.

## Error and hydration behavior

- Corrupt or invalid saved data is never silently deleted.
- Hydration failure retains the last valid in-memory snapshot and sets an error status.
- Startup without a valid snapshot renders a load failure instead of presenting a seed as recovered user data.
- Desktop and mobile expose retry controls.
- Mutation and upload failures provide visible alerts without exposing sensitive payloads.
- The injected browser storage failure produced a visible error and did not overwrite the persisted task.
- Seed data is used only when no persisted canonical or migratable legacy document exists.

## Date and intelligence strategy

- Production workspace selectors default to the actual current date.
- Tests inject deterministic ISO dates.
- Schedule bounds derive from project start/handover and task dates.
- Two-week lookahead and three-day site plan derive from the current date.
- Intelligence derives overdue, due-today, due-this-week, next milestone, seven-day recent activity, and schedule-risk days from shared task/event records.
- July 2026 constants remain only in the Karun seed fixture and deterministic tests; none is used as the production “today.”

## Schema and migration

- Current schema: `project-workspace.v2`.
- Existing v1 documents are read from all accepted aliases, validated, normalized, backed up under a timestamped v2 backup key, and saved under canonical ID `sp-kcc-main`.
- V1 nested asset relationships are deduplicated into top-level normalized records.
- V1 inverse `assetIds` arrays are discarded during normalization; inverse queries use normalized relations.
- The old v1 document is not automatically deleted.
- Invalid local data is preserved in place and reported; it is not replaced by seed data.
- No production migration executes automatically.

Future production migration should implement the same repository contract against the approved database/object storage, run an explicit dry-run mapping by canonical ID, verify relationship/blob counts, preserve source backups, and require an authorized production migration step.

## Validation evidence

| Validation | Result | Evidence |
|---|---|---|
| Mission-owned ESLint | PASS | Project domain, desktop workspace, mobile consumer, OsContext bridge, tests, and browser runner exit 0 |
| TypeScript | PASS | `npx.cmd tsc -b --pretty false` |
| Lifecycle/integration tests | PASS | 23 tests, 23 pass, 0 fail |
| Production build | PASS | `npm.cmd run build`; 212 modules transformed |
| Desktop/mobile browser lifecycle | PASS | Expanded `browser-smoke.mjs`; all assertions true, 0 console/page errors |
| Desktop task → `/m` | PASS | Shared task visible in mobile project detail |
| `/m` mutation → desktop | PASS | Done/100% visible on desktop |
| Site report → `/m` | PASS | Shared report visible in mobile site context |
| Multi-file upload | PASS | Two files, metadata, blobs, task/BOQ relations |
| Inverse relationship queries | PASS | Task and BOQ inverse checks true; site-report inverse covered by tests/mobile context |
| Asset edit/unlink/delete | PASS | Metadata edit, task unlink, metadata/relation delete, blob count decrement |
| Refresh persistence | PASS | Remaining task and asset survived navigation/reload |
| Forced persistence failure | PASS | Visible alert; no application error or silent reset |
| Current-date schedule | PASS | Daily plan rendered the actual browser date |
| Base revision ESLint | PASS | Detached base `8fe679c` exited 0 |
| Current repository-wide ESLint | BASELINE EXCEPTION | 14 problems: 11 errors, 3 warnings — unchanged from pre-repair review |

### Test coverage

The 23 focused tests cover:

- canonical identity and v1 normalization;
- desktop/mobile-compatible task visibility in both directions;
- shared Task/Schedule records;
- asset metadata/blob/relation creation;
- blob-write and metadata-write failure compensation;
- inverse task/BOQ/site-report lookup;
- unlink, delete, and linked-entity safety;
- blob replacement and recoverable old-blob cleanup;
- orphan blob, missing-blob metadata, and dangling-relation repair;
- hydration failure preservation;
- deterministic current-date intelligence;
- seed non-overwrite;
- derived BOQ calculations and post-success-only events;
- migration backup.

## Repository-wide lint comparison

The current result exactly matches the acceptance-review baseline: **14 problems (11 errors, 3 warnings)**, exclusively in unrelated pre-existing paths:

- `.hermes/tmp-selective-stage/candidate-index.tsx`
- `.hermes/tmp-selective-stage/head-index.tsx`
- generated `src-tauri/target/**/tauri-codegen-assets/*.js`
- `src/desktop/DesktopApp.tsx`
- `src/desktop/ProviderSettingsPanel.tsx`

The base revision `8fe679c` passes repository ESLint. All repair-owned files pass the same ESLint configuration, so this repair introduces zero new lint diagnostics. No baseline error was fixed, suppressed, or added to ignore configuration.

## Changed-file risk review

| Files | Change | Risk |
|---|---|---|
| `src/core/projectWorkspace/types.ts` | v2 relationship/snapshot/error contracts | Medium: production adapter must preserve the contract |
| `migration.ts` | canonical aliases and non-destructive v1 normalization | Medium: intentionally local-only migration until production approval |
| `repository.ts` | shared mutation, blob lifecycle, compensation, reconciliation | Medium: cross-store atomicity remains compensating by browser constraint |
| `useProjectWorkspace.ts` | subscribed hydration/retry/cross-tab refresh | Low |
| `legacyAdapter.ts` | explicit OsData read and compatibility projection | Medium: rich fields are intentionally not flattened into legacy tasks |
| `selectors.ts` | inverse relations and current/injected-date intelligence | Low |
| `karunCkkSeed.ts` | seed normalized to canonical identity | Low |
| `ProjectWorkspace.tsx/.css` | shared hook, error/loading states, dynamic dates, full asset controls | Medium: large existing component remains a future decomposition candidate |
| `MobileStudioApp.tsx`, `StudioMobilePage.tsx` | shared project reader, task mutation, reports/assets context | Medium: mobile supports task status mutation only |
| `OsContext.tsx` | repository-to-legacy projection for existing consumers | Medium: compatibility bridge should retire after all consumers migrate |
| Tests/browser artifacts/closeout | lifecycle, failure, browser, and evidence expansion | Low |

The React best-practices review found no new hook dependency, accessibility, unstable-list-key, or TypeScript violations; scoped React/ESLint checks pass. The existing monolithic desktop workspace file was not redesigned during this repair.

## Remaining limitations

- Persistence remains local to the browser profile. There is no remote collaboration, cross-device synchronization, server authorization, signed asset access, or production concurrency control.
- Cross-tab refresh is supported; cross-device sync requires the future production repository adapter.
- Mobile currently mutates task completion/reopen only. BOQ, report, and asset writes remain desktop-only but mobile reads the same shared records rather than stale fixtures.
- Reconciliation is a repository operation with tested repair behavior; it is not yet exposed as an end-user maintenance screen.
- Legacy project/task models remain temporarily for unmigrated Studio projects and existing consumers.

## Mission-owned files reviewed/changed

- `artifacts/project-workspace-core/IMPLEMENTATION_PLAN.md`
- `artifacts/project-workspace-core/CLOSEOUT.md`
- `artifacts/project-workspace-core/browser-smoke.mjs`
- `artifacts/project-workspace-core/screenshots/01-overview-desktop.png`
- `artifacts/project-workspace-core/screenshots/02-tasks-desktop.png`
- `artifacts/project-workspace-core/screenshots/03-files-desktop.png`
- `artifacts/project-workspace-core/screenshots/04-site-desktop.png`
- `artifacts/project-workspace-core/screenshots/05-boq-desktop.png`
- `artifacts/project-workspace-core/screenshots/06-site-mobile.png`
- `artifacts/project-workspace-core/screenshots/07-existing-mobile-route.png`
- `scripts/__tests__/project-workspace-core.test.mjs`
- `src/components/studio/project-workspace/ProjectWorkspace.tsx`
- `src/components/studio/project-workspace/ProjectWorkspace.css`
- `src/components/studio/mobile/MobileStudioApp.tsx`
- `src/core/os/OsContext.tsx`
- `src/core/projectWorkspace/karunCkkSeed.ts`
- `src/core/projectWorkspace/legacyAdapter.ts`
- `src/core/projectWorkspace/migration.ts`
- `src/core/projectWorkspace/repository.ts`
- `src/core/projectWorkspace/selectors.ts`
- `src/core/projectWorkspace/types.ts`
- `src/core/projectWorkspace/useProjectWorkspace.ts`
- `src/layouts/OSLayout.tsx`
- `src/pages/os/StudioControlRoomPage.tsx`
- `src/pages/os/StudioMobilePage.tsx`
- `src/pages/os/StudioProjectDetailView.tsx`
- `src/routes/index.tsx` (mission-owned canonical nested-route hunk only)

This inventory contains 27 files. Runtime logs, local caches, unrelated screenshots, generated desktop artifacts, and unrelated worktree changes are excluded.
