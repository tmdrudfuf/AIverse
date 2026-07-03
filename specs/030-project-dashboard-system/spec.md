# Feature Specification: Project Dashboard System

**Feature Branch**: `030-project-dashboard-system`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Allow the player to inspect one project in detail from the Company Dashboard. This is the bridge between the internal simulation and future GitHub/project integrations."

## User Scenarios & Testing

### User Story 1 - Open a Project Dashboard (Priority: P1)

As the player, I can choose a project from the Company Dashboard and inspect it in a focused read-only Project Dashboard so I can understand what that project is doing without controlling it.

**Why this priority**: This is the minimum playable vertical slice and establishes the bridge from company-level observation to project-level understanding.

**Independent Test**: Open the Company Dashboard, select one available project, and verify a read-only Project Dashboard appears for that same project.

**Acceptance Scenarios**:

1. **Given** the Company Dashboard is open and at least one project exists, **When** the player selects a project entry, **Then** the Project Dashboard opens for that selected project.
2. **Given** the Project Dashboard is open, **When** the player reviews the page, **Then** it clearly shows the project name, status, progress, and current work context.
3. **Given** the Project Dashboard is open, **When** the player exits or returns, **Then** the player returns to the Company Dashboard without changing project, task, employee, schedule, or progression state.

---

### User Story 2 - Understand Project Health and Work (Priority: P1)

As the player, I can see active tasks, assigned employees, blockers, project health, recent activity, and related employee focus for one project so I understand why the project is healthy, risky, blocked, or progressing.

**Why this priority**: The feature must provide useful project understanding, not just a title page.

**Independent Test**: Open a project with active work and verify the dashboard presents derived work, health, blocker, activity, and employee context from existing simulation data.

**Acceptance Scenarios**:

1. **Given** a project has active tasks, **When** the Project Dashboard opens, **Then** the active tasks are summarized with status and progress where available.
2. **Given** employees are associated with project work, **When** the Project Dashboard opens, **Then** the assigned or related employees are shown with their current focus or AI state where available.
3. **Given** existing simulation data indicates blockers or risk, **When** the Project Dashboard opens, **Then** project health, blockers, and risk context are derived from that existing data.
4. **Given** insufficient data is available for any section, **When** the Project Dashboard opens, **Then** the section uses a clear empty or unavailable state without fabricating project activity.

---

### User Story 3 - Preserve Read-Only Project Observation (Priority: P2)

As the player, I can inspect project details without the dashboard assigning work, editing tasks, creating issues, changing task status, mutating employee behavior, or changing company focus.

**Why this priority**: Employee autonomy and simulation authority must remain intact while the player is still in the Observe and Understand stages.

**Independent Test**: Snapshot project, task, employee AI, schedule, company influence, and progression state before and after opening and closing the Project Dashboard, and verify no direct mutation occurs.

**Acceptance Scenarios**:

1. **Given** the Project Dashboard is opened and closed, **When** state is compared before and after, **Then** project, task, employee AI, schedule, work-session, company influence, and progression state remains unchanged.
2. **Given** the Project Dashboard is open, **When** the player reviews all controls, **Then** no task assignment, editing, issue creation, management action, dialogue, or direct employee-control affordance is offered.
3. **Given** the player selected a company focus previously, **When** the Project Dashboard is viewed, **Then** the selected focus may be referenced as advisory context but does not directly mutate the project.

---

### User Story 4 - Support Future GitHub Mapping (Priority: P3)

As a developer, I can later map a GitHub repository or project source into the same Project Dashboard structure without replacing the UI or duplicating project state.

**Why this priority**: The feature is the bridge between internal simulation and future project integrations, but the current vertical slice must stay internal-only.

**Independent Test**: Review the Project Dashboard model and contracts to confirm the UI consumes a provider-neutral project detail snapshot and no GitHub connector, credentials, network calls, or issue management behavior is implemented.

**Acceptance Scenarios**:

1. **Given** the Project Dashboard data model is inspected, **When** future GitHub metadata is considered, **Then** source identity and external metadata placeholders can represent future mapping without requiring GitHub integration now.
2. **Given** the Project Dashboard UI is inspected, **When** data providers are reviewed, **Then** the UI depends on a provider-neutral project detail structure rather than an internal-only provider implementation.
3. **Given** the current feature is complete, **When** network and credential paths are reviewed, **Then** no GitHub API calls, credential flows, issue creation, repository sync, webhook, or external provider integration exists.

### Edge Cases

- No projects exist: Company Dashboard project entries remain empty and the Project Dashboard cannot be opened until a project exists.
- Selected project cannot be found: the player sees a clear unavailable state and can return to the Company Dashboard.
- Project has no active tasks: the Project Dashboard shows an empty active-work state without inventing tasks.
- Project has no assigned employees: employee context is empty or unavailable without inventing assignments.
- Project progress is missing or partial: progress is displayed as unknown or derived only from available source data.
- Existing blockers are unavailable: blocker and risk sections show neutral states instead of fabricated risks.
- Company focus is unset: next suggested focus avoids pretending a selected company priority exists.
- Dashboard data refreshes while the Project Dashboard is open: the view updates from provider data without direct mutation.
- Future external metadata is absent: the dashboard remains fully usable with internal simulation data only.

## Requirements

### Functional Requirements

- **FR-001**: The player MUST be able to open a read-only Project Dashboard for one project from the Company Dashboard.
- **FR-002**: The Project Dashboard MUST identify the selected project by name and status.
- **FR-003**: The Project Dashboard MUST show project progress when existing project or task data supports it.
- **FR-004**: The Project Dashboard MUST show active tasks for the selected project when existing task data is available.
- **FR-005**: The Project Dashboard MUST show assigned or related employees for the selected project when existing employee or task data is available.
- **FR-006**: The Project Dashboard MUST show current blockers, risk, or a neutral no-blocker state derived from existing simulation data.
- **FR-007**: The Project Dashboard MUST show recent project activity when existing project, task, employee, work-session, or progression data supports it.
- **FR-008**: The Project Dashboard MUST show related employee focus or AI state where existing Employee AI data supports it.
- **FR-009**: The Project Dashboard MUST show a project health summary derived from existing project, task, progression, and employee signals.
- **FR-010**: The Project Dashboard MAY show a next suggested focus as advisory context only.
- **FR-011**: The Project Dashboard MAY include future external source metadata placeholders only when they help preserve provider-neutral mapping and remain empty for the internal-only slice.
- **FR-012**: The feature MUST reuse existing Project, Task, Employee AI, Company Dashboard, Company Influence, Schedule, Company Progression, and related simulation systems where relevant.
- **FR-013**: The feature MUST NOT duplicate simulation state for presentation purposes.
- **FR-014**: The feature MUST NOT implement GitHub integration, external provider calls, credentials, repository sync, issue creation, webhooks, or network connector behavior.
- **FR-015**: The feature MUST NOT add task assignment, editing, task status mutation, project control, management controls, dialogue, economy, payroll, relationship, quest, multiplayer, save/load, or direct employee-control behavior.
- **FR-016**: Existing Company Dashboard, Company Influence, project portal, office movement, computer interaction, Employee Insight, Employee Knowledge, and project task execution behavior MUST remain unchanged except for the new read-only project inspection path.
- **FR-017**: Manual validation MUST verify opening the Company Dashboard, opening one project dashboard, reviewing core project sections, returning to the Company Dashboard, and confirming no direct project, task, employee, schedule, or focus mutation occurs.

### Non-Goals

- No GitHub integration.
- No external project provider implementation.
- No task assignment or editing.
- No issue creation.
- No repository synchronization.
- No direct employee control.
- No project execution control.
- No mutation of employee AI, schedules, work sessions, company influence, or progression.
- No economy, payroll, relationship, quest, multiplayer, save/load, or full management system.

### Key Entities

- **Project Dashboard Snapshot**: Provider-neutral read model for one selected project.
- **Project Dashboard Provider**: A source that derives one project dashboard snapshot from existing data.
- **Internal Simulation Project Provider**: The first provider, derived only from existing internal simulation systems.
- **Project Health Summary**: Derived project status, risk, progress, and blocker context.
- **Project Work Item Summary**: Read-only representation of a project task or active work item.
- **Project Employee Context**: Read-only employee focus, AI state, role, or assignment context related to the selected project.
- **Project Activity Item**: Recent project activity derived from existing simulation events or progression signals.
- **External Source Metadata**: Optional future-ready source identity placeholder for mapping GitHub or other integrations into the same structure later.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can open the Project Dashboard for an available project from the Company Dashboard flow in under 30 seconds.
- **SC-002**: The Project Dashboard presents project name, status, progress, active work, employee context, health, and blocker or neutral blocker context for the selected project.
- **SC-003**: Opening, reviewing, and closing the Project Dashboard produces no direct changes to project task status, employee AI state, schedule state, work-session progress, company influence focus, project execution, or company progression.
- **SC-004**: The first vertical slice contains no GitHub API calls, credentials, repository sync, issue creation, external provider implementation, or management controls.
- **SC-005**: Existing Company Dashboard, Company Influence, project portal, office movement, computer interaction, Employee Insight, Employee Knowledge, and task execution validation flows continue to pass after implementation.

## Assumptions

- The Company Dashboard System and Company Influence Planning System are available foundations.
- Existing project/task data is sufficient for the first read-only detail slice.
- The first implementation uses internal simulation data only.
- Future GitHub mapping, external project providers, project control, task editing, management workflows, and issue creation require separate Spec Kit features.
- Existing dashboard and portal navigation patterns should determine the exact player controls for opening and closing the Project Dashboard.
