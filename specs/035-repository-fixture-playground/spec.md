# Feature Specification: Repository Fixture Playground

**Feature Branch**: `035-repository-fixture-playground`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Before connecting to the real GitHub API, create a local fixture-driven repository playground that proves the dashboard/source/advisory flow works end-to-end with realistic GitHub-like dummy data."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Observe Fixture Repository Signals (Priority: P1)

As a player reviewing company and project dashboards, I can see realistic local repository-style source data for mapped projects so the future GitHub read flow can be validated without connecting to GitHub.

**Why this priority**: The Company Dashboard source signals and Project Dashboard source metadata already exist, but the current mock repository data is too thin to exercise realistic issue, pull request, commit, check, freshness, and activity states.

**Independent Test**: Open the office portal, open the Company Dashboard, select a mapped project, and verify the Company Dashboard and Project Dashboard expose deterministic fixture-backed repository signals without network access.

**Acceptance Scenarios**:

1. **Given** a mapped project has local fixture repository data, **When** the Company Dashboard renders, **Then** the project source signal shows GitHub-linked fixture status such as Fresh, Stale, or Unavailable without hiding internal project data.
2. **Given** the player opens the mapped project's Project Dashboard, **When** fixture repository data is available, **Then** the source metadata shows repository name, default branch, issue summary, pull request summary, check/build status, latest activity, and recent commit context in compact read-only form.
3. **Given** fixture data changes only by selecting a different deterministic fixture record in tests or setup, **When** the dashboard flow is repeated, **Then** the same inputs produce the same source and activity output every time.

---

### User Story 2 - Exercise Non-Happy Repository States (Priority: P1)

As a tester or developer, I can use local fixture scenarios for stale, unavailable, failing, or otherwise non-happy repository states so dashboard source handling is proven before real provider work begins.

**Why this priority**: Future GitHub integration must handle more than a connected/fresh repository. Local fixtures let the app prove these display states safely before credentials, sync, or network behavior exists.

**Independent Test**: Run focused provider/dashboard tests with fixture-backed fresh, stale, failing-check, and unavailable repository summaries, then verify display-safe dashboard output for each state.

**Acceptance Scenarios**:

1. **Given** a fixture repository summary is stale, **When** dashboard source rows are derived, **Then** stale status and reason are displayed without retrying or refreshing.
2. **Given** a fixture repository summary has failing checks or open risks, **When** the Project Dashboard renders source health and activity, **Then** the risk is visible as read-only source context without mutating AIverse tasks or advisory data.
3. **Given** no fixture repository data exists for a mapped project, **When** the dashboard flow requests source context, **Then** the existing unavailable/empty source behavior remains clear and display-safe.

---

### User Story 3 - Preserve Read-Only Local Boundaries (Priority: P2)

As a player, I can review fixture-backed repository context without the app calling external services, storing credentials, syncing repositories, or changing simulation state.

**Why this priority**: This feature exists to validate future read integration safely. It must not become the real GitHub integration or introduce hidden mutation.

**Independent Test**: Snapshot project, task, employee, work-session, company focus, repository mapping, repository summary, source signal, and advisory inputs before and after fixture-backed dashboard derivation/rendering, then verify no direct mutation occurs outside the existing in-memory read-model loading path.

**Acceptance Scenarios**:

1. **Given** fixture-backed repository data is displayed, **When** dashboards are opened and closed, **Then** project, task, employee, work-session, company influence, source mapping, source fixture, and advisory data remain unchanged.
2. **Given** fixture-backed repository data is available, **When** source summaries are loaded, **Then** the app uses local deterministic fixture data only and performs no real GitHub API, auth, credential, sync, webhook, or network operation.
3. **Given** fixture-backed source data appears next to Project Advisory Signals, **When** the Project Dashboard renders, **Then** advisory signals still come only from existing local project-manager suggestions and are not fabricated from repository fixture data.

### Edge Cases

- Fixture data is missing for a mapped project: the dashboard uses the existing unavailable source state.
- Fixture data is present for a project with no valid mapping: the dashboard does not display it as linked project data.
- Repository mapping is disabled, invalid, or private: the existing display-safe unavailable/unauthenticated behavior remains.
- Fixture source status is stale, offline, rate-limited, unauthenticated, or unavailable: dashboard rows show status and reason without retrying.
- Fixture check/build status is failing, pending, unavailable, or unknown: Project Dashboard health/source rows remain compact and readable.
- Fixture issue or pull request counts are zero: dashboards show empty/non-risk source context without fabricated work.
- Fixture issue or pull request counts are high: dashboard text remains compact and does not imply task mutation.
- Fixture repository names, commit messages, labels, or status reasons are long: terminal-style dashboard rows remain readable without overlap.
- Project advisory data is missing while repository fixture data exists: advisory empty state remains honest.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide deterministic local fixture repository data for at least one mapped AIverse project.
- **FR-002**: Fixture repository data MUST include display-safe repository owner/name, display name or repository label, default branch, recent commit or activity summary, issue summary, pull request summary, check/build status, source freshness/status, and latest activity timestamp where available.
- **FR-003**: Fixture repository data MUST include at least one non-happy source scenario such as stale, unavailable, failing checks, offline, rate-limited, or unknown status.
- **FR-004**: The Company Dashboard MUST be able to consume fixture-backed repository source status through existing provider-neutral source signal paths.
- **FR-005**: The Project Dashboard MUST be able to consume fixture-backed repository source metadata, health, source rows, and recent activity through existing provider-neutral source paths.
- **FR-006**: Fixture-backed repository data MUST NOT replace, duplicate, or mutate internal project, task, employee, schedule, progression, work-session, company focus, source mapping, or advisory state.
- **FR-007**: Fixture-backed repository data MUST NOT generate Project Advisory Signals; advisory content MUST continue to come only from existing local project-manager suggestions.
- **FR-008**: The feature MUST NOT call real GitHub APIs, make external network calls, store credentials, request auth, run sync jobs, create webhooks, persist repository data, or mutate repositories.
- **FR-009**: Existing Company Dashboard source signals, Project Dashboard source metadata, Project Advisory Signals, project/task/work-session flows, office movement, and computer interaction behavior MUST remain unchanged except for richer local fixture-backed source data.
- **FR-010**: Automated tests MUST verify realistic fixture scenarios, deterministic output, read-only boundaries, missing fixture behavior, and preservation of existing source/advisory behavior.

### Non-Goals

- No real GitHub API integration.
- No OAuth, tokens, credential storage, private repository access, or auth UI.
- No external network calls.
- No sync engine, refresh scheduler, webhook, background worker, or persistence/save-load.
- No issue, pull request, branch, commit, merge, check, repository settings, or repository mutation controls.
- No task/project/employee mutation, assignment, status changes, project execution, management controls, dialogue, economy, payroll, relationship, quest, multiplayer, or direct employee control.
- No broad dashboard redesign.
- No new player-facing fixture selector or standalone playground screen in the first slice.
- No generic provider framework unless the existing provider-neutral dashboard contracts require a minimal extension.

### Key Entities *(include if feature involves data)*

- **Repository Fixture Dataset**: Deterministic local set of fake repository summaries keyed by AIverse project identity or repository mapping identity.
- **Fixture Repository Summary**: Local GitHub-like summary containing repository identity, branch, issue and pull request counts, latest commit/activity, check status, and source freshness.
- **Fixture Source Scenario**: Named or test-addressable repository state such as fresh, stale, failing checks, unavailable, or no fixture.
- **Repository Mapping Input**: Existing read-only AIverse project to repository mapping that decides whether fixture data can be associated with a project.
- **Dashboard Source Signal**: Existing provider-neutral Company Dashboard and Project Dashboard source metadata derived from repository summaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player or tester can identify fixture repository name, default branch, source status, check/build status, issue summary, pull request summary, and latest activity within 5 seconds of opening a mapped Project Dashboard.
- **SC-002**: Automated tests cover at least one connected/fresh fixture and one non-happy fixture state while proving the output is deterministic.
- **SC-003**: Company Dashboard source signals and Project Dashboard source rows can consume fixture-backed data without importing real GitHub API, auth, credential, sync, or network behavior.
- **SC-004**: Reviewing fixture-backed dashboards produces zero direct changes to project, task, employee, work-session, company focus, source mapping, source fixture, repository summary input, or advisory suggestion state.
- **SC-005**: Existing source signal and advisory validations continue to pass with fixture-backed repository data present.

## Assumptions

- The first slice should enhance the existing local mock repository provider/data path rather than add a player-facing fixture selector or standalone playground screen.
- Existing provider-neutral Company Dashboard and Project Dashboard source contracts are the correct surfaces for fixture-backed repository data.
- The current repository summary model supports realistic summary-level issue and pull request data; detailed issue and pull request lists can be deferred unless planning proves they fit the existing small slice.
- Fixture data is fake, deterministic, display-safe, and intentionally local.
- Future real GitHub reads, credentials, sync, persistence, and repository mutation require separate Spec Kit features.
