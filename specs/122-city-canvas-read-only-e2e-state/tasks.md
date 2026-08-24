# Tasks: City Canvas Read-Only E2E State Probe

**Input**: Design documents from `/specs/122-city-canvas-read-only-e2e-state/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is updated for probe attributes. Playwright validation is documented but not run from this ADOS runtime.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish Spec Kit traceability for feature 122 before application code changes.

- [X] T001 Create Spec Kit artifacts under specs/122-city-canvas-read-only-e2e-state
- [X] T002 Point Spec Kit active feature metadata at specs/122-city-canvas-read-only-e2e-state in .specify/feature.json
- [X] T003 Update the SPECKIT managed AGENTS.md plan pointer to specs/122-city-canvas-read-only-e2e-state/plan.md

---

## Phase 2: User Story 1 - Observe Canvas Boot State (Priority: P1) MVP

**Goal**: The home canvas smoke can read passive city canvas boot facts from the existing host and fail when the mounted state is incomplete.

**Independent Test**: In an allowed validation runtime, execute focused unit coverage and the home canvas smoke command; confirm the probe reports ready state, dimensions, scene count, and canvas count.

### Tests for User Story 1

- [X] T004 [P] [US1] Extend probe-focused canvas boot coverage in src/features/city-view/CitySceneCanvas.boot-smoke.test.ts

### Implementation for User Story 1

- [X] T005 [US1] Expose passive read-only probe attributes from src/features/city-view/CitySceneCanvas.tsx
- [X] T006 [US1] Assert read-only probe state in e2e/home-canvas-smoke.spec.ts

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup and handoff notes.

- [X] T007 Mark all completed tasks in specs/122-city-canvas-read-only-e2e-state/tasks.md
- [X] T008 Document that validation was not run from this ADOS runtime in the final handoff

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on probe implementation

### Parallel Opportunities

- T004 can be authored before T005 because it captures the expected probe behavior, but both touch related files and should be reviewed together.

## Implementation Strategy

### MVP First

1. Restore feature 122 Spec Kit artifacts and pointers.
2. Add focused unit coverage for host probe attributes.
3. Add the passive probe and wire the Playwright smoke through it.
4. Leave validation to an allowed validation runtime per ADOS policy.
