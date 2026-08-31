# Feature Specification: In-Office Development Request

**Feature Branch**: `codex/138-in-office-development-request`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Allow a user inside a bound project company office to submit a real development request for that active registered project, preserve full authoritative requirements, start the trusted ADOS execution path, and show real run progress without cross-project leakage or simulated state."

## User Scenarios & Testing

### User Story 1 - Submit Bound Project Request (Priority: P1)

A user enters a registered project company's office, opens the project development surface, reviews the displayed target identity, submits a development request, and sees a real ADOS run accepted for that same project.

**Why this priority**: This is the core product goal and the main cross-project safety boundary.

**Independent Test**: Enter Company A, create and submit a request, and verify the accepted run records Company A's project id, identity, full request text, durable requirements artifact, and run id.

**Acceptance Scenarios**:

1. **Given** the user is inside Company A with a valid bound project, **When** the development request is prepared and submitted, **Then** execution targets Company A's registered project and never a stale or globally latest project.
2. **Given** a previous portal selection points at Project B, **When** the user submits from Company A's office, **Then** the request and run remain bound to Project A.
3. **Given** the bound project is unavailable or invalid, **When** the user opens the development request surface, **Then** submission is disabled and no replacement project is used.

---

### User Story 2 - Persist and Reconnect Real Run State (Priority: P2)

A user who leaves or reloads AIverse can return to the office and see the submitted request, associated ADOS run identity, and current real progress.

**Why this priority**: Browser-only state or fake progress would make the workflow unreliable after launch.

**Independent Test**: Submit a request, restore persisted office state, and verify Project Status and live visualization derive from the stored real run records.

**Acceptance Scenarios**:

1. **Given** a request has an accepted run id, **When** the office state is restored, **Then** Project Status reconnects to the same run instead of requiring duplicate submission.
2. **Given** a real run reaches blocked, review, validation, publication, or complete state, **When** Project Status and live visualization render, **Then** they display that actual state without fabricated percentages.

---

### User Story 3 - Prevent Unsafe or Duplicate Execution (Priority: P3)

The request flow fails safely when runtime prerequisites are unavailable, when a conflicting active run exists, or when the user repeats the submit action.

**Why this priority**: Real repository mutation must be explicitly requested, non-conflicting, and shell-safe.

**Independent Test**: Exercise missing runtime, active conflict, compatible existing run, duplicate submit, and hostile request text cases and verify deterministic non-duplicating outcomes.

**Acceptance Scenarios**:

1. **Given** a request is already pending or accepted, **When** submit is pressed again, **Then** no duplicate run is spawned and the existing request/run identity remains visible.
2. **Given** ADOS/runtime/project configuration is unavailable, **When** submission is attempted, **Then** the UI reports a blocked or failed state and does not claim work started.
3. **Given** the request text contains shell metacharacters, **When** execution is prepared, **Then** the text is preserved only as requirements content and never becomes shell syntax.

### Edge Cases

- Bound project id exists in office context but no registered project is available.
- Local project path or trusted runtime configuration is missing.
- Existing active run conflicts with a new request for the same project.
- Existing compatible run can be reused according to ADOS duplicate/resume semantics.
- User reloads after request preparation, after accepted start, after blocked state, and after completion.
- Employees assigned to other projects exist while the active office project has its own workers or shared workers.

## Requirements

### Functional Requirements

- **FR-001**: The development request target MUST be derived from the active project-company context when present.
- **FR-002**: The request flow MUST NOT target a globally latest project, globally latest run, stale portal selection, hidden fallback, or arbitrary project list order.
- **FR-003**: The target identity MUST be displayed before execution, including company/project display name, registered project identity, and readable local project path.
- **FR-004**: If the active bound project is unavailable or invalid, execution MUST be disabled and no substitute project may be used.
- **FR-005**: A durable development request record MUST include target project id, request text, project/company context, creation/update identity, execution status, and associated ADOS run id when available.
- **FR-006**: Full request text MUST be preserved into authoritative requirements for ADOS and MUST NOT be reduced to only a short title.
- **FR-007**: Requirements artifacts MUST be tied to the specific request and target project and stored outside the target primary checkout unless ADOS durably copies them before execution.
- **FR-008**: The execution system MUST derive a non-hard-coded feature/spec identity for the target project and fail safely on collision or invalid identity.
- **FR-009**: Trusted local execution MUST use structured process invocation and MUST NOT interpolate raw request text into shell command syntax.
- **FR-010**: Submitting a request MAY start the explicitly requested ADOS run, but the system MUST NOT introduce unrelated autonomous background feature creation.
- **FR-011**: Existing ADOS concurrency and active-worktree protections MUST be respected; conflicting active runs must block and compatible resumable runs must remain deterministic.
- **FR-012**: Duplicate submit attempts MUST NOT spawn duplicate identical runs.
- **FR-013**: Project-specific mutation actions in an active office context MUST be scoped to that active project and make their target explicit.
- **FR-014**: Spec 136 live visualization MUST derive from persisted real run state for the submitted request, not a simulated pipeline.
- **FR-015**: Project Status MUST show concise real request/run information including feature/request title, spec identity, stage, run state, blocked reason, run id, and completion where available.
- **FR-016**: The UI MUST distinguish ready, submitting/preparing, accepted/started, already-active/conflict, blocked, failed to start, and completed states.
- **FR-017**: Reload or re-entry MUST reconnect to persisted run/request state.
- **FR-018**: Employees explicitly assigned to another project MUST NOT be selected as active workers for the entered project when project-scoped employees are available.
- **FR-019**: Unassigned/shared employees MUST follow deterministic safe behavior and not create cross-project duplicates.
- **FR-020**: Existing project portal, Spec 135 office, and Spec 137 binding behavior MUST remain intact.

### Key Entities

- **Development Request**: User-entered work request for one target project, including full request text, context, status, timestamps, durable requirements artifact, and ADOS run identity.
- **Target Project Identity**: Display and execution identity for the active project/company, including registry id, display name, company name, and local path.
- **Authoritative Requirements Artifact**: Durable external requirements document bound to a request and project.
- **ADOS Run**: Trusted execution record associated with a request and target project.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In 100% of tested bound-company submissions, the recorded target project id equals the active company project id.
- **SC-002**: In 100% of duplicate-submit tests, only one run identity is associated with the request.
- **SC-003**: In 100% of hostile request text tests, the full text appears in requirements content and never in command arguments.
- **SC-004**: Users can identify the target project and local path before submission in one portal/status view.
- **SC-005**: After reload in supported persisted-state scenarios, the same request and run identity are visible without resubmission.

## Assumptions

- The existing project registry and active project-company context from Spec 137 are the authoritative source of project binding.
- The existing trusted local runtime provider remains the execution boundary.
- Browser state persists request metadata/content for re-entry, but trusted local execution must materialize a real request-bound requirements file at the prepared requirements path before spawning ADOS. Browser-only execution remains blocked when that trusted filesystem/runtime boundary is unavailable.
