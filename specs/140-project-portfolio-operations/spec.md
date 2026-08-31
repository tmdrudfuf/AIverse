# Feature Specification: Project Portfolio Operations

**Feature Branch**: `codex/140-project-portfolio-operations`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Turn the AIverse city into a practical operator-facing portfolio operations surface for multiple real software projects while preserving the pixel-art city as the primary navigation model."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read Portfolio Status In City (Priority: P1)

An operator views the city and can distinguish which project companies are active, idle, blocked, need attention, recently completed, or disconnected without opening each office.

**Why this priority**: This is the core value of turning the existing multi-project state into an operator-facing portfolio surface.

**Independent Test**: Load a city with multiple registered project companies and deterministic project-scoped runtime states; verify each building exposes the expected portfolio attention status without using global latest-run fallback data.

**Acceptance Scenarios**:

1. **Given** Project A has an implementation run, **When** the operator views the city, **Then** Project A's building is marked Active.
2. **Given** Project B has review changes requested or a blocked run, **When** the operator views the city, **Then** Project B's building is marked Needs Attention or Blocked with a concise normalized reason.
3. **Given** Project C has no active or resumable run, **When** the operator views the city, **Then** Project C's building is marked Idle.
4. **Given** Project D has a persisted completed run, **When** the operator views the city, **Then** Project D's building is marked Recently Completed.
5. **Given** a building binding references an unavailable registry project, **When** the operator views the city, **Then** that building is marked Disconnected and does not allow project mutation.

---

### User Story 2 - Select A Company For Summary (Priority: P2)

An operator selects or approaches a company building and sees a concise operations summary for that exact canonical project before entering.

**Why this priority**: Selection summary lets the operator decide which company to enter next without replacing the city with a conventional dashboard.

**Independent Test**: Select two different company buildings in sequence and verify the displayed summaries remain independently keyed by project id, including current state, run/request awareness, blocker summary, and safe entry availability.

**Acceptance Scenarios**:

1. **Given** Project B is blocked, **When** the operator selects Project B's building, **Then** the summary names Project B, shows its blocked condition, and does not show Project A's run or request details.
2. **Given** Project A has an active run and Project B has a prepared request, **When** each building is selected, **Then** each summary shows only that project's request/run indicator.

---

### User Story 3 - Filter Portfolio Companies (Priority: P3)

An operator applies lightweight city filters to emphasize or navigate project companies by portfolio status without mutating execution state.

**Why this priority**: Filtering helps operators find attention states while preserving the mouse-driven city experience and avoiding a permanent dashboard layout.

**Independent Test**: Apply each filter category and verify only matching buildings are selected/emphasized while the underlying project registry, requests, and run records remain unchanged.

**Acceptance Scenarios**:

1. **Given** the city contains Active, Idle, Blocked, Completed, and Disconnected companies, **When** the operator selects the attention filter, **Then** only Needs Attention or Blocked companies are emphasized.
2. **Given** a filter is changed, **When** the change completes, **Then** no project execution, request, blocker, or registry state is mutated.

---

### User Story 4 - Re-enter Exact Project Context (Priority: P4)

An operator enters one company, returns to the city, then enters another company, and each office reconnects to the exact selected project context.

**Why this priority**: Portfolio operations must preserve Spec 139 isolation and must not introduce another competing selected-project source of truth.

**Independent Test**: Enter Project A, return to city, enter Project B, return, and re-enter Project A; verify office Project Status, live NPC visualization, development request surface, and active/resumable ADOS state match the selected canonical project each time.

**Acceptance Scenarios**:

1. **Given** Project A and Project B have different run states, **When** the operator enters Project B after visiting Project A, **Then** the office uses Project B's canonical project id and Project B's state.
2. **Given** the operator returns to Project A after visiting Project B, **When** Project A's office opens, **Then** Project A's request/run/blocker state is restored without contamination from Project B.

### Edge Cases

- A building binding points to a project id missing from the registry.
- A registered project has no local repository binding or validated project identity.
- Multiple projects have runtime records with different timestamps, including a newer run on a different project.
- A project has a prepared request but no started ADOS run.
- A project has a completed persisted run and no current active run.
- Browser session state is restored after reload with stale or unavailable project identities.
- A blocked state includes long raw diagnostics; the city must show only concise normalized reason text.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST derive a project-neutral portfolio summary for each city company from canonical registered project and project-scoped runtime state.
- **FR-002**: Each portfolio summary MUST include project id, display/company identity, binding status, current operational stage, active or resumable run id when available, development request summary when available, blocked reason summary when available, most recent completed state when available, and whether operator action is available.
- **FR-003**: System MUST map project-scoped workflow stages to deterministic attention states: Active, Idle, Needs Attention, Blocked, Recently Completed, and Disconnected.
- **FR-004**: System MUST classify implementation, validation, review, publication, and preparation as Active unless real blocked/failure state requires Needs Attention or Blocked.
- **FR-005**: System MUST classify no active or resumable run as Idle.
- **FR-006**: System MUST classify completed persisted run state as Recently Completed.
- **FR-007**: System MUST classify missing or unavailable project binding/registry state as Disconnected and fail closed for mutation availability.
- **FR-008**: City buildings MUST show subtle visual status treatment that supports navigation without replacing the pixel-art city with a dashboard.
- **FR-009**: Selecting or approaching a company MUST expose a concise operations summary derived from the same canonical project-scoped source of truth used by the office.
- **FR-010**: Portfolio filtering MUST support all, active, needs attention or blocked, idle, completed, and disconnected categories.
- **FR-011**: Portfolio filtering MUST affect only visibility, emphasis, or navigation and MUST NOT mutate project execution, request, blocker, registry, or binding state.
- **FR-012**: Entering a company from portfolio operations MUST pass the selected canonical project id and binding metadata into the existing office context.
- **FR-013**: Office Project Status, NPC live visualization, development request surface, and active/resumable ADOS execution MUST remain project-scoped after re-entry.
- **FR-014**: Development request awareness MUST show only safe short indicators or summaries in the city and keep full request interaction inside the project office.
- **FR-015**: Blocked project attention MUST expose concise normalized reasons tied to actual persisted workflow state, without dumping raw logs.
- **FR-016**: Portfolio aggregation MUST NOT use global latest-run fallback behavior, display-name guessing, or silent substitution of another registered project.
- **FR-017**: Browser reload MUST preserve project associations and project-scoped operational classifications.
- **FR-018**: The feature MUST remain human-operated and MUST NOT generate requirements, start ADOS runs, switch projects, or choose tasks autonomously.
- **FR-019**: Runtime visual evidence MUST demonstrate multiple simultaneous project-company states, selecting one company, entering it, returning, and preserving isolation.

### Key Entities *(include if feature involves data)*

- **Portfolio Summary**: A per-company operator summary derived from canonical project registry, binding, request, run, blocker, and completed-state records.
- **Attention State**: Operator-facing status category layered on detailed workflow stage.
- **Portfolio Filter**: Non-mutating view selection category used to emphasize or navigate city companies.
- **Company Selection Summary**: Concise city-level summary for the selected building and its canonical project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a deterministic fixture containing at least four companies, the operator can identify Active, Idle, Needs Attention or Blocked, and Recently Completed or Disconnected states from the city view.
- **SC-002**: All required status mapping cases are covered by automated tests, including active, blocked/review-change, idle, completed, disconnected, cross-project isolation, latest-run contamination prevention, filtering, selection, re-entry, reload, request awareness, and no-mutation aggregation.
- **SC-003**: Selecting a company displays the correct canonical project summary on the first selection attempt.
- **SC-004**: Entering Project A, visiting Project B, and re-entering Project A preserves each project's state with no cross-project contamination.
- **SC-005**: The city remains primarily a pixel-art management environment with compact cues and no conventional dashboard replacement.

## Assumptions

- Existing Spec 135-139 services remain the source of truth for registry, binding, office session persistence, project-scoped development request state, ADOS run state, and live agent visualization.
- Filters may reset after browser reload unless preserving them is simple and does not introduce duplicated execution state.
- Runtime visual evidence may use deterministic safe fixtures and must not start real ADOS execution.
