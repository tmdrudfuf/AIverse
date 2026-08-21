# Tasks: Daily Proof Canvas Boot Console Smoke

**Input**: Design documents from `/specs/116-daily-proof-canvas-boot-console-smoke/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest smoke coverage is included because the feature explicitly requests a canvas boot console smoke check.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 116.

- [X] T001 Point Spec Kit active feature metadata at specs/116-daily-proof-canvas-boot-console-smoke in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/116-daily-proof-canvas-boot-console-smoke/plan.md

---

## Phase 2: User Story 1 - Smoke Validate Daily Proof Canvas Boot (Priority: P1) MVP

**Goal**: The Daily Proof city canvas boot path requests the expected game configuration without console warnings or errors.

**Independent Test**: Call the canvas boot boundary with a mocked Phaser runtime, assert the supplied host is used, assert the scene collection is configured, and assert no console warning or error is emitted.

### Tests for User Story 1

- [X] T003 [P] [US1] Add Daily Proof canvas boot console smoke coverage in src/features/city-view/CitySceneCanvas.boot-smoke.test.ts

### Implementation for User Story 1

- [X] T004 [US1] Extract a behavior-preserving canvas boot helper in src/features/city-view/CitySceneCanvas.tsx

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T005 Mark all completed tasks in specs/116-daily-proof-canvas-boot-console-smoke/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on smoke coverage completion

### Parallel Opportunities

- T003 and T004 touch related behavior and should be edited sequentially in this implementation.

## Implementation Strategy

### MVP First

1. Restore feature 116 Spec Kit artifacts and pointers.
2. Extract the Daily Proof canvas boot helper without changing rendered behavior.
3. Add focused canvas boot console smoke coverage.
4. Leave validation to an allowed validation runtime per ADOS policy.
