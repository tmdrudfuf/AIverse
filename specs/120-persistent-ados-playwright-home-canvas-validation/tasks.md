# Tasks: Persistent ADOS Playwright Home Canvas Validation Command

**Input**: Design documents from `/specs/120-persistent-ados-playwright-home-canvas-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused workflow fixture coverage is updated because the feature closes default validation command persistence drift. Validation is not run from this ADOS runtime.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore Spec Kit context for feature 120 and point agent context at the active plan.

- [X] T001 Create Spec Kit artifacts under specs/120-persistent-ados-playwright-home-canvas-validation
- [X] T002 Point Spec Kit active feature metadata at specs/120-persistent-ados-playwright-home-canvas-validation in .specify/feature.json
- [X] T003 Update the SPECKIT managed AGENTS.md plan pointer to specs/120-persistent-ados-playwright-home-canvas-validation/plan.md

---

## Phase 2: User Story 1 - Persist Home Canvas Validation In ADOS Defaults (Priority: P1) MVP

**Goal**: Default ADOS workflow fixtures and generated prompts carry the existing home canvas Playwright smoke command.

**Independent Test**: In an allowed validation runtime, execute focused workflow tests and confirm default fixture construction and prompt rendering include `npm run test:e2e:home-canvas`.

### Tests for User Story 1

- [X] T004 [P] [US1] Use DEFAULT_VALIDATION_COMMANDS in tools/agent-workflow/agentWorkflow.test.ts default state fixtures
- [X] T005 [P] [US1] Use DEFAULT_VALIDATION_COMMANDS in tools/agent-workflow/agentRunner.test.ts default state fixtures
- [X] T006 [P] [US1] Use DEFAULT_VALIDATION_COMMANDS in tools/agent-workflow/agentWorkflowRun.test.ts default state fixtures

### Implementation for User Story 1

- [X] T007 [US1] Confirm explicit validation command override tests still supply custom commands in tools/agent-workflow validation tests

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T008 Mark all completed tasks in specs/120-persistent-ados-playwright-home-canvas-validation/tasks.md
- [X] T009 Document that validation was not run from this ADOS runtime in the final handoff

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **Polish (Phase 3)**: Depends on fixture updates

### Parallel Opportunities

- T004, T005, and T006 touch separate test files and can be completed in parallel after setup.

## Implementation Strategy

### MVP First

1. Restore feature 120 Spec Kit artifacts and pointers.
2. Replace stale fixture validation lists with the canonical default.
3. Preserve explicit override tests unchanged.
4. Leave validation to an allowed validation runtime per ADOS policy.
