# Jarvis Dashboard v0.1.1

## Purpose

Jarvis Dashboard is the local-first monitoring surface for Jarvis B. It shows run state, lane ownership, queue status, checks, reports, and risk notes using sanitized local data only.
It is a monitoring surface, not a runner.

## Files

- `src/pages/os/JarvisDashboardPage.tsx`
- `src/core/jarvis/types.ts`
- `src/core/jarvis/buildJarvisDashboardModel.ts`
- `src/data/jarvis/sampleJarvisDashboardState.ts`
- `src/components/jarvis/JarvisRunSummary.tsx`
- `src/components/jarvis/JarvisAgentLane.tsx`
- `src/components/jarvis/JarvisTaskTable.tsx`
- `src/components/jarvis/JarvisChecksPanel.tsx`
- `src/components/jarvis/JarvisReportsPanel.tsx`
- `src/components/jarvis/JarvisRisksPanel.tsx`
- `public/jarvis/dashboard-state.sample.json`
- `.jarvis/state/dashboard-state.example.json`
- `.jarvis/tasks/inbox/jarvis-runner-v0.1.example.json`
- `.jarvis/tasks/inbox/lint-debt-cleanup-v0.1.json`

## Data contract

The dashboard reads from `sampleJarvisDashboardState.ts` for now. A future runner should write the same shape to `.jarvis/state/dashboard-state.json`, then refresh the UI with the new state snapshot.
The JSON examples in `public/jarvis/dashboard-state.sample.json` and `.jarvis/state/dashboard-state.example.json` document that contract for future local-first automation.

## Runner update flow

1. Claim a task packet from `.jarvis/tasks/inbox/`.
2. Update the active run and queue snapshot in `.jarvis/state/dashboard-state.json`.
3. Append a sanitized run note to `.jarvis/logs/`.
4. Write a report to `.jarvis/reports/`.
5. Move the packet to `.jarvis/tasks/done/` or `.jarvis/tasks/failed/`.
6. Keep the packet and report summaries sanitized, short, and local-first.

## Safe rendering rules

- Render summaries only.
- Do not surface secrets, raw logs, env values, or private API output.
- Keep path references normalized and consistent.
- Build verification means the dashboard compiles.
- Lint failures may reflect unrelated repo debt, not a dashboard failure.
- Distinguish task failure from repo-level technical debt in both state and reports.
- Future runner output should write check summaries, not raw logs.

## Recommended agent flow

- `codex.architect` shapes the packet and decides the task scope.
- `opencode.deepseek.implementer` updates the dashboard state and UI.
- `opencode.deepseek.fixer` gets its own packet for repo debt cleanup.
- `codex.reviewer` verifies scope and regressions.
- `tester` runs build and lint checks and records the result truthfully.
- `handoff` archives the packet and closes the run note.

## Current truth snapshot

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed after removing the synchronous state updates from `src/pages/os/AIToolRadarPage.tsx` and `src/pages/os/CommandCenterPage.tsx`.
- `npm run typecheck` is unavailable because the repo has no dedicated script.
- No live runner exists yet, so the dashboard still uses sample and local state.
- The live runner now writes truthful `running`, `done`, `failed`, and `blocked` states.
- AI calling is still not implemented in the runner.
- The next packet should focus on a minimal OpenCode + DeepSeek adapter.
