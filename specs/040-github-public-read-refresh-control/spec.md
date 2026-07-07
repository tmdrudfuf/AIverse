# Feature Specification: GitHub Public Read Refresh Control

**Feature Branch**: `040-github-public-read-refresh-control`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Now that repository summaries can come from a cache, add the smallest safe mechanism to distinguish cached vs refreshed repository summaries and allow an explicit manual refresh path that bypasses the in-memory cache only when intentionally requested."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explicit Manual Refresh (Priority: P1)

As a player or developer viewing a mapped project's Repository Detail screen, I can explicitly request a fresh read from GitHub instead of waiting for the cache TTL to expire, without that refresh happening automatically on every screen open.

**Why this priority**: Spec 039 added caching for safety, but a cache with no manual override can feel "stuck" to a developer validating real repository state. A small, explicit, opt-in refresh closes that gap without weakening the cache's default safety.

**Independent Test**: Open the Repository Detail screen for a mapped project, then trigger the refresh action; verify the underlying provider is called again even if the cache TTL has not expired, and the displayed summary updates to the new result.

**Acceptance Scenarios**:

1. **Given** a mapped project's repository summary is cached and within its TTL, **When** the player explicitly triggers refresh, **Then** the underlying provider is called again rather than serving the cached value.
2. **Given** the refresh succeeds, **When** the same project is read again through the normal (non-refresh) path within the TTL, **Then** it returns the newly-refreshed data, not the value that was cached before the refresh.
3. **Given** the player has not triggered refresh, **When** the Repository Detail screen is opened or re-rendered, **Then** no additional network request occurs beyond what the existing cache/TTL behavior already produces.

---

### User Story 2 - Safe Refresh for Unmapped or Invalid Projects (Priority: P1)

As a player, triggering refresh for a project with no valid repository mapping must never cause a fabricated or guessed GitHub request, exactly like the existing non-refresh read path.

**Why this priority**: A manual trigger must not become a new way to bypass the safety boundaries already established in specs 037-038.

**Independent Test**: Trigger refresh for a project id that resolves to no repository reference; verify zero network requests occur and the existing safe fallback is returned, identically to the non-refresh path.

**Acceptance Scenarios**:

1. **Given** a project has no valid, enabled, resolvable repository reference, **When** refresh is triggered, **Then** no network request occurs and the existing "not configured" fallback is returned.
2. **Given** the Repository Detail screen for such a project, **When** the player presses the refresh action, **Then** nothing happens (no loading state, no request) because refresh is only offered for validly mapped projects.

---

### User Story 3 - Refresh Failure Stays Display-Safe (Priority: P1)

As a player, if a manual refresh fails (rate-limited, offline, malformed response), I must see the existing display-safe failure state, never a fabricated success, and the failure must not corrupt any other project's cached data.

**Why this priority**: A refresh feature that could produce fabricated data or leak low-level error detail would be worse than not having refresh at all.

**Independent Test**: Trigger refresh where the underlying provider returns a rate-limited/offline/malformed result; verify the displayed summary is exactly that failure state, and verify a second, different project's cache is untouched.

**Acceptance Scenarios**:

1. **Given** a refresh attempt fails, **When** the result is displayed, **Then** it shows the existing display-safe failure state (never a fabricated "connected"/"fresh" result).
2. **Given** a refresh attempt fails after a previously successful cached read for the same project, **When** the same project is read again immediately afterward (not through refresh), **Then** the underlying provider is called again rather than replaying the pre-refresh stale success — the failed refresh clears that project's cache entry, consistent with the cache's existing "never cache a failure, never let a stale success survive a later failure" policy from spec 039.
3. **Given** a refresh attempt for one project fails, **When** a different project's cached data is read, **Then** it is completely unaffected.

### Edge Cases

- Refresh is triggered while the cache still has time remaining: the underlying provider is still called (refresh always bypasses the cache check).
- Refresh succeeds: the cache is updated with the new data and a new TTL window, exactly like a normal cache-miss read.
- Refresh fails: the cache entry for that project (if any) is cleared, matching the already-established failure policy from spec 039 — this is a continuation of an existing, already-reviewed decision, not a new one.
- Refresh is requested for an unmapped, disabled, private, or malformed-mapping project: no network request occurs, matching the existing non-refresh behavior exactly, because both paths route through the same resolver-aware provider chain.
- No new field is added to `GitHubRepositorySummary` to mark "came from cache" — the existing `sourceStatus.lastSuccessfulFetchAt` timestamp already changes only on an actual network read and is unchanged on a cache hit, which already serves as the freshness signal without expanding the approved summary field boundary.
- The manual refresh action lives only on the Repository Detail screen; Project Dashboard's existing auto-refresh-on-open behavior (pre-existing, unrelated to this feature) is untouched.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `CachedGitHubRepositoryProvider` MUST expose an explicit `refreshRepositorySummary(projectId)` capability that always calls the wrapped provider, bypassing the cache-hit check.
- **FR-002**: A successful refresh MUST replace the cache entry for that project id with the new summary and a new TTL window, using the exact same store logic as a normal cache-miss read (no duplicated or divergent logic).
- **FR-003**: A failed refresh MUST NOT be cached, and MUST clear any existing cache entry for that project id, consistent with the store-or-delete policy already established in spec 039.
- **FR-004**: Refresh for one project id MUST NOT affect the cache entry, in-flight state, or outcome of any other project id.
- **FR-005**: `GitHubRepositoryService` MUST expose a matching `refreshRepositorySummary(projectId)` method with the same error-collapsing safety net as its existing `getRepositorySummary`, remaining usable with providers that do not support native refresh (falling back to a normal read).
- **FR-006**: Refresh MUST NOT be offered or triggered for a project with no valid, enabled, resolvable repository reference; the existing zero-fetch behavior for such projects MUST hold for refresh exactly as it does for normal reads.
- **FR-007**: The `OfficeProjectPortalController` Repository Detail screen MUST expose an explicit action (not automatic on open/render) that triggers refresh only when a valid mapping exists for the currently displayed project.
- **FR-008**: Refresh MUST NOT introduce any new `GitHubRepositorySummary` field; freshness is already observable via the existing `sourceStatus.lastSuccessfulFetchAt`/`lastUpdatedAt` fields, which differ between a cache hit and a fresh read.
- **FR-009**: The `GitHubRepositoryProvider` interface MUST NOT change; the refresh capability is an additional, optional capability layered alongside it, not a change to it.
- **FR-010**: Automated tests MUST cover: cache-hit-within-TTL for normal reads, refresh bypassing the cache, refresh replacing the cache on success, per-project cache isolation during refresh, refresh failure staying display-safe and not fabricating success, refresh failure clearing (not preserving) the previous cache entry, zero-fetch refresh for unmapped/invalid projects, no mutation/write behavior, and the real controller action path (not just the underlying method in isolation).

### Non-Goals

- No background polling, refresh scheduler, or automatic re-fetching beyond what already exists (TTL expiry, dashboard-open auto-refresh).
- No persistence, `localStorage`/`sessionStorage`, or database changes.
- No OAuth, tokens, credential storage, or authenticated GitHub behavior.
- No write/mutation requests of any kind.
- No GitHub Projects integration, issue sync, or PR sync.
- No repository auto-discovery or guessing.
- No new field on `GitHubRepositorySummary` or change to `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`.
- No refresh action on the Project Dashboard or Company Dashboard; this feature is scoped to the existing Repository Detail screen only.
- No broad UI redesign; only the existing Repository Detail input handler and instruction text change.

### Key Entities *(include if feature involves data)*

- **Repository Refresher Capability**: A small additional interface (`refreshRepositorySummary(projectId): Promise<GitHubRepositorySummary>`) implemented by `CachedGitHubRepositoryProvider` and optionally supported by whatever `GitHubRepositoryService` wraps.
- **Refresh Action**: A new, explicit input-triggered controller action on the Repository Detail screen, guarded by the same mapping-validity check the existing auto-refresh path already uses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Triggering refresh for a mapped project always results in exactly one additional call to the underlying provider, regardless of remaining cache TTL.
- **SC-002**: A successful refresh is immediately reflected in the next normal (non-refresh) read within the TTL.
- **SC-003**: A failed refresh never produces a "connected"/"fresh" result and never masks a different project's cache.
- **SC-004**: Triggering refresh for any unmapped/disabled/private/malformed-mapping project produces zero network requests.
- **SC-005**: Existing specs 037/038/039 test suites continue to pass unchanged.

## Assumptions

- The Repository Detail screen (`viewMode: "repository-detail"`) is the correct, smallest home for a manual refresh action; it is already single-purpose and isolated from Company/Project Dashboard rendering.
- Reusing the existing `sourceStatus.lastSuccessfulFetchAt` timestamp is sufficient to distinguish cached from freshly-read data; no new field is needed or added.
- `MockGitHubRepositoryProvider` does not need to implement the new refresh capability; `GitHubRepositoryService`'s fallback (plain `getRepositorySummary`) is the correct, safe behavior for a provider with nothing to bypass.
