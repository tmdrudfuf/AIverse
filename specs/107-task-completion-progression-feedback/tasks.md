# Tasks: Task Completion Progression Feedback

**Input**: Design documents from `specs/107-task-completion-progression-feedback/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest tasks are included because the feature changes user-visible task completion behavior and progression trigger state.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Confirm existing app surfaces and ignore-file state before implementation.

- [X] T001 Verify Spec Kit artifacts for feature 107 under specs/107-task-completion-progression-feedback/
- [X] T002 Verify existing TypeScript app ignore coverage in .gitignore without changing application code

---

## Phase 2: Foundational

**Purpose**: Add shared state shape needed by task completion feedback.

- [X] T003 Add task completion progression feedback state type in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [X] T004 Initialize task completion progression feedback state in src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts

---

## Phase 3: User Story 1 - See Completion Progression Immediately (Priority: P1) MVP

**Goal**: Completing a Review task immediately refreshes progression triggers and shows task detail feedback.

**Independent Test**: Mark a Review task Done from task detail and verify task status, feedback state, and progression triggers.

### Tests for User Story 1

- [X] T005 [P] [US1] Add controller coverage for Done completion feedback and refreshed progression triggers in src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts
- [X] T006 [P] [US1] Add view coverage for task detail completion progression feedback in src/features/city-view/scene/office/OfficeProjectPortalView.test.ts

### Implementation for User Story 1

- [X] T007 [US1] Capture before/after company progression and update triggers when marking selected task Done in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [X] T008 [US1] Render latest task completion progression feedback in task detail in src/features/city-view/scene/office/OfficeProjectPortalView.ts

---

## Phase 4: User Story 2 - Preserve Existing Completion Workflow (Priority: P2)

**Goal**: Existing task activity, employee release, persistence, and advisory refresh behavior remain intact.

**Independent Test**: Complete an assigned Review task and verify existing completion side effects are preserved.

### Tests for User Story 2

- [X] T009 [P] [US2] Extend controller completion coverage for activity log and employee release preservation in src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts

### Implementation for User Story 2

- [X] T010 [US2] Keep feedback generation inside the existing markSelectedTaskDone flow without changing non-progression side effects in src/features/city-view/scene/office/OfficeProjectPortalController.ts

---

## Phase 5: User Story 3 - Avoid False Progression Feedback (Priority: P3)

**Goal**: Non-completion and duplicate actions do not create progression feedback or triggers.

**Independent Test**: Move a task to Review and press action on already Done task, verifying no new feedback or trigger appears.

### Tests for User Story 3

- [X] T011 [P] [US3] Add controller coverage for no feedback on non-Done and already Done actions in src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts

### Implementation for User Story 3

- [X] T012 [US3] Guard feedback creation to successful Review to Done transitions only in src/features/city-view/scene/office/OfficeProjectPortalController.ts

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and handoff cleanup.

- [X] T013 Update AGENTS.md Spec Kit pointer to specs/107-task-completion-progression-feedback/plan.md
- [X] T014 Review changed files for formatting without running validation commands

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on setup completion.
- **US1 (Phase 3)**: Depends on foundational state additions.
- **US2 (Phase 4)**: Depends on US1 completion flow.
- **US3 (Phase 5)**: Depends on US1 completion flow.
- **Polish**: Depends on desired user stories.

## Parallel Opportunities

- T005 and T006 can be written in parallel because they touch different test files.
- T009 and T011 are separate scenarios in the same controller test file and should be applied sequentially in this worktree.

## Implementation Strategy

1. Complete setup and foundational state tasks.
2. Implement US1 as the MVP.
3. Preserve existing completion behavior for US2.
4. Add guard coverage for US3.
5. Stop before validation/review commands per ADOS runtime policy.
