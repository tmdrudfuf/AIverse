# Tasks: Employee Insight System

**Input**: Design documents from `specs/026-employee-insight-system/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/employee-insight-ui.md`, `quickstart.md`

**Tests**: Include targeted Vitest service/controller tests plus static and manual validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup and Existing System Review

**Purpose**: Confirm current office employee systems and create feature-local boundaries before implementation.

- [X] T001 Confirm existing Employee AI, employee simulation, NPC movement, workstation, schedule, project/task, progression, conversation, office scene, and NPC renderer files before implementation.
  - Files likely inspected: `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/CompanyOfficeScene.ts`, `src/features/city-view/scene/office/employees/EmployeeAITypes.ts`, `src/features/city-view/scene/office/employees/EmployeeAIService.ts`, `src/features/city-view/scene/office/npc/EmployeeNpcTypes.ts`, `src/features/city-view/scene/office/npc/EmployeeNpcMovementTypes.ts`, `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`, `src/features/city-view/scene/office/schedules/EmployeeDailyScheduleTypes.ts`, `src/features/city-view/scene/office/tasks/ProjectTaskTypes.ts`, `src/features/city-view/scene/office/progression/CompanyProgressionTypes.ts`, `src/features/city-view/scene/office/conversations/EmployeeConversationService.ts`
  - Acceptance criteria: Relevant files are reviewed; implementation notes preserve existing ownership boundaries and avoid dialogue coupling.
  - Implementation notes: `OfficeProjectPortalController` already composes employee, AI, movement, workstation, schedule, project/task, and progression snapshots; `CompanyOfficeScene` owns scene composition and player position; `EmployeeConversationService` remains dialogue-only and should not be called by passive insight derivation.

- [X] T002 Create employee insight module folder and config in `src/features/city-view/scene/office/insight/EmployeeInsightConfig.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightConfig.ts`
  - Acceptance criteria: Exports configurable proximity radius and fallback labels; no Phaser scene or controller logic is added.

- [X] T003 [P] Create employee insight type definitions in `src/features/city-view/scene/office/insight/EmployeeInsightTypes.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightTypes.ts`
  - Acceptance criteria: Defines source, target, view-model, progress, mood, and thinking text types; types reference existing employee/project/task/schedule/progression shapes without mutating them.

## Phase 2: Foundational Insight Derivation

**Purpose**: Build deterministic, testable insight derivation before rendering or scene integration.

- [X] T004 [P] Add nearest-target service tests for radius inclusion, radius exclusion, and deterministic ties in `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`
  - Acceptance criteria: Tests fail before service implementation and cover nearest eligible employee selection.

- [X] T005 [P] Add view-model service tests for required fields, fallback task/project/progress values, optional mood, and non-dialogue Thinking text in `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`
  - Acceptance criteria: Tests fail before service implementation and cover required card content.

- [X] T006 Implement deterministic EmployeeInsightService in `src/features/city-view/scene/office/insight/EmployeeInsightService.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightService.ts`, `src/features/city-view/scene/office/insight/EmployeeInsightTypes.ts`, `src/features/city-view/scene/office/insight/EmployeeInsightConfig.ts`
  - Acceptance criteria: Selects nearest employee inside radius, resolves ties by employee id, builds one card view model, generates local non-dialogue Thinking text, and has no Phaser or provider dependencies.

## Phase 3: User Story 1 - Observe Nearby Employee Work (Priority: P1) MVP

**Goal**: Show a passive Employee Insight card automatically when the player approaches one employee.

**Independent Test**: Move near a visible employee in the office and confirm the card appears with work information while movement remains available.

- [X] T007 [P] [US1] Add controller integration tests for composing insight source data from Employee AI, simulation, movement, workstation, schedule, project/task, and progression state in `src/features/city-view/scene/office/OfficeProjectPortalController.employee-insight.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.employee-insight.test.ts`
  - Acceptance criteria: Tests prove read-only source composition and no mutation of existing snapshots.

- [X] T008 [US1] Expose read-only employee insight source data from `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/insight/EmployeeInsightTypes.ts`
  - Acceptance criteria: Controller returns source data needed by EmployeeInsightService without changing Employee AI, schedule, project/task, progression, movement, workstation, or conversation state.

- [X] T009 [P] [US1] Create non-blocking Phaser overlay renderer in `src/features/city-view/scene/office/insight/EmployeeInsightOverlay.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightOverlay.ts`
  - Acceptance criteria: Renders one screen-space card from EmployeeInsightViewModel; has show/update/hide/destroy methods; does not consume input or manage business rules.

- [X] T010 [US1] Wire EmployeeInsightService and EmployeeInsightOverlay into `src/features/city-view/scene/office/CompanyOfficeScene.ts`.
  - Files likely affected: `src/features/city-view/scene/office/CompanyOfficeScene.ts`
  - Acceptance criteria: Scene passes current player position and controller source data each update; card appears automatically near an employee; movement remains active; cleanup destroys overlay.

## Phase 4: User Story 2 - Hide Insight When Leaving Proximity (Priority: P1)

**Goal**: Hide the card automatically when the player leaves range or no eligible employee exists.

**Independent Test**: Move near an employee to show the card, then leave the radius and confirm the card hides without input.

- [X] T011 [P] [US2] Add service tests for hidden state when no employees are in range and when a blocking overlay suppresses insight in `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`
  - Acceptance criteria: Tests cover hide conditions without relying on Phaser rendering.

- [X] T012 [US2] Implement automatic hide handling in `src/features/city-view/scene/office/CompanyOfficeScene.ts`.
  - Files likely affected: `src/features/city-view/scene/office/CompanyOfficeScene.ts`, `src/features/city-view/scene/office/insight/EmployeeInsightOverlay.ts`
  - Acceptance criteria: Overlay hides when no employee is eligible or when project portal is open; no interaction key or dismissal state is introduced.

## Phase 5: User Story 3 - Choose the Correct Nearby Employee (Priority: P2)

**Goal**: Keep card selection predictable when several employees are nearby.

**Independent Test**: Place the player near multiple employees and confirm nearest employee wins with deterministic tie behavior.

- [X] T013 [US3] Add controller or service tests for multi-employee source ordering and selected insight stability in `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`
  - Acceptance criteria: Tests cover nearest employee updates and deterministic tie-break behavior.

- [X] T014 [US3] Ensure EmployeeInsightService selection remains stable across equivalent distances in `src/features/city-view/scene/office/insight/EmployeeInsightService.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightService.ts`
  - Acceptance criteria: Equal distances resolve by employee id and card updates only when selected employee or source data changes.

## Phase 6: User Story 4 - Preserve Future Dialogue Extensibility (Priority: P3)

**Goal**: Keep passive insight separate from existing and future dialogue systems.

**Independent Test**: Review code and behavior to confirm no dialogue text, choices, or interaction key are introduced by Employee Insight.

- [ ] T015 [US4] Add regression tests proving Employee Insight does not call EmployeeConversationService or require conversation view models in `src/features/city-view/scene/office/OfficeProjectPortalController.employee-insight.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.employee-insight.test.ts`
  - Acceptance criteria: Tests prove insight source composition is independent from dialogue creation and does not mutate conversation behavior.

- [ ] T016 [US4] Review and document dialogue boundary comments in `src/features/city-view/scene/office/insight/EmployeeInsightTypes.ts`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightTypes.ts`
  - Acceptance criteria: Brief comments identify passive observation boundaries without describing dialogue as implemented.

## Phase 7: Validation and Manual Review

**Purpose**: Verify behavior, test coverage, and non-regression boundaries.

- [ ] T017 Run employee insight automated tests with `npm test`.
  - Files likely affected: `src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts`, `src/features/city-view/scene/office/OfficeProjectPortalController.employee-insight.test.ts`
  - Acceptance criteria: Employee insight tests and existing tests pass.

- [ ] T018 Run TypeScript validation with `npx tsc --noEmit`.
  - Files likely affected: `src/features/city-view/scene/office/`
  - Acceptance criteria: TypeScript validation passes with no introduced errors.

- [ ] T019 Run production build with `npm run build`.
  - Files likely affected: `src/app/`, `src/features/city-view/`
  - Acceptance criteria: Build passes; Phaser client boundaries remain valid.

- [ ] T020 Complete manual browser validation from `specs/026-employee-insight-system/quickstart.md`.
  - Files likely affected: `specs/026-employee-insight-system/quickstart.md`
  - Acceptance criteria: Card appears/disappears by proximity, is non-blocking, hides for project portal, and contains no dialogue or interaction-key prompt.

- [ ] T021 Review architecture checklist: no external AI calls, no dialogue coupling, no mutation of Employee AI/schedule/project/progression state, no broad renderer refactor, configurable radius exists.
  - Files likely affected: `specs/026-employee-insight-system/tasks.md`
  - Acceptance criteria: Review confirms feature boundaries and notes any blocker before completion.

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete before implementation because it establishes insight module boundaries.
- Phase 2 must complete before scene rendering because it owns deterministic selection and view-model rules.
- US1 and US2 are both P1 and should be delivered together for a complete proximity experience.
- US3 depends on Phase 2 and can follow once the MVP card appears/hides correctly.
- US4 depends on the insight API shape and controller integration.
- Validation runs last.

### User Story Dependencies

- **US1 Observe Nearby Employee Work**: Depends on Phase 1 and Phase 2.
- **US2 Hide Insight When Leaving Proximity**: Depends on Phase 1 and Phase 2.
- **US3 Choose the Correct Nearby Employee**: Depends on Phase 2 and should validate after US1/US2 integration.
- **US4 Preserve Future Dialogue Extensibility**: Depends on the final insight source and view-model boundary.

### Parallel Opportunities

- T003 can run in parallel with T002 after folder creation is agreed.
- T004 and T005 can be written in parallel because they target separate test concerns.
- T007 and T009 can proceed in parallel after T006 if controller source shape is stable.
- T011 and T013 can be written while scene wiring is reviewed.

## Parallel Example

```text
Task: "T004 Add nearest-target service tests in src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts"
Task: "T005 Add view-model service tests in src/features/city-view/scene/office/insight/EmployeeInsightService.test.ts"
Task: "T009 Create non-blocking Phaser overlay renderer in src/features/city-view/scene/office/insight/EmployeeInsightOverlay.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 setup and review.
2. Complete Phase 2 service tests and derivation.
3. Complete US1 and US2 together.
4. Stop and validate: card appears by proximity, hides by distance, and does not block movement.

### Incremental Delivery

1. Deliver passive one-employee insight.
2. Add automatic hide and blocking-overlay suppression.
3. Add robust multi-employee selection.
4. Lock dialogue boundaries and run full validation.

### Explicit Non-Goals

Do not add:

- Dialogue text, choices, prompts, or interaction flow.
- New AI provider calls.
- New employee AI state transitions.
- Project/task progression changes.
- Persistence or backend endpoints.
- Broad office renderer refactors.
