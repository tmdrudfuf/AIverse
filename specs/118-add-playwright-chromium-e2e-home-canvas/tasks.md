# Tasks: Add Playwright Chromium E2E Home Canvas Smoke Script

**Input**: Design documents from `/specs/118-add-playwright-chromium-e2e-home-canvas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Playwright Chromium E2E smoke coverage is included because the feature explicitly requests a home canvas E2E smoke script.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore Spec Kit context for feature 118 and add the Playwright E2E runner surface.

- [X] T001 Point Spec Kit active feature metadata at specs/118-add-playwright-chromium-e2e-home-canvas in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/118-add-playwright-chromium-e2e-home-canvas/plan.md
- [X] T003 Add Playwright test dependency and focused npm script in package.json and package-lock.json
- [X] T004 Add Chromium-focused Playwright configuration in playwright.config.ts

---

## Phase 2: User Story 1 - Run Home Canvas Browser Smoke (Priority: P1) MVP

**Goal**: A maintainer can run one focused Chromium E2E command that opens the home route, observes the city canvas host, observes a rendered canvas, and fails on browser error signals.

**Independent Test**: Execute `npm run test:e2e:home-canvas` in an allowed validation runtime and confirm the home route canvas smoke passes without page errors, console warnings, or console errors.

### Tests for User Story 1

- [X] T005 [P] [US1] Add home canvas Chromium smoke coverage in e2e/home-canvas-smoke.spec.ts

### Implementation for User Story 1

- [X] T006 [US1] Confirm no home route behavior change is needed in src/app/page.tsx

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T007 Mark all completed tasks in specs/118-add-playwright-chromium-e2e-home-canvas/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on smoke coverage completion

### Parallel Opportunities

- T005 touches a new E2E test file and can be implemented independently after setup.

## Implementation Strategy

### MVP First

1. Restore feature 118 Spec Kit artifacts and pointers.
2. Add the minimal Playwright Chromium E2E runner surface.
3. Add focused home route canvas smoke coverage.
4. Confirm the existing home route already composes the city canvas experience without source behavior changes.
5. Leave validation to an allowed validation runtime per ADOS policy.
