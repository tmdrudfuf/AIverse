# Feature Specification: Real Project Company Binding

**Feature Branch**: `codex/137-real-project-company-binding`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Bind each AIverse project-company to a real registered software project."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter Bound Project Company (Priority: P1)

As a user viewing the AIverse city, I can enter a visible project company and know that the office represents the registered project bound to that company.

**Why this priority**: This is the core product promise: a company is a real project, not a demo-only surface.

**Independent Test**: Register or use a project-company with a known project identity, enter it from the city, and verify the office title, selected portal project, project status, and live work state all use the bound project.

**Acceptance Scenarios**:

1. **Given** a city building bound to Project A, **When** the user clicks or enters that building, **Then** the office active context resolves to Project A.
2. **Given** Project A has registered display identity and local path metadata, **When** the office renders, **Then** signage and project status use Project A identity and metadata.
3. **Given** the bound project is available, **When** portal/development actions are opened from the office, **Then** they operate against the bound project.

---

### User Story 2 - Switch Isolated Project Companies (Priority: P2)

As a user switching between companies, I see each office reflect its own project state without stale run, status, blocked, complete, or employee state leaking from another project.

**Why this priority**: Project isolation prevents misleading status and unsafe execution context.

**Independent Test**: Provide two registered project-company bindings with distinct run states, enter each one, and verify each office/dashboard/live visualization shows only that project's state.

**Acceptance Scenarios**:

1. **Given** Project A is validating and Project B has no active run, **When** the user enters Project B, **Then** Project B shows idle/no-run state and does not show Project A validation.
2. **Given** Project A is complete and Project B is reviewing, **When** the user enters Project B, **Then** Project B shows review state and not Project A complete state.
3. **Given** Project A has a blocked run, **When** the user enters Project B, **Then** Project B does not inherit Project A blocked reason.

---

### User Story 3 - Persist And Recover Bindings (Priority: P3)

As a returning user, project-company bindings survive reload and stale bindings fail safely without substituting another project's data.

**Why this priority**: Real project identity must be stable across normal app re-entry.

**Independent Test**: Persist registered project entries and bindings, reload state, resolve a company binding, then remove or invalidate a project/path and verify unavailable state is shown without fallback to another project.

**Acceptance Scenarios**:

1. **Given** a registered project-company binding has been saved, **When** the app reloads, **Then** the same company resolves to the same project id and display identity.
2. **Given** a persisted company references a missing project, **When** the office context resolves, **Then** the office reports unavailable/disconnected state without crashing.
3. **Given** a local path is stale or unavailable, **When** the project context is shown, **Then** no other project's run state is substituted.

### Edge Cases

- Bound project id no longer exists in the project registry.
- Registered local project path is missing or stale.
- ADOS status is unavailable for the bound project.
- Multiple projects have historical ADOS runs; the selected company constrains run lookup.
- Daily Proof seed data exists, but generic logic must not require or substitute Daily Proof.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each visible project company MUST resolve to exactly one registered project identity.
- **FR-002**: Company selection and office entry MUST set a single authoritative active project-company context.
- **FR-003**: Office title/signage MUST derive from the bound project's display/company identity.
- **FR-004**: Project Status MUST read state for the bound project only.
- **FR-005**: Spec 136 Live Agent Work Visualization MUST read ADOS/run state for the bound project only.
- **FR-006**: Runtime, portal, dashboard, and development actions opened from the office MUST operate against the active bound project.
- **FR-007**: The system MUST preserve registered project local path, worktree, branch, spec, and repository metadata where available.
- **FR-008**: Existing project registration data MUST participate in the binding model without a second project registry.
- **FR-009**: Bindings and registered project display identity MUST survive normal app reload/re-entry using existing persistence.
- **FR-010**: Missing projects, stale paths, and unavailable ADOS state MUST fail safely without crashing and without substituting another project.
- **FR-011**: Daily Proof MAY remain sample/default data, but generic project context logic MUST NOT hard-code Daily Proof.
- **FR-012**: Spec 135 office rendering and Spec 136 role/provider semantics MUST remain intact.

### Key Entities

- **Project Company Binding**: Stable association between a visible company/building and one registered project id.
- **Active Project Context**: The resolved project context for the office, including project id, display identity, repository/local path metadata, and availability.
- **Registered Project**: Existing canonical project registry entry used as the source of truth for project identity and metadata.
- **Bound Runtime State**: ADOS/run/live visualization state selected by active project id.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of selectable project companies resolve to one registered project id or an explicit unavailable state.
- **SC-002**: Switching between two project companies changes project status and live work state within the next office render/update cycle.
- **SC-003**: Tests prove at least two project ids cannot leak ADOS validation, review, blocked, complete, or no-run state into each other.
- **SC-004**: Persisted registered project-company identity restores after reload without manual code edits.
- **SC-005**: Missing project or stale local path scenarios do not crash the office and never show another project's state.

## Assumptions

- The existing project registry and browser session persistence remain the canonical sources for registered projects.
- The existing Spec 135 office layout is reused for multiple projects.
- Unique project-specific office art is out of scope.
- The complete in-office feature-request to new ADOS run workflow is out of scope for Spec 137.
