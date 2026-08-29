# Tasks: Live Agent Work Visualization

**Input**: Design documents from `specs/136-live-agent-work-visualization/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the specification and authoritative handoff.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the active feature artifacts and focused implementation surface.

- [X] T001 Create Spec 136 documentation artifacts in `specs/136-live-agent-work-visualization/`
- [X] T002 Update Spec Kit active feature pointer in `.specify/feature.json`
- [X] T003 Update SPECKIT managed plan reference in `AGENTS.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core semantic translation that all visualization stories depend on.

- [X] T004 [P] Add deterministic semantic mapping tests in `src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts`
- [X] T005 Implement semantic ADOS/project state translation in `src/features/city-view/scene/office/LiveAgentWorkVisualization.ts`
- [X] T006 [P] Add movement timestamp regression coverage in `src/features/city-view/scene/office/npc/EmployeeNpcMovementService.test.ts`

**Checkpoint**: Semantic work state can be derived without rendering code changes.

---

## Phase 3: User Story 1 - See Active Work In The Correct Department (Priority: P1) MVP

**Goal**: Employees and Project Status visibly reflect active implementation, validation, review, and publication states.

**Independent Test**: Representative active run states produce expected semantic destinations, status labels, and Project Status rows.

### Tests for User Story 1

- [X] T007 [P] [US1] Add active-stage NPC view-model tests in `src/features/city-view/scene/office/OfficeProjectPortalController.live-agent-work-visualization.test.ts`
- [X] T008 [P] [US1] Add Project Status active-stage rendering tests in `src/features/city-view/scene/office/OfficeVisualLayer.test.ts`

### Implementation for User Story 1

- [X] T009 [US1] Integrate semantic work state into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T010 [US1] Render selected-project status rows in `src/features/city-view/scene/office/OfficeVisualLayer.ts`
- [X] T011 [US1] Extend NPC view models for semantic labels/tone in `src/features/city-view/scene/office/npc/EmployeeNpcTypes.ts`
- [X] T012 [US1] Improve employee label rendering in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`

**Checkpoint**: Active ADOS work is visible in the correct department with readable contextual labels.

---

## Phase 4: User Story 2 - Avoid Stale Or Misleading Work State (Priority: P2)

**Goal**: Completed, blocked, idle, and project-switching states stay truthful.

**Independent Test**: Terminal and project-switch scenarios clear active labels and isolate state by selected project.

### Tests for User Story 2

- [X] T013 [P] [US2] Add blocked, complete, no-active-run, role-swap, and project-switch tests in `src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts`
- [X] T014 [P] [US2] Add stale active label clearing tests in `src/features/city-view/scene/office/OfficeProjectPortalController.live-agent-work-visualization.test.ts`

### Implementation for User Story 2

- [X] T015 [US2] Ensure selected-project-only state lookup and terminal clearing in `src/features/city-view/scene/office/LiveAgentWorkVisualization.ts`
- [X] T016 [US2] Apply blocked/complete/idle visual tones in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`

**Checkpoint**: Stale and cross-project work state cannot survive a refresh or project switch.

---

## Phase 5: User Story 3 - Preserve The Spec 135 Office Experience (Priority: P3)

**Goal**: The rendered office composition, project portal, interaction behavior, and NPC infrastructure remain usable.

**Independent Test**: Existing composition, portal interaction, and NPC tests continue to pass with added live visualization.

### Tests for User Story 3

- [X] T017 [P] [US3] Preserve Spec 135 composition assertions in `src/features/city-view/scene/office/RenderedOfficeComposition.test.ts`
- [X] T018 [P] [US3] Preserve project portal interaction coverage in `src/features/city-view/scene/office/OfficeInteractionController.test.ts`
- [X] T019 [P] [US3] Preserve NPC renderer infrastructure coverage in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.test.ts`

### Implementation for User Story 3

- [X] T020 [US3] Keep Spec 135 layout anchors stable in `src/features/city-view/scene/office/RenderedOfficeComposition.ts`
- [X] T021 [US3] Verify project portal remains reachable after visual-layer updates in `src/features/city-view/scene/office/OfficeVisualLayer.ts`

**Checkpoint**: Live visualization does not regress the rendered office or existing interactions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final checks and documentation.

- [X] T022 Update runtime verification notes in `specs/136-live-agent-work-visualization/quickstart.md`
- [X] T023 Run focused validation commands from `specs/136-live-agent-work-visualization/plan.md`
- [X] T024 Mark completed tasks in `specs/136-live-agent-work-visualization/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational.
- **User Story 2 (Phase 4)**: Depends on Foundational and integrates with US1 behavior.
- **User Story 3 (Phase 5)**: Can run after Foundational but must be checked before completion.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: MVP and highest priority.
- **User Story 2 (P2)**: Builds on the same semantic model to ensure correctness.
- **User Story 3 (P3)**: Confirms preservation of existing office behavior.

### Parallel Opportunities

- T004 and T006 can run in parallel.
- T007 and T008 can run in parallel.
- T013 and T014 can run in parallel.
- T017, T018, and T019 can run in parallel.

## Implementation Strategy

1. Complete setup and semantic translation first.
2. Add active work visualization as the MVP.
3. Harden terminal, blocked, idle, role-swap, and project-switch behavior.
4. Re-run preservation tests for Spec 135 office composition, portal interaction, and NPC infrastructure.
5. Record focused validation and runtime verification limits.
