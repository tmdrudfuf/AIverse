# Tasks: Reviewer Runtime Uncommitted Target Blocked Result Explanation

**Input**: Design documents from `/specs/114-reviewer-runtime-uncommitted-target-blocked-result/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes a user-visible dashboard row with existing text-budget and no-mutation guarantees.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 114.

- [X] T001 Point Spec Kit active feature metadata at specs/114-reviewer-runtime-uncommitted-target-blocked-result in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/114-reviewer-runtime-uncommitted-target-blocked-result/plan.md

---

## Phase 2: User Story 1 - Understand Uncommitted Target Block (Priority: P1) MVP

**Goal**: The blocked Reviewer Runtime row names the uncommitted target cause and inspection as the immediate next action while preserving not-started safety wording.

**Independent Test**: Render the blocked uncommitted-target result state and verify the row includes blocked, uncommitted target, inspect, and not started while remaining within the row budget.

### Tests for User Story 1

- [X] T003 [P] [US1] Add uncommitted-target blocked result expectations in src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeView.test.ts

### Implementation for User Story 1

- [X] T004 [US1] Update uncommitted-target blocked Reviewer Runtime display text in src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeView.ts

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T005 Mark all completed tasks in specs/114-reviewer-runtime-uncommitted-target-blocked-result/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on User Story 1 completion

### Parallel Opportunities

- T003 is isolated in the focused test file and can be prepared independently before T004.

## Implementation Strategy

### MVP First

1. Restore feature 114 Spec Kit artifacts and pointers.
2. Add focused uncommitted-target blocked-result expectations.
3. Update the blocked row text selection.
4. Leave validation to an allowed validation runtime per ADOS policy.
