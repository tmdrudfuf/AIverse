# Feature Specification: AI-Assisted Project Backlog Suggestions

**Feature Branch**: `codex/143-ai-assisted-project-backlog-suggestions`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Spec 143 - AI-assisted backlog suggestion generation for each real registered project, using only project-scoped trusted context, with explicit operator request, review, accept/reject, persistence, and strict no-execution safety boundaries."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request Project Suggestions (Priority: P1)

An operator reviewing a real registered project can explicitly ask AIverse to suggest a small set of concrete next backlog tasks for that project.

**Why this priority**: This is the core value: helping the operator answer what the project should work on next without automatically changing project state.

**Independent Test**: Select a registered project, click a suggestion generation control, and verify proposed candidates appear only after the click.

**Acceptance Scenarios**:

1. **Given** a registered project with scoped backlog and project state, **When** the operator requests suggestions, **Then** the system shows up to 3 validated proposed suggestions for that same project.
2. **Given** a project is opened or reloaded, **When** no suggestion control is clicked, **Then** no AI suggestion generation occurs.

---

### User Story 2 - Review Accept Or Reject Suggestions (Priority: P2)

An operator can inspect each proposed suggestion, reject unwanted suggestions, or accept a suggestion into the existing project backlog after optionally editing its title, details, and priority.

**Why this priority**: AI output must remain advisory until the operator confirms the task.

**Independent Test**: Generate suggestions, edit and accept one, reject another, and verify only the accepted one becomes a backlog task in non-executing backlog status.

**Acceptance Scenarios**:

1. **Given** a proposed suggestion for Project A, **When** the operator accepts it with edited text, **Then** a Spec 141 backlog task is created under Project A using the edited text and remains in backlog status.
2. **Given** a proposed suggestion, **When** the operator rejects it, **Then** no backlog task is created.

---

### User Story 3 - Preserve Multi-Project Isolation (Priority: P3)

An operator can switch between multiple registered projects and see separate suggestion histories that never leak context, suggestions, or accepted tasks across projects.

**Why this priority**: The feature is unsafe if Project A context can influence Project B prompts or backlog mutations.

**Independent Test**: Generate suggestions for Project A and Project B, accept one for A, reject one for B, reload, and verify persisted state remains project-scoped.

**Acceptance Scenarios**:

1. **Given** Project A and Project B have distinct backlog/project context, **When** suggestions are generated for Project B, **Then** Project A backlog and suggestion context are absent from Project B prompt/input.
2. **Given** Project A has accepted and proposed suggestions, **When** the operator switches to Project B or reloads, **Then** Project A suggestions and accepted tasks do not appear under Project B.

### Edge Cases

- Project identity cannot be resolved to a bound registered project: fail closed and do not generate or accept suggestions.
- AI output contains malformed or empty candidates: reject malformed entries and preserve valid entries.
- AI output duplicates same-project backlog, ready, in-progress, blocked, completed, accepted, or rejected work: filter duplicate proposed candidates and prevent duplicate acceptance.
- Project has active or blocked ADOS execution: suggestions remain advisory future work and do not mutate execution state.
- Reload or re-entering a project with persisted suggestions: restore project-scoped suggestion state without regeneration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate suggestions only after explicit operator action for the current canonical registered project.
- **FR-002**: System MUST fail closed when the project id cannot be proven through existing registered project and company binding state.
- **FR-003**: System MUST build suggestion context only from the target project's identity, backlog, active/recent run state, blocked state, status, repository metadata, development requests, and operational state already available in AIverse.
- **FR-004**: System MUST NOT use another project's backlog, run state, repository context, suggestions, or development requests when generating, storing, displaying, accepting, or rejecting suggestions.
- **FR-005**: System MUST request a small candidate set by default, with 3 suggestions as the default count.
- **FR-006**: System MUST validate structured suggestion fields before displaying or persisting candidates.
- **FR-007**: System MUST ignore malformed candidates without corrupting valid candidates from the same response.
- **FR-008**: System MUST filter deterministic duplicates against the same project's backlog and suggestion history before presenting proposed candidates.
- **FR-009**: System MUST persist suggestion id, project id, title, details, source context summary, generated timestamp, status, and optional rationale/priority.
- **FR-010**: System MUST preserve proposed, accepted, and rejected suggestion state across reload without regenerating.
- **FR-011**: System MUST show each proposed suggestion for operator review with target project, title, details, rationale when present, and advisory priority when present.
- **FR-012**: System MUST provide Accept and Reject actions for proposed suggestions.
- **FR-013**: System SHOULD allow editing title, details, and priority before acceptance when practical.
- **FR-014**: System MUST create a real Spec 141 backlog task under the same canonical project when a suggestion is accepted.
- **FR-015**: System MUST create accepted backlog tasks in a non-executing planning status and MUST NOT mark them Ready.
- **FR-016**: System MUST NOT invoke Spec 142 Start Development, ADOS, review, validation, Git mutation, shell commands, publishing, merging, or deployment during suggestion generation or acceptance.
- **FR-017**: System MUST keep rejected suggestions historical/advisory and MUST NOT create backlog tasks for rejected suggestions.
- **FR-018**: System MUST prevent an accepted suggestion from creating duplicate backlog tasks on repeated accept attempts.
- **FR-019**: System MAY surface subtle portfolio advisory text such as suggestion counts, without changing the city into an AI dashboard.
- **FR-020**: Automated tests MUST cover explicit action gating, reload behavior, prompt isolation, project-scoped storage, duplicate filtering, accept/reject semantics, edit-before-accept, invalid output handling, project switching, and compatibility with existing Specs 141-142.

### Key Entities

- **Backlog Suggestion Candidate**: Advisory AI-generated proposal with id, project id, title, details, source context summary, generated timestamp, status, optional rationale, optional priority, and optional accepted backlog task id.
- **Suggestion Collection**: Project-scoped candidate list for one canonical project.
- **Suggestion Context**: Trusted, project-scoped input summary used to generate candidates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can generate and review suggestions for a selected project in one explicit action.
- **SC-002**: At least 95% of deterministic duplicate candidates in tests are filtered before presentation or duplicate acceptance.
- **SC-003**: Acceptance creates exactly one non-ready backlog task for the same project in tested scenarios.
- **SC-004**: Reload tests preserve proposed, accepted, and rejected suggestion state without additional generation calls.
- **SC-005**: Multi-project tests demonstrate two distinct projects with no cross-project prompt, display, or backlog contamination.

## Assumptions

- Existing registered project, company binding, backlog, office portal, session persistence, portfolio, and ADOS state services are available and remain canonical.
- A deterministic provider is acceptable for tests and local verification; live provider integration is not required for this implementation.
- Suggestion generation is advisory only and must not perform repository crawling or shell execution.
