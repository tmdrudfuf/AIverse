# Tasks: Home Route Playwright Canvas Boot Smoke

**Input**: Design documents from `/specs/117-home-route-playwright-canvas-boot-smoke/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest smoke coverage is included because the feature explicitly requests home route canvas boot smoke confidence.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 117.

- [X] T001 Point Spec Kit active feature metadata at specs/117-home-route-playwright-canvas-boot-smoke in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/117-home-route-playwright-canvas-boot-smoke/plan.md

---

## Phase 2: User Story 1 - Smoke Validate Home Canvas Entry (Priority: P1) MVP

**Goal**: The home route reaches the city view and city canvas entry point expected by downstream Playwright canvas smoke workflows.

**Independent Test**: Evaluate the home route and city view component composition locally, assert the home route returns the city view, and assert the city view includes the canvas entry point.

### Tests for User Story 1

- [X] T003 [P] [US1] Add home route canvas entry smoke coverage in src/app/page.canvas-boot-smoke.test.ts

### Implementation for User Story 1

- [X] T004 [US1] Confirm no application route behavior change is needed in src/app/page.tsx

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T005 Mark all completed tasks in specs/117-home-route-playwright-canvas-boot-smoke/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on smoke coverage completion

### Parallel Opportunities

- T003 touches a new test file and can be implemented independently after setup.

## Implementation Strategy

### MVP First

1. Restore feature 117 Spec Kit artifacts and pointers.
2. Add focused home route canvas entry smoke coverage.
3. Confirm the existing home route already composes the city view without source behavior changes.
4. Leave validation to an allowed validation runtime per ADOS policy.
