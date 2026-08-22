# Tasks: Playwright WebGL Warning Allowlist

**Input**: Design documents from `/specs/121-playwright-webgl-warning-allowlist/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is added for allowlist behavior. Validation is not run from this ADOS runtime.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish Spec Kit traceability for feature 121 before application code changes.

- [X] T001 Create Spec Kit artifacts under specs/121-playwright-webgl-warning-allowlist
- [X] T002 Point Spec Kit active feature metadata at specs/121-playwright-webgl-warning-allowlist in .specify/feature.json
- [X] T003 Update the SPECKIT managed AGENTS.md plan pointer to specs/121-playwright-webgl-warning-allowlist/plan.md

---

## Phase 2: User Story 1 - Keep Home Canvas Smoke Stable For Benign WebGL Warnings (Priority: P1) MVP

**Goal**: Known benign warning-level WebGL messages do not fail the home canvas smoke, while all unknown warnings, console errors, and page errors remain failures.

**Independent Test**: In an allowed validation runtime, execute focused unit coverage and the home canvas smoke command; confirm only the documented WebGL warning is ignored.

### Tests for User Story 1

- [X] T004 [P] [US1] Add focused browser signal allowlist unit coverage in src/test-support/browserSignalFilter.test.ts

### Implementation for User Story 1

- [X] T005 [US1] Add browser signal filtering helper in src/test-support/browserSignalFilter.ts
- [X] T006 [US1] Use the filtering helper in e2e/home-canvas-smoke.spec.ts

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup and handoff notes.

- [X] T007 Mark all completed tasks in specs/121-playwright-webgl-warning-allowlist/tasks.md
- [X] T008 Document that validation was not run from this ADOS runtime in the final handoff

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on allowlist implementation

### Parallel Opportunities

- T004 can be authored before T005 because it captures the expected helper behavior, but both touch related files and should be reviewed together.

## Implementation Strategy

### MVP First

1. Restore feature 121 Spec Kit artifacts and pointers.
2. Add focused unit coverage for warning-only allowlist behavior.
3. Add the helper and wire the Playwright smoke through it.
4. Leave validation to an allowed validation runtime per ADOS policy.
