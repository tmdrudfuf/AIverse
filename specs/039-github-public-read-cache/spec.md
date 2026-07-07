# Feature Specification: GitHub Public Read Cache

**Feature Branch**: `039-github-public-read-cache`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Now that the real public read provider is wired into the app, add the smallest safe in-memory caching layer so repeated reads for the same mapped project do not immediately re-fetch from GitHub."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Avoid Redundant Re-Fetches for the Same Project (Priority: P1)

As a player or developer repeatedly opening a mapped project's Project Dashboard during a session, I don't want every open to immediately re-hit GitHub's public API for data that was just successfully read moments ago.

**Why this priority**: Spec 038 made real network reads reachable from the running app. Without any caching, ordinary repeated use (opening/closing/reopening a dashboard) can needlessly consume the ~60/hour unauthenticated GitHub rate limit.

**Independent Test**: Wrap a stub `GitHubRepositoryProvider` in the cache with an injected clock; call `getRepositorySummary` twice for the same project id within the TTL window; verify the underlying provider is called only once and both calls return equivalent data.

**Acceptance Scenarios**:

1. **Given** a successful repository summary was just read for a project, **When** the same project is read again within the cache TTL, **Then** the underlying provider is not called again.
2. **Given** the cache TTL has elapsed since the last successful read, **When** the project is read again, **Then** the underlying provider is called again.
3. **Given** two different mapped projects, **When** both are read, **Then** each has its own independent cache entry; reading one never returns or consumes the other's cached data.

---

### User Story 2 - Never Serve Fabricated Freshness After a Failure (Priority: P1)

As a player, I need a rate-limited, offline, or otherwise failed repository read to never be silently replaced by an old cached "success," and I need a failed read to never itself be treated as a valid cached result that blocks retrying.

**Why this priority**: A cache that hides errors behind stale success data, or that "freezes" a transient failure for the full TTL, would be actively unsafe and would contradict the display-safe guarantees already established in specs 036-037.

**Independent Test**: Cause the underlying provider to return a rate-limited/offline/unavailable summary; verify the cache returns that failure summary unchanged (not a stale success), and verify the failure itself is not cached — the very next read calls the underlying provider again rather than replaying the failure from cache.

**Acceptance Scenarios**:

1. **Given** the underlying provider returns a rate-limited, offline, or unavailable summary, **When** the cache returns a result, **Then** it is exactly that failure summary, never a previously cached success.
2. **Given** a read fails, **When** the same project is read again immediately afterward, **Then** the underlying provider is called again rather than replaying a cached failure.
3. **Given** a project was previously cached as successful and a later read for the same project fails, **When** the failure is returned, **Then** the stale successful cache entry is not used to mask or replace the failure.

---

### User Story 3 - Preserve Every Existing Safety Guarantee (Priority: P1)

As a maintainer, I need the cache to be a transparent decorator: it must not change what data looks like, must not let callers corrupt future reads by mutating a returned object, must not cache anything for unmapped/invalid projects (which never reach the network anyway), and must not alter the `GitHubRepositoryProvider` interface any other composed code depends on.

**Why this priority**: This feature must not regress any guarantee already proven in specs 036-038.

**Independent Test**: Mutate a returned summary's nested fields after a cache hit; verify a subsequent cached read is unaffected. Wrap the real provider with an unmapped-project resolver; verify zero `fetch` calls occur with or without the cache present. Verify the cache class satisfies `GitHubRepositoryProvider` with no interface change.

**Acceptance Scenarios**:

1. **Given** a caller mutates a summary object returned from a cache hit, **When** the same project is read again within the TTL, **Then** the cached data returned is unaffected by that mutation.
2. **Given** a project has no valid resolvable repository reference, **When** it is read through the cache, **Then** zero network requests occur, exactly as without the cache.
3. **Given** the cache wraps any `GitHubRepositoryProvider`, **When** it is composed into `GitHubRepositoryService`, **Then** no other file needs to change to accommodate it.

### Edge Cases

- Cache key is the `projectId` string passed to `getRepositorySummary` — never a repository display URL, project title, or owner/name string.
- A `not_connected` ("not configured") result for an unmapped project is not cached as a success; every call for that project id re-checks the underlying provider (which itself performs no network I/O for unmapped projects).
- Rate-limited, offline, and unavailable results are not cached; every subsequent read re-attempts the underlying provider immediately, favoring safety (a possibly-recovered read) over savings from caching a known failure.
- TTL expiry is based on an injectable clock, not real wall-clock timers, so tests are deterministic.
- Cached and freshly-fetched summaries are always returned as independent clones so no caller can mutate cache-internal state through a returned reference.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A new provider decorator, `CachedGitHubRepositoryProvider`, MUST implement `GitHubRepositoryProvider` unchanged and wrap any other `GitHubRepositoryProvider`.
- **FR-002**: The cache key MUST be the `projectId` string argument, and MUST NOT be derived from a project's display name, title, or repository URL.
- **FR-003**: A successful summary (`connectionStatus === "connected"`) MUST be cached and reused for subsequent reads of the same project id until its TTL expires.
- **FR-004**: After TTL expiry, the next read for that project id MUST call the underlying provider again.
- **FR-005**: A non-successful summary (any `connectionStatus` other than `"connected"`, including rate-limited/offline/unavailable/not-configured) MUST NOT be cached; the next read for that project id MUST call the underlying provider again rather than replaying the failure.
- **FR-006**: The cache MUST NOT mutate summary objects, mapping data, project data, or any other input; both cache-hit and cache-miss results MUST be independent clones so caller-side mutation cannot corrupt future reads.
- **FR-007**: The cache MUST NOT introduce any new network call, credential, auth, sync, or persistence behavior; it only reduces calls to whatever provider it wraps.
- **FR-008**: The TTL and clock MUST be explicit, injectable constructor options with a documented default, so tests never depend on real timers.
- **FR-009**: `OfficeProjectPortalController` MUST compose `CachedGitHubRepositoryProvider` around `GitHubPublicRepositoryProvider` as its active provider, so the caching behavior is actually reachable from the running application (this is the entire purpose of the feature).
- **FR-010**: Automated tests MUST cover: first-read-calls-through, cache-hit-within-TTL, cache-miss-after-TTL-expiry, independent keys, no-mutation-poisoning, failure-not-cached-as-success, unmapped-project-remains-zero-fetch, and existing rate-limit/offline/malformed display-safety.

### Non-Goals

- No persistent storage (`localStorage`, `sessionStorage`, database, disk).
- No background polling, refresh scheduler, or sync engine — the cache is purely reactive to calls already made by existing code paths.
- No OAuth, tokens, credential storage, or authenticated GitHub behavior.
- No write/mutation requests of any kind.
- No GitHub Projects integration, issue sync, or PR sync.
- No repository auto-discovery or guessing.
- No dashboard redesign or unrelated UI changes.
- No changes to `GitHubRepositoryProvider`, `GitHubPublicRepositoryProvider`, `GitHubRepositoryReferenceResolver`, or `MockGitHubRepositoryProvider`.

### Key Entities *(include if feature involves data)*

- **Cached Provider Decorator**: `CachedGitHubRepositoryProvider`, wraps any `GitHubRepositoryProvider` and adds an in-memory, TTL-based, clock-injectable cache keyed by `projectId`.
- **Cache Entry**: An in-memory record of `{ summary, expiresAt }`, present only for projects whose most recent read was successful.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two reads of the same successfully-mapped project within the TTL result in exactly one underlying provider call.
- **SC-002**: A read after TTL expiry results in a new underlying provider call.
- **SC-003**: A failed read is never replayed from cache, and never blocks an immediate retry.
- **SC-004**: Mutating a returned summary never affects a subsequent cached read for the same project.
- **SC-005**: Existing specs 036-038 test suites continue to pass unchanged.

## Assumptions

- The cache lives at the provider-decorator level (composed once, in the controller constructor), not inside `GitHubRepositoryService`, `GitHubPublicRepositoryProvider`, or the resolver — keeping each of those focused on their existing single responsibility.
- A documented default TTL (5 minutes) is a reasonable balance between reducing redundant reads during normal interactive use and not feeling "stuck" on old data; the exact value is easily adjustable since it is an explicit constructor option, not a hardcoded internal constant.
- Not caching failures is the safer default per explicit instruction to prefer safety; this is a deliberate, documented decision (see `research.md`), not an oversight.
