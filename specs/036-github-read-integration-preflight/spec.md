# Feature Specification: GitHub Read Integration Preflight

**Feature Branch**: `036-github-read-integration-preflight`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Prepare the project for real GitHub repository read integration by defining the exact read-only integration boundary, provider contract, data mapping, and safety constraints before implementing any real network/API behavior."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define Public Repository Read Boundary (Priority: P1)

As an AIverse developer preparing the first real GitHub read integration, I can see exactly which public repository data is allowed into AIverse dashboards so the future provider does not grow into auth, sync, mutation, or broad integration work.

**Why this priority**: The fixture playground proves the dashboard flow, but a real provider needs a crisp preflight boundary before any network code is introduced.

**Independent Test**: Review the preflight specification and contract expectations, then verify the future first read slice is limited to public repository summary data that maps into the existing repository summary/dashboard fields.

**Acceptance Scenarios**:

1. **Given** a future public repository read provider is planned, **When** the preflight boundary is reviewed, **Then** it identifies the first allowed data set as repository identity, default branch, latest commit summary, open issue count, open pull request count, check/build status summary, source status, and latest activity timestamp.
2. **Given** a requested GitHub data field is outside the first allowed data set, **When** it is evaluated against the preflight boundary, **Then** it is deferred to a future feature rather than added implicitly.
3. **Given** the fixture provider and future real provider are compared, **When** their dashboard output is reviewed, **Then** both produce the same provider-neutral repository summary shape for Company Dashboard and Project Dashboard consumers.

---

### User Story 2 - Define Error and Availability States (Priority: P1)

As a player reviewing dashboards later, I need unavailable, rate-limited, offline, private, invalid, and network-error repository states to appear clearly without hiding internal simulation data or prompting for credentials.

**Why this priority**: Real public reads can fail even before auth exists. The dashboard must stay useful and safe when a repository cannot be read.

**Independent Test**: Evaluate each future source state against the preflight rules and confirm every state maps to display-safe source status labels and reasons already supported by the dashboard model.

**Acceptance Scenarios**:

1. **Given** a repository cannot be read because it is missing, invalid, private, or disabled, **When** source status is mapped, **Then** dashboards show unavailable or unauthenticated status without credential prompts.
2. **Given** a future public read is rate-limited, offline, or fails due to a network/API error, **When** source status is mapped, **Then** dashboards show Rate limited, Offline, or Unavailable with a display-safe reason and keep internal project information visible.
3. **Given** source data is stale or incomplete, **When** dashboards render, **Then** they show stale or partial source context without retry loops, sync controls, or fabricated repository data.

---

### User Story 3 - Guard Read-Only Provider Interchangeability (Priority: P2)

As a maintainer, I can validate that the future real provider remains interchangeable with the fixture provider and cannot mutate repositories, simulation state, or advisory data.

**Why this priority**: AIverse already depends on provider-neutral Company Dashboard and Project Dashboard source paths. The next feature should strengthen that contract before real network code appears.

**Independent Test**: Planned contract/type tests can assert provider outputs, no-network behavior for this preflight feature, and no mutation of projects, tasks, employees, repository mappings, source summaries, or advisory suggestions.

**Acceptance Scenarios**:

1. **Given** the future real read provider boundary is reviewed, **When** its output contract is compared to the fixture provider, **Then** both are constrained to the existing repository summary fields consumed by dashboards.
2. **Given** this preflight feature is implemented, **When** tests inspect the codebase, **Then** no `fetch`, external GitHub API call, credential/token/auth handling, sync, persistence, or repository mutation behavior has been added.
3. **Given** dashboard source data is rendered, **When** read-only boundaries are checked, **Then** project, task, employee, company influence, repository mapping, source summary, and advisory suggestion state remain unchanged except for existing local read-model loading behavior.

### Edge Cases

- Public repository exists but has no latest commit available: latest commit displays as unavailable while repository identity remains visible.
- Public repository has no open issues or pull requests: issue and pull request counts display as zero rather than being omitted or fabricated.
- Default branch is missing or unknown: dashboard source rows use an unknown/unavailable branch state.
- Checks are unavailable, pending, failing, or unknown: dashboards display the check status as read-only source health.
- Repository owner/name is invalid or unsafe for display: mapping validation keeps the source unavailable.
- Repository is private or requires auth: status remains unauthenticated and no credential prompt appears.
- Rate limits, offline mode, malformed responses, and network errors: mapped to display-safe source statuses without retry loops or sync controls.
- Source data is stale: dashboards show stale status while preserving internal project and advisory context.
- Future provider returns fields not in the approved summary boundary: extra data is ignored or deferred, not surfaced implicitly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The preflight MUST define the first allowed public read data set as repository identity, default branch, latest commit summary, open issue count, open pull request count, check/build status summary, source freshness/status, and latest activity timestamp.
- **FR-002**: The preflight MUST define how the allowed public read data maps into the existing repository summary fields consumed by Company Dashboard and Project Dashboard.
- **FR-003**: The preflight MUST define display-safe handling for unavailable, unauthenticated/private, rate-limited, offline, stale, unknown, malformed, and network-error states.
- **FR-004**: The future real provider boundary MUST remain interchangeable with the local fixture provider at the repository summary contract level.
- **FR-005**: Dashboards MUST continue consuming provider-neutral repository summaries and MUST NOT depend on raw GitHub API response shapes.
- **FR-006**: This feature MUST NOT add real GitHub API calls, `fetch`, external network behavior, credentials, tokens, OAuth, auth UI, sync jobs, webhooks, persistence, or repository mutation.
- **FR-007**: This feature MUST NOT add issue creation, pull request creation, editing, branch creation, commits, merges, check reruns, repository settings, or management actions.
- **FR-008**: This feature MUST NOT mutate project, task, employee, company influence, repository mapping, repository summary, source fixture, or advisory suggestion state.
- **FR-009**: If planning includes code changes, they MUST be limited to non-network provider-contract/type cleanup or tests that strengthen the existing read-only boundary.
- **FR-010**: Tests for any code changes MUST prevent accidental network/auth/sync/mutation behavior and prove existing fixture-backed Company Dashboard and Project Dashboard consumption remains unchanged.

### Non-Goals

- No real GitHub API calls.
- No `fetch` or external network behavior.
- No OAuth, tokens, credential storage, auth UI, private repository access, or personal account connection.
- No sync engine, polling, refresh scheduler, webhook, background worker, or persistence/save-load.
- No repository mutation, issue/PR creation, issue/PR editing, branch creation, commits, merges, check reruns, or repository settings.
- No task/project/employee/advisory mutation, assignment, status changes, project execution, management controls, dialogue, economy, payroll, relationship, quest, multiplayer, or direct employee control.
- No UI for entering repository URLs.
- No dashboard redesign.
- No broad generic provider framework.

### Key Entities *(include if feature involves data)*

- **Public Repository Read Boundary**: Approved first-slice set of public repository fields that a future real provider may read.
- **Repository Summary Mapping**: Rules that map public repository data into the existing summary fields consumed by dashboards.
- **Provider Contract Guard**: Documentation and possible tests that keep real and fixture providers interchangeable.
- **Source Availability State**: Display-safe status and reason for fresh, stale, unavailable, unauthenticated, rate-limited, offline, and unknown source data.
- **Read-Only Safety Boundary**: Prohibition on credentials, sync, mutation, persistence, and dashboard/provider side effects.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A maintainer can identify the allowed first-read GitHub data fields and their repository summary mappings in under 5 minutes.
- **SC-002**: Every supported unavailable/error source state has a documented display-safe dashboard outcome before real network behavior is implemented.
- **SC-003**: A future provider can be evaluated against the same repository summary contract as the fixture provider without changing Company Dashboard or Project Dashboard consumers.
- **SC-004**: If this feature includes tests or type guards, automated validation proves zero real network, auth, credential, sync, persistence, or mutation behavior was introduced.
- **SC-005**: Existing fixture-backed source signal and project advisory behavior remains unchanged after the preflight slice.

## Assumptions

- The smallest useful preflight scope is specification plus planning for contract/type tests; no production real provider implementation is required yet.
- Public repository reads will eventually target only unauthenticated public data until a separate credential/auth feature is approved.
- Existing `GitHubRepositorySummary`, source status, Company Dashboard source signal, and Project Dashboard source metadata models are the intended boundary for the first real read integration.
- Detailed issue/PR lists, repository URL entry UI, persistence, sync, credentials, and mutations require separate Spec Kit features.
