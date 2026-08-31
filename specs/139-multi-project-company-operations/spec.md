# Feature Specification: Multi-Project Company Operations

**Feature Branch**: `codex/139-multi-project-company-operations`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Extend AIverse from a single currently-entered project company into a multi-project AI company operations environment where each registered city company displays and restores its own real ADOS workflow state without cross-project leakage."

## User Scenarios & Testing

### User Story 1 - See Independent Company Operations (Priority: P1)

An operator views the city and can tell that different project companies are in different operational states.

**Why this priority**: The city must stop presenting every bound company as the same static active company; this is the missing product surface.

**Independent Test**: With Project A in implementation and Project B in review, the city representation shows implementation for A and review for B at the same time.

**Acceptance Scenarios**:

1. **Given** two bound companies with different persisted ADOS states, **When** the city renders, **Then** each building shows its own status derived from its bound project.
2. **Given** Project A has a newer run than Project B, **When** the city renders Project B, **Then** Project B uses only Project B state and never falls back to Project A's run.

---

### User Story 2 - Preserve State While Switching Companies (Priority: P2)

An operator enters Company A, returns to the city, enters Company B, then returns to Company A and sees the correct state restored each time.

**Why this priority**: Multi-project operations are only useful if city-to-office navigation preserves identity and run context.

**Independent Test**: Switching A to B to A restores the correct office/run/request/NPC state for each bound project.

**Acceptance Scenarios**:

1. **Given** Company A has an implementation request and Company B has a review run, **When** the operator switches between buildings, **Then** each office shows only that company's project state.
2. **Given** the browser reloads after project states are persisted, **When** the city renders again, **Then** company-project associations and statuses remain correct.

---

### User Story 3 - Fail Closed for Blocked, Complete, and Disconnected Projects (Priority: P3)

An operator can distinguish blocked, complete, idle, and unavailable companies without any project contaminating another.

**Why this priority**: Recovery and completion states must be truthful and scoped so the operator does not mutate the wrong project.

**Independent Test**: A blocked Project A marks only Company A as blocked, a complete Project B clears active visual treatment only for B, and an unavailable binding disables mutation for that company.

**Acceptance Scenarios**:

1. **Given** a bound project is removed from the registry, **When** its building renders, **Then** it shows disconnected/unavailable and mutation is disabled.
2. **Given** Project A is complete and Project B is active, **When** the city and offices render, **Then** only Project A shows completion and active work clears only for Project A.

### Edge Cases

- A building binding references a project id that is no longer registered.
- A registered project has no run or request while another project has an active run.
- Persisted status exists under a different project id than the building's bound project id.
- A project is blocked because validation, review, recovery, runtime, or publication failed.
- A project has a completed run but retains durable request/run history.

## Requirements

### Functional Requirements

- **FR-001**: System MUST use canonical project ids from the existing registry and company binding when deriving city, office, request, run, NPC, and Project Status state.
- **FR-002**: Each bound city company MUST expose one concise operational status from its own persisted project state.
- **FR-003**: City statuses MUST distinguish idle, preparing, implementation, validation, review, publication, blocked, complete, and disconnected/unavailable.
- **FR-004**: System MUST NOT use a global latest ADOS run as fallback for a company with missing project-specific state.
- **FR-005**: Entering a company MUST restore that company's development request, prepared/executing run, live agent visualization, and Project Status state.
- **FR-006**: Development request text, requirements artifact, prepared feature identity, target path, and run id MUST remain project-scoped.
- **FR-007**: Blocked and recovery reasons MUST stay associated with the correct project and be concise in city view.
- **FR-008**: Complete project runs MUST clear stale active work visualization for only that project while retaining history.
- **FR-009**: Unavailable or removed project bindings MUST show disconnected/unavailable, disable mutation, and never substitute another project.
- **FR-010**: Runtime city state MUST represent at least two distinct company statuses correctly for visual verification.

### Key Entities

- **Project Company Binding**: Associates a city building/company with one canonical registered project id.
- **Project Operational Status**: A concise project-scoped status for city and office surfaces.
- **Development Request Draft**: Project-scoped operator request and generated requirements artifact metadata.
- **ADOS Run Record**: Project-scoped prepared, active, blocked, or completed ADOS execution state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At least two city companies can visibly show different operational statuses in one city render.
- **SC-002**: Switching Company A to Company B to Company A restores the expected project state every time in deterministic tests.
- **SC-003**: A project with no run remains idle even when another registered project has a newer active run.
- **SC-004**: A removed or unavailable project binding is represented as disconnected and cannot be used for mutation.
- **SC-005**: Runtime visual verification demonstrates distinct project-scoped city statuses and matching office states.

## Assumptions

- Existing Spec 135, 136, 137, and 138 systems remain the source of office rendering, live visualization, binding, and ADOS execution behavior.
- The city status treatment is secondary visual information attached to buildings, not a dashboard replacement.
- Real concurrent child-process execution may be constrained by ADOS policy, but persisted project-scoped run records must coexist.
