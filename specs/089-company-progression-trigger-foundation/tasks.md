# Tasks: Spec 089

**Input**: Design documents from `/specs/089-company-progression-trigger-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 089 artifact state.
- [X] T002 Create Spec 089 Spec Kit artifacts for company progression trigger foundation.

## Phase 2: Foundational

- [X] T003 Verify ignore/config baseline for the Node/TypeScript project in `.gitignore`.

## Phase 3: User Story 1 - Detect Company Level-Up Triggers (Priority: P1)

**Goal**: Produce a stable structured trigger when company progression crosses an upward level threshold.

**Independent Test**: Compare level-1 and level-2 progression snapshots and confirm exactly one copied trigger is produced.

- [X] T004 [US1] Add company progression trigger types in `src/features/city-view/scene/office/progression/CompanyProgressionTypes.ts`.
- [X] T005 [US1] Implement trigger evaluation in `src/features/city-view/scene/office/progression/CompanyProgressionTriggerService.ts`.
- [X] T006 [US1] Add focused level-up and no-duplicate tests in `src/features/city-view/scene/office/progression/CompanyProgressionTriggerService.test.ts`.

## Phase 4: User Story 2 - Preserve Multi-Level Progression Context (Priority: P2)

**Goal**: Preserve every newly reached level when a single refresh jumps across multiple levels.

**Independent Test**: Compare level 1 to level 4 and confirm triggers for levels 2, 3, and 4 in order.

- [X] T007 [US2] Add multi-level jump and regression coverage in `src/features/city-view/scene/office/progression/CompanyProgressionTriggerService.test.ts`.
- [X] T008 [US2] Ensure trigger service filters and orders reached snapshots by reached level in `src/features/city-view/scene/office/progression/CompanyProgressionTriggerService.ts`.

## Phase 5: User Story 3 - Surface Latest Triggers Through Portal State (Priority: P3)

**Goal**: Store latest computed progression triggers in portal state during company dashboard refresh without visible UI changes.

**Independent Test**: Read `companyProgressionTriggers` after dashboard refresh and confirm it reflects latest evaluated triggers.

- [X] T009 [US3] Add `companyProgressionTriggers` to `ProjectPortalState` in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and initialize it in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`.
- [X] T010 [US3] Wire trigger evaluation into company dashboard refresh in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.

## Phase 6: Validation and Handoff

- [ ] T011 Run focused validation outside this runtime per ADOS handoff policy.
- [ ] T012 Run full ADOS validation outside this runtime per handoff policy.
- [ ] T013 Commit, review, publish, merge, deploy, or remote operations outside this runtime only.

## Dependencies & Execution Order

- T001-T003 before T004.
- T004 before T005.
- T006 after T004-T005.
- T007 before T008.
- T009 before T010.
- T011-T013 remain intentionally unchecked in this runtime.

## Implementation Strategy

Complete the trigger foundation first, then portal state wiring. Do not run validation or review from this runtime.
