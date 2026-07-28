# Feature Specification: GitHub Issue Read Synchronization Foundation

**Feature Branch**: `codex/062-github-issue-read-synchronization-foundation`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Extend the repository read synchronization foundation (Spec 061) so AIverse can read GitHub Issues belonging to a registered project's repository — a reliable, read-only issue synchronization foundation. Not yet issue-to-task conversion."

## Current Product Limitation

Spec 061 added a provider-neutral, read-only repository *snapshot* boundary (`RepositorySyncSnapshot`) — one verified state per repository (availability, branch, latest commit). It has no concept of a *collection* of anything, and nothing in the codebase reads GitHub Issues at all. The existing GitHub read pipeline (`GitHubRepositoryProvider`/`GitHubPublicRepositoryProvider`) only reads repository-level summary fields (default branch, latest commit, open issue/PR *counts*) — never individual issue records — and GitHub's own `/issues` REST endpoint conflates issues and pull requests in one response, which nothing in this codebase currently filters.

## User-Visible Behavior Being Added

The project dashboard screen (`OfficeProjectPortalView.renderProjectDashboard` — the same reachable surface Spec 061 used for its `[REPO-SYNC]` row) gains up to three new lower-panel rows, sourced from a new, provider-neutral issue synchronization collection. `[ISSUES]` always appears when a repository identity is present; `[ISSUE LIST]` and `[ISSUE DETAIL]` appear only when the lower panel has room after existing rows (see FR-011 and plan.md's row-count budget) — they are never guaranteed on every project:

- `[ISSUES] Succeeded · 3 open, 1 closed` — a one-line status/count summary; also `Not started`, `Syncing...`, `Failed: <reason>`, `Unavailable: <reason>`, or `No repository identity`, and a `· partial` suffix when the first page could not confirm every issue was retrieved.
- `[ISSUE LIST] #142 Fix crash when opening the settings dia… (Open); +5 more` — the single most-relevant issue (per the ordering below), bounded to one entry so the row can never overflow the panel regardless of title length, plus a `+N more` count when more exist. Rendered only when space remains in the lower panel.
- `[ISSUE DETAIL] Labels: bug, needs-tri…, +1 · Assignees: octocat, +2` — labels/assignees of that same issue, omitted entirely when the issue has neither. Rendered only when space remains in the lower panel; the first row dropped under space pressure.

Daily Proof (GitHub-backed, per Spec 060/061) shows real, verified issue data once its dashboard is opened. Portfolio and AI Lab (local-provider) show the same honest `Unavailable` state Spec 061 established for repository sync — never a fabricated empty-success result.

## In Scope

- A provider-neutral `IssueSyncProvider.readIssueSnapshots(repositoryIdentity)` contract, with no mutation method of any kind.
- An immutable `IssueSnapshotCollection` model: provider, owner/name, an explicit synchronization status, the issue list, open/closed counts, a truncation flag, the last successful sync timestamp, and a display-safe error summary.
- A per-issue `IssueSnapshot` model: stable identifier, number, title, optional body summary, `Open`/`Closed` state, optional author, defensively-copied assignees/labels, owner/name/provider, optional web URL, created/updated/optional-closed timestamps, and a synchronization timestamp.
- Exclusion of pull requests from every issue collection, even though GitHub's issues endpoint returns them commingled.
- A bounded first-page GitHub read (50 issues) with an explicit, tested truncation indicator when more may exist — never presented as complete without that metadata.
- Deterministic ordering: open before closed, most-recently-updated first, issue number as a tie-breaker — applied client-side regardless of what the GitHub API's own sort returns.
- Reuse of Spec 061's `RepositorySyncStatus` lifecycle (`NotStarted | Syncing | Succeeded | Failed | Unavailable`), aliased as `IssueSyncStatus`, rather than inventing a parallel enum.
- A dedicated `issueSyncRequestVersion` concurrency counter (a new sibling to Spec 061's `repositorySyncRequestVersion`, not a shared one — seeded 061's own rejected-alternative finding: two flows firing in the same tick under one shared counter invalidate each other).
- Integration into the existing project dashboard open/refresh flow, alongside Spec 061's repository sync trigger.

## Out of Scope

- Issue creation, editing, closing/reopening, labeling, assignment, comments, or milestones.
- Pull request mutation or repository mutation of any kind.
- GitHub authentication UI or token management (only unauthenticated public reads, matching Spec 061's `GitHubPublicRepositoryProvider` precedent).
- Firebase, issue-to-task conversion, task creation, AI employee assignment, or automated coding from an issue — this Spec produces a read-only collection an AI-employee-assignment Spec could consume later, but does not consume it itself.
- Background polling, webhooks, or persistent storage — synchronization is triggered by the existing dashboard-open/refresh flow only, exactly like Spec 061.
- Server-side filesystem access, direct `git`/`gh` shell execution — this runtime remains 100% client-side (reconfirmed: no `fs`, `child_process`, or API route anywhere in `src/`).
- A generic, unbounded pagination framework — a single bounded first page with an explicit truncation flag is the entire pagination boundary for this Spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Daily Proof's real, filtered issue list (Priority: P1) 🎯 MVP

As a player opening Daily Proof's project dashboard, I can see a real, read-only snapshot of its GitHub Issues — never its pull requests — with an honest open/closed count.

**Why this priority**: The spec's core deliverable — a working, provider-neutral issue read distinct from Spec 061's single-repository-snapshot concept.

**Independent Test**: Open Daily Proof's project dashboard with a fresh `createProjectPortalState()`, let a mocked GitHub issues fetch resolve with a mix of issues and pull requests, and confirm the lower panel shows `[ISSUES] Succeeded · <n> open, <n> closed` with pull requests excluded from every count and from the visible list.

**Acceptance Scenarios**:

1. **Given** Daily Proof's project dashboard is opened and the GitHub issues fetch resolves with 2 open issues, 1 closed issue, and 1 pull request, **When** the sync completes, **Then** the lower panel shows `[ISSUES] Succeeded · 2 open, 1 closed` (the pull request contributes to neither count) and `state.issueSyncCollections["daily-proof"].issues` contains exactly 3 entries, none of them the pull request.
2. **Given** the same resolved collection, **When** rows are rendered, **Then** `[ISSUE LIST]` shows the single most-relevant issue per the ordering rule (open before closed, most-recently-updated first, number as tie-breaker) and, if more than one issue exists, a `+N more` suffix.

---

### User Story 2 - Issue synchronization degrades safely without a usable GitHub repository (Priority: P1)

As a player opening Portfolio's or AI Lab's project dashboard, I see an honest `Unavailable` issue-synchronization state — never a fabricated empty-success result — because neither project has a usable GitHub repository identity.

**Why this priority**: Directly demonstrates that "no repository" and "repository with zero issues" are never conflated, mirroring Spec 061's core safety property for the new collection-shaped model.

**Independent Test**: Open Portfolio's project dashboard (its `repositoryIdentity.provider` is `"local"`) and confirm `[ISSUES] Unavailable: ...` is shown, distinct from `Succeeded · 0 open, 0 closed`.

**Acceptance Scenarios**:

1. **Given** Portfolio's project dashboard is opened, **When** the local issue provider is invoked, **Then** `state.issueSyncCollections["portfolio"].syncStatus === "Unavailable"` and the rendered row is never `Succeeded`.
2. **Given** a project whose GitHub repository has genuinely zero issues, **When** the sync succeeds, **Then** the collection reports `syncStatus === "Succeeded"` with `issues: []` and `openCount === 0 && closedCount === 0` — a state distinguishable in both data and rendered text from the `Unavailable` case in Scenario 1.

---

### User Story 3 - A slower, stale issue sync can never overwrite a newer one, and switching projects never leaks another project's issues (Priority: P1)

As a player who quickly re-triggers an issue sync, or switches from one project's dashboard to another before a sync resolves, I never see a stale or mismatched issue collection.

**Why this priority**: The feature request's explicit, named correctness property, generalized from Spec 061's single-snapshot guarantee to a collection.

**Independent Test**: Two overlapping issue-sync requests for the same project where the older request resolves after the newer one; assert the stored collection remains the newer result regardless of which one succeeded or failed. Separately, open project A's dashboard, let its sync resolve, then open project B's dashboard before B's own sync resolves; assert B never displays A's issues.

**Acceptance Scenarios**:

1. **Given** an in-flight older sync and a newer sync both requested for project P, **When** the older resolves after the newer has already applied a `Succeeded` result, **Then** `state.issueSyncCollections[P]` still equals the newer result — regardless of whether the older result was `Succeeded`, `Failed`, or anything else.
2. **Given** project A's issue sync has already resolved and stored a real collection, **When** the player opens project B's dashboard, **Then** B's rendered `[ISSUES]` row reflects only B's own state (`Not started` or B's own in-flight/resolved result) and never A's collection.

### Edge Cases

- A project has no `repositoryIdentity` at all: the view shows `[ISSUES] No repository identity` rather than silence. **No project seeded by `createProjectPortalState()` is actually in this state today** (Daily Proof, Portfolio, and AI Lab all carry a `repositoryIdentity`, per Spec 060) — this message is reachable only for a future project registered without one, and is verified at the view-formatting-function level, not end-to-end through the running app.
- GitHub's first page returns exactly 50 raw items (issues and pull requests combined): `isTruncated` is `false` — the raw page was complete, so there is no next page, even though the *visible issue count* (after excluding pull requests) may be lower than 50. `isTruncated` describes "the raw first page was complete," not "every issue was retrieved" if a 51st raw item exists.
- GitHub's first page returns 51 raw items: `isTruncated` is `true` and only the first 50 raw items (after pull-request exclusion) are kept — the 51st is discarded, never silently counted or displayed.
- A label value returned by GitHub is a bare string rather than a `{name}` object (both shapes are valid per GitHub's API): both are normalized to the label's plain string name.
- An issue has no assignees, no labels, no body, and no `closed_at`: all are omitted from both the domain snapshot (undefined/empty array, never fabricated placeholders) and the rendered `[ISSUE DETAIL]` row (omitted entirely when both labels and assignees are empty).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a provider-neutral `IssueSyncProvider` contract with exactly one read method (`readIssueSnapshots`) and MUST NOT expose any method that creates, edits, closes, labels, assigns, or comments on an issue or pull request.
- **FR-002**: `IssueSnapshotCollection.syncStatus` MUST reuse Spec 061's `RepositorySyncStatus` union (`NotStarted | Syncing | Succeeded | Failed | Unavailable`) rather than a duplicate parallel type.
- **FR-003**: Every entry returned by the GitHub issues endpoint that carries a `pull_request` field MUST be excluded from the issue collection, its counts, and its ordering — before the bounded-page truncation decision is finalized on the raw (pre-exclusion) result set.
- **FR-004**: `IssueSnapshotCollection` MUST distinguish, in both data and rendered text, all four of: no usable repository identity (`Unavailable`, no fetch attempted), a successful fetch with zero issues (`Succeeded`, `issues: []`), a failed fetch (`Failed`), and an unavailable provider/repository (`Unavailable`, fetch attempted or declined for a known reason).
- **FR-005**: Every `IssueSnapshot`'s `assignees` and `labels` arrays, and the collection's `issues` array, MUST be defensively copied — mutating a caller-supplied source array or a previously-returned collection's arrays MUST NOT affect internally stored state or later reads.
- **FR-006**: The controller MUST guard every applied issue-sync result with a dedicated, monotonically-increasing `issueSyncRequestVersion` counter (distinct from `repositorySyncRequestVersion`), checked against the current viewMode/selected-project context, so a slower/older request can never overwrite a newer one, and switching to a different project's dashboard MUST discard any in-flight result for the project the player left.
- **FR-007**: No raw exception, stack trace, or unfiltered provider response MUST ever reach `IssueSnapshotCollection.errorSummary` or the rendered view.
- **FR-008**: The GitHub provider MUST fetch at most 51 raw items in a single request (50 requested plus a 1-item over-fetch used only to detect truncation) and MUST expose `isTruncated: true` whenever the raw response contains more than 50 items — never presenting a possibly-partial collection as complete without this flag.
- **FR-009**: Issue ordering MUST be: open before closed; within each state, most-recently-updated first; issue number as a deterministic tie-breaker — computed client-side, not assumed from the GitHub API's own sort parameter.
- **FR-010**: The project dashboard's existing dynamically-stacked lower-panel row mechanism MUST remain the rendering path for issue rows (no fixed-Y-offset placement), and every new row's text MUST fit within the existing `78`-character single-line wrap budget by construction (bounded title/label/assignee truncation applied before string concatenation), not by relying on the generic line-clamp to hide an overflowing `+N more` or truncation indicator.
- **FR-011**: When the combined row count (existing rows plus this Spec's new rows) would exceed the lower panel's fixed maximum height, the lowest-priority rows (this Spec's `[ISSUE DETAIL]`, then `[ISSUE LIST]`, then `[ISSUES]`, in that order — the most recently stacked rows drop first) MUST be omitted from rendering entirely rather than allowed to render past the drawn panel's bottom edge.

### Key Entities

- **IssueSyncStatus** (reused): Spec 061's `RepositorySyncStatus`, aliased for this domain — no new lifecycle enum.
- **IssueSnapshot** (new): `{ id: string, number: number, title: string, bodySummary?: string, state: "Open" | "Closed", author?: { login: string }, assignees: string[], labels: string[], owner?: string, name?: string, provider: string, url?: string, createdAt: string, updatedAt: string, closedAt?: string, syncedAt: string }`.
- **IssueSnapshotCollection** (new): `{ provider: string, owner?: string, name?: string, syncStatus: IssueSyncStatus, issues: IssueSnapshot[], openCount: number, closedCount: number, isTruncated: boolean, lastSuccessfulSyncAt?: string, errorSummary?: string }`. Deliberately has no separate `availability` field (unlike Spec 061's `RepositorySyncSnapshot`) — every factory function in that Spec derived `availability` from `syncStatus` alone, so the field was redundant; `syncStatus` is the single source of truth here.
- **IssueSyncProvider** (new): `{ readonly providerId: string, readIssueSnapshots(identity: ProjectRegistryRepositoryIdentity): Promise<IssueSnapshotCollection> }` — read-only, no mutation method.
- **IssueSyncService** (new): dispatches to the registered `IssueSyncProvider` for `identity.provider`, normalizes thrown errors and unregistered providers to `Unavailable`, and stamps `lastSuccessfulSyncAt` only on `Succeeded` (carrying the previous timestamp forward otherwise) — structurally identical to Spec 061's `RepositorySyncService`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening Daily Proof's project dashboard shows a real, pull-request-free issue collection with correct open/closed counts once a mocked GitHub fetch resolves.
- **SC-002**: Opening Portfolio's (or AI Lab's) project dashboard shows `[ISSUES] Unavailable: ...`, never fabricated success data, and is distinguishable from a real zero-issue success.
- **SC-003**: A test proves an older request (success or failure) resolving after a newer one cannot overwrite the newer result, and that switching projects never displays a stale project's issues.
- **SC-004**: `npm test` passes, including new unit tests for domain normalization (including pull-request exclusion and label/assignee shape variance), provider behavior (ordering, truncation, error mapping), immutability, concurrency, controller wiring, and view rendering across all six user-facing states.
- **SC-005**: No `git`/`gh` shell command, no `fs`/`child_process` import, and no new API route exists anywhere in the diff.
- **SC-006**: A future Spec adding issue-to-task conversion can consume `IssueSnapshotCollection` as a read-only input without any change to this Spec's existing provider contract or snapshot fields.

## Assumptions

- **Project dashboard, not detail screen, is the integration surface** — same reasoning Spec 061 established and re-verified here: `detail`/`workspace`/`repository-detail` remain a closed subgraph unreachable from `list`, a pre-existing condition out of scope for this Spec.
- **A dedicated `issueSyncRequestVersion` counter, not a shared one** — `openProjectDashboard` now fires three independent async flows in the same tick (repository summary refresh, repository sync, issue sync); sharing any one counter across flows that fire together would cause whichever bumps second to invalidate the first's still-pending, legitimate result, exactly the failure mode Spec 061 identified and avoided for its own two flows.
- **`availability` is dropped from `IssueSnapshotCollection`** — Spec 061's `RepositorySyncSnapshot.availability` was always computed directly from `syncStatus` in every factory function and never carried independent information; omitting it here avoids duplicating a concept `syncStatus` already fully expresses.
- **Row budgets are conservative by design, not by accident** — the existing lower-panel wrap length (78 characters, single line) cannot safely fit more than one visible issue title alongside a `+N more` suffix for realistic long titles; this Spec bounds the visible issue list to one entry rather than risk silently truncating the `+N more` indicator itself, which would violate this Spec's own truncation-honesty requirement.
- **Unauthenticated, public reads only** — mirrors Spec 061/060's existing `GitHubPublicRepositoryProvider` precedent; no token management or authenticated request path is introduced.
