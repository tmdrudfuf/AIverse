# Tasks: Employee Knowledge System

**Input**: Design documents from `specs/027-employee-knowledge-system/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/employee-knowledge-ui.md`, `quickstart.md`

**Tests**: Include targeted Vitest service/controller tests plus static and manual validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup and Existing System Review

**Purpose**: Confirm current office systems and establish the Employee Knowledge boundary before implementation.

- [X] T001 Confirm existing Employee Insight, Employee AI, employee simulation, schedule, project/task, work session, progression, conversation, movement, workstation, office scene, and overlay files before implementation.
  - Files likely inspected: `src/features/city-view/scene/office/insight/EmployeeInsightTypes.ts`, `src/features/city-view/scene/office/insight/EmployeeInsightService.ts`, `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/CompanyOfficeScene.ts`, `src/features/city-view/scene/office/employees/EmployeeAITypes.ts`, `src/features/city-view/scene/office/employees/EmployeeAIService.ts`, `src/features/city-view/scene/office/employees/EmployeeSimulationTypes.ts`, `src/features/city-view/scene/office/schedules/EmployeeDailyScheduleTypes.ts`, `src/features/city-view/scene/office/tasks/ProjectTaskTypes.ts`, `src/features/city-view/scene/office/progression/CompanyProgressionTypes.ts`, `src/features/city-view/scene/office/conversations/EmployeeConversationTypes.ts`
  - Acceptance criteria: Relevant files are reviewed; implementation notes preserve the Insight target, read-only simulation source, and no-dialogue boundary.
  - Implementation notes: `EmployeeInsightSource` already carries the read-only AI, simulation, task, project, progress, mood, schedule, movement, workstation, and progression context needed for the first Knowledge boundary; `OfficeProjectPortalController` composes preview state and should remain the source-composition owner; `CompanyOfficeScene` owns overlay composition; `EmployeeConversationContext` can be referenced as optional read-only context but Knowledge must not create conversations or route dialogue.

- [X] T002 Create Employee Knowledge module config in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeConfig.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeConfig.ts`
  - Acceptance criteria: Exports fallback labels, display limits, and lightweight panel defaults; no scene or controller logic is added.

- [X] T003 [P] Create Employee Knowledge type definitions in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`
  - Acceptance criteria: Defines source, reason, goal, schedule summary, timeline item, optional confidence, and view-model types; references existing insight/simulation shapes without duplicating state.

## Phase 2: Foundational Knowledge Derivation

**Purpose**: Build deterministic, testable knowledge derivation before rendering or scene integration.

- [X] T004 [P] Add service tests for Why and Current Goal derivation in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`
  - Acceptance criteria: Tests cover working, walking, break, idle, conversation, and missing-task cases using existing source data.

- [X] T005 [P] Add service tests for schedule summary, planned next activity, optional confidence, and missing-data fallbacks in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`
  - Acceptance criteria: Tests prove optional rows are omitted or marked unavailable without fake state.

- [X] T006 [P] Add service tests for recent activity timeline derivation from existing activity sources in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`
  - Acceptance criteria: Tests cover ordering, item limits, source labels, and no generated history when sources are empty.

- [X] T007 Implement deterministic EmployeeKnowledgeService in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts`, `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`, `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeConfig.ts`
  - Acceptance criteria: Derives Why, Current Goal, Planned Next Activity, optional schedule/timeline/confidence fields, and stable fallbacks from existing source data; has no Phaser, mutation, or provider dependencies.

## Phase 3: User Story 1 - Understand Nearby Employee Reasoning (Priority: P1) MVP

**Goal**: Show read-only reasoning for the Employee Insight-selected employee.

**Independent Test**: Move near a visible employee and confirm Employee Knowledge appears for the same employee with identity, current state, Thinking, Why, Current Goal, and work context while movement remains available.

- [X] T008 [P] [US1] Add controller integration tests for composing Employee Knowledge source data from Insight, Employee AI, schedule, project/task, conversation, progression, movement, and workstation state in `src/features/city-view/scene/office/OfficeProjectPortalController.employee-knowledge.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.employee-knowledge.test.ts`
  - Acceptance criteria: Tests prove source composition is read-only and follows the current Employee Insight target/source.

- [X] T009 [US1] Expose read-only Employee Knowledge source data from `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`
  - Acceptance criteria: Controller returns data needed by EmployeeKnowledgeService without mutating Employee AI, schedule, project/task, progression, conversation, movement, workstation, or Insight state.

- [X] T010 [P] [US1] Create non-blocking Phaser knowledge overlay renderer in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeOverlay.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeOverlay.ts`
  - Acceptance criteria: Renders one read-only panel from EmployeeKnowledgeViewModel; has show/update/hide/destroy methods; does not consume input or own business rules.

- [X] T011 [US1] Wire EmployeeKnowledgeService and EmployeeKnowledgeOverlay into `src/features/city-view/scene/office/CompanyOfficeScene.ts`.
  - Files likely affected: `src/features/city-view/scene/office/CompanyOfficeScene.ts`
  - Acceptance criteria: Scene derives knowledge for the same observed employee as Employee Insight, updates during office ticks, hides for blocking overlays, and destroys overlay cleanly.

## Phase 4: User Story 2 - Review Schedule and Next Activity (Priority: P2)

**Goal**: Add schedule context and planned next activity to the knowledge panel.

**Independent Test**: Observe an employee during a schedule block and confirm the panel describes current schedule context and planned next activity when source data exists.

- [X] T012 [P] [US2] Add service tests for current schedule block and planned next activity labels in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`
  - Acceptance criteria: Tests cover work, break, conversation, walking, and unavailable schedule scenarios.

- [X] T013 [US2] Extend EmployeeKnowledgeService schedule derivation in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts`, `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`
  - Acceptance criteria: Panel view model includes current schedule and planned next activity derived from schedule snapshots without fake data.

- [X] T014 [US2] Render schedule and planned next activity sections in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeOverlay.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeOverlay.ts`
  - Acceptance criteria: Optional schedule content appears only when source data or unavailable fallback is defined; layout remains non-blocking.

## Phase 5: User Story 3 - Review Recent Activity Timeline (Priority: P2)

**Goal**: Add a concise recent activity timeline derived from existing simulation activity sources.

**Independent Test**: Observe an employee with recent activity and confirm the panel shows a short newest-first timeline; observe an employee without recent activity and confirm no fake history appears.

- [X] T015 [P] [US3] Add controller integration tests for exposing recent activity sources without duplicating history in `src/features/city-view/scene/office/OfficeProjectPortalController.employee-knowledge.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.employee-knowledge.test.ts`
  - Acceptance criteria: Tests prove timeline inputs reference existing task, work session, schedule, conversation, AI, or progression data.

- [X] T016 [US3] Expose recent activity source data for Employee Knowledge in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`
  - Acceptance criteria: Source data remains read-only and does not create a parallel persisted activity log.

- [X] T017 [US3] Implement timeline derivation and rendering in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts` and `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeOverlay.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts`, `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeOverlay.ts`
  - Acceptance criteria: Timeline is concise, ordered, source-labeled, and omitted or unavailable when no real source activity exists.

## Phase 6: User Story 4 - Preserve Future Influence Systems (Priority: P3)

**Goal**: Keep Employee Knowledge read-only and reusable by future dialogue, memory, relationship, and management systems.

**Independent Test**: Review code and behavior to confirm no dialogue choices, memory persistence, relationship mutations, management commands, or direct employee controls are introduced.

- [X] T018 [P] [US4] Add regression tests proving Employee Knowledge does not call dialogue creation, assign tasks, alter schedules, or mutate conversation state in `src/features/city-view/scene/office/OfficeProjectPortalController.employee-knowledge.test.ts`.
  - Files likely affected: `src/features/city-view/scene/office/OfficeProjectPortalController.employee-knowledge.test.ts`
  - Acceptance criteria: Tests prove knowledge source composition is read-only and separate from influence systems.

- [X] T019 [US4] Document read-only future-extension boundaries in `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeTypes.ts`
  - Acceptance criteria: Brief comments identify passive understanding boundaries without implementing dialogue, memory, relationship, management, economy, multiplayer, or save/load systems.

## Phase 7: Validation and Manual Review

**Purpose**: Verify behavior, test coverage, and non-regression boundaries.

- [ ] T020 Run Employee Knowledge automated tests with `npm test`.
  - Files likely affected: `src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts`, `src/features/city-view/scene/office/OfficeProjectPortalController.employee-knowledge.test.ts`
  - Acceptance criteria: Employee Knowledge tests and existing tests pass.

- [ ] T021 Run TypeScript validation with `npx tsc --noEmit`.
  - Files likely affected: `src/features/city-view/scene/office/`
  - Acceptance criteria: TypeScript validation passes with no introduced errors.

- [ ] T022 Run production build with `npm run build`.
  - Files likely affected: `src/app/`, `src/features/city-view/`
  - Acceptance criteria: Build passes; Phaser client boundaries remain valid.

- [ ] T023 Complete manual browser validation from `specs/027-employee-knowledge-system/quickstart.md`.
  - Files likely affected: `specs/027-employee-knowledge-system/quickstart.md`
  - Acceptance criteria: Knowledge follows Employee Insight target, updates by simulation state, remains non-blocking, hides with blocking overlays, and contains no dialogue or control affordance.

- [ ] T024 Review architecture checklist: no duplicated simulation state, no external AI calls, no dialogue coupling, no employee direct control, no fake confidence, no fake timeline, and no broad office renderer refactor.
  - Files likely affected: `specs/027-employee-knowledge-system/tasks.md`
  - Acceptance criteria: Review confirms feature boundaries and notes any blocker before completion.

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete before implementation because it establishes Employee Knowledge boundaries.
- Phase 2 must complete before rendering because it owns deterministic knowledge derivation.
- US1 is the MVP and depends on Phase 1 and Phase 2.
- US2 depends on Phase 2 schedule derivation and can follow the MVP panel.
- US3 depends on timeline source decisions and can follow MVP source composition.
- US4 depends on final knowledge source and view-model boundaries.
- Validation runs last.

### User Story Dependencies

- **US1 Understand Nearby Employee Reasoning**: Depends on Phase 1 and Phase 2.
- **US2 Review Schedule and Next Activity**: Depends on Phase 2 and can build on US1 rendering.
- **US3 Review Recent Activity Timeline**: Depends on Phase 2 and controller source composition.
- **US4 Preserve Future Influence Systems**: Depends on the final knowledge source and view-model boundary.

### Parallel Opportunities

- T003 can run in parallel with T002 after the module boundary is agreed.
- T004, T005, and T006 can be written in parallel because they target separate service concerns.
- T008 and T010 can proceed in parallel after T007 if the source shape is stable.
- T012 and T015 can be written while US1 scene wiring is reviewed.

## Parallel Example

```text
Task: "T004 Add Why and Current Goal derivation tests in src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts"
Task: "T005 Add schedule, planned next activity, confidence, and fallback tests in src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.test.ts"
Task: "T010 Create non-blocking Phaser knowledge overlay renderer in src/features/city-view/scene/office/knowledge/EmployeeKnowledgeOverlay.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 setup and review.
2. Complete Phase 2 knowledge derivation tests and service.
3. Complete US1 with Why, Current Goal, and work context for the Employee Insight-selected employee.
4. Stop and validate: knowledge appears with insight, explains current behavior, updates automatically, and remains read-only.

### Incremental Delivery

1. Deliver reasoning and goal understanding for the observed employee.
2. Add schedule and planned next activity.
3. Add recent activity timeline.
4. Lock future influence boundaries and run full validation.

### Explicit Non-Goals

Do not add:

- Dialogue text, choices, prompts, or interaction flow.
- Memory, relationship, economy, multiplayer, save/load, or management systems.
- Employee direct-control commands.
- New AI provider calls.
- New employee AI state transitions.
- Project/task progression changes.
- Persistence or backend endpoints.
- Broad office renderer refactors.
