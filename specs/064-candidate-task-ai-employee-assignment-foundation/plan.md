# Implementation Plan: Candidate Task AI Employee Assignment Foundation

**Branch**: `codex/064-candidate-task-ai-employee-assignment-foundation` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/064-candidate-task-ai-employee-assignment-foundation/spec.md`

## Summary

Add a synchronous, provider-neutral assignment recommendation module that consumes Spec 063 `CandidateTaskCollection` values and existing `Employee` records. It derives immutable capability profiles, applies deterministic matching rules, stores recommendation collections on `ProjectPortalState`, and renders assignment recommendation rows after Candidate Task rows in the project dashboard. The feature creates proposals only; it does not mutate employees, create `ProjectTask` records, start work sessions, call GitHub, call LLMs, or perform remote actions.

## Technical Context

**Language/Version**: TypeScript strict mode in the existing Next.js/Phaser app.

**Primary Dependencies**: No new dependencies. Reuses `candidate-tasks/`, `employees/`, `OfficeProjectPortalController`, and `OfficeProjectPortalView`.

**Storage**: In-memory only on `ProjectPortalState`.

**Testing**: Vitest colocated tests.

**Target Platform**: Browser runtime.

**Project Type**: Client application feature in the office project portal.

**Performance Goals**: Synchronous linear matching over visible candidate tasks and employees.

**Constraints**: Deterministic, provider-neutral, no LLM, no remote mutation, no active assignment, no persistence.

**Scale/Scope**: Existing seeded AIverse projects and employee mock provider.

## Constitution Check

No violations.

- Spec first: `spec.md` and quality checklist are present.
- Plan before code: this plan defines ownership and validation before implementation.
- Tasks gate implementation: `tasks.md` will be created before source changes.
- Preserve stability: changes are scoped to a new `candidate-assignments/` module and narrow controller/view integration.
- Validation required: focused and full validation are listed below.

## Project Structure

### Documentation (this feature)

```text
specs/064-candidate-task-ai-employee-assignment-foundation/
├── spec.md
├── plan.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── candidate-assignments/
│   ├── CandidateAssignmentTypes.ts
│   ├── CandidateAssignmentTypes.test.ts
│   ├── EmployeeCapabilityProfile.ts
│   ├── EmployeeCapabilityProfile.test.ts
│   ├── CandidateAssignmentMatcher.ts
│   ├── CandidateAssignmentMatcher.test.ts
│   ├── CandidateAssignmentService.ts
│   ├── CandidateAssignmentService.test.ts
│   ├── CandidateAssignmentView.ts
│   └── CandidateAssignmentView.test.ts
├── OfficeProjectPortalTypes.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalController.issue-sync.test.ts
├── OfficeProjectPortalView.ts
└── OfficeProjectPortalView.test.ts
```

**Structure Decision**: A `candidate-assignments/` sibling module keeps recommendation logic separate from issue synchronization, Candidate Task mapping, employee storage, and executable task logic.

## Matching Rules

Capability taxonomy:

- `SoftwareDevelopment`
- `BugFixing`
- `FeatureDevelopment`
- `Documentation`
- `Testing`
- `CodeReview`
- `Research`
- `Maintenance`
- `ProjectPlanning`

Task requirements:

- `Bug`: `BugFixing` or `SoftwareDevelopment`
- `Feature`: `FeatureDevelopment` or `SoftwareDevelopment`
- `Documentation`: `Documentation`
- `Maintenance`: `Maintenance` or `SoftwareDevelopment`
- `Research`: `Research` or `ProjectPlanning`
- `Unknown`: generalist `SoftwareDevelopment` or `ProjectPlanning`, otherwise `NeedsReview`

Tie-breaking:

1. Match tier (`Strong`, `Moderate`, `Weak`, `None`)
2. Availability (`Idle` before `Working`, `Working` before `Offline`)
3. Lower active workload (`assignedTaskId` absent before present)
4. Stable employee ID

Closed Candidate Tasks are preserved but not recommended to employees.

## Controller Integration

After candidate tasks are mapped from issue sync, the controller derives assignment recommendations from:

- the stored candidate task collection for the project
- the current `state.employees`

It does not call providers, mutate employees, create ProjectTasks, create work sessions, or start work. Project switching and unavailable candidate task states overwrite stale recommendation collections with the current explicit state.

## Layout Strategy

Dashboard lower rows keep priority:

1. existing critical project rows
2. `[ISSUE LIST]` and `[ISSUE DETAIL]`
3. `[CANDIDATE TASKS]` / `[CANDIDATE TOP]`
4. `[ASSIGNMENT RECOMMENDATIONS]` / top assignment rows

Rows are bounded and appended last so assignment rows are dropped first under panel pressure.

## Validation Strategy

- `npx vitest run src/features/city-view/scene/office/candidate-assignments/EmployeeCapabilityProfile.test.ts`
- `npx vitest run src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentMatcher.test.ts src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentService.test.ts`
- `npx vitest run src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Complexity Tracking

No constitution violations.
