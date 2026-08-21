# Tasks: Playwright Home Canvas Smoke ADOS Validation Gate

**Input**: Design documents from `/specs/119-playwright-home-canvas-smoke-ados-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused workflow tests are included because the feature changes validation-gate behavior. Validation is not run from this ADOS runtime.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore Spec Kit context for feature 119 and point agent context at the active plan.

- [X] T001 Point Spec Kit active feature metadata at specs/119-playwright-home-canvas-smoke-ados-validation in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/119-playwright-home-canvas-smoke-ados-validation/plan.md

---

## Phase 2: User Story 1 - Gate ADOS Validation With Home Canvas Smoke (Priority: P1) MVP

**Goal**: Default ADOS full validation includes the existing home canvas Playwright smoke command.

**Independent Test**: In an allowed validation runtime, execute the focused workflow tests and confirm default command resolution and prompt rendering include `npm run test:e2e:home-canvas`.

### Tests for User Story 1

- [X] T003 [P] [US1] Add default validation command coverage in tools/agent-workflow/validationPolicy.test.ts
- [X] T004 [P] [US1] Add generated prompt coverage in tools/agent-workflow/agentWorkflow.test.ts

### Implementation for User Story 1

- [X] T005 [US1] Add npm run test:e2e:home-canvas to DEFAULT_VALIDATION_COMMANDS in tools/agent-workflow/agentWorkflow.js
- [X] T006 [US1] Document the updated default validation gate in tools/agent-workflow/README.md and AGENTS.md

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T007 Mark all completed tasks in specs/119-playwright-home-canvas-smoke-ados-validation/tasks.md
- [X] T008 Document that validation was not run from this ADOS runtime in the final handoff

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on gate wiring and documentation completion

### Parallel Opportunities

- T003 and T004 touch separate tests and can be completed in parallel after setup.

## Implementation Strategy

### MVP First

1. Restore feature 119 Spec Kit artifacts and pointers.
2. Add focused workflow test coverage for default command resolution and prompt rendering.
3. Add the home canvas smoke command to the default full validation gate.
4. Document the updated gate.
5. Leave validation to an allowed validation runtime per ADOS policy.
