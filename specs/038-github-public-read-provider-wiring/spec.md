# Feature Specification: GitHub Public Read Provider Wiring

**Feature Branch**: `038-github-public-read-provider-wiring`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Minimal production wiring of the real GitHub public read provider (spec 037) into the existing application architecture, so mapped projects can use real data while unmapped projects degrade safely."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use Real Data for a Mapped Project (Priority: P1)

As a player opening the Project Dashboard for a project with a valid, enabled, public GitHub repository mapping, I see repository source data read from the real public GitHub API instead of local fixture data.

**Why this priority**: Spec 037 built and proved the real provider in isolation. This feature is the smallest step that makes it reachable from the running application for the one project that already has a trustworthy mapping.

**Independent Test**: Construct the real `OfficeProjectPortalController`, stub global `fetch`, open the Project Dashboard for the mapped project ("daily-proof"), and verify a real `GET` request is issued to `api.github.com` and the resulting summary flows into `state.repositorySummaries` and the dashboard snapshot exactly as it would for any other provider.

**Acceptance Scenarios**:

1. **Given** a project has an enabled, public repository mapping, **When** its Project Dashboard is opened, **Then** the application issues a real, unauthenticated `GET` request for that repository's summary data.
2. **Given** the same mapped project, **When** the repository reference is resolved, **Then** the resolved owner/name come only from the existing `AIverseProjectRepositoryMapping` data, never from the project's display name or title.
3. **Given** the resolver is queried twice for the same project id with unchanged mapping data, **When** results are compared, **Then** the resolved reference is identical both times (deterministic).

---

### User Story 2 - Safe Degradation for Unmapped or Invalid Mappings (Priority: P1)

As a player opening the Project Dashboard for a project with no repository mapping, a disabled mapping, or a private/invalid mapping, I see the existing safe "not configured"/"unavailable" source state, and the application never attempts a fabricated or guessed GitHub request.

**Why this priority**: The whole point of routing through an explicit resolver is to guarantee that anything not explicitly and validly mapped can never reach the network layer.

**Independent Test**: Query the resolver for a project id with no mapping entry, one with `enabled: false`, and one with `visibility: "private"`; verify all three return `undefined`. Then verify that when the real provider receives `undefined` from the resolver, it returns the existing safe fallback without ever calling `fetch`.

**Acceptance Scenarios**:

1. **Given** a project has no repository mapping entry, **When** its repository reference is resolved, **Then** the resolver returns nothing and the real provider never issues a network request for it.
2. **Given** a project's mapping is disabled or marks the repository private, **When** its repository reference is resolved, **Then** the resolver returns nothing, consistent with the existing `validateAIverseProjectRepositoryMapping` rules already used elsewhere in the dashboard flow.
3. **Given** no reference is resolved, **When** the real provider is asked for a summary, **Then** it returns the same display-safe "not configured" shape it already returns today, with no fabricated data.

---

### User Story 3 - Preserve Every Existing Safety Guarantee Through the Real Path (Priority: P1)

As a maintainer, I need every display-safe behavior already proven in specs 036-037 (rate limiting, offline, malformed responses, secondary-read degradation, no mutation, no auth) to hold when exercised through the actual wired application path, not only in provider-level unit tests.

**Why this priority**: Wiring is only safe if the guarantees proven in isolation still hold once real application state and control flow are involved.

**Independent Test**: Snapshot `projects`, `repositoryMappings`, `taskCollections`, `employees`, `projectManagementSuggestions`, and `companyInfluencePlan` before and after opening a mapped project's dashboard through the real controller with a stubbed `fetch`; verify no mutation. Verify a stubbed rate-limited/malformed `fetch` response still produces the existing display-safe degraded summary through the full controller path.

**Acceptance Scenarios**:

1. **Given** the real provider is wired in, **When** a mapped project's dashboard is opened and closed, **Then** project, task, employee, repository mapping, and advisory state remain unchanged.
2. **Given** a stubbed network failure or malformed response through the real wired path, **When** the dashboard renders, **Then** the existing rate-limited/offline/unavailable display states appear exactly as they do in the provider's own isolated tests.
3. **Given** the `MockGitHubRepositoryProvider` is still imported and used directly by other existing tests, **When** those tests run, **Then** they are unaffected by this feature, since it is not the controller's default anymore but remains fully usable as a standalone provider.

### Edge Cases

- Project has no repository mapping entry at all: resolver returns nothing; real provider's existing "not configured" fallback applies; no network call.
- Mapping exists but `enabled: false`: resolver returns nothing, same as unmapped.
- Mapping exists but `repository.visibility === "private"`: resolver returns nothing (unauthenticated repositories are out of scope for an unauthenticated-only provider; the existing upstream `validateAIverseProjectRepositoryMapping` check already renders "Unauthenticated" for this case at the dashboard layer regardless of what any summary says).
- Mapping exists with malformed owner/name (fails existing display-safe validation): resolver returns nothing.
- `repositoryMappings` array changes at runtime (hypothetically): resolver always reads the current state, never a stale snapshot captured at construction time.
- Existing tests that construct `MockGitHubRepositoryProvider` directly, or that bypass the controller constructor via a test harness, are unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST construct `GitHubRepositoryService` with `GitHubPublicRepositoryProvider` (not `MockGitHubRepositoryProvider`) as the active provider in `OfficeProjectPortalController`.
- **FR-002**: The real provider MUST receive a repository-reference resolver that reads `AIverseProjectRepositoryMapping` entries from the controller's live state, not a static snapshot.
- **FR-003**: The resolver MUST return a repository reference only for a mapping that exists, is `enabled`, and passes the existing `validateAIverseProjectRepositoryMapping` validity check (display-safe owner/name, not private).
- **FR-004**: The resolver MUST NOT derive owner/name from a project's display name, title, or any string other than the mapping's own `repository.owner`/`repository.name` fields.
- **FR-005**: A project with no valid, resolvable reference MUST NOT cause any network request; the real provider's existing "not configured" fallback MUST be what callers observe.
- **FR-006**: The `GitHubRepositoryProvider` interface MUST NOT change.
- **FR-007**: `MockGitHubRepositoryProvider` MUST remain unchanged and usable directly by any test or future scenario that wants deterministic local fixtures.
- **FR-008**: All display-safe behaviors already established in specs 036-037 (rate-limited, offline, malformed-response, 404, secondary-read degradation, no-mutation, no-auth) MUST continue to hold when exercised through the real controller construction path.
- **FR-009**: No new persistence, sync engine, background polling, mutation/write behavior, GitHub Projects integration, or credential/auth UI may be introduced.
- **FR-010**: Automated tests MUST cover: a valid mapped project routing to a real network call, an unmapped project issuing no network call, a disabled/private mapping issuing no network call, resolver determinism, no name-guessing, and no mutation of mapping/project/advisory state.

### Non-Goals

- No new repository-mapping authoring UI or data source; this feature only routes through the mapping data that already exists.
- No dual-provider routing mechanism (e.g., "real for some projects, mock for others" via a router); a single active provider whose own resolver naturally falls back to a safe empty state is sufficient and simpler.
- No changes to `GitHubRepositoryProvider`, `MockGitHubRepositoryProvider`, dashboard providers, or Project/Company Dashboard rendering.
- No feature flag, environment toggle, or configuration system to switch between mock and real providers; the existing constructor-injection seam is the only composition point touched.
- No handling for repository mappings added or changed after application startup beyond reading `state.repositoryMappings` live (no reactive/event-driven update mechanism is added).

### Key Entities *(include if feature involves data)*

- **Repository Reference Resolver**: A small function, built from the controller's live `repositoryMappings` state, that returns `{ owner, name }` only for valid, enabled, non-private mappings.
- **Active Repository Provider**: `GitHubPublicRepositoryProvider`, now constructed as the controller's default `GitHubRepositoryProvider` implementation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening the Project Dashboard for the one currently-mapped project results in a real, unauthenticated `GET` request being issued (verifiable via a stubbed `fetch` spy).
- **SC-002**: Opening the Project Dashboard for any unmapped, disabled-mapping, or private-mapping project results in zero `fetch` calls and the existing safe fallback summary.
- **SC-003**: All specs 036-037 display-safe error states are reproducible end-to-end through the real controller construction path.
- **SC-004**: Reviewing this feature's tests produces zero mutation of project, task, employee, repository mapping, or advisory state.
- **SC-005**: Existing test suites (specs 033-037) continue to pass unchanged.

## Assumptions

- The existing `REPOSITORY_MAPPINGS` fixture in `OfficeProjectPortalRegistry.ts` (currently one entry, `daily-proof` → `ai-verse/daily-proof`) is the only repository-reference data source this feature needs to route through; no new mapping data is authored by this feature.
- If `ai-verse/daily-proof` is not actually a reachable public GitHub repository, the running application will safely show an "unavailable" state rather than fabricate data — this is expected, already-proven behavior from spec 037, not a defect of this feature.
- A single active provider (real, with a resolver that safely no-ops for anything not validly mapped) is sufficient; no separate routing/dispatch layer between mock and real providers is required for this slice.
