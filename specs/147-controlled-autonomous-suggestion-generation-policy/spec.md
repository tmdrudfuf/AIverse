# Feature Specification: Controlled Autonomous Suggestion Generation Policy

**Feature Branch**: `codex/147-controlled-autonomous-suggestion-generation-policy`

**Created**: 2026-09-02

**Status**: Draft

**Input**: ADOS handoff for Spec 147, Controlled Autonomous Suggestion Generation Policy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enable Auto Suggestions Per Project (Priority: P1)

An operator explicitly enables automatic AI backlog suggestion generation for one canonical registered project while other projects remain manual-only.

**Why this priority**: The primary safety requirement is deliberate, project-scoped consent with default OFF behavior.

**Independent Test**: Enable Auto Suggestions for Project A, reload the office session, and confirm Project A remains enabled while Project B remains disabled.

**Acceptance Scenarios**:

1. **Given** two registered projects with no saved Spec 147 policy, **When** the operator opens either project, **Then** Auto Suggestions is Off for both projects.
2. **Given** Project A is selected, **When** the operator enables Auto Suggestions, **Then** only Project A stores an enabled policy and Project B remains Off.
3. **Given** Spec 144, Spec 145, or Spec 146 is enabled, **When** Spec 147 is missing or disabled, **Then** Auto Suggestions remains Off.

---

### User Story 2 - Generate One Bounded Suggestion Safely (Priority: P1)

An enabled idle project may automatically trigger the existing AI backlog suggestion generation flow exactly once for a legitimate planning lifecycle event.

**Why this priority**: The feature only creates value if it safely reuses the existing Spec 143 suggestion-generation path.

**Independent Test**: With Project A enabled, connected, idle, below capacity, and cooldown clear, evaluate one event and confirm exactly the configured number of Project A suggestions are created as suggestions only.

**Acceptance Scenarios**:

1. **Given** Project A has Auto Suggestions enabled and all gates pass, **When** a bounded planning evaluation event occurs, **Then** the system invokes the existing suggestion-generation path and creates at most the configured number of suggestions for Project A.
2. **Given** Spec 145 is disabled, **When** Spec 147 generates a suggestion, **Then** the suggestion remains pending for manual review.
3. **Given** a manual suggestion request, **When** Auto Suggestions is disabled, **Then** the manual Spec 143 generation flow still works.

---

### User Story 3 - Gate Automatic Generation Deterministically (Priority: P1)

The system skips automatic generation with concise reasons when deterministic project state indicates it is unsafe or unnecessary.

**Why this priority**: Controlled automation requires fail-closed eligibility and auditability.

**Independent Test**: Evaluate disabled, disconnected, active-execution, ready-work, pending-suggestion, capacity-full, duplicate-event, and cooldown-active states and verify no provider invocation occurs.

**Acceptance Scenarios**:

1. **Given** Project A has active execution and the policy requires no active execution, **When** Auto Suggestions is evaluated, **Then** generation is skipped with an active-execution reason.
2. **Given** Project A has a Ready task and the policy requires no pending Ready task, **When** Auto Suggestions is evaluated, **Then** generation is skipped with a Ready-work reason.
3. **Given** the same event is observed repeatedly, **When** Auto Suggestions is evaluated, **Then** only one bounded evaluation can generate and subsequent observations are skipped by idempotency or cooldown.

---

### User Story 4 - Audit The Four Independent Automation Controls (Priority: P2)

The project office and portfolio make Auto Suggestions visible alongside Auto Accept, Auto Ready, and Auto Execute without combining consent.

**Why this priority**: Operators need to understand the planning-to-execution chain without a misleading single automation switch.

**Independent Test**: Toggle each of the four automation controls independently and confirm each state persists and is shown independently in the project office, while portfolio indicators are read-only.

**Acceptance Scenarios**:

1. **Given** a project office is open, **When** planning controls are visible, **Then** Auto Suggestions, Auto Accept, Auto Ready, and Auto Execute each show independent On/Off state.
2. **Given** the portfolio is viewed, **When** project summaries are rendered, **Then** Auto Suggestions status may be shown read-only and does not mutate policy.

### Edge Cases

- Missing, malformed, stale, ambiguous, or unsupported Spec 147 policy state resolves to manual suggestion generation only.
- Policy project ID, event project ID, generation target project ID, and canonical registered project must match exactly.
- Disconnected, deleted, stale, non-canonical, or unavailable projects skip generation without falling back to another project.
- Provider/runtime failure records a concise failure result, creates no suggestion or backlog work, and does not start retries recursively.
- Replayed loads, render cycles, page reloads, and duplicate lifecycle notifications do not duplicate automatic generation.
- Existing unresolved suggestions, Ready tasks, in-progress work, or configured planning capacity can block new automatic suggestions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Automatic suggestion generation MUST default Off for every canonical project until explicitly enabled by the operator.
- **FR-002**: The system MUST persist an independent Spec 147 policy per canonical project and MUST NOT use a global fallback policy.
- **FR-003**: Spec 144, Spec 145, Spec 146, manual suggestion generation, project selection, reloads, completed tasks, ADOS runs, PR merges, or office entry MUST NOT imply Spec 147 consent.
- **FR-004**: Automatic generation MUST reuse the existing Spec 143 suggestion generation flow, validation, structured suggestion representation, provider-neutral abstraction, and suggestion store.
- **FR-005**: One automatic evaluation MUST generate a bounded number of suggestions, defaulting to one and rejecting unsafe, malformed, zero, negative, or unbounded values.
- **FR-006**: Automatic generation MUST enforce a persistent per-project cooldown of at least 15 minutes by default.
- **FR-007**: Automatic generation MUST be event-driven only and MUST NOT use continuous polling, render-loop invocation, recursive retry, or self-triggered generation.
- **FR-008**: Eligibility MUST be deterministic and include policy enabled, canonical project connection, same-project ownership, cooldown, active execution gate, Ready work gate, existing eligible suggestion gate, planning capacity, duplicate protection, and valid project state.
- **FR-009**: Spec 147 MUST fail closed when active execution exists if the project policy requires no active execution.
- **FR-010**: Spec 147 MUST fail closed when Ready work or unresolved eligible suggestions exist if the project policy requires those queues to be empty.
- **FR-011**: Spec 147 MUST enforce deterministic planning-capacity limits across backlog, Ready, in-progress work, and pending suggestions.
- **FR-012**: Automatically generated AI output MUST remain untrusted suggestion data and MUST NOT be accepted, converted to backlog, promoted to Ready, executed, or sent to Spec 142/ADOS by Spec 147.
- **FR-013**: Spec 147 MUST NOT directly invoke Spec 145, Spec 146, Spec 144, Spec 142, ADOS, Codex, Claude, shell commands, Git, or GitHub.
- **FR-014**: The system MUST persist concise per-project evaluation metadata including last evaluation time, latest result, last automatic generation time when applicable, and last generated suggestion ID when available.
- **FR-015**: The system MUST expose concise operator reasons such as generated, policy disabled, cooldown active, active execution, Ready work pending, pending suggestion exists, backlog capacity reached, project disconnected, and generation unavailable.
- **FR-016**: The office UI MUST show compact project-scoped Auto Suggestions controls near existing autonomy controls and display all four controls independently.
- **FR-017**: Portfolio summaries MAY show read-only Auto Suggestions status but MUST NOT modify policy.
- **FR-018**: Runtime evidence MUST cover at least two registered project contexts and use repository-relative persisted evidence paths.

### Key Entities *(include if feature involves data)*

- **Autonomous Suggestion Generation Policy**: Project-scoped operator policy containing enabled state, bounded generation limit, cooldown, deterministic gates, planning capacity, update timestamp, operator consent marker, and evaluation metadata.
- **Automatic Suggestion Evaluation Event**: A bounded lifecycle signal for one exact project that can be evaluated once using a stable event identity.
- **Automatic Suggestion Evaluation Result**: Concise deterministic outcome explaining whether generation occurred, was skipped, or failed.
- **Backlog Suggestion Candidate**: Existing Spec 143 suggestion data that remains untrusted until later review or Spec 145 acceptance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-project runtime scenario, Project A can enable Auto Suggestions and generate exactly one suggestion while Project B remains Off and receives none.
- **SC-002**: Immediate repeated evaluation of the same event or a reload creates zero additional automatic suggestions.
- **SC-003**: All configured safety gates produce deterministic skip reasons without invoking the suggestion provider.
- **SC-004**: Automatically generated suggestions remain suggestions unless a separately enabled downstream policy acts.
- **SC-005**: Manual AI suggestion generation continues to work when Spec 147 is disabled.

## Assumptions

- The existing browser office session persistence remains the appropriate persistence mechanism for project policy and evaluation metadata.
- The existing deterministic suggestion provider used by Spec 143 tests is sufficient for runtime evidence without contacting a live external provider.
- The initial maximum automatic suggestions per evaluation is one, with an upper bound consistent with existing policy validation conventions.
- The initial planning-capacity limit counts unresolved backlog, Ready, in-progress, and proposed suggestion items.
