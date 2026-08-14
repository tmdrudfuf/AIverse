# Tasks: Company Growth Gameplay Loop Integration

**Input**: Design documents from `/specs/096-company-growth-gameplay-loop-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused unit tests requested by the implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish active feature pointer and documentation alignment

- [X] T001 Update `.specify/feature.json` to point at `specs/096-company-growth-gameplay-loop-integration`
- [X] T002 Update `AGENTS.md` SPECKIT managed plan pointer to `specs/096-company-growth-gameplay-loop-integration/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared company growth gameplay loop contract

- [X] T003 [P] Add company growth loop service tests in `src/features/city-view/scene/office/progression/CompanyGrowthGameplayLoopService.test.ts`
- [X] T004 Implement company growth loop service in `src/features/city-view/scene/office/progression/CompanyGrowthGameplayLoopService.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Produce One Growth Loop Result (Priority: P1) MVP

**Goal**: Produce one copied trigger/effect/reward/feed result from current progression triggers.

**Independent Test**: Create a level-up trigger, run the loop service, and verify matching lineage IDs and copied nested arrays.

### Implementation for User Story 1

- [X] T005 [US1] Add empty and multiple-trigger coverage in `src/features/city-view/scene/office/progression/CompanyGrowthGameplayLoopService.test.ts`
- [X] T006 [US1] Ensure loop service returns fresh copied arrays for triggers, effects, rewards, and feed events in `src/features/city-view/scene/office/progression/CompanyGrowthGameplayLoopService.ts`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Use Growth Loop Result At Office Exit (Priority: P2)

**Goal**: Use the portal controller's growth loop result when returning to the city.

**Independent Test**: Controller accessor returns copied loop output from stored progression triggers.

### Implementation for User Story 2

- [X] T007 [US2] Add controller accessor coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.company-influence.test.ts`
- [X] T008 [US2] Expose `getCompanyGrowthGameplayLoopResult()` from `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T009 [US2] Replace inline progression effect/reward/feed construction in `src/features/city-view/scene/office/CompanyOfficeScene.ts`

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Traceability and handoff readiness

- [X] T010 Mark completed tasks in `specs/096-company-growth-gameplay-loop-integration/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish**: Depends on selected user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational
- **User Story 2 (P2)**: Depends on User Story 1 loop result contract

### Parallel Opportunities

- T003 can be created before T004.
- Source files touched by T008 and T009 should be applied sequentially in this single-agent runtime.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1 loop result derivation.
3. Complete User Story 2 controller and scene integration.
4. Leave validation to the external ADOS validation runtime per handoff constraints.
