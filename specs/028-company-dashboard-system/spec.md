# Feature Specification: Company Dashboard System

**Feature Branch**: `028-company-dashboard-system`
**Created**: 2026-07-03
**Status**: Draft
**Input**: User description: "Create the central Company Dashboard for AIverse. The dashboard is the primary observation interface for the player and should become the future hub for all company information. It must aggregate existing simulation data without introducing new simulation state."

## User Scenarios & Testing

### User Story 1 - Observe the Company at a Glance (Priority: P1)

As the player, I can open a read-only Company Dashboard that summarizes company health, employee state, project state, workload, and recent activity so I understand what the company is doing within a few seconds.

**Why this priority**: The dashboard is the core observation interface and the minimum playable vertical slice for the feature.

**Independent Test**: Open the dashboard from the existing company/office experience and verify it shows provider-sourced company overview data without offering actions, editing, dialogue, task assignment, or project controls.

**Acceptance Scenarios**:

1. **Given** the player is in the office/company experience, **When** the dashboard is opened, **Then** a read-only company overview appears with company health, employee summary, project summary, workload, occupancy, and recent activity where available.
2. **Given** source simulation data changes, **When** the dashboard refreshes, **Then** the displayed values reflect the current provider snapshot without storing duplicate UI state.
3. **Given** the dashboard is visible, **When** the player scans it, **Then** no management, editing, dialogue, task assignment, or direct employee-control affordance is present.

---

### User Story 2 - Understand Employee and Project State (Priority: P1)

As the player, I can see aggregated employee states, current tasks, project progress, and current workload so I understand how autonomous employees and projects are progressing.

**Why this priority**: Employee and project status are the most important existing simulation signals for a company command center.

**Independent Test**: Seed or observe employees and projects, open the dashboard, and verify employee/project sections derive their values from existing Employee AI, schedule, project, progression, and work-session data.

**Acceptance Scenarios**:

1. **Given** employees have active AI states and work assignments, **When** the dashboard renders, **Then** employee summaries group and display the current autonomous state without creating separate dashboard-only employee state.
2. **Given** projects have progress and task status, **When** the dashboard renders, **Then** project summaries and progress are derived from existing project/progression data.
3. **Given** employees are present in office locations, **When** the dashboard renders occupancy, **Then** occupancy is derived from existing office layout and NPC/employee positioning data where available.

---

### User Story 3 - Surface Bottlenecks, Risks, and Context (Priority: P2)

As the player, I can see current bottlenecks, recent company activity, recent conversations summary, productivity, risks, and a short company summary so I understand what deserves attention before future influence tools exist.

**Why this priority**: This expands observation into understanding while keeping the first slice read-only.

**Independent Test**: Open the dashboard with varied employee, schedule, project, and conversation data and verify contextual sections show derived summaries or clear empty states without external integrations.

**Acceptance Scenarios**:

1. **Given** projects or employees show stalled, idle, overloaded, blocked, or low-progress signals, **When** the dashboard renders, **Then** bottlenecks and risks summarize those signals using existing simulation data.
2. **Given** recent employee activity or conversation data exists, **When** the dashboard renders, **Then** recent activity and conversation summary sections reflect existing records without creating new conversation state.
3. **Given** not enough source data exists for a section, **When** the dashboard renders, **Then** it shows a lightweight empty or unavailable state instead of fabricating data.

---

### User Story 4 - Preserve Future Connector Extensibility (Priority: P3)

As a developer, I can add future dashboard data providers without changing the dashboard UI because the UI consumes provider-neutral dashboard snapshots.

**Why this priority**: The dashboard should become the future company hub while only the Internal Simulation provider exists in this feature.

**Independent Test**: Review the provider contract and verify the dashboard UI depends on the contract, not the internal simulation provider implementation.

**Acceptance Scenarios**:

1. **Given** the dashboard UI renders data, **When** the data source is inspected, **Then** the UI consumes a provider-neutral snapshot contract.
2. **Given** the provider registry is inspected, **When** this feature is complete, **Then** only the Internal Simulation provider is implemented.
3. **Given** future providers such as GitHub, Firebase, Notion, Jira, Linear, or Figma are considered, **When** reviewing the architecture, **Then** they can be added as provider adapters later without changing dashboard presentation components.

### Edge Cases

- No employees exist yet: dashboard shows empty employee sections and still renders company/project sections where available.
- No projects exist yet: dashboard shows empty project and progress sections without errors.
- Employees exist but no current task is available: dashboard treats the employee as unassigned or unavailable based on existing state.
- Office occupancy data is unavailable: occupancy section shows unavailable rather than inventing counts.
- Conversation history is unavailable: conversation summary shows no recent conversations.
- Provider returns partial data: dashboard renders available sections and clear empty states for missing sections.
- Provider refresh fails: dashboard preserves the last known snapshot only if already held by existing runtime state and shows a non-blocking unavailable state.
- Multiple providers are possible in the future: this feature still registers only Internal Simulation.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a read-only Company Dashboard that acts as an observation interface for company state.
- **FR-002**: The dashboard MUST aggregate existing simulation data and MUST NOT introduce new simulation state for presentation purposes.
- **FR-003**: The dashboard MUST use a provider abstraction so UI components depend on provider-neutral dashboard data, not on a specific provider implementation.
- **FR-004**: The feature MUST implement only the Internal Simulation provider.
- **FR-005**: The feature MUST NOT implement GitHub, Firebase, Notion, Jira, Linear, Figma, or other external integrations.
- **FR-006**: The dashboard MUST expose company health information where it can be derived from existing systems.
- **FR-007**: The dashboard MUST expose employee summary and employee state information using existing Employee AI, schedule, office, and work-simulation data where available.
- **FR-008**: The dashboard MUST expose project summary and project progress using existing project and progression systems where available.
- **FR-009**: The dashboard MUST expose current workload and office occupancy using existing employee, task, schedule, and office layout data where available.
- **FR-010**: The dashboard MUST expose current bottlenecks and risks as derived observations from existing employee/project/progression signals where available.
- **FR-011**: The dashboard MUST expose recent company activity and recent conversations summary from existing activity/conversation systems where available.
- **FR-012**: The dashboard MUST support a short company summary derived from provider data without adding new external AI integration in this feature.
- **FR-013**: The dashboard MUST automatically update when the underlying simulation/provider snapshot changes.
- **FR-014**: The dashboard MUST provide clear empty or unavailable states when source data for a section does not exist.
- **FR-015**: The dashboard MUST be designed so future influence, management, dialogue, memory, and external connector systems can be added without rewriting the read-only observation foundation.

### Non-Goals

- No task assignment.
- No management actions.
- No editing.
- No dialogue.
- No project control.
- No direct employee control.
- No new simulation state.
- No external integrations.
- No connector authentication.
- No save/load changes unless an existing system already requires them for read-only state.

### Key Entities

- **Company Dashboard Snapshot**: Provider-neutral read model containing company overview sections for the current moment.
- **Dashboard Provider**: Interface that supplies dashboard snapshots from a source system.
- **Internal Simulation Provider**: The only provider implemented in this feature; derives snapshots from existing simulation systems.
- **Company Health Summary**: Derived company-level status, productivity, risk, and bottleneck summary.
- **Employee Dashboard Summary**: Derived employee counts, roles, AI states, current tasks, workload, mood where available, and occupancy contribution.
- **Project Dashboard Summary**: Derived project counts, progress, active work, stalled work, and current risk indicators.
- **Company Activity Item**: Derived recent activity from existing work, project, progression, or conversation records.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can open the dashboard and identify company health, employee state, project state, and current workload within 10 seconds.
- **SC-002**: The first vertical slice contains no player actions beyond opening/closing/navigating the read-only dashboard.
- **SC-003**: The dashboard UI imports or consumes only provider-neutral dashboard contracts for rendered dashboard data.
- **SC-004**: The Internal Simulation provider can render a useful dashboard snapshot when employees and projects exist.
- **SC-005**: Empty employee, project, conversation, and occupancy states render without runtime errors.
- **SC-006**: No external provider implementation, credential flow, or network integration is added.
