# Tasks: Daily Proof Portal Browser Smoke Validation

**Input**: Design documents from `/specs/115-daily-proof-portal-browser-smoke-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest smoke coverage is included because the feature is explicitly a browser smoke validation request.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 115.

- [X] T001 Point Spec Kit active feature metadata at specs/115-daily-proof-portal-browser-smoke-validation in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/115-daily-proof-portal-browser-smoke-validation/plan.md

---

## Phase 2: User Story 1 - Smoke Validate Daily Proof Portal Entry (Priority: P1) MVP

**Goal**: The browser-facing portal path opens Daily Proof and reaches its dashboard without starting downstream runtimes or remote actions.

**Independent Test**: Open the portal from a fresh controller, clear the just-opened frame, activate Daily Proof, and assert dashboard selection plus no downstream runtime collections.

### Tests for User Story 1

- [X] T003 [P] [US1] Add Daily Proof portal-entry smoke coverage in src/features/city-view/scene/office/OfficeProjectPortalController.browser-smoke.test.ts

---

## Phase 3: User Story 2 - Smoke Validate Daily Proof Runtime-Start Chain (Priority: P2)

**Goal**: The deterministic Daily Proof portal chain reaches exactly one runtime-start record without starting implementer, reviewer, or validation runtimes.

**Independent Test**: Drive the existing Daily Proof candidate-task chain through runtime start and assert one runtime-start record plus no downstream runtime collections.

### Tests for User Story 2

- [X] T004 [P] [US2] Add Daily Proof runtime-start chain smoke coverage in src/features/city-view/scene/office/OfficeProjectPortalController.browser-smoke.test.ts

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T005 Mark all completed tasks in specs/115-daily-proof-portal-browser-smoke-validation/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **User Story 2 (Phase 3)**: Depends on Setup completion and can be reviewed independently from User Story 1
- **Polish (Phase 4)**: Depends on smoke coverage completion

### Parallel Opportunities

- T003 and T004 share one focused test file and should be edited sequentially in this implementation, but each asserts an independent smoke outcome.

## Implementation Strategy

### MVP First

1. Restore feature 115 Spec Kit artifacts and pointers.
2. Add Daily Proof portal-entry smoke coverage.
3. Add Daily Proof runtime-start chain smoke coverage.
4. Leave validation to an allowed validation runtime per ADOS policy.
