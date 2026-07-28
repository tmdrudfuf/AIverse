# Feature Specification: Repository Read Synchronization Foundation

**Feature Branch**: `codex/061-repository-read-synchronization-foundation`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Build a provider-neutral, read-only repository read-synchronization boundary on top of Spec 060's `ProjectRegistryRepositoryIdentity`. Distinguish configured identity from verified repository state. No mutation, no live infrastructure that doesn't already exist."

## Current Product Limitation

Spec 060 added `ProjectRegistryRepositoryIdentity` — a *configured* description of where a project's source lives (`provider`, `owner`, `name`, `defaultBranch`, `connectionState`), seeded as static data and never verified against anything real. `connectionState: "Configured"` means only "this is what we were told," not "this was confirmed by reading the repository." There is no concept anywhere in the codebase of a *verified* repository read — no synchronization lifecycle, no distinct "we tried to read this and it succeeded/failed/is unavailable" state, and no safeguard against a stale or out-of-order read overwriting a newer one. The existing GitHub read pipeline (`GitHubRepositoryProvider`/`GitHubRepositoryService`) fetches a GitHub-specific `GitHubRepositorySummary` keyed by `projectId` (not by repository identity), feeds only the GitHub-dashboard-signal pipeline (Specs 031/033), and has no provider-neutral equivalent a future GitLab, local-git, or other read source could implement.

## User-Visible Behavior Being Added

The project dashboard screen (`OfficeProjectPortalView.renderProjectDashboard`, opened via Enter/Space from the project list — the portal's actually-reachable per-project drill-down, confirmed by discovery; see Assumptions) gains one new status row in its existing dynamically-stacked lower panel, sourced from a new, provider-neutral repository synchronization snapshot:

- `[REPO-SYNC] Syncing...` — while a read is in flight.
- `[REPO-SYNC] Succeeded · main · a1b2c3d` — branch and short commit sha, once a read has verified the repository.
- `[REPO-SYNC] Failed: <safe reason>` — a read was attempted and failed.
- `[REPO-SYNC] Unavailable: <safe reason>` — no read is currently possible for this project's provider.
- `[REPO-SYNC] Not started` — a repository identity exists but no read has been attempted yet.

Daily Proof (GitHub-backed, per Spec 060) shows real, verified data once its dashboard is opened and its GitHub summary resolves. Portfolio and AI Lab (local-provider, per Spec 060) show an honest `Unavailable` state, because this client-side runtime cannot read a local filesystem — never fabricated "Succeeded" data. Configured identity (Spec 060's `repositoryIdentity.connectionState`) is untouched and remains visible on the detail screen exactly as Spec 060 left it; this Spec adds a second, clearly distinct concept next to it rather than overloading it.

## In Scope

- A provider-neutral read-only contract, `RepositorySyncProvider.readRepositorySnapshot(identity, context)`, with no mutation method of any kind.
- A new, immutable `RepositorySyncSnapshot` model representing *verified* (or honestly-not-verified) repository state — availability, provider, owner, name, default branch, current branch (when available), latest commit (sha/message/timestamp), working-tree cleanliness (when available), an explicit synchronization status, the last successful synchronization timestamp, and a display-safe error summary. Every field degrades safely (is simply absent) when the underlying provider cannot supply it.
- An explicit synchronization lifecycle: `NotStarted | Syncing | Succeeded | Failed | Unavailable`, newly introduced (discovery confirmed no existing near-duplicate).
- Two concrete providers: a GitHub-backed provider that wraps the existing `GitHubRepositoryService` (reused, not duplicated) and maps its already-normalized `GitHubRepositorySummary` into the new provider-neutral shape; and a local provider that honestly reports `Unavailable` (this runtime cannot read a local filesystem — see Runtime Limitation below), rather than fabricating live local-git data.
- Integration into the existing project-dashboard open/refresh flow (`OfficeProjectPortalController.openProjectDashboard`), with a dedicated request-version counter and guard (mirroring the established `repositoryRequestVersion`/`shouldApplyX` pattern) so stale or out-of-order reads can never overwrite a newer result.
- A new lower-panel row on the project dashboard screen, built by a pure formatting function owned by the new module (not by the view).

## Out of Scope

- GitHub issue synchronization, pull request synchronization, branch switching, `git fetch`/`git pull`, any repository write, task creation from issues, AI employee assignment from issues, Firebase, Expo, authentication, repository cloning, server deployment, background/scheduled polling.
- Any local filesystem or shell-based git read. This app has no server-side code anywhere (confirmed by discovery: no `fs`, `child_process`, or `node:*` import under `src/`; no API route in the entire repository) — a real local git reader would require new server infrastructure, which this Spec explicitly declines to introduce (see Runtime Limitation).
- Any change to Spec 060's `ProjectRegistryRepositoryIdentity`/`connectionState` semantics. Configured identity and verified synchronization state are kept as two separate concepts on purpose (see Key Entities).
- Any change to the GitHub-dashboard-signal pipeline (Specs 031/033: `externalSources`, `mergeGitHubProjectDashboardSource`, `[SYNC]`/`[SOURCE]` rows) — untouched, to avoid conflating a provider-neutral verified-read concept with that GitHub-specific signal slot.
- Writing verified state back into `ProjectRegistryEntry`/`ProjectRegistryRepositoryIdentity`. Verified snapshots live only in portal session state; registry entries remain the clone-independent, configured-identity source of truth established in Spec 060.

## Runtime Limitation (documented per Discovery requirement)

This is a 100% client-side Next.js + Phaser application: no server-side data-fetching layer, no API route, no Node-only module (`fs`, `child_process`) anywhere in `src/`. A genuine local-git reader (reading `.git/HEAD`, running `git status --porcelain`, etc.) is architecturally unavailable without adding new server infrastructure, which is out of proportion to "add a read boundary." Per the feature request's own Initial-Provider preference order, this Spec therefore ships:

1. A real, working provider for the one case that's actually reachable today without new infrastructure — GitHub, via the existing browser-side `GitHubRepositoryProvider`/`GitHubRepositoryService` chain.
2. A deterministic, honest `Unavailable` provider for the local case, rather than a fabricated "live" local-git reader. It reports the limitation as its `errorSummary` rather than pretending to have read anything.

Both fields on `RepositorySyncSnapshot` that only make sense for a real local working copy — `currentBranch` and `workingTreeState` — are modeled on the type today (so a future server-capable local provider needs no new type) but are never populated in this Spec, for either provider. This is a deliberate, documented gap, not an oversight.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Daily Proof's verified repository state (Priority: P1) 🎯 MVP

As a player opening Daily Proof's project dashboard, I can see whether its repository was actually, successfully read — not just that a repository is configured for it.

**Why this priority**: This is the spec's core deliverable — a verified-read concept that is observably different from Spec 060's static configured identity.

**Independent Test**: Open Daily Proof's project dashboard with a fresh `createProjectPortalState()`, let the sync resolve, and confirm the lower panel shows a `[REPO-SYNC] Succeeded · ...` row distinct from the (unmodified) detail screen's `Status: Configured` line.

**Acceptance Scenarios**:

1. **Given** the portal is open and Daily Proof's project dashboard is opened, **When** the GitHub read resolves successfully, **Then** the lower panel shows `[REPO-SYNC] Succeeded · <branch> · <short sha>` and `state.repositorySyncSnapshots["daily-proof"].syncStatus === "Succeeded"`.
2. **Given** the same state, **When** the read has not yet resolved, **Then** the lower panel shows `[REPO-SYNC] Syncing...`.

---

### User Story 2 - Repository sync degrades safely when no verified read is possible (Priority: P2)

As a player opening Portfolio's (or AI Lab's) project dashboard, I see an honest `Unavailable` synchronization state — never a fabricated `Succeeded` result — because this runtime cannot read a local repository.

**Why this priority**: Proves the model does not pretend to verify what it cannot verify; directly demonstrates the spec's "do not treat configured metadata as proof of a successful read" requirement.

**Independent Test**: Open Portfolio's project dashboard and confirm the lower panel shows `[REPO-SYNC] Unavailable: ...` with a display-safe reason, never a raw exception and never `Succeeded`.

**Acceptance Scenarios**:

1. **Given** the portal is open and Portfolio's project dashboard is opened, **When** the local provider is invoked, **Then** `state.repositorySyncSnapshots["portfolio"].syncStatus === "Unavailable"` and the rendered row contains no stack trace or raw error text.

---

### User Story 3 - A slower, stale sync can never overwrite a newer, faster one (Priority: P1)

As a player who quickly re-opens or re-triggers a repository sync, I never see an old, failed, or stale result silently replace a newer, successful one.

**Why this priority**: This is the feature request's explicit, named safety requirement ("protected against an older failed result overwriting a newer successful one") — a correctness property, not a display nicety.

**Independent Test**: Simulate two overlapping sync requests for the same project where the first (older) request resolves as `Failed` *after* the second (newer) request has already resolved as `Succeeded`; assert the stored snapshot remains `Succeeded`.

**Acceptance Scenarios**:

1. **Given** a sync is in flight for project P, **When** a second sync for P is triggered before the first resolves, **Then** the first request's eventual result (whatever it is) is discarded once the second has been applied.
2. **Given** the first (older) request resolves *after* the second (newer) request has already applied a `Succeeded` snapshot, **When** the first request's callback runs, **Then** `state.repositorySyncSnapshots[P]` still equals the `Succeeded` snapshot from the second request.
3. **Given** a sync is in flight for project P, **When** the player navigates away from P's dashboard (Escape) before it resolves, **Then** the eventual result is not applied to state.

### Edge Cases

- A project has no `repositoryIdentity` at all: no sync is attempted, and the lower panel shows no `[REPO-SYNC]` row (matching Spec 060's degrade-safely precedent for absent fields).
- A project's `repositoryIdentity.provider` is neither `"github"` nor `"local"` (a hypothetical future provider string): the service falls back to an honest `Unavailable` snapshot stating no provider is registered, rather than throwing.
- The underlying `GitHubRepositoryService` call throws unexpectedly: the service layer catches it and produces an `Unavailable` snapshot with a generic, display-safe reason — never a raw exception reaching the view.
- A project dashboard is closed and reopened for the same project: the previous snapshot (if any) is shown immediately while a fresh sync runs, rather than resetting to `NotStarted`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a provider-neutral `RepositorySyncProvider` contract with exactly one read method (`readRepositorySnapshot`) and MUST NOT expose any method that mutates a repository, branch, issue, or pull request.
- **FR-002**: `RepositorySyncSnapshot` MUST model synchronization status as exactly one of `NotStarted | Syncing | Succeeded | Failed | Unavailable`, and MUST NOT be derivable from `ProjectRegistryRepositoryIdentity.connectionState` alone — a `"Configured"` identity MUST NOT imply `"Succeeded"` synchronization.
- **FR-003**: Every optional field on `RepositorySyncSnapshot` (owner, name, defaultBranch, currentBranch, latestCommit, workingTreeState, errorSummary, lastSuccessfulSyncAt) MUST be safely omissible; no provider is required to populate a field it cannot supply.
- **FR-004**: The controller MUST guard every applied synchronization result with a dedicated, monotonically-increasing request-version counter (`repositorySyncRequestVersion`) checked against the current viewMode/selected-project context, so that a slower, older request can never overwrite a newer request's result, and no in-flight request is applied after the player has navigated away from that project's dashboard.
- **FR-005**: No raw exception, stack trace, or unfiltered provider error MUST ever reach `RepositorySyncSnapshot.errorSummary` or the rendered view; all errors MUST be normalized to a display-safe string.
- **FR-006**: The system MUST NOT invoke, directly or indirectly, any repository-mutating command or API call (`git pull`, `git fetch`, `git checkout`, `git reset`, `git clean`, `git commit`, `git push`, `gh repo sync`, `gh pr`, `gh issue edit`, or equivalents). This Spec ships zero shell/git invocations of any kind (browser-only runtime — see Runtime Limitation), so this requirement is satisfied vacuously as well as by design.
- **FR-007**: `RepositorySyncSnapshot` MUST NOT be written back onto `ProjectRegistryEntry`/`ProjectRegistryRepositoryIdentity`; verified state and configured identity remain two distinct, independently-owned models.
- **FR-008**: The project dashboard's existing lower-panel row list MUST remain dynamically stacked (no fixed-Y-offset placement) when the new repository-sync row is added, consistent with the existing `createProjectDashboardLowerRows`/`calculateProjectDashboardLowerPanelHeight` mechanism.

### Key Entities

- **RepositorySyncStatus** (new): `"NotStarted" | "Syncing" | "Succeeded" | "Failed" | "Unavailable"` — the explicit synchronization lifecycle.
- **RepositorySyncSnapshot** (new): `{ provider: string, availability: "available" | "unavailable" | "unknown", owner?: string, name?: string, defaultBranch?: string, currentBranch?: string, latestCommit?: { sha: string, message: string, committedAt: string }, workingTreeState?: "clean" | "dirty", syncStatus: RepositorySyncStatus, lastSuccessfulSyncAt?: string, errorSummary?: string }` — verified (or honestly-unverified) repository read state. Distinct from, and never derived solely from, `ProjectRegistryRepositoryIdentity`.
- **RepositorySyncProvider** (new): `{ readonly providerId: string, readRepositorySnapshot(identity: ProjectRegistryRepositoryIdentity, context: { projectId: string }): Promise<RepositorySyncSnapshot> }` — read-only, no mutation method.
- **RepositorySyncService** (new): dispatches to the registered `RepositorySyncProvider` for `identity.provider`, normalizes thrown errors to `Unavailable`, and stamps `lastSuccessfulSyncAt` only on a `Succeeded` result (carrying the previous timestamp forward otherwise).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening Daily Proof's project dashboard shows a `[REPO-SYNC]` row that transitions from `Syncing...` to `Succeeded · ...` once the (mocked, in tests) GitHub read resolves.
- **SC-002**: Opening Portfolio's (or AI Lab's) project dashboard shows `[REPO-SYNC] Unavailable: ...`, never fabricated success data.
- **SC-003**: A test proves that an older, slower request resolving after a newer, faster request cannot overwrite the newer request's applied result.
- **SC-004**: `npm test` passes, including new unit tests for the provider(s), the service's dispatch/error-normalization/timestamp-carry-forward behavior, the concurrency guard, and both view-rendering cases (populated and absent `repositoryIdentity`).
- **SC-005**: No `git`/`gh` shell command, no `fs`/`child_process` import, and no new API route exists anywhere in the diff.
- **SC-006**: A future Spec adding GitHub issue/PR read synchronization can add a new method to a sibling provider-neutral contract, or a new field to a sibling snapshot type, without modifying `RepositorySyncProvider`'s existing contract or `RepositorySyncSnapshot`'s existing fields.

## Assumptions

- **The project dashboard, not the detail screen, is the correct integration surface.** Discovery traced every `viewMode` assignment in `OfficeProjectPortalController.ts` and found `detail`/`workspace`/`repository-detail` form a closed subgraph reachable only from each other (`workspace` ↔ `detail`, `workspace` → `repository-detail`) with no edge from `list` or `project-dashboard` — i.e. `"detail"` is not reachable from a fresh session via any player keypress found in this controller. This is a pre-existing condition, unrelated to this Spec, and out of scope to fix. `project-dashboard` (reached from `list` via Enter/Space) is genuinely reachable and already has an established auto-refresh-on-open pattern (`refreshProjectDashboardRepositorySummary`), so it is the surface this Spec integrates with and renders on.
- **A dedicated `repositorySyncRequestVersion` counter, not the existing `repositoryRequestVersion`.** The existing counter is shared by `openRepositoryDetail`/`refreshRepositoryDetail`/`refreshProjectDashboardRepositorySummary`, all of which are mutually exclusive by `viewMode`. This Spec's sync is triggered *alongside* (in the same synchronous burst as) `refreshProjectDashboardRepositorySummary` inside `openProjectDashboard` — sharing one counter across two independently-resolving async flows fired together would cause whichever bumps the counter second to invalidate the first's still-pending, still-legitimate result. A sibling counter (matching the codebase's existing one-counter-per-async-flow-family convention: `taskRequestVersion`, `employeeRequestVersion`, etc.) avoids this.
- **`lastSuccessfulSyncAt` is a locally-generated timestamp, not repository data.** It records when *this app* last completed a successful read, not any timestamp reported by the provider — so stamping it via `new Date().toISOString()` at the moment a `Succeeded` result is produced is bookkeeping, not fabricated repository data.
- **Repository identity is provided to the provider layer, not just a bare `projectId`.** The existing `GitHubRepositoryService.getRepositorySummary(projectId)` contract is reused as-is (avoiding duplicating GitHub fetch/cache/dedup logic), but the new `GitHubRepositorySyncProvider` also receives the full `ProjectRegistryRepositoryIdentity` and uses it to populate `owner`/`name`/`defaultBranch` whenever the fetched summary is missing them — so the provider-neutral contract's identity parameter is load-bearing, not decorative.
