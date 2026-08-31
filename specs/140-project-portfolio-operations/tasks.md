# Tasks: Project Portfolio Operations

**Input**: Design artifacts from `specs/140-project-portfolio-operations/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/portfolio-operations-city.md`

## Phase 1: Setup

- [X] T001 Verify Spec 140 documentation artifacts exist in `specs/140-project-portfolio-operations/`
- [X] T002 Update Spec Kit agent plan pointer in `AGENTS.md`

## Phase 2: Foundational

- [X] T003 Add portfolio aggregation types and deterministic attention/filter mapping in `src/features/city-view/scene/PortfolioOperationsService.ts`
- [X] T004 Add portfolio mapping/isolation/filter/no-mutation tests in `src/features/city-view/scene/PortfolioOperationsService.test.ts`

## Phase 3: User Story 1 - Read Portfolio Status In City (Priority: P1)

- [X] T005 [US1] Adapt `src/features/city-view/scene/CityProjectOperationsStatusService.ts` to derive city status badges from portfolio summaries
- [X] T006 [US1] Extend status tests for Active, Idle, Needs Attention or Blocked, Recently Completed, Disconnected, and latest-run contamination in `src/features/city-view/scene/CityProjectOperationsStatusService.test.ts`
- [X] T007 [US1] Update compact visual treatment labels/colors in `src/features/city-view/scene/layers/CityBuildingLayer.ts`
- [X] T008 [US1] Update rendering tests in `src/features/city-view/scene/layers/CityBuildingLayer.test.ts`

## Phase 4: User Story 2 - Select A Company For Summary (Priority: P2)

- [X] T009 [US2] Enhance city building prompt to show project operations summary from the current building status in `src/features/city-view/scene/buildings/BuildingInteractionPrompt.ts`
- [X] T010 [US2] Add prompt summary tests in `src/features/city-view/scene/buildings/BuildingInteractionPrompt.test.ts`
- [X] T011 [US2] Wire city scene prompt updates to selected/active building portfolio status in `src/features/city-view/scene/CityWorldScene.ts`

## Phase 5: User Story 3 - Filter Portfolio Companies (Priority: P3)

- [X] T012 [US3] Expose pure filter helpers and filtered summary selection in `src/features/city-view/scene/PortfolioOperationsService.ts`
- [X] T013 [US3] Verify filter helpers do not mutate project state in `src/features/city-view/scene/PortfolioOperationsService.test.ts`

## Phase 6: User Story 4 - Re-enter Exact Project Context (Priority: P4)

- [X] T014 [US4] Ensure city entry requests remain canonical-project keyed and unavailable summaries cannot create competing selected project state in `src/features/city-view/scene/buildings/BuildingTransitionController.ts`
- [X] T015 [US4] Add re-entry/canonical context tests in `src/features/city-view/scene/buildings/BuildingTransitionController.test.ts`

## Phase 7: Polish & Cross-Cutting

- [X] T016 Document runtime visual evidence expectations in `specs/140-project-portfolio-operations/runtime-verification.md`
- [X] T017 Run targeted tests for modified services and rendering surfaces
- [X] T018 Run `git diff --check`

## Dependencies

- Phase 1 before Phase 2.
- Phase 2 before all user story phases.
- US1 before US2 city prompt wiring.
- US3 filter helpers depend on foundational summary mapping.
- US4 depends on canonical portfolio summary behavior.

## Implementation Strategy

Implement the portfolio aggregation service first, then adapt existing city status rendering, selection prompt summary, pure filtering, and re-entry tests incrementally. Keep every step project-scoped and avoid autonomous ADOS behavior.
