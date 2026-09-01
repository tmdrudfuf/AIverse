# Feature Specification: Ready Task to Development Request Execution Bridge

**Feature Branch**: `codex/142-ready-task-to-development-request-execution`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Connect the Spec 141 project-scoped backlog foundation to the Spec 138 safe development request and ADOS execution workflow so an operator can explicitly select a Ready backlog task in the correct real project company, review the exact project/task target, and start development without automatic execution."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Ready Task Preview (Priority: P1)

An operator enters a real project company office, opens the planning backlog, selects a Ready backlog task, and sees a preview of the exact task and canonical project target without causing execution or mutation.

**Why this priority**: Human control and safe task targeting are the minimum viable bridge. Ready tasks must never execute merely because they are selected or viewed.

**Independent Test**: Create a Ready task for Project A, select it in Project A's backlog, and verify no development request, ADOS preparation, ADOS execution, source mutation, or in-progress planning status is created.

**Acceptance Scenarios**:

1. **Given** a Ready task belongs to Project A, **When** the operator selects it in Project A's office backlog, **Then** the preview shows Project A identity, task title, full request text, priority, current status, and active-run awareness.
2. **Given** a Ready task is selected, **When** the operator takes no explicit start action, **Then** no development request, requirements artifact, ADOS run, or task status mutation occurs.

---

### User Story 2 - Start Task Development Explicitly (Priority: P1)

An operator reviews the selected Ready task confirmation and chooses Start Development to create a project-scoped development request, durable requirements artifact, ADOS preparation, and trusted ADOS execution for the same canonical project.

**Why this priority**: The feature's purpose is to bridge backlog planning to real development execution while preserving the Spec 138 safety path.

**Independent Test**: Start Project A's Ready task and verify the resulting development request, requirements artifact, preparation, execution result, and task association all carry Project A and the source backlog task id with full task content.

**Acceptance Scenarios**:

1. **Given** a Ready task has non-empty title and description and Project A is registered and available, **When** the operator chooses Start Development, **Then** a Spec 138 development request is created for Project A with the source backlog task id and the full task title/description.
2. **Given** the development request is accepted for execution, **When** ADOS preparation and trusted execution begin, **Then** durable associations persist task id, canonical project id, development request id, preparation id, and run id when known.
3. **Given** task text contains quotes, newlines, shell characters, PowerShell syntax, or code blocks, **When** development starts, **Then** that text remains data in the durable requirements artifact and is not embedded in unsafe shell arguments.

---

### User Story 3 - Reconnect Existing Task Execution (Priority: P2)

An operator reloads the browser or re-enters the office and sees the selected task reconnected to its exact development request and execution state without relaunching or guessing from the latest run.

**Why this priority**: Durable project-scoped association is required for trust across real multi-project work.

**Independent Test**: Persist a task-to-request-to-run association, restore the session, and verify the task shows its associated execution state without invoking the execution service again.

**Acceptance Scenarios**:

1. **Given** Project A task A1 is associated with run RA and Project B task B1 is associated with run RB, **When** the operator switches companies or reloads, **Then** each task reconnects only to its own project-scoped association.
2. **Given** a task already has an active or accepted execution association, **When** the operator clicks Start Development repeatedly or after reload, **Then** the existing association is reused and no duplicate request or run is launched.

---

### User Story 4 - Truthful Execution State Awareness (Priority: P3)

An operator can distinguish planning state from real execution state in the office and concise portfolio/project summaries.

**Why this priority**: Operators need status awareness without collapsing backlog planning statuses into ADOS runtime statuses.

**Independent Test**: Seed associated Started, Completed, and Blocked execution states and verify the UI distinguishes planning Ready/In Progress/Blocked from execution Started/Complete/Blocked without incorrectly marking completion from request creation or preparation alone.

**Acceptance Scenarios**:

1. **Given** an associated ADOS run reaches COMPLETE, **When** the office displays the selected task, **Then** the execution appears complete and task completion is only shown when derived from the real associated run.
2. **Given** an associated ADOS run is blocked, **When** the office displays the selected task, **Then** the task remains associated with the run and the UI exposes concise execution blocked state separately from planning blocked state.
3. **Given** the portfolio view summarizes projects, **When** tasks are ready, in development, blocked, or completed, **Then** concise read-only awareness is project-scoped and does not expose full requirements or raw ADOS logs.

### Edge Cases

- Selecting a task from a different canonical project fails closed and never substitutes another project.
- Missing, unavailable, or ambiguous project registration disables Start Development and preserves backlog history safely.
- Non-Ready tasks cannot start development.
- Empty title or description cannot start development.
- Existing Spec 138 direct/manual development requests remain compatible and are not forced through backlog tasks.
- A latest global run cannot satisfy another task's association.
- Browser initialization, task creation, task Ready status changes, office entry, preview rendering, reload, or project switching never starts execution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the operator to select a backlog task from the currently active project office for preview only.
- **FR-002**: System MUST ensure only tasks belonging to the canonical active project are eligible for execution.
- **FR-003**: Selection MUST NOT create a development request, prepare ADOS, start ADOS, mutate source code, or change task status.
- **FR-004**: System MUST fail closed unless canonical project identity, project registration, task ownership, Ready status, no conflicting active execution, no existing active task execution, and non-empty task content are all proven.
- **FR-005**: Before execution, system MUST show project/company identity, canonical project id or safe display identity, task title, full request text or safe display of it, priority, current planning status, and active-run awareness.
- **FR-006**: The explicit action MUST use clear wording such as "Start Development" and MUST NOT imply execution already happened.
- **FR-007**: On explicit confirmation, system MUST create a project-scoped Spec 138 development request preserving target project id, task title, full task description, and source backlog task id.
- **FR-008**: Durable requirements content actually passed to ADOS MUST include the full operator-authored task content without truncation.
- **FR-009**: Durable artifacts and associations MUST include project id, backlog task id, development request id, preparation id when available, and ADOS run id when known.
- **FR-010**: System MUST use the existing Spec 138 trusted preparation and execution path and MUST NOT introduce a second subprocess mechanism.
- **FR-011**: Task text MUST remain data and MUST NOT be concatenated into shell commands, `Invoke-Expression`, `cmd /c`, or raw command arguments.
- **FR-012**: Execution MUST occur only after explicit operator confirmation and never from Ready status, opening/selecting a task, entering an office, reload, preview preparation, or project switching.
- **FR-013**: Once real execution is accepted, system MUST persist a project-scoped task-to-request-to-preparation-to-run association and reconnect by that association after reload.
- **FR-014**: System MUST set the backlog task to `in_progress` only after real execution acceptance is confirmed.
- **FR-015**: If preparation or execution is blocked before acceptance, system MUST preserve or restore the correct planning state and must not claim active work.
- **FR-016**: Completion awareness MUST derive from the actual associated run reaching COMPLETE, not request creation, preparation, attempted execution, validation, review, or other intermediate activity.
- **FR-017**: Blocked execution state MUST remain distinct from manually blocked planning state.
- **FR-018**: Repeated Start Development clicks or refreshes MUST NOT create duplicate development requests or ADOS runs for the same project/task accepted execution association.
- **FR-019**: Project isolation MUST prevent Project A tasks from creating Project B requests, reusing Project B artifacts/runs, displaying Project B execution state, or mutating Project B repositories.
- **FR-020**: Office integration MUST reuse the existing planning/development surfaces without requiring manual copy/paste from backlog to development request text.
- **FR-021**: Portfolio awareness MAY show concise read-only project-scoped execution indicators and MUST NOT expose full requirements or raw ADOS logs.
- **FR-022**: Reload and office re-entry MUST reconnect existing associations without restarting execution.
- **FR-023**: If the registered project becomes unavailable, system MUST show unavailable/disconnected, disable Start Development, preserve history, and never guess another target.
- **FR-024**: Existing Spec 138 direct/manual development request flow and Specs 139-141 project isolation behavior MUST remain compatible.

### Key Entities

- **Backlog Task Execution Selection**: Preview state for the selected project-scoped backlog task, including eligibility and active-run awareness.
- **Backlog Task Execution Association**: Durable project-scoped relationship among backlog task id, canonical project id, development request id, preparation id, and ADOS run id.
- **Development Request From Task**: Spec 138 request created from a Ready backlog task that preserves full task title, description, source task id, and canonical project target.
- **Durable Requirements Artifact**: File-backed authoritative requirements content passed to ADOS, including full task content and association metadata.
- **Execution Awareness**: Read-only state derived from the associated real ADOS run and kept separate from planning status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In deterministic runtime evidence, selecting a Ready task creates zero development requests, preparations, executions, repository mutations, and planning status changes.
- **SC-002**: In deterministic tests, 100% of task-started development requests retain the same canonical project id and source backlog task id.
- **SC-003**: In deterministic tests, full multiline task descriptions including shell-like text appear in durable requirements content and never appear in provider command arguments.
- **SC-004**: Repeated Start Development for the same accepted project/task association creates no more than one development request and no more than one ADOS run.
- **SC-005**: Browser reload or office re-entry reconnects the existing task association in 100% of covered scenarios and invokes no new execution.
- **SC-006**: Cross-project isolation tests demonstrate Project A tasks cannot connect to Project B requests, artifacts, runs, or repository targets.

## Assumptions

- Existing project registry, project company binding, backlog persistence, Spec 138 development request, ADOS preparation, trusted execution, Project Status, live agent visualization, and portfolio aggregation services remain available for composition.
- The direct Spec 138 development request path remains a valid operator path separate from backlog task execution.
- If automatic completed-state synchronization would risk false completion, the implementation will prefer truthful execution-complete awareness over mutating planning status.
- Full ADOS validation and independent Claude review are performed by ADOS after this implementation runtime.
