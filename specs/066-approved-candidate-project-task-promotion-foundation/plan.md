# Implementation Plan: Approved Candidate ProjectTask Promotion Foundation

**Branch**: `codex/066-approved-candidate-project-task-promotion-foundation` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/066-approved-candidate-project-task-promotion-foundation/spec.md`

## Summary

Add a synchronous, provider-neutral promotion service that converts one explicit human-approved Candidate Task into the existing local `ProjectTask` collection. The implementation reuses Spec 063 Candidate Tasks, Spec 064 assignment recommendations, Spec 065 promotion decisions, and the existing office ProjectTask service/state. It creates a deterministic `Todo` ProjectTask only after command-time revalidation, records immutable promotion results for dashboard display, prevents duplicates, and preserves all no-execution/no-remote safety boundaries.

## Technical Context

**Language/Version**: TypeScript strict mode in the existing Next.js/Phaser app.

**Primary Dependencies**: No new dependencies. Reuses `candidate-tasks/`, `candidate-assignments/`, `candidate-promotions/`, `tasks/`, `OfficeProjectPortalController`, and `OfficeProjectPortalView`.

**Storage**: Existing in-memory `ProjectPortalState.taskCollections` and new in-memory promotion-result state.

**Testing**: Vitest colocated tests.

**Target Platform**: Browser runtime.

**Project Type**: Client application feature in the office project portal.

**Performance Goals**: Synchronous linear validation over visible Candidate Tasks, recommendations, decisions, and project tasks.

**Constraints**: Deterministic, provider-neutral, no LLM, no remote mutation, no employee assignment, no work-session creation, no task execution, no new persistence.

**Scale/Scope**: Existing seeded AIverse projects and issue/candidate/assignment/promotion dashboard flows.

## Constitution Check

No violations.

- Spec first: `spec.md` and quality checklist are present.
- Plan before code: this plan defines ownership and validation before implementation.
- Tasks gate implementation: `tasks.md` will be created before source changes.
- Preserve stability: changes are scoped to a new `candidate-project-task-promotions/` module and narrow controller/view integration.
- Validation required: focused and full validation are listed below.

## Project Structure

### Documentation

```text
specs/066-approved-candidate-project-task-promotion-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- project-task-promotion.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- candidate-project-task-promotions/
|   |-- CandidateProjectTaskPromotionTypes.ts
|   |-- CandidateProjectTaskPromotionTypes.test.ts
|   |-- CandidateProjectTaskPromotionService.ts
|   |-- CandidateProjectTaskPromotionService.test.ts
|   |-- CandidateProjectTaskPromotionView.ts
|   `-- CandidateProjectTaskPromotionView.test.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.issue-sync.test.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: A `candidate-project-task-promotions/` sibling module keeps conversion to real ProjectTasks separate from Candidate Task mapping, employee assignment recommendation, human decision approval, task execution, and work sessions.

## ProjectTask Reuse

The existing `ProjectTask` type is reused. A promoted Candidate Task maps to:

- `id`: deterministic promoted-task ID.
- `title`: Candidate Task title.
- `description`: Candidate Task summary plus source issue/provenance and non-binding recommendation hint.
- `status`: `Todo`.
- `priority`: Candidate priority mapped to existing task priority.
- `projectId`: Candidate Task project.
- `assignee`/`assigneeId`: unset.
- `estimatedHours`: omitted.
- `createdAt`/`updatedAt`: command timestamp.
- `activityLog`: one non-executing note describing local promotion provenance.

No second ProjectTask type or duplicate registry is introduced.

## Promotion Eligibility

Promotion succeeds only when:

- Candidate Task collection exists and succeeded.
- Candidate Task exists for the requested project and Candidate Task ID.
- Candidate Task is open and has project/issue/source provenance.
- Promotion decision exists for the same project/task and is `Approved`.
- Assignment recommendation collection exists and succeeded.
- Matching assignment recommendation belongs to the same project/task and is `Recommended`.
- Assignment recommendation provenance matches Candidate Task ID, issue ID, and issue number.
- Task collection is available.
- No existing ProjectTask in that project has the deterministic promoted-task ID or matching promotion provenance.

All other states return explicit blocked results and create no task.

## Assignment Policy

- `Recommended`: promotable if all other inputs are valid.
- `NeedsReview`: blocked.
- `Unassigned`: blocked.
- `Unavailable`: blocked.

The recommended employee is stored only as non-binding provenance text. It is not assigned to the ProjectTask.

## Idempotency and Duplicate Detection

ProjectTask ID policy:

```text
<projectId>:promoted-task:<candidateTaskId>:candidate-promotion-v1
```

Duplicate detection checks deterministic task ID and provenance marker content. Repeated promotion returns `AlreadyPromoted` and the existing task ID without modifying task state, employee state, or work sessions.

## Controller Integration

The controller stores promotion-result collections by project, calls the promotion service only from an explicit dashboard command, updates `taskCollections[projectId]` atomically on success, refreshes dashboard rows, and preserves existing tasks.

It does not call GitHub, assign employees, mutate employees, create work sessions, invoke Codex/Claude, or start execution.

## UI Strategy

Dashboard lower-row priority remains:

1. critical project rows
2. issue list and issue detail
3. existing active ProjectTask details
4. Candidate Task rows
5. assignment recommendation rows
6. promotion review rows
7. promotion result rows

Promotion result rows are appended last and bounded to one line, so they drop first under panel pressure.

## Validation Strategy

- `npx vitest run src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionTypes.test.ts`
- `npx vitest run src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionService.test.ts`
- `npx vitest run src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Complexity Tracking

No constitution violations.
