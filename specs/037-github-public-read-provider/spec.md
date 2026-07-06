# Feature Specification: GitHub Public Read Provider

**Feature Branch**: `037-github-public-read-provider`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Implement the first actual GitHub public read provider, using real network/auth code for the first time, but keep the scope narrow and safe."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read Real Public Repository Summary Data (Priority: P1)

As an AIverse developer, I can swap the local fixture provider for a real provider that reads a public GitHub repository's summary data over the network, so Company Dashboard and Project Dashboard can eventually show real repository state instead of fixtures.

**Why this priority**: Spec 036 defined the exact contract (`GITHUB_PUBLIC_READ_SUMMARY_FIELDS`) a real provider must satisfy. This feature is the first implementation of that contract.

**Independent Test**: Construct the real provider with a repository reference resolver and a stubbed `fetch`, call `getRepositorySummary(projectId)`, and verify the returned summary only contains fields from `GITHUB_PUBLIC_READ_SUMMARY_FIELDS` and matches the values returned by the stubbed GitHub API responses.

**Acceptance Scenarios**:

1. **Given** a project is mapped to a public repository, **When** the real provider reads it, **Then** the returned summary includes repository identity, default branch, latest commit summary, open issue count, open pull request count, source status, and latest activity timestamp.
2. **Given** the same repository reference and the same stubbed API responses, **When** `getRepositorySummary` is called twice, **Then** both calls produce the same mapped summary shape (deterministic mapping logic; the underlying GitHub data itself is not repo-controlled by AIverse).
3. **Given** the real provider and the fixture provider are compared, **When** their outputs are inspected, **Then** both satisfy the same `GitHubRepositoryProvider` interface and the same summary field boundary.

---

### User Story 2 - Handle Real-World Failure States Safely (Priority: P1)

As a player, I need the dashboard to stay safe and readable when a real public GitHub read fails for any reason (rate limit, network failure, missing repository, malformed response), without crashing, leaking error internals, or prompting for credentials.

**Why this priority**: Real network reads fail in ways local fixtures never did. The first real provider must prove every failure path collapses to an existing display-safe state.

**Independent Test**: Stub `fetch` to simulate a rate-limited response, an offline/network failure, a 404, and a malformed JSON body; verify each case returns a normal (non-throwing) `GitHubRepositorySummary` with the correct `sourceStatus` state and a display-safe `errorMessage` containing no raw response bodies, headers, or URLs.

**Acceptance Scenarios**:

1. **Given** GitHub responds with a rate-limit signal, **When** the provider reads the repository, **Then** the summary reports `rate_limited` status with a display-safe reason and no retry is attempted automatically.
2. **Given** `fetch` throws or the network is unreachable, **When** the provider reads the repository, **Then** the summary reports `offline` status with a display-safe reason.
3. **Given** GitHub responds with a 404 or a malformed/unexpected body, **When** the provider reads the repository, **Then** the summary reports `unavailable` status with a display-safe reason, and internal project data remains visible elsewhere in the dashboard.
4. **Given** any failure path, **When** the resulting summary is inspected, **Then** `errorMessage` never contains the request URL, response body, or header values.

---

### User Story 3 - Preserve Provider Interchangeability and Read-Only Boundaries (Priority: P2)

As a maintainer, I can confirm the real provider is a drop-in replacement for the fixture provider and introduces no mutation, auth, sync, or scope creep beyond the approved boundary.

**Why this priority**: This is the first feature to add real network code to AIverse. It must not regress any of the safety guarantees spec 035/036 established.

**Independent Test**: Snapshot repository mapping, project, task, employee, and advisory inputs before and after calling the real provider; verify no mutation. Verify the provider module contains no auth/credential/token handling and no write/mutation HTTP methods.

**Acceptance Scenarios**:

1. **Given** the real provider is used, **When** inputs are snapshotted before and after, **Then** repository mapping, project, task, employee, company focus, and advisory state remain unchanged.
2. **Given** the provider module is inspected, **When** its HTTP usage is reviewed, **Then** it only issues `GET` requests to public, unauthenticated GitHub REST endpoints and never sends credentials, tokens, or auth headers.
3. **Given** the real provider exists, **When** the running application is reviewed, **Then** it is not yet wired in as the active provider for `OfficeProjectPortalController`; the mock/fixture provider remains the active default until a separate, explicitly reviewed integration step swaps it in.

### Edge Cases

- Repository has no commits yet: latest commit is unavailable; repository identity remains visible.
- Repository has zero open issues or pull requests: counts display as zero, not omitted.
- Default branch is missing from the API response: default branch falls back to unknown.
- GitHub rate limit is reached: `rate_limited` status, no automatic retry, no background polling.
- Network is unreachable or `fetch` rejects: `offline` status.
- Repository does not exist or returns 404: `unavailable` status (private-vs-missing is already resolved upstream by existing repository mapping validation before this provider is ever called).
- GitHub returns an unexpected/malformed JSON body: `unavailable` status, no crash.
- No repository reference can be resolved for the given `projectId`: same `not_connected`/unavailable fallback shape the fixture provider already returns for unmapped projects.
- Pull request count exceeds a single page of results: count is capped/approximated rather than requiring unbounded pagination.
- Check/build status: not populated by this first real-read slice (mapped to the existing "Checks unavailable" fallback already supported by `createGitHubRepositorySnapshot`); reading check runs is deferred to a future feature to keep this slice narrow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a `GitHubRepositoryProvider` implementation that reads real public repository data over the network for at least repository identity, default branch, latest commit summary, open issue count, open pull request count, source status, and latest activity timestamp.
- **FR-002**: The provider MUST only populate fields present in `GITHUB_PUBLIC_READ_SUMMARY_FIELDS` and MUST NOT introduce new summary fields.
- **FR-003**: The provider MUST map GitHub responses into the existing `GitHubRepositorySummary`/`GitHubExternalSourceStatus` shapes without exposing raw GitHub API response types to callers.
- **FR-004**: The provider MUST map rate-limited, offline/network-failure, not-found, and malformed-response conditions into existing display-safe `sourceStatus` states (`rate_limited`, `offline`, `unavailable`) with a generic, display-safe `errorMessage` that never includes request URLs, response bodies, or header values.
- **FR-005**: The provider MUST NOT throw for any anticipated failure condition listed in FR-004; it MUST always resolve to a well-formed `GitHubRepositorySummary`.
- **FR-006**: The provider MUST NOT send credentials, tokens, or auth headers, and MUST only issue `GET` requests to public GitHub REST endpoints.
- **FR-007**: The provider MUST NOT be wired in as the active provider for the running application in this feature; `MockGitHubRepositoryProvider` remains the default until a separate, explicitly reviewed step changes it.
- **FR-008**: The provider MUST NOT mutate project, task, employee, company focus, repository mapping, repository summary, or advisory suggestion state.
- **FR-009**: The provider MUST remain interchangeable with `MockGitHubRepositoryProvider` at the `GitHubRepositoryProvider` interface level (same method signature, same return shape).
- **FR-010**: Automated tests MUST cover a successful read, a rate-limited response, a network/offline failure, a malformed response, and confirm no auth/mutation/sync behavior was introduced.

### Non-Goals

- No OAuth, personal access tokens, credential storage, or auth UI.
- No private repository access.
- No check-run/build-status reads in this slice (deferred; falls back to existing "Checks unavailable" state).
- No sync engine, polling, background refresh, or persistence.
- No repository mutation, issue/PR creation or editing, branch creation, commits, merges, or repository settings.
- No task/project/employee/advisory mutation or management controls.
- No wiring of the real provider into `OfficeProjectPortalController` as the active provider.
- No new dashboard UI or redesign; consumption continues through the existing provider-neutral paths from specs 033-036.
- No unbounded pull-request pagination.

### Key Entities *(include if feature involves data)*

- **GitHub Public Repository Reference**: Owner/name pair for a public repository, resolved from an AIverse project id via an injected resolver.
- **GitHub Public Read Provider**: The new `GitHubRepositoryProvider` implementation that performs real, unauthenticated `GET` reads and maps them into the approved summary boundary.
- **Repository Reference Resolver**: A function/lookup, supplied by the caller, that maps an AIverse `projectId` to a repository owner/name using existing repository mapping data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The real provider produces a `GitHubRepositorySummary` for a public repository containing all fields required by `GITHUB_PUBLIC_READ_SUMMARY_FIELDS` that are obtainable from public, unauthenticated GitHub reads.
- **SC-002**: Every failure mode in FR-004 is covered by a test proving a display-safe, non-throwing result.
- **SC-003**: No test or code path sends an auth header, token, or credential, or performs a non-`GET` request.
- **SC-004**: Reviewing the provider's behavior produces zero direct mutation of project, task, employee, company focus, repository mapping, repository summary, or advisory state.
- **SC-005**: Existing fixture-backed Company Dashboard, Project Dashboard, and advisory tests continue to pass unchanged.

## Assumptions

- The first real-read slice targets only public, unauthenticated GitHub REST API v3 endpoints (`api.github.com`).
- Detailed issue/PR lists, check-run detail, and private repository access remain deferred to future Spec Kit features.
- The repository reference (owner/name) resolver is supplied by the caller; this feature does not change how `OfficeProjectPortalController` currently constructs its repository service, since wiring the real provider in is an explicit follow-up decision.
- Open pull request count may be approximated (capped at a single page of results) rather than requiring full pagination, consistent with keeping this slice minimal.
