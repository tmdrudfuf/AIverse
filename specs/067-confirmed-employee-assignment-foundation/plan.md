# Implementation Plan: Confirmed Employee Assignment Foundation

**Branch**: `codex/067-confirmed-employee-assignment-foundation` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/067-confirmed-employee-assignment-foundation/spec.md`

## Summary

Add a synchronous, provider-neutral assignment-confirmation service that binds one available recommended employee to one existing promoted, unassigned, not-started ProjectTask after explicit human input. The feature reuses Spec 064 recommendations, Spec 066 promoted ProjectTask provenance, existing employees, existing task collections, and dashboard state. It records immutable assignment records/results, updates only the ProjectTask assignee fields, remains idempotent, and preserves the no-work-session/no-execution/no-remote boundary.

## Technical Context

**Language/Version**: TypeScript strict mode in the existing Next.js/Phaser app.

**Primary Dependencies**: No new dependencies. Reuses `tasks/`, `employees/`, `work-sessions/`, `candidate-assignments/`, `candidate-project-task-promotions/`, `OfficeProjectPortalController`, and `OfficeProjectPortalView`.

**Storage**: Existing in-memory `ProjectPortalState.taskCollections` plus new in-memory confirmed-assignment record/result state.

**Testing**: Vitest colocated tests.

**Target Platform**: Browser runtime.

**Project Type**: Client application feature in the office project portal.

**Performance Goals**: Synchronous linear validation over visible project tasks, recommendations, employees, and work sessions.

**Constraints**: Deterministic, provider-neutral, no LLM, no remote mutation, no employee movement, no work-session creation, no execution, no durable persistence.

**Scale/Scope**: Current seeded project dashboard and local issue/candidate/promotion flows.

## Constitution Check

No violations.

- Spec before code: `spec.md` and checklist are created first.
- Plan before implementation: this file defines architecture and validation.
- Tasks before implementation: `tasks.md` gates source edits.
- Scoped changes: new `confirmed-assignments/` module plus narrow portal integration.
- Validation required: focused tests and full repository checks.

## Project Structure

### Documentation

```text
specs/067-confirmed-employee-assignment-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- confirmed-employee-assignment.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- confirmed-assignments/
|   |-- ConfirmedEmployeeAssignmentTypes.ts
|   |-- ConfirmedEmployeeAssignmentTypes.test.ts
|   |-- ConfirmedEmployeeAssignmentService.ts
|   |-- ConfirmedEmployeeAssignmentService.test.ts
|   |-- ConfirmedEmployeeAssignmentView.ts
|   `-- ConfirmedEmployeeAssignmentView.test.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.issue-sync.test.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: A `confirmed-assignments/` sibling module keeps employee confirmation separate from recommendations, promotion approval, ProjectTask creation, manual task assignment, and work sessions.

## Existing Architecture Reuse

- **ProjectTask**: Reuse `ProjectTask` with `assigneeId`/`assignee` updated on confirmation. Status remains `Todo`.
- **Recommendation**: Reuse `CandidateAssignmentRecommendation` as advisory input. Only `Recommended` can pass eligibility.
- **Promotion provenance**: Reuse Spec 066 promoted-task description markers and recommendation/Candidate Task lines for deterministic validation.
- **Employee registry**: Reuse `Employee[]` from portal state. Employee IDs are canonical; display names are snapshots only.
- **Work sessions**: Reuse `workSessions` only for conflict detection. Never create a work session.

## Assignment Eligibility

Confirmation succeeds only when:

- request project, ProjectTask ID, and recommendation ID are present;
- task collection exists for the same project;
- ProjectTask exists, belongs to the project, is `Todo`, and has no assignee;
- promoted-task provenance contains a Candidate Task ID and assignment recommendation ID;
- matching recommendation exists, belongs to the same project and Candidate Task, has matching ID/provenance, and status is `Recommended`;
- recommended employee ID exists and matches the request;
- employee exists, is `Idle`, and has no conflicting `assignedTaskId`/current active task/work session;
- no existing confirmed assignment record already owns the task for another employee.

Blocked states return explicit reason codes and create no mutation.

## Recommendation Policy

- `Recommended`: eligible if all current checks pass.
- `NeedsReview`: blocked.
- `Unassigned`: blocked.
- `Unavailable`: blocked.

The recommendation never mutates tasks or employees by itself. Confirmation remains human-only.

## ProjectTask Assignee Update Policy

On successful confirmation:

- set `assigneeId` to the employee ID;
- set `assignee` to the employee name snapshot;
- preserve title, description, priority, project ID, created timestamp, and provenance;
- keep status `Todo`;
- update `updatedAt` to command timestamp;
- prepend one deterministic assignment activity if it does not already exist.

No employee status, movement, AI state, workload simulation, or work session state changes.

## Identity, Idempotency, and Atomicity

Assignment record ID:

```text
<projectId>:task-assignment:<projectTaskId>:<employeeId>:confirmed-assignment-v1
```

Result ID:

```text
<projectId>:task-assignment-result:<projectTaskId>:confirmed-assignment-v1
```

The service returns `AlreadyAssigned` for repeated confirmation of the same task/employee. It updates task and assignment record together in memory or returns a blocked result with no task change.

## Controller Integration

The controller adds assignment confirmation after ProjectTask promotion in the project-dashboard Enter path and before repository/issue sync fallback. It revalidates current state, stores result collections by project, updates task collections only on success, preserves employee/work-session state, and re-renders dashboard rows.

Project switching is guarded by selected dashboard project ID. Stale recommendations or tasks from another project are rejected.

## UI Strategy

Dashboard lower-row priority remains:

1. critical project rows
2. issue list and issue detail
3. active ProjectTask details
4. Candidate Task rows
5. assignment recommendation rows
6. promotion review rows
7. promotion result rows
8. confirmed assignment rows and assignment results

Confirmed-assignment rows are appended last, one-line bounded, and dropped first under panel pressure. Wording explicitly says `Not started` and `No work session`.

## Validation Strategy

- `npx vitest run src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentTypes.test.ts`
- `npx vitest run src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentService.test.ts`
- `npx vitest run src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Complexity Tracking

No constitution violations.
