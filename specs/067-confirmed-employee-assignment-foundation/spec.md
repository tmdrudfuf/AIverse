# Feature Specification: Confirmed Employee Assignment Foundation

**Feature Branch**: `codex/067-confirmed-employee-assignment-foundation`
**Created**: 2026-07-28
**Status**: Draft
**Input**: User request: "Spec 067 — Confirmed Employee Assignment Foundation"

## User Scenarios & Testing

### User Story 1 - Confirm a recommended employee for a promoted ProjectTask (Priority: P1)

As a human operator, I want to explicitly confirm the recommended employee for an existing promoted ProjectTask so AIverse records a confirmed assignment without starting work.

**Independent Test**: Given an unassigned `Todo` promoted ProjectTask, a matching `Recommended` assignment recommendation, and an available employee, the confirmation command records one immutable assignment, updates the ProjectTask assignee fields, leaves task status as `Todo`, creates no work session, and leaves employee execution state unchanged.

**Acceptance Scenarios**:

1. **Given** a promoted ProjectTask with valid Candidate Task provenance, **When** the human confirms the recommended employee, **Then** the ProjectTask receives the employee ID/name as assignee and remains `Todo`.
2. **Given** the same confirmation command is repeated, **When** the same task and employee are already confirmed, **Then** no duplicate record or activity entry is created and the result is `AlreadyAssigned`.

---

### User Story 2 - Block unsafe or stale assignment attempts (Priority: P1)

As a human operator, I need AIverse to block assignment confirmation when task, recommendation, employee, or project context is unsafe or stale.

**Independent Test**: Service and controller tests provide invalid inputs such as started tasks, stale recommendations, missing employees, unavailable employees, existing assignees, and project mismatches; every case returns a blocked result and mutates no task, employee, work session, or remote provider.

**Acceptance Scenarios**:

1. **Given** a recommendation with status `NeedsReview`, `Unassigned`, or `Unavailable`, **When** assignment confirmation is requested, **Then** AIverse blocks the action and preserves the unassigned ProjectTask.
2. **Given** an employee is offline, working on conflicting active work, or missing, **When** confirmation is requested, **Then** AIverse records an explicit blocked result and does not assign the task.
3. **Given** a stale recommendation from another project or Candidate Task, **When** confirmation is requested, **Then** AIverse blocks the action with a stale/project mismatch reason.

---

### User Story 3 - Display confirmed assignment state safely (Priority: P2)

As a human operator, I want the Project Dashboard to show confirmed assignment results separately from recommendations and active work so I can see that assignment is confirmed but work has not started.

**Independent Test**: Dashboard rendering tests verify `[CONFIRMED ASSIGNMENT]` or assignment result rows show safe wording, remain low priority, truncate long titles/names/reasons, support `+N more`, and do not overlap or hide existing issue/detail/task rows.

**Acceptance Scenarios**:

1. **Given** an assignment was confirmed, **When** the project dashboard renders, **Then** it shows assigned employee, assignment status, `Not started`, and `No work session`.
2. **Given** lower dashboard space is crowded, **When** rows are fit into the panel, **Then** confirmed-assignment rows drop before higher-priority issue, active task, Candidate Task, assignment recommendation, promotion review, and promotion result rows.

### Edge Cases

- A task with an existing assignee must not be silently reassigned.
- A task already in `In Progress`, `Review`, or `Done` must not receive a new confirmation.
- A missing task collection, employee registry, or assignment recommendation collection must produce `Unavailable` or blocked result.
- Two tasks with the same title must remain distinct by task ID/provenance.
- Two employees with the same display name must remain distinct by employee ID.
- Project switching must prevent stale selected dashboard rows from confirming assignments under the wrong project.
- Removed or stale recommendations must not unassign an already confirmed task and must not create a new assignment.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a provider-neutral confirmed-assignment domain model with immutable records and results.
- **FR-002**: The system MUST require an explicit human command before confirming an employee assignment.
- **FR-003**: Assignment confirmation MUST consume an existing ProjectTask, existing Candidate Assignment Recommendation, existing employee state, and promoted-task provenance.
- **FR-004**: Assignment confirmation MUST NOT create ProjectTasks, Candidate Tasks, assignment recommendations, promotion decisions, work sessions, GitHub mutations, branches, pull requests, or AI runtime executions.
- **FR-005**: Assignment confirmation MUST update only the selected eligible ProjectTask assignee fields and assignment-result state.
- **FR-006**: Confirmed assignment MUST leave the ProjectTask in a non-started status and MUST NOT mark it `In Progress`, `Review`, `Done`, `Working`, `Running`, or `Executing`.
- **FR-007**: Confirmed assignment MUST NOT mutate employee status to `Working`, start movement, create a workstation target, or start a work session.
- **FR-008**: The validator MUST block assignment unless the ProjectTask exists, belongs to the current project, is unassigned, is not completed, is not started, and carries valid promoted Candidate Task provenance where applicable.
- **FR-009**: The validator MUST require a matching same-project `Recommended` assignment recommendation for the same Candidate Task and employee.
- **FR-010**: The validator MUST block `NeedsReview`, `Unassigned`, and `Unavailable` recommendation statuses.
- **FR-011**: The validator MUST require the recommended employee to exist, be active/available, and be free of conflicting active work or active work sessions.
- **FR-012**: Assignment confirmation MUST be idempotent for the same project, ProjectTask, and employee.
- **FR-013**: The assignment record ID MUST be deterministic and MUST NOT use random UUIDs, timestamps, display order, employee display name, or array indexes.
- **FR-014**: Assignment result collections MUST be immutable or defensively copied.
- **FR-015**: Controller integration MUST revalidate eligibility at command time and protect against stale project selection.
- **FR-016**: Dashboard UI MUST distinguish recommendation, confirmed assignment, ProjectTask, and work-started states.
- **FR-017**: Dashboard UI MUST use safe wording such as `Confirm employee assignment`, `Assignment confirmed`, `Not started`, and `No work session`.
- **FR-018**: Dashboard UI MUST NOT imply work has started as a result of assignment confirmation.
- **FR-019**: Dashboard confirmed-assignment rows MUST be bounded, deterministic, and lower priority than issue/detail/task/Candidate Task/assignment/promotion rows.
- **FR-020**: Existing manual sync and dashboard controls MUST remain reachable when no valid assignment confirmation action applies.

### Key Entities

- **Confirmed Employee Assignment Record**: Immutable local record proving a human confirmed one employee for one ProjectTask. Contains project ID, task ID, employee ID/name snapshot, recommendation ID, Candidate Task provenance, status, reason codes, timestamp, and safety flags fixed to no work/execution.
- **Confirmed Employee Assignment Result**: Immutable command result for success, idempotent already-assigned, blocked, unavailable, conflict, or failed outcomes.
- **Assignment Eligibility Input**: Current ProjectTask collection, recommendation collection, employees, work sessions, and selected project/task context used for command-time validation.

## Success Criteria

- **SC-001**: Focused assignment domain/service tests cover eligibility, mapping, identity, idempotency, atomicity, employee-state safety, and immutable collections.
- **SC-002**: Controller tests prove assignment confirmation uses existing task/recommendation/employee state, requires explicit input, blocks stale project rows, and performs no GitHub/AI/work-session calls.
- **SC-003**: View tests prove safe wording, row priority, truncation, multiple results, `+N more`, and no panel overlap.
- **SC-004**: Full repository validation passes: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.
- **SC-005**: Independent Reviewer approves the exact committed HEAD before any remote mutation.

## Out of Scope

- Work-session creation, task execution, employee movement, NPC pathfinding, autonomous coding, Codex/Claude runtime invocation, GitHub mutation, issue mutation, PR/branch creation, background jobs, Firebase, durable persistence, reassignment, bulk assignment, and task completion.
