# Tasks: Real Project Company Binding

**Input**: Design documents from `/specs/137-real-project-company-binding/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by authoritative Spec 137 requirements.

## Phase 1: Setup

- [X] T001 Create Spec 137 documentation artifacts in specs/137-real-project-company-binding/
- [X] T002 Point .specify/feature.json and AGENTS.md Spec Kit pointer at Spec 137

## Phase 2: Foundational

- [X] T003 Add project-company binding types/service using existing project registry in src/features/city-view/scene/office/project-company-binding/
- [X] T004 Extend city building and office spawn types with project binding metadata in src/features/city-view/scene/buildings/buildingTypes.ts and src/features/city-view/scene/office/officeTypes.ts
- [X] T005 Bind existing city companies to registered project ids in src/features/city-view/scene/config/cityBuildingConfig.ts

## Phase 3: User Story 1 - Enter Bound Project Company (Priority: P1)

**Goal**: Entering a company sets active project context to its bound registered project.

**Independent Test**: A company bound to Project A opens the office with Project A selected and displayed.

- [X] T006 [P] [US1] Add binding service tests for stable project resolution in src/features/city-view/scene/office/project-company-binding/ProjectCompanyBindingService.test.ts
- [X] T007 [US1] Pass bound project context through BuildingTransitionController in src/features/city-view/scene/buildings/BuildingTransitionController.ts
- [X] T008 [US1] Resolve office display identity from active project context in src/features/city-view/scene/office/OfficeSpawnManager.ts
- [X] T009 [US1] Initialize OfficeProjectPortalController to active bound project in src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Phase 4: User Story 2 - Switch Isolated Project Companies (Priority: P2)

**Goal**: Project A state never appears in Project B after switching companies.

**Independent Test**: Two project ids with distinct ADOS states show isolated status/live visualization.

- [X] T010 [P] [US2] Add portal binding isolation tests in src/features/city-view/scene/office/OfficeProjectPortalController.project-company-binding.test.ts
- [X] T011 [US2] Scope live visualization and employee office state to the active project context in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [X] T012 [US2] Ensure Project Dashboard/Status opens the active bound project by default in src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Phase 5: User Story 3 - Persist And Recover Bindings (Priority: P3)

**Goal**: Bindings survive reload and stale bindings fail safely.

**Independent Test**: Browser-session project registry restore keeps binding identity, and missing/stale bindings show unavailable state.

- [X] T013 [P] [US3] Add browser-session binding persistence coverage in src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
- [X] T014 [US3] Persist project-company binding metadata through existing browser session state in src/features/city-view/scene/office/browser-session/
- [X] T015 [US3] Add missing project/path unavailable handling in src/features/city-view/scene/office/project-company-binding/ProjectCompanyBindingService.ts

## Phase 6: Polish & Cross-Cutting

- [X] T016 Verify Spec 135 office rendering remains layout-compatible with shared office definitions
- [X] T017 Verify Spec 136 role/provider separation remains project-scoped
- [X] T018 Run focused tests and git diff --check; do not run the full ADOS validation pipeline in this runtime

## Dependencies & Execution Order

- Phase 1 before application code.
- Phase 2 before user stories.
- US1 before US2 and US3 because it establishes active context.
- US2 and US3 can be validated independently after US1.

## Implementation Strategy

Implement the smallest binding/context layer that bridges city selection to existing project registry and portal state. Reuse existing project-id keyed ADOS collections and dashboard/live visualization inputs.
