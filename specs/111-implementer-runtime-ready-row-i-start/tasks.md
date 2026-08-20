# Tasks: Implementer Runtime Ready Row I Start Label

**Input**: Design documents from `/specs/111-implementer-runtime-ready-row-i-start/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes a user-visible dashboard row with existing text-budget and no-mutation guarantees.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 111.

- [X] T001 Point Spec Kit active feature metadata at specs/111-implementer-runtime-ready-row-i-start in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/111-implementer-runtime-ready-row-i-start/plan.md

---

## Phase 2: User Story 1 - See Start Key On Ready Implementer Row (Priority: P1) MVP

**Goal**: The ready Implementer Runtime row names the `I` start input while preserving no-review/no-validation/no-mutation signals.

**Independent Test**: Render the ready state and verify the row includes the `I` start label, still says Codex is not started, and remains within the row budget.

### Tests for User Story 1

- [X] T003 [P] [US1] Add ready row `I` start label expectations in src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeView.test.ts

### Implementation for User Story 1

- [X] T004 [US1] Update ready Implementer Runtime display text in src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeView.ts

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T005 Mark all completed tasks in specs/111-implementer-runtime-ready-row-i-start/tasks.md

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

1. Restore feature 111 Spec Kit artifacts and pointers.
2. Add focused ready-row expectations.
3. Update the ready row text.
4. Leave validation to an allowed validation runtime per ADOS policy.
