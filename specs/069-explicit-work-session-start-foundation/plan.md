# Implementation Plan: Explicit Work Session Start Foundation

**Branch**: `codex/069-explicit-work-session-start-foundation` | **Date**: 2026-07-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/069-explicit-work-session-start-foundation/spec.md`

## Summary

Add a provider-neutral explicit start layer that consumes existing ProjectTasks, confirmed assignment records, prepared work-session records, employees, and active WorkSession snapshots. The implementation will create deterministic active-session records and start results after a distinct human command, update the task to `In Progress` and employee to logical `Working` only on success, preserve preparation and assignment history, and keep all agent execution, subprocess, repository, and GitHub mutation flags false.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/React/Phaser application

**Primary Dependencies**: Existing office domain services, `ProjectTask`, employee registry, Spec 067 confirmed assignments, Spec 068 prepared work sessions, `WorkSession`, dashboard view tests, Vitest

**Storage**: Local in-memory controller state only; no Firebase, browser storage, file-system runtime writes, GitHub, or remote persistence

**Testing**: Vitest focused unit/controller/view tests, full `npm test`, TypeScript, build, diff checks

**Target Platform**: Existing browser game/runtime dashboard

**Project Type**: Single web application

**Performance Goals**: Deterministic synchronous start validation over current in-memory project collections; no network calls or subprocesses

**Constraints**: Explicit human start only, no AI runtime invocation, no subprocess spawning, no repository mutation, no GitHub mutation, no employee movement, no task completion, no durable persistence

**Scale/Scope**: One active session per prepared session in the current controller session

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; this plan defines source ownership, validation, and architectural fit before implementation.
- Tasks gate implementation: pending; implementation starts only after `tasks.md`.
- Preserve application stability: passed; changes are scoped to a focused active-session start module plus narrow controller/view integration.
- Validation required: passed; focused and full validation commands are listed below.

## Project Structure

### Documentation (this feature)

```text
specs/069-explicit-work-session-start-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- active-work-session-start.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- active-work-sessions/
|   |-- ActiveWorkSessionTypes.ts
|   |-- ActiveWorkSessionTypes.test.ts
|   |-- ActiveWorkSessionStartService.ts
|   |-- ActiveWorkSessionStartService.test.ts
|   |-- ActiveWorkSessionView.ts
|   `-- ActiveWorkSessionView.test.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.issue-sync.test.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: A new `active-work-sessions/` sibling module keeps the explicit start boundary separate from prepared-session creation, confirmed assignment, project promotion, and legacy placeholder work simulation. It reuses the existing `WorkSession` shape rather than introducing a second active-session domain.

## Existing WorkSession Reuse

The active session model extends the existing `WorkSession` data shape through a provider-neutral local record with:

- deterministic ID;
- status `running`;
- provider `placeholder`;
- prepared-session and confirmed-assignment provenance;
- explicit booleans showing execution and mutations remain false.

The existing `workSessions` state remains the source used by dashboard and simulation summaries for active work visibility.

## Start Eligibility

Start succeeds only when:

- request project, ProjectTask ID, and prepared-session ID are present;
- task collection exists for the same project;
- ProjectTask exists, belongs to the project, is `Todo`, has `assigneeId`, and is not completed or cancelled;
- prepared session exists, belongs to the same project/task, has status `Prepared`, is inactive, and has all execution and mutation flags false;
- confirmed assignment exists, belongs to the same project/task/employee, is human-confirmed, and matches the prepared session;
- employee exists, is `Idle`, matches the task, assignment, and prepared session, and has no conflicting active task/session;
- active-session store and result store are available;
- no active session already exists with conflicting provenance.

Repeated starts return `AlreadyStarted` only after the same current-state validation passes.

## State Transition Policy

On successful start:

- create one active work-session record in `workSessions[projectTaskId]`;
- transition the selected ProjectTask from `Todo` to `In Progress`;
- preserve task title, description, priority, provenance, and assignee fields;
- update employee `status` to `Working`, `assignedTaskId` to the task ID, and `currentProjectId` to the project ID;
- record one non-duplicated `work_started` task activity;
- preserve prepared-session and confirmed-assignment records unchanged;
- keep `executionStarted`, `agentStarted`, `repositoryMutationStarted`, and `githubMutationStarted` false.

## Identity, Idempotency, and Atomicity

Active session ID policy:

```text
<projectId>:work-session:<projectTaskId>:<preparedSessionId>:active-session-v1
```

Start result ID policy:

```text
<projectId>:work-session-start-result:<projectTaskId>:<preparedSessionId>:active-session-v1
```

The service stages validation before mutation and returns a copied task collection, employee list, active-session records, and result. Controller state is updated only after a successful atomic outcome or a safe result write. Failed validation changes no task, employee, prepared-session, assignment, repository, or GitHub state.

## Controller Integration

The controller adds one explicit start command after preparation is already complete. It must not combine approval, promotion, assignment confirmation, preparation, and start in one input event. It revalidates current state, stores start results by project, updates task and employee collections only on successful start, preserves stale-project guards, and refreshes dashboard rows.

## UI Strategy

Dashboard priority becomes:

1. critical project rows
2. issue list and detail
3. active ProjectTask details
4. active work-session rows
5. Candidate Task rows
6. assignment recommendation rows
7. promotion rows
8. confirmed assignment rows
9. preparation rows

Active-session rows use bounded, one-line text with wording such as `Work session active`, `Work started`, `Agent execution not started`, and `No repository mutation`.

## Validation Strategy

- Focused tests:
  - `npx vitest run src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionTypes.test.ts`
  - `npx vitest run src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.test.ts`
  - `npx vitest run src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionView.test.ts`
  - `npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`
  - `npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- Full validation:
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run build`
  - `git diff --check`
  - `git diff --cached --check`

## Complexity Tracking

No constitution violations.
