# Feature Specification: Project Advisory Signals

**Feature Branch**: `034-project-advisory-signals`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Expose existing hidden/local AI project manager suggestions in the Project Dashboard as compact, read-only advisory signals."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Project Advisory Signals (Priority: P1)

As a player reviewing a selected project, I can see a compact advisory signal in the Project Dashboard so I know what project health, risk, or next attention point deserves my focus.

**Why this priority**: The Project Dashboard already helps the player understand project state. Advisory signals close the next gap by turning existing project-management suggestions into readable guidance without adding management controls.

**Independent Test**: Open the office portal, open the Company Dashboard, select a project with prepared advisory data, and verify the Project Dashboard shows a compact advisory area with health summary, top risk or blocker, and next recommended attention.

**Acceptance Scenarios**:

1. **Given** a project has a prepared advisory suggestion, **When** the player opens that project's Project Dashboard, **Then** the dashboard shows the project's advisory health summary.
2. **Given** the advisory suggestion includes risks, **When** the Project Dashboard renders, **Then** the most important risk or blocker is shown in compact readable form.
3. **Given** the advisory suggestion includes a next recommendation, **When** the Project Dashboard renders, **Then** the next recommended attention or action is shown as read-only guidance.

---

### User Story 2 - Handle Missing Advisory Data Gracefully (Priority: P1)

As a player, I can open a Project Dashboard before advisory data is available and still understand that the advisory signal is empty or unavailable rather than fabricated.

**Why this priority**: Advisory preparation can be local, asynchronous, or absent. The first player-facing slice must be honest about missing data while preserving the rest of the Project Dashboard.

**Independent Test**: Open the Project Dashboard for a project with no prepared advisory suggestion and verify the advisory area shows a clear empty or unavailable state while all existing project details remain visible.

**Acceptance Scenarios**:

1. **Given** no advisory suggestion exists for the selected project, **When** the Project Dashboard renders, **Then** the advisory area shows a clear unavailable or waiting state.
2. **Given** advisory data is missing, **When** the player reviews active work, employee context, source signals, and project health, **Then** those existing sections remain visible and unchanged.
3. **Given** an advisory suggestion becomes available later in the local session, **When** the Project Dashboard renders again, **Then** the advisory display reflects the available suggestion without requiring any project mutation.

---

### User Story 3 - Preserve Read-Only Project Observation (Priority: P2)

As a player, I can review project advisory signals without the dashboard assigning employees, changing tasks, starting work, changing company focus, calling external systems, or controlling the project.

**Why this priority**: AIverse's current loop is Observe -> Understand -> Influence. Advisory signals belong to the Understand stage and must not become management actions.

**Independent Test**: Snapshot project, task, employee, work-session, company focus, source mapping, source summary, and dashboard state before and after rendering advisory signals, then verify no direct mutation occurs.

**Acceptance Scenarios**:

1. **Given** advisory signals are rendered, **When** state is compared before and after, **Then** project, task, employee, work-session, company focus, source mapping, and source summary data remain unchanged.
2. **Given** advisory signals are visible, **When** the player reviews the Project Dashboard, **Then** no task assignment, task status change, management action, employee-control, external sync, credential, repository mutation, or execution control is offered.
3. **Given** existing Company Dashboard source signals are present, **When** advisory signals are added to Project Dashboard, **Then** Company Dashboard source signal behavior remains unchanged.

### Edge Cases

- Selected project is unavailable: advisory shows unavailable and does not hide the existing unavailable-project state.
- Advisory suggestion exists for another project: the selected Project Dashboard does not show the wrong project's advisory data.
- Advisory suggestion has no risks: the advisory area shows a neutral "no immediate advisory risk" state.
- Advisory suggestion references a task or employee no longer visible in the selected project: advisory text remains display-safe and does not mutate or recreate missing data.
- Advisory text is long: the Project Dashboard keeps the advisory compact and readable without overlapping existing rows.
- External source or GitHub data is unavailable: advisory signals still use local project-management suggestion data only and do not attempt external refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Project Dashboard MUST show a compact advisory signal area for the selected project.
- **FR-002**: When advisory data exists for the selected project, the advisory signal MUST include a project health summary.
- **FR-003**: When advisory data includes one or more risks, the advisory signal MUST show the top risk or blocker in compact readable form.
- **FR-004**: When advisory data includes a next recommendation, the advisory signal MUST show the next recommended attention or action as guidance only.
- **FR-005**: When advisory data is missing, the Project Dashboard MUST show a clear empty or unavailable advisory state.
- **FR-006**: Advisory signals MUST be scoped to the selected project and MUST NOT display advisory data from a different project.
- **FR-007**: Advisory signals MUST remain read-only and MUST NOT expose task assignment, task editing, status changes, project management action buttons, employee-control, dialogue, execution, sync, credential, repository mutation, or external provider controls.
- **FR-008**: Rendering advisory signals MUST NOT mutate project, task, employee, work-session, company focus, repository mapping, repository summary, Company Dashboard, or Project Dashboard source signal state.
- **FR-009**: Advisory signal behavior MUST use deterministic local/mock advisory data available in the current session and MUST NOT call real external AI services, GitHub APIs, credential flows, sync jobs, background workers, or persistence systems.
- **FR-010**: Existing Company Dashboard, Project Dashboard, Company Dashboard source signals, project/task/work-session flows, employee insight, and employee knowledge behavior MUST remain unchanged except for the new read-only advisory display.

### Non-Goals

- No real external AI calls.
- No GitHub API calls.
- No credentials, tokens, OAuth, or private repository access.
- No repository refresh or sync.
- No task mutation, assignment, status changes, or project execution.
- No employee control or direct management actions.
- No project management action buttons.
- No generic advisory framework beyond this focused Project Dashboard display.
- No persistence, save/load, background jobs, or multi-provider connector expansion.

### Key Entities *(include if feature involves data)*

- **Project Advisory Signal**: Compact read-only display for a selected project's advisory health, top risk, and next recommended attention.
- **Project Health Advisory**: Human-readable summary of the selected project's advisory health.
- **Top Advisory Risk**: Highest-priority risk, blocker, or neutral risk state shown in the Project Dashboard.
- **Next Recommended Attention**: Read-only guidance describing what the player should pay attention to next.
- **Advisory Empty State**: Honest display state used when no advisory suggestion is available for the selected project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can identify the selected project's advisory health, top risk or neutral risk state, and next recommended attention within 5 seconds of opening the Project Dashboard when advisory data is available.
- **SC-002**: A Project Dashboard with no advisory data clearly communicates the unavailable advisory state while preserving all existing project information.
- **SC-003**: Reviewing advisory signals produces zero direct changes to project, task, employee, work-session, company focus, repository mapping, repository summary, or dashboard source signal state.
- **SC-004**: The advisory display exposes zero management, task mutation, employee-control, credential, sync, repository mutation, or execution controls.
- **SC-005**: Existing dashboard, source signal, project/task, and work-session validation flows continue to pass after the advisory display is added.

## Assumptions

- Local project-management suggestions already exist in the current session for some project flows.
- The first slice only exposes available local advisory suggestions; it does not change when or how suggestions are prepared.
- Advisory signals belong in the Project Dashboard because they are project-specific.
- Missing advisory data should be visible as an empty state rather than silently hidden.
- Future real AI providers, management actions, persistence, and external integrations require separate Spec Kit features.
