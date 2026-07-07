# Feature Specification: GitHub Refresh Concurrency Guard

**Feature Branch**: `041-github-refresh-concurrency-guard`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Add the smallest safe concurrency guard so repeated manual refresh requests for the same project while one is already in flight do not issue duplicate GitHub requests and cannot overwrite state out of order."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - No Duplicate Requests While a Refresh Is In Flight (Priority: P1)

As a player or developer, if I press the refresh action repeatedly on the Repository Detail screen before the first request completes, only one real GitHub read should occur for that project, not one per press.

**Why this priority**: Manual refresh (spec 040) always bypasses the cache. Without a concurrency guard, rapid repeated presses multiply real network calls against an already-scarce unauthenticated rate-limit budget.

**Independent Test**: Trigger two overlapping refresh calls for the same project id before either resolves; verify the underlying provider is called exactly once, and both callers receive an equivalent resolved summary.

**Acceptance Scenarios**:

1. **Given** a refresh for a project is already in flight, **When** another refresh is requested for the same project, **Then** no additional call is made to the underlying provider; the second request joins the in-flight result.
2. **Given** both requests join the same in-flight read, **When** it resolves, **Then** both callers receive an equivalent summary (independently cloned, not a shared mutable reference).
3. **Given** the in-flight refresh completes (success or failure), **When** a new refresh is requested afterward, **Then** it starts a new underlying call — the guard does not permanently block future refreshes.

---

### User Story 2 - Failures Clear the Guard (Priority: P1)

As a player, if a refresh fails, I must be able to retry immediately; the concurrency guard must never get "stuck" from a failed attempt.

**Why this priority**: A guard that fails to release after an error would make refresh permanently unusable for that project until the whole application restarts.

**Independent Test**: Cause the underlying provider to fail during an in-flight refresh; verify the guard is cleared once the failure resolves, and immediately triggering another refresh for the same project starts a new underlying call.

**Acceptance Scenarios**:

1. **Given** an in-flight refresh ultimately fails, **When** it settles, **Then** the in-flight entry for that project is removed regardless of success or failure.
2. **Given** the guard has cleared after a failure, **When** refresh is requested again, **Then** the underlying provider is called again (no permanent lockout).

---

### User Story 3 - Independent Projects Never Block Each Other (Priority: P1)

As a player, refreshing one project must never delay, block, or interfere with a concurrent refresh of a different project.

**Why this priority**: The guard must be scoped per project, not global, or it would silently serialize unrelated work.

**Independent Test**: Trigger concurrent refreshes for two different project ids; verify both underlying calls happen independently and neither waits on the other.

**Acceptance Scenarios**:

1. **Given** two different projects are refreshed concurrently, **When** both resolve, **Then** each triggered its own independent underlying call with no cross-project blocking.

### Edge Cases

- A normal (non-refresh) cache-miss read for a project already has an in-flight refresh for the same project: it joins the same in-flight request rather than issuing a second underlying call, since both paths share the same underlying helper. This is a natural consequence of the chosen seam, not a new requirement to satisfy separately.
- The in-flight map is a private field of each `CachedGitHubRepositoryProvider` instance; it is never shared across instances or stored at module/global scope.
- Joining an in-flight request that ultimately rejects (an unexpected thrown error, not a normal display-safe failure summary) still propagates that rejection independently to each joining caller, so `GitHubRepositoryService`'s existing catch-all continues to apply per caller.
- A cached, non-expired read (a true cache hit) never touches the in-flight map at all — the guard only applies to the path that would otherwise call the underlying provider.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `CachedGitHubRepositoryProvider` MUST track at most one in-flight underlying-provider call per project id at a time.
- **FR-002**: A second request for a project id that already has an in-flight call MUST NOT trigger another underlying-provider call; it MUST join the existing in-flight result.
- **FR-003**: Joining callers MUST receive an independently-cloned summary, never a shared mutable reference to the same object another caller could mutate.
- **FR-004**: The in-flight entry for a project id MUST be removed once that call settles, whether it resolves or rejects, so a later request always starts fresh.
- **FR-005**: The guard MUST be scoped per project id; concurrent refreshes for different project ids MUST NOT block or wait on each other.
- **FR-006**: The guard MUST be an instance-scoped field of `CachedGitHubRepositoryProvider`, never module-level or global state shared across instances.
- **FR-007**: Normal cached reads (cache hit within TTL) MUST remain unaffected by this feature — the guard only applies to the path that would call the underlying provider.
- **FR-008**: Manual refresh MUST still bypass the cache exactly as spec 040 established, except now coalescing with any already-in-flight call for the same project.
- **FR-009**: The `GitHubRepositoryProvider` interface, `GitHubRepositoryService`, `OfficeProjectPortalController`, and `OfficeProjectPortalView` MUST NOT require any change; the existing controller-level `repositoryRequestVersion` guard already prevents stale UI writes and is unaffected by this feature.
- **FR-010**: Automated tests MUST cover: single underlying call for two concurrent same-project requests, equivalent (cloned) results for both callers, guard release after success, guard release after failure with successful retry, independent concurrent handling of different project ids, unchanged normal-read/TTL/unmapped-project/display-safe behavior, and no mutation/write behavior.

### Non-Goals

- No request queueing beyond "join the single in-flight call"; there is no ordered queue of pending refreshes.
- No changes to the controller's existing stale-response guard (`repositoryRequestVersion`); it already solves a complementary, different problem (which UI write wins) and needs no modification.
- No persistence, background polling, sync engine, or automatic retry loop.
- No auth, credentials, or write/mutation behavior.
- No new UI, dashboard, or controller-level changes.

### Key Entities *(include if feature involves data)*

- **In-Flight Request Map**: A private, instance-scoped `Map<string, Promise<GitHubRepositorySummary>>` inside `CachedGitHubRepositoryProvider`, tracking at most one pending underlying call per project id.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two concurrent requests for the same project id (whether both refresh, both normal reads, or a mix) result in exactly one call to the underlying provider.
- **SC-002**: Both callers receive structurally equivalent summaries with no shared mutable object.
- **SC-003**: A refresh failure never leaves the guard engaged; the next request for that project always reaches the underlying provider.
- **SC-004**: Two different project ids refreshed concurrently never block each other.
- **SC-005**: Existing specs 037/038/039/040 test suites continue to pass unchanged.

## Assumptions

- The existing shared `fetchAndUpdateCache` helper (introduced in spec 040 to keep `getRepositorySummary` and `refreshRepositorySummary` consistent) is the correct, smallest place to add this guard, since both public methods already funnel through it.
- No controller, service, or interface file needs to change; this is a self-contained addition to `CachedGitHubRepositoryProvider`.
