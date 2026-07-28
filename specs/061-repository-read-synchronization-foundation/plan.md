# Implementation Plan: Repository Read Synchronization Foundation

**Branch**: `codex/061-repository-read-synchronization-foundation` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/061-repository-read-synchronization-foundation/spec.md`

## Summary

Add a new, provider-neutral `repository-sync/` domain module with a read-only `RepositorySyncProvider` contract, an immutable `RepositorySyncSnapshot` model, and an explicit `NotStarted | Syncing | Succeeded | Failed | Unavailable` lifecycle. Wire it into the project dashboard's existing open/refresh flow with a dedicated request-version guard so stale results can never overwrite newer ones. Ship two providers: a GitHub-backed one that reuses the existing `GitHubRepositoryService`, and an honest `Unavailable` local provider (this runtime cannot read a local filesystem). No mutation, no live infrastructure beyond what already exists, no change to Spec 060's configured-identity model.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js app, Phaser 3 for the office scene — unchanged from Specs 059/060.

**Primary Dependencies**: None new. Extends `src/features/city-view/scene/office/github/` (existing GitHub read pipeline) and `project-registry/` (Spec 060 identity). Adds one new sibling domain module, `repository-sync/`.

**Storage**: In-memory only, on `ProjectPortalState` (session state), same lifecycle as `repositorySummaries`/`repositoryMappings`. Verified snapshots are never persisted back onto `ProjectRegistryEntry`.

**Testing**: Vitest, colocated `*.test.ts` files.

**Target Platform**: Browser (Next.js client + Phaser canvas). Reconfirmed by discovery: no `fs`/`child_process`/`node:*` import anywhere in `src/`, no API route anywhere in the repository. This is why the local provider reports `Unavailable` honestly instead of attempting a real filesystem read (see spec.md's Runtime Limitation).

**Constraints**: Read-only. No shell/git/`gh` invocation of any kind. No write-back onto Spec 060's registry model. No new dashboard screen — integrates into the existing project dashboard.

**Scale/Scope**: 3 seeded projects (Daily Proof: github provider; Portfolio, AI Lab: local provider) — the same set Spec 060 established.

## Constitution Check

No project-specific constitution gates beyond `AGENTS.md` (as in Specs 059/060). Relevant constraints and how this plan satisfies them:

- "Make the smallest correct change" / "Do not make unrelated refactors" -> the GitHub read pipeline (`GitHubRepositoryProvider`, `GitHubRepositoryService`, `CachedGitHubRepositoryProvider`) and the GitHub-dashboard-signal pipeline (`GitHubProjectDashboardProvider`, `mergeGitHubProjectDashboardSource`, `externalSources`) are untouched — reused via composition, not modified.
- "Views must not own sync rules or call providers directly" -> `OfficeProjectPortalView.ts` calls one pure formatting function (`createRepositorySyncDisplayRows`) owned by the new `repository-sync/` module; all fetching, dispatch, and error-normalization logic lives in the controller and the new service/provider classes.
- "Do not treat configured metadata as proof of a successful read" -> `RepositorySyncSnapshot` is a wholly separate type from `ProjectRegistryRepositoryIdentity`, never derived from `connectionState`, and never written back onto the registry (see Data Flow below).
- "Stale/out-of-order protection via an established concurrency guard" -> reuses the exact `RequestVersion` counter + `shouldApplyX` pattern already established for `repositoryRequestVersion`/`taskRequestVersion`, as a new sibling counter (see Considered Alternatives).
- "Snapshots must be immutable" -> every function that produces a `RepositorySyncSnapshot` (the three factories, `GitHubRepositorySyncProvider`'s mapping, `RepositorySyncService.readRepositorySnapshot`'s final spread) returns a freshly constructed object; `RepositorySyncService` holds no internal snapshot state between calls (the caller supplies `previous` each time); and `latestCommit` is rebuilt field-by-field from `summary.latestCommit` rather than aliased, so no returned snapshot shares a mutable reference with anything the controller or a provider retains.

## Project Structure

### Documentation (this feature)

```text
specs/061-repository-read-synchronization-foundation/
├── spec.md
├── plan.md          # this file
├── tasks.md
└── quickstart.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── repository-sync/                                   # NEW module
│   ├── RepositorySyncTypes.ts                          # NEW: RepositorySyncStatus, RepositorySyncSnapshot, factory functions
│   ├── RepositorySyncTypes.test.ts                     # NEW: factory function coverage
│   ├── RepositorySyncProvider.ts                       # NEW: provider-neutral contract (read-only)
│   ├── GitHubRepositorySyncProvider.ts                 # NEW: wraps GitHubRepositoryService, maps GitHubRepositorySummary -> RepositorySyncSnapshot
│   ├── GitHubRepositorySyncProvider.test.ts             # NEW: mapping coverage for connected/loading/not_connected/error
│   ├── LocalRepositorySyncProvider.ts                  # NEW: honest Unavailable provider
│   ├── LocalRepositorySyncProvider.test.ts              # NEW
│   ├── RepositorySyncService.ts                        # NEW: dispatch by identity.provider, error normalization, lastSuccessfulSyncAt stamping
│   ├── RepositorySyncService.test.ts                    # NEW: dispatch, unknown-provider fallback, catch-all, timestamp carry-forward
│   ├── RepositorySyncView.ts                            # NEW: pure createRepositorySyncDisplayRows formatting function
│   └── RepositorySyncView.test.ts                       # NEW
├── OfficeProjectPortalTypes.ts                          # MODIFIED: add repositorySyncSnapshots to ProjectPortalState
├── OfficeProjectPortalController.ts                     # MODIFIED: repositorySyncService field, repositorySyncRequestVersion counter, syncRepositorySnapshot(), shouldApplyRepositorySyncSnapshot(), wiring in openProjectDashboard/updateProjectDashboardInput
├── OfficeProjectPortalController.repository-sync.test.ts # NEW: concurrency guard, stale/out-of-order protection (User Story 3), navigation-away protection
├── OfficeProjectPortalRegistry.ts                        # MODIFIED: initialize repositorySyncSnapshots: {} in createProjectPortalState() (RepositorySyncService itself is constructed in the controller's constructor, alongside the existing repositoryService, matching that field's own construction site)
├── OfficeProjectPortalRegistry.test.ts                    # MODIFIED: createProjectPortalState() includes empty repositorySyncSnapshots
├── OfficeProjectPortalView.ts                            # MODIFIED: renderProjectDashboard reads repositorySyncSnapshots, createProjectDashboardLowerRows accepts the new row
└── OfficeProjectPortalView.test.ts                        # MODIFIED: [REPO-SYNC] row rendering, absent-identity case, dynamic panel height with the new row
```

**Structure Decision**: One new sibling domain module (`repository-sync/`), matching the existing pattern of `github/`, `project-dashboard/`, `project-registry/` each owning one bounded concept. No new top-level scene, no new dashboard screen.

### UI surface decision: project dashboard's existing lower panel, not the detail screen

Discovery traced every `viewMode` assignment in `OfficeProjectPortalController.ts`. `detail` is only ever entered via `updateWorkspaceInput`'s Escape handler (`workspace` → `detail`), and `workspace` is only entered via `updateDetailInput`'s action/enter handler — a closed two-node subgraph with no edge from `list` or `project-dashboard`. `list`'s own action/enter handler (`updateListInput`) always calls `openProjectDashboard`, never anything that sets `viewMode = "detail"`. This means `"detail"` is not reachable from a fresh session by any traced player input — a pre-existing condition from before this Spec, out of scope to fix (Codex's prior reviews of Specs 059/060 exercised `renderDetail` via unit tests that construct `viewMode: "detail"` directly, which is valid rendering-logic coverage but does not establish navigational reachability).

Given that, rendering this Spec's new status row on `detail` would make it unobservable in the running app, contradicting the Spec's own "user-visible behavior" requirement. `project-dashboard` (reached from `list` via Enter/Space, `updateListInput` → `openProjectDashboard`) is genuinely reachable and already has an established auto-refresh-on-open pattern. This Spec integrates there, using the existing dynamically-stacked lower-panel mechanism (`createProjectDashboardLowerRows` / `prepareProjectDashboardLowerRows` / `calculateProjectDashboardLowerPanelHeight`) rather than any fixed-Y-offset placement, to avoid Spec 059's Round-3 overlap-bug class entirely.

### Data flow

```text
project.repositoryIdentity (Spec 060, configured, unchanged)
      |
      v
OfficeProjectPortalController.openProjectDashboard(projectId)
  -> void this.syncRepositorySnapshot(projectId)          (new, fired alongside the existing
                                                             refreshProjectDashboardRepositorySummary call)
       requestVersion = ++repositorySyncRequestVersion      (new, dedicated counter)
       state.repositorySyncSnapshots[projectId] = Syncing snapshot (carries forward lastSuccessfulSyncAt)
       render()
       snapshot = await RepositorySyncService.readRepositorySnapshot(identity, { projectId }, previous)
         -> dispatch on identity.provider:
              "github" -> GitHubRepositorySyncProvider
                            -> reuses existing GitHubRepositoryService.getRepositorySummary(projectId)
                            -> maps GitHubRepositorySummary -> RepositorySyncSnapshot
              "local"  -> LocalRepositorySyncProvider -> always Unavailable, honest reason
              (other)  -> RepositorySyncService's own fallback -> Unavailable, "no provider registered"
         -> any thrown error caught -> Unavailable, generic display-safe reason
         -> lastSuccessfulSyncAt stamped now() only if syncStatus === "Succeeded", else carried forward from `previous`
       if !shouldApplyRepositorySyncSnapshot(projectId, requestVersion): return   (stale/out-of-order guard)
       state.repositorySyncSnapshots[projectId] = snapshot
       render()
  -> (unchanged) void this.refreshProjectDashboardRepositorySummary(projectId)   still drives repositorySummaries
                                                                                   and the GitHub-dashboard-signal
                                                                                   pipeline, untouched

OfficeProjectPortalView.renderProjectDashboard(state)
  -> createRepositorySyncDisplayRows(project?.repositoryIdentity, state.repositorySyncSnapshots[projectId])
  -> spliced into createProjectDashboardLowerRows(...) as one more dynamically-stacked row, tagged [REPO-SYNC]
```

`ProjectRegistryEntry`/`ProjectRegistryRepositoryIdentity` (Spec 060) are read from, never written to. `state.repositorySummaries`, `state.repositoryMappings`, and the GitHub-dashboard `externalSources`/`[SYNC]`/`[SOURCE]` rows are entirely unaffected — the new pipeline is additive and parallel, not a replacement.

### Considered alternative: reuse `repositoryRequestVersion` instead of a new counter (rejected)

`openProjectDashboard` already calls `refreshProjectDashboardRepositorySummary`, which bumps and captures `repositoryRequestVersion`. This Spec's `syncRepositorySnapshot` is called in the same synchronous burst, for the same project, on the same `viewMode`. If it shared that counter, its own bump would invalidate `refreshProjectDashboardRepositorySummary`'s in-flight request (or vice versa, depending on call order) every single time the dashboard is opened — both are legitimate, wanted results, not competing stale/fresh requests. This is not a hypothetical: it would reproduce on every dashboard open. A dedicated `repositorySyncRequestVersion` avoids it, and matches the codebase's existing convention of one counter per independent async-flow family (`taskRequestVersion`, `employeeRequestVersion`, `employeeNpcBootstrapRequestVersion`, etc. already coexist for exactly this reason).

### `RepositorySyncSnapshot` field mapping from `GitHubRepositorySummary`

| `GitHubRepositorySummary.connectionStatus` | `RepositorySyncSnapshot.syncStatus` | `availability` | `errorSummary` |
|---|---|---|---|
| `"connected"` | `"Succeeded"` | `"available"` | *(absent)* |
| `"loading"` | `"Syncing"` | `"unknown"` | *(absent)* |
| `"not_connected"` | `"Unavailable"` | `"unavailable"` | `summary.errorMessage ?? "No repository mapping is configured for this project."` |
| `"error"` | `"Failed"` | `"unavailable"` | `summary.errorMessage ?? "Repository synchronization failed."` |

`owner`/`name`/`defaultBranch` are taken from `summary` when present, falling back to `identity.owner`/`identity.name`/`identity.defaultBranch` — making the identity parameter load-bearing rather than decorative. `currentBranch` and `workingTreeState` are never populated by this provider (GitHub's read-only API has no concept of a local working copy) — left `undefined`, per spec.md's documented Runtime Limitation.

### View rendering (`OfficeProjectPortalView.renderProjectDashboard`)

```ts
const dashboardProjectId = state.selectedProjectDashboardProjectId;
const dashboardProject = state.projects.find((item) => item.id === dashboardProjectId);
const repositorySyncRows = createRepositorySyncDisplayRows(
  dashboardProject?.repositoryIdentity,
  dashboardProjectId ? state.repositorySyncSnapshots[dashboardProjectId] : undefined,
);
```

`createProjectDashboardLowerRows` gains one more optional parameter and, when `repositorySyncRows` is non-empty, pushes `{ text: `[REPO-SYNC] ${repositorySyncRows[0]}`, maxLines: 1 }` — same shape as every existing lower row, so `prepareProjectDashboardLowerRows`/`calculateProjectDashboardLowerPanelHeight` require no change.

## Complexity Tracking

No Constitution Check violations — no table needed.
