# Project Workspace Core Implementation Plan

## Mission

Make `/os/studio/projects/:projectId` the canonical, reusable BeBlank Studio Project Workspace and prove the model with Karun Thai Tea, Central Khon Kaen Campus.

## Repository findings

- React 19, TypeScript 6, Vite 8, React Router 7, Tailwind 3.
- The canonical project route already exists and currently resolves to `StudioProjectDetailView.tsx`.
- Studio data is adapter-backed mock data. Firestore is installed, but it is not the active Studio persistence path.
- Legacy Studio data is split between lightweight `projects/tasks` records and richer `studioProjects/studioTasks` operational records.
- Existing writes flow through approval requests. No direct production data mutation is appropriate for this mission.
- `/m` uses the same `OsData` provider but has a separate presentation adapter.
- Owned workspace primitives live in `src/components/shared/workspace` and the design-system registry.

## Implementation sequence

1. Add a central typed Project Workspace domain with stable IDs, timestamps, explicit relations, and future entity kinds.
2. Add a non-destructive legacy adapter and realistic connected Karun CKK seed.
3. Add deterministic selectors for overview intelligence, events, task schedule views, and BOQ cost calculations.
4. Add an adapter-backed repository. Development mutations persist to local storage; binary upload blobs use IndexedDB. Production data is never overwritten.
5. Replace the monolithic project view with a nested workspace shell and connected Overview, Timeline, Tasks, Schedule, Site, Files & Media, and BOQ & Cost sections.
6. Provide unified Add flows for task, BOQ item, site report, file, and photo.
7. Add pure data-logic tests, then run TypeScript/build, lint, tests, route smoke checks, and desktop/mobile visual checks.
8. Capture screenshots and finish architecture, migration, validation, limitations, Phase 2, and changed-file closeout artifacts.

## Compatibility and rollback

- Keep the existing route path, OS shell, auth, `/m`, and all unrelated routes.
- Do not modify Firebase, auth, finance, trading, environment, deployment, or production data.
- Adapt legacy data at the repository boundary instead of destructively migrating it.
- Existing user changes in the dirty worktree are preserved and excluded from this mission inventory.
- Rollback is removal of the new Project Workspace domain/components/styles and restoration of `StudioProjectDetailView.tsx` from the branch base.

## Planned owned files

- `src/core/projectWorkspace/*`
- `src/components/studio/project-workspace/*`
- `src/pages/os/StudioProjectDetailView.tsx`
- `artifacts/project-workspace-core/*`

## Definition of done

The attached mission success conditions are authoritative. No commit, push, deploy, Firebase write, or production migration is included.

## Acceptance-repair continuation

The final review found a desktop-only store, one-sided asset links, incomplete blob lifecycle, silent hydration reset, and fixed operational dates. The approved repair sequence was:

1. Canonicalize Karun CKK to existing Studio identity `sp-kcc-main`, retaining route aliases.
2. Upgrade to `project-workspace.v2` through a non-destructive adapter with a local backup.
3. Make one repository snapshot the desktop/mobile mutation boundary and project it into legacy `OsData` for existing consumers.
4. Normalize asset relationships and implement inverse queries, edit, replace, unlink, delete, compensation, and reconciliation.
5. Add subscribed hydration/error state and replace fixed current-state dates with an injected/default clock and project/task bounds.
6. Prove the repair through repository lifecycle tests, cross-surface browser tests, lint/type/build, and baseline comparison.
