# Feature Specification: Company Dashboard Project Source Signals

**Feature Branch**: `033-company-dashboard-project-source-signals`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "Add lightweight read-only source signals per project in the Company Dashboard, such as Internal, GitHub linked, Fresh, Stale, or Unavailable."

## User Scenarios & Testing

### User Story 1 - See Project Source Signals (Priority: P1)

As the player viewing the Company Dashboard, I can see a compact source signal for each visible project so I know whether the project is internal-only or linked to an external source.

**Why this priority**: The Company Dashboard is the primary observation surface. Project source context helps the player understand where project signals are coming from before opening an individual Project Dashboard.

**Independent Test**: Open the Company Dashboard with internal projects and linked projects, then verify each project entry includes a clear read-only source signal.

**Acceptance Scenarios**:

1. **Given** a project has no external source mapping, **When** the Company Dashboard renders, **Then** the project shows an Internal source signal.
2. **Given** a project has a valid GitHub repository mapping, **When** the Company Dashboard renders, **Then** the project shows a GitHub linked source signal.
3. **Given** a project has an unavailable, stale, unauthenticated, rate-limited, offline, or unknown external source status, **When** the Company Dashboard renders, **Then** the project shows the corresponding display-safe source status without blocking internal project data.

---

### User Story 2 - Preserve Read-Only Observation (Priority: P1)

As the player, I can review source signals without the dashboard refreshing repositories, changing mappings, mutating simulation state, or exposing credentials.

**Why this priority**: This is an observation feature and must stay safe for the first Codex + Claude coordination test.

**Independent Test**: Snapshot project, task, employee, schedule, progression, work-session, company influence, repository mapping, and repository summary inputs before and after deriving/rendering the Company Dashboard, then verify no state changed.

**Acceptance Scenarios**:

1. **Given** the Company Dashboard derives project source signals, **When** source signal data is read, **Then** no project, task, employee, schedule, work-session, progression, company influence, repository mapping, or repository summary state is mutated.
2. **Given** source signals are visible, **When** the player reviews the Company Dashboard, **Then** no repository refresh, sync, credential, issue, pull request, branch, commit, merge, or management control is offered.
3. **Given** external source data is missing, **When** the dashboard renders, **Then** internal project information remains visible and the missing source state is shown as unavailable or internal-only instead of being fabricated.

---

### User Story 3 - Keep Provider-Neutral Dashboard Boundaries (Priority: P2)

As a developer, I can extend Company Dashboard project rows with source signal metadata without making the view depend on GitHub-specific provider implementation details.

**Why this priority**: The feature should reuse source status concepts from the GitHub integration while preserving the Company Dashboard as a provider-neutral observation surface.

**Independent Test**: Inspect the dashboard read model and view layer to confirm the Company Dashboard consumes compact project source signal metadata rather than GitHub provider classes or API response shapes.

**Acceptance Scenarios**:

1. **Given** Company Dashboard types are inspected, **When** project source signal data is reviewed, **Then** it is represented as compact dashboard metadata suitable for internal and future external sources.
2. **Given** the Company Dashboard view is inspected, **When** project source signals are rendered, **Then** it depends on dashboard read-model data rather than importing GitHub provider implementations.
3. **Given** future source providers are considered, **When** the source signal shape is reviewed, **Then** it supports display-safe provider labels and statuses without requiring a generic connector framework.

### Edge Cases

- No projects exist: the dashboard remains empty/unavailable without showing fabricated source signals.
- Project has no external mapping: show Internal.
- Mapping exists but is disabled or invalid: show Unavailable or equivalent display-safe status.
- Mapping points to a private repository: show an unauthenticated or unavailable status without credential prompts.
- Repository summary is absent: show GitHub linked with Unavailable or Unknown status, depending on available source status.
- Repository summary is stale, rate-limited, or offline: show that status without retrying or blocking simulation.
- Multiple projects have different source states: each project shows its own source signal independently.
- Long source labels: dashboard rows remain readable and compact.

## Requirements

### Functional Requirements

- **FR-001**: The Company Dashboard MUST expose a read-only source signal for each visible project.
- **FR-002**: Projects with no external source mapping MUST show Internal or equivalent internal-only source context.
- **FR-003**: Projects with a valid GitHub repository mapping MUST show GitHub linked or equivalent external-source context.
- **FR-004**: Project source signals MUST support display-safe status labels including Fresh, Stale, Unavailable, Unauthenticated, Rate limited, Offline, Unknown, and Internal where source data supports them.
- **FR-005**: Project source signals MUST reuse existing source-status concepts from the GitHub Project Integration System where available.
- **FR-006**: Project source signals MUST NOT call GitHub APIs, refresh repositories, store credentials, sync data, mutate mappings, or mutate repository summaries.
- **FR-007**: Project source signals MUST NOT overwrite or duplicate internal project, task, employee, schedule, work-session, company influence, or progression state.
- **FR-008**: The Company Dashboard UI MUST render source signals through provider-neutral dashboard data and MUST NOT import GitHub provider implementation classes.
- **FR-009**: The feature MUST NOT add issue creation, pull request creation, branch creation, commits, merges, repository settings, webhook, management, or direct employee-control affordances.
- **FR-010**: Existing Company Dashboard, Project Dashboard, GitHub Project Dashboard, office movement, computer interaction, Employee Insight, Employee Knowledge, and project task execution behavior MUST remain unchanged except for the new read-only source signal display.

### Non-Goals

- No GitHub API calls.
- No repository refresh or sync.
- No credentials, tokens, OAuth, or private repository access.
- No repository mutation.
- No task assignment, project editing, management controls, dialogue, economy, payroll, relationship, quest, multiplayer, save/load, or direct employee control.
- No generic multi-provider connector framework.
- No replacement of the Project Dashboard source metadata model.

### Key Entities

- **Company Project Source Signal**: Compact read-only metadata shown with a Company Dashboard project entry.
- **Source Provider Label**: Display-safe label such as Internal or GitHub.
- **Source Status Label**: Display-safe status such as Fresh, Stale, Unavailable, Unauthenticated, Rate limited, Offline, Unknown, or Internal.
- **Project Source Summary**: Existing Company Dashboard project summary extended with source signal metadata.
- **Repository Mapping Input**: Existing read-only AIverse project to GitHub repository mapping data.
- **Repository Summary Input**: Existing read-only GitHub repository summary data when already available.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can identify whether each visible Company Dashboard project is Internal or externally linked within 5 seconds of opening the dashboard.
- **SC-002**: At least one internal-only project and one GitHub-linked project can show distinct source signals in automated tests.
- **SC-003**: Missing, stale, unauthenticated, rate-limited, offline, and unknown source states render without hiding internal project data.
- **SC-004**: Deriving and rendering source signals produces no direct mutation of project, task, employee, schedule, work-session, progression, company influence, repository mapping, or repository summary inputs.
- **SC-005**: The feature passes the existing automated validation suite without adding GitHub API calls, credential flows, sync behavior, or repository mutation controls.

## Assumptions

- The GitHub Project Integration System provides read-only mapping and source-status types that can be reused.
- The first slice can use already-available local mapping and repository summary inputs; it does not need a repository selection UI.
- Company Dashboard project rows are the right first player-facing surface for source signals.
- Project Dashboard remains the detailed source view; this feature only adds compact company-level source visibility.
