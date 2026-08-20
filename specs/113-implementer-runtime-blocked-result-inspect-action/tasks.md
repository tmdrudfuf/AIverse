# Tasks: Implementer Runtime Blocked Result Inspect Action

**Input**: Design documents from `/specs/113-implementer-runtime-blocked-result-inspect-action/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes a user-visible dashboard row with existing text-budget and no-mutation guarantees.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 113.

- [X] T001 Point Spec Kit active feature metadata at specs/113-implementer-runtime-blocked-result-inspect-action in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/113-implementer-runtime-blocked-result-inspect-action/plan.md

---

## Phase 2: User Story 1 - See Inspect Cue On Blocked Implementer Result (Priority: P1) MVP

**Goal**: The blocked Implementer Runtime row names inspection as the immediate next action while preserving Codex-not-started safety wording.

**Independent Test**: Render the blocked result state and verify the row includes blocked, inspect, and Codex not started while remaining within the row budget.

### Tests for User Story 1

- [X] T003 [P] [US1] Add blocked result inspect cue expectations in src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeView.test.ts

### Implementation for User Story 1

- [X] T004 [US1] Update blocked Implementer Runtime display text in src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeView.ts

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T005 Mark all completed tasks in specs/113-implementer-runtime-blocked-result-inspect-action/tasks.md

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

1. Restore feature 113 Spec Kit artifacts and pointers.
2. Add focused blocked-result inspect expectations.
3. Update the blocked row text.
4. Leave validation to an allowed validation runtime per ADOS policy.
