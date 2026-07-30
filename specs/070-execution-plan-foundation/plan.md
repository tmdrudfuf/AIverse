# Implementation Plan: Execution Plan Foundation

**Branch**: `codex/070-execution-plan-foundation` | **Date**: 2026-07-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/070-execution-plan-foundation/spec.md`

## Summary

Add a provider-neutral execution-plan layer that consumes existing ProjectTasks, confirmed assignment records, prepared work-session records, active WorkSessions, employees, repository identity/sync metadata, Spec Kit feature context, and configured role labels. The implementation will create deterministic immutable execution-plan records and results after a distinct human command, expose them on the dashboard, and keep all readiness, runtime, subprocess, repository, and GitHub mutation behavior out of scope.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/React/Phaser application

**Primary Dependencies**: Existing office domain services, `ProjectTask`, employee registry, Spec 067 confirmed assignments, Spec 068 prepared work sessions, Spec 069 active work sessions, repository identity/sync snapshots, dashboard view tests, Vitest

**Storage**: Local in-memory controller state only; no Firebase, browser storage, file-system runtime writes, GitHub, or remote persistence

**Testing**: Vitest focused unit/controller/view tests, full `npm test`, TypeScript, build, diff checks

**Target Platform**: Existing browser game/runtime dashboard

**Project Type**: Single web application

**Performance Goals**: Deterministic synchronous plan validation over current in-memory project collections; no network calls or subprocesses

**Constraints**: Explicit human plan creation only, no readiness checks, no AI runtime invocation, no subprocess spawning, no repository mutation, no GitHub mutation, no employee movement, no task status change, no durable persistence

**Scale/Scope**: One execution plan per active work session and rules version in the current controller session

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; this plan defines source ownership, validation, and architectural fit before implementation.
- Tasks gate implementation: pending; implementation starts only after `tasks.md`.
- Preserve application stability: passed; changes are scoped to a focused execution-plan module plus narrow controller/view integration.
- Validation required: passed; focused and full validation commands are listed below.

## Project Structure

### Documentation (this feature)

```text
specs/070-execution-plan-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- execution-plan.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- execution-plans/
|   |-- ExecutionPlanTypes.ts
|   |-- ExecutionPlanTypes.test.ts
|   |-- ExecutionPlanService.ts
|   |-- ExecutionPlanService.test.ts
|   |-- ExecutionPlanView.ts
|   `-- ExecutionPlanView.test.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.issue-sync.test.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: A new `execution-plans/` sibling module keeps the plan boundary separate from active-session start, prepared-session creation, confirmed assignment, promotion, and future runtime execution. It reuses existing records by reference/provenance rather than duplicating them.

## Reused Architecture

- `ProjectTask` remains the task source and is not modified by plan creation.
- Spec 064 recommendation provenance is read through active-session/assignment provenance.
- Spec 065 promotion decision identity is read through task/session provenance.
- Spec 067 confirmed assignment records remain immutable and are not rewritten.
- Spec 068 prepared-session records remain immutable and are not rewritten.
- Spec 069 active `WorkSession` records remain immutable from the plan service perspective and are not executed.
- Repository identity and repository sync snapshots provide provider-neutral repository metadata.
- Project portal controller state remains local in-memory storage.

## Plan Eligibility

Plan creation succeeds only when:

- request project, active-session ID, and ProjectTask ID are present;
- ProjectTask collection exists for the same project;
- ProjectTask exists, belongs to the project, is assigned to the active-session employee, and remains `In Progress`;
- active session exists, belongs to the project/task, is `running`, and has execution/mutation flags false;
- confirmed assignment exists and matches the active session, project, task, candidate, recommendation, promotion, and employee;
- prepared session exists and matches the active session and confirmed assignment;
- employee exists and matches the active session;
- repository identity and repository sync snapshot exist for the project;
- repository metadata includes a usable repository ID, worktree path, current branch, and clean availability state;
- spec path exists;
- implementer and reviewer role labels are configured;
- no conflicting execution plan already exists with incompatible provenance.

Repeated plan creation returns `AlreadyExists` only after the same current-state validation passes.

## State Policy

On successful plan creation:

- create one immutable execution-plan record keyed by deterministic plan ID;
- create one immutable execution-plan result;
- store both under the current project in controller state;
- leave task, employee, assignment, prepared-session, active-session, repository, and GitHub state unchanged;
- keep `executionStarted`, `runtimeStarted`, `subprocessStarted`, `repositoryMutationStarted`, and `githubMutationStarted` false.

## Identity, Idempotency, and Atomicity

Execution plan ID policy:

```text
<projectId>:execution-plan:<activeSessionId>:plan-v1
```

Execution plan result ID policy:

```text
<projectId>:execution-plan-result:<activeSessionId>:plan-v1
```

The service validates first and returns a copied plan record/result collection. Controller state is updated only after a successful atomic outcome or a safe blocked result write. Failed validation creates no plan and changes no existing domain record.

## Controller Integration

The controller adds one explicit create-plan command after an active work session already exists. It must not combine session start and plan creation in one input event. It revalidates current state, stores plan records/results by project, preserves stale-project guards, and refreshes dashboard rows.

## UI Strategy

Dashboard priority becomes:

1. critical project rows
2. issue list and detail
3. active ProjectTask details
4. active work-session rows
5. execution-plan rows
6. Candidate Task rows
7. assignment recommendation rows
8. promotion rows
9. confirmed assignment rows
10. preparation rows

Execution-plan rows use bounded text with wording such as `Execution Plan Ready`, `Execution Not Started`, and `Awaiting Readiness Validation`. They must not use Running, Executing, Coding, or Reviewing.

## Validation Strategy

- Focused tests:
  - `npx vitest run src/features/city-view/scene/office/execution-plans/ExecutionPlanTypes.test.ts`
  - `npx vitest run src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts`
  - `npx vitest run src/features/city-view/scene/office/execution-plans/ExecutionPlanView.test.ts`
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
