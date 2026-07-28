# Implementation Plan: GitHub Issue Read Synchronization Foundation

**Branch**: `codex/062-github-issue-read-synchronization-foundation` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/062-github-issue-read-synchronization-foundation/spec.md`

## Summary

Add a new sibling domain module, `issue-sync/`, providing a provider-neutral, read-only `IssueSyncProvider.readIssueSnapshots(identity)` contract, an immutable `IssueSnapshotCollection` model, and reuse of Spec 061's `RepositorySyncStatus` lifecycle. Ship a GitHub-backed provider (bounded first page, pull-request exclusion, deterministic ordering, truncation metadata) and a local provider that honestly reports `Unavailable`. Wire into the project dashboard's existing open/refresh flow with a dedicated `issueSyncRequestVersion` guard. No mutation, no new infrastructure, no issue-to-task conversion.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js app, Phaser 3 for the office scene — unchanged from Specs 059-061.

**Primary Dependencies**: None new. Extends `src/features/city-view/scene/office/repository-sync/` (for the reused `RepositorySyncStatus` type only) and follows the `github/` module's existing fetch/error-normalization conventions (`GitHubPublicRepositoryProvider.ts`) without importing its private helpers — those are unexported, and this Spec's read (issues) is a genuinely different endpoint/shape than that provider's (repository summary/commits/PR-count), so a small, self-contained fetch routine in the new module is the smaller change versus refactoring an already-shipped file's private internals into a shared export.

**Storage**: In-memory only, on `ProjectPortalState` (session state), same lifecycle as `repositorySyncSnapshots`. Issue collections are never persisted back onto `ProjectRegistryEntry`.

**Testing**: Vitest, colocated `*.test.ts` files.

**Target Platform**: Browser (Next.js client + Phaser canvas). Reconfirmed: no `fs`/`child_process`/`node:*` import anywhere in `src/`, no API route anywhere in the repository — unauthenticated public GitHub reads only, matching the existing `GitHubPublicRepositoryProvider` precedent.

**Constraints**: Read-only. No shell/git/`gh` invocation of any kind. No write-back onto the registry. No new dashboard screen. Single bounded first page (50 issues) — no generic pagination framework.

**Scale/Scope**: Same 3 seeded projects as Spec 060/061 (Daily Proof: github provider; Portfolio, AI Lab: local provider).

## Constitution Check

No project-specific constitution gates beyond `AGENTS.md`. Relevant constraints and how this plan satisfies them:

- "Make the smallest correct change" / "Do not make unrelated refactors" -> the existing GitHub repository-summary pipeline (`GitHubRepositoryProvider`, `GitHubPublicRepositoryProvider`, `CachedGitHubRepositoryProvider`, `GitHubRepositoryService`) and Spec 061's `repository-sync/` module are untouched, except for one type import (`RepositorySyncStatus`).
- "Do not duplicate concepts unnecessarily" -> `IssueSyncStatus` is a direct alias of `RepositorySyncStatus`, not a new enum; `IssueSnapshotCollection` deliberately omits a Spec-061-style `availability` field (see Considered Alternatives).
- "Views must not own sync rules or call providers directly" -> `OfficeProjectPortalView.ts` calls one pure formatting function (`createIssueSyncDisplayRows`) owned by the new module; all fetching, dispatch, and ordering/truncation logic lives in the controller and the new service/provider classes.
- "Snapshots must be immutable" -> every function that produces an `IssueSnapshot`/`IssueSnapshotCollection` builds fresh arrays via `.map()`/spread (never aliases a caller-supplied or provider-response array), and `IssueSyncService` holds no internal collection state between calls (the caller supplies `previous` each time).
- "Reuse the established concurrency guard, generalized" -> a new, dedicated `issueSyncRequestVersion` counter + `shouldApplyIssueSyncCollection` guard, structurally identical to Spec 061's `repositorySyncRequestVersion`/`shouldApplyRepositorySyncSnapshot` pair.

## Project Structure

### Documentation (this feature)

```text
specs/062-github-issue-read-synchronization-foundation/
├── spec.md
├── plan.md          # this file
├── tasks.md
└── quickstart.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── issue-sync/                                          # NEW module
│   ├── IssueSyncTypes.ts                                 # NEW: IssueSyncStatus (alias), IssueSnapshot, IssueSnapshotCollection, factory functions
│   ├── IssueSyncTypes.test.ts                            # NEW: factory functions, immutability of factory output
│   ├── IssueSyncProvider.ts                              # NEW: provider-neutral contract (read-only)
│   ├── GitHubIssueSyncProvider.ts                        # NEW: bounded first-page GitHub issues fetch, PR exclusion, ordering, normalization
│   ├── GitHubIssueSyncProvider.test.ts                   # NEW: normalization, PR exclusion, ordering, truncation, error mapping, immutability
│   ├── LocalIssueSyncProvider.ts                         # NEW: honest Unavailable provider
│   ├── LocalIssueSyncProvider.test.ts                     # NEW
│   ├── IssueSyncService.ts                                # NEW: dispatch, error normalization, lastSuccessfulSyncAt stamping
│   ├── IssueSyncService.test.ts                           # NEW: dispatch, unknown-provider fallback, catch-all, timestamp carry-forward
│   ├── IssueSyncView.ts                                   # NEW: pure createIssueSyncDisplayRows formatting function(s)
│   └── IssueSyncView.test.ts                              # NEW
├── OfficeProjectPortalTypes.ts                            # MODIFIED: add issueSyncCollections to ProjectPortalState
├── OfficeProjectPortalController.ts                       # MODIFIED: issueSyncService field, issueSyncRequestVersion counter, syncIssueSnapshots(), shouldApplyIssueSyncCollection(), wiring in openProjectDashboard/updateProjectDashboardInput
├── OfficeProjectPortalController.issue-sync.test.ts       # NEW: concurrency guard, stale/out-of-order protection, project-switch isolation, no-task-created assertion
├── OfficeProjectPortalController.project-dashboard.test.ts # MODIFIED: Object.create-based harness gains issueSyncService/issueSyncRequestVersion fields
├── OfficeProjectPortalRegistry.ts                          # MODIFIED: initialize issueSyncCollections: {} in createProjectPortalState()
├── OfficeProjectPortalView.ts                              # MODIFIED: renderProjectDashboard reads issueSyncCollections, createProjectDashboardLowerRows accepts the new rows
└── OfficeProjectPortalView.test.ts                          # MODIFIED: [ISSUES]/[ISSUE LIST]/[ISSUE DETAIL] row rendering across all view states
```

**Structure Decision**: A new sibling module (`issue-sync/`), not an extension of `repository-sync/`. Repository snapshots and issue collections are different shapes with different concerns (single-object-with-fields vs. collection-with-ordering-and-truncation, PR-exclusion, per-item labels/assignees) — mixing them into one module or one oversized service would blur ownership. The two modules share only the `RepositorySyncStatus` type (imported, not duplicated) and the established request-version pattern (replicated as a sibling counter, not shared).

### UI surface decision: same project dashboard lower panel Spec 061 used

Unchanged reasoning from Spec 061: `detail` is unreachable from `list` in this controller (a pre-existing, out-of-scope condition), while `project-dashboard` is reachable and already carries an auto-refresh-on-open pattern. This Spec adds up to three more rows to the same dynamically-stacked lower-panel mechanism (`createProjectDashboardLowerRows` / `prepareProjectDashboardLowerRows` / `calculateProjectDashboardLowerPanelHeight`), never a fixed-Y-offset placement.

### Row budget (computed, not assumed — see spec.md FR-010)

The existing lower-panel wrap is `PROJECT_DASHBOARD_LOWER_WRAP_LENGTH = 78`, single line (`maxLines: 1`), truncated with `compactTextLine`'s generic `"..."` clamp as a safety net only — every row here is constructed to fit *before* that clamp would ever trigger, so a `+N more` or truncation suffix can never be silently cut off. Verified with worst-case synthetic values (4-digit issue numbers, 200-character titles, `"Closed"` as the longest state word, up to 5 labels/assignees):

| Row | Worst-case length | Budget |
|---|---|---|
| `[ISSUES] Succeeded · 9999 open, 9999 closed · partial` | 53 | 78 |
| `[ISSUE LIST] #9999 <34-char truncated title>… (Closed); +49 more` | 72 | 78 |
| `[ISSUE DETAIL] Labels: <2×8-char>, +N · Assignees: <1×10-char>, +N` | 72 | 78 |

This is why `[ISSUE LIST]` is bounded to **one** visible issue (not three, matching the active-work/employee rows elsewhere on this screen) — two realistic-length titles plus a `+N more` suffix does not reliably fit in 78 characters; one title truncated to 34 characters does, with margin.

### Row *count* budget — a second, independent constraint discovered during implementation

The 78-character check above only proves each row is safe on its own. The lower panel also has a fixed maximum *height* (`this.panelHeight - PROJECT_DASHBOARD_LOWER_PANEL_Y`), and before this Spec, `calculateProjectDashboardLowerPanelHeight` only clamped the *drawn panel background* to that height — it never reduced which rows were rendered. Rows were always laid out at their full computed Y position regardless of the clamp. This was latent (Specs 059-061 never had enough simultaneous rows to trigger it) but became a real, reachable overlap bug the moment this Spec added up to three more rows: with the existing base rows (`[RISK]`/`[ACTIVITY]`/`[ADVISORY]` (up to 2 lines)/`[ATTENTION]`/`[SOURCE]` or `[FOCUS]`/`[SYNC]` or `[NEXT]`) plus Spec 061's `[REPO-SYNC]` row, the *pre-existing* real (non-synthetic) default test fixture already consumed nearly the entire budget — confirmed by a failing test, not assumed.

Two changes fix this, both scoped to `renderProjectDashboard` only (no other viewMode is touched):

1. **Reclaim genuinely unused space — conservatively.** The middle "Active Work"/"Employees" section panel was 148px tall. Its content is up to 3 rows per side, each individually wrapped (`wrapText(..., 34)` / `wrapText(..., 32)`) at a fixed 32px row spacing — realistic titles (e.g. the default fixture's "Build project dashboard - In Progress (High)") commonly wrap to 2 lines, so the true worst-case content floor is the third row's y (232 relative) plus two line-heights (`2 × 14 = 28`), i.e. ~260 relative, not the single-line ~232 first assumed. An initial attempt reclaimed a naive 28px (`PROJECT_DASHBOARD_SECTION_PANEL_HEIGHT = 120`) on the wrong assumption that rows were single-line; a dedicated regression test (3 realistic multi-word active-work titles and employee names, each wrapping to exactly 2 lines) caught this immediately — it failed with rows rendering 10px past the panel's bottom edge before this was corrected. The reclaim actually available, with margin preserved, is **12px**: `PROJECT_DASHBOARD_SECTION_PANEL_HEIGHT` is `136` (was inlined as `148`), and `PROJECT_DASHBOARD_LOWER_PANEL_Y`/`PROJECT_DASHBOARD_LOWER_ROW_START_Y` move up by the same 12px, preserving the existing 6px gap between the two panels. No existing row's position changes; only the lower panel gains 12px of budget.
2. **Make the height clamp actually drop rows, not just shrink the background.** A new `fitProjectDashboardLowerRows(rows, maxHeight)` repeatedly drops the *last* row until the remaining set's content height fits within `maxHeight`. Because rows are always appended in ascending priority order (base rows first, then `[REPO-SYNC]`, then `[ISSUES]`/`[ISSUE LIST]`/`[ISSUE DETAIL]`), dropping from the end means the newest, lowest-priority information degrades first — `[ISSUE DETAIL]` before `[ISSUE LIST]` before `[ISSUES]` before anything from Specs 059-061. This directly implements spec.md's own instruction: "Use a bounded visible list ... if space is limited. Do not allow issue rows to overlap adjacent panels."

With the corrected 12px reclaim, the real default fixture (2-line advisory + default external-source `[SOURCE]`/`[SYNC]` rows + `[REPO-SYNC]`) only has room for `[ISSUES]`, dropping both `[ISSUE LIST]` and `[ISSUE DETAIL]`; a project with a shorter advisory and a minimal single-signal external source fits all three. Both `[ISSUE LIST]` and `[ISSUE DETAIL]` are therefore conditional, not guaranteed, on every project — this is documented in spec.md and quickstart.md rather than asserted as unconditional. This is verified by three dedicated tests: one with a short advisory and minimal external source (all three issue rows present), one with the real default fixture (only `[ISSUES]` remains, and no row ever renders outside the drawn panel), and one dedicated regression test proving the reclaimed section panels themselves never clip realistic 2-line-wrapped Active Work/Employee rows.

### Data flow

```text
project.repositoryIdentity (Spec 060, configured, unchanged)
      |
      v
OfficeProjectPortalController.openProjectDashboard(projectId)
  -> void this.refreshProjectDashboardRepositorySummary(projectId)   (Spec 059/060, unchanged)
  -> void this.syncRepositorySnapshot(projectId)                     (Spec 061, unchanged)
  -> void this.syncIssueSnapshots(projectId)                        (new, this Spec)
       requestVersion = ++issueSyncRequestVersion                    (new, dedicated counter)
       state.issueSyncCollections[projectId] = Syncing collection (carries forward lastSuccessfulSyncAt)
       render()
       collection = await IssueSyncService.readIssueSnapshots(identity, previous)
         -> dispatch on identity.provider:
              "github" -> GitHubIssueSyncProvider
                            -> GET /repos/{owner}/{repo}/issues?state=all&per_page=51
                            -> exclude raw items carrying `pull_request`
                            -> isTruncated = rawItems.length > 50 (judged BEFORE exclusion)
                            -> normalize each remaining item -> IssueSnapshot (defensive array copies)
                            -> sort: open-before-closed, updated desc, number asc
              "local"  -> LocalIssueSyncProvider -> always Unavailable, honest reason
              (other)  -> IssueSyncService's own fallback -> Unavailable, "no provider registered"
         -> any thrown error caught -> Unavailable, generic display-safe reason
         -> lastSuccessfulSyncAt stamped now() only if syncStatus === "Succeeded", else carried forward
       if !shouldApplyIssueSyncCollection(projectId, requestVersion): return   (stale/out-of-order guard)
       state.issueSyncCollections[projectId] = collection
       render()

OfficeProjectPortalView.renderProjectDashboard(state)
  -> createIssueSyncDisplayRows(project?.repositoryIdentity, state.issueSyncCollections[projectId])
  -> spliced into createProjectDashboardLowerRows(...) as up to three more dynamically-stacked rows,
     tagged [ISSUES] / [ISSUE LIST] / [ISSUE DETAIL]
```

### Why a dedicated `issueSyncRequestVersion` (not shared with `repositorySyncRequestVersion`)

`openProjectDashboard` now fires **three** independent async flows in the same synchronous burst: the existing repository-summary refresh, Spec 061's repository sync, and this Spec's issue sync. Sharing any single counter across flows that bump it in the same tick means whichever bumps last invalidates the others' still-pending, legitimate results — the exact failure mode Spec 061 identified and avoided for its own two flows. A third, sibling counter (matching the codebase's established one-counter-per-async-flow-family convention) avoids it here too. Tested explicitly: opening one dashboard populates `repositorySummaries`, `repositorySyncSnapshots`, and `issueSyncCollections` for the same project, none invalidating another.

### Pull-request exclusion and truncation ordering (the one subtle correctness point)

GitHub's `/issues` endpoint returns issues and pull requests commingled on the same page; only pull requests carry a `pull_request` field. `isTruncated` is computed from the **raw**, pre-exclusion page size (51 raw items fetched; `isTruncated = rawItems.length > 50`), not from the post-exclusion issue count — because the existence of a 51st raw item means "there is a next page of raw results," regardless of how many of the 50 kept items turn out to be pull requests after filtering. `isTruncated: false` therefore means "the raw first page was complete" — not "every issue was retrieved," since a same-size-or-smaller raw page can still contain PRs that reduce the visible issue count below 50 without indicating truncation. This distinction is stated in spec.md's Edge Cases and covered by a dedicated test.

### `IssueSnapshotCollection` field mapping from a raw GitHub issue

| GitHub field | `IssueSnapshot` field | Notes |
|---|---|---|
| `number` | `number` | required |
| `title` | `title` | required |
| `body` | `bodySummary` | truncated to 240 chars; omitted if null/absent |
| `state` (`"open"`/`"closed"`) | `state` (`"Open"`/`"Closed"`) | normalized casing |
| `user.login` | `author.login` | omitted if absent |
| `assignees[].login` | `assignees: string[]` | defensive `.map()` copy, empty array if absent |
| `labels[]` (string or `{name}`) | `labels: string[]` | both GitHub label shapes normalized to plain names |
| `html_url` | `url` | omitted if absent |
| `created_at` | `createdAt` | required |
| `updated_at` | `updatedAt` | required |
| `closed_at` | `closedAt` | omitted if null |
| *(stamped once per fetch)* | `syncedAt` | same timestamp for every issue in one collection |
| *(from `repositoryIdentity`, not the response)* | `owner`, `name`, `provider` | trusts the identity we requested, not response echo fields |
| *(composed)* | `id` | `` `${owner}/${name}#${number}` `` — deterministic, no reliance on GitHub's opaque numeric `id` |

## Complexity Tracking

No Constitution Check violations — no table needed.
