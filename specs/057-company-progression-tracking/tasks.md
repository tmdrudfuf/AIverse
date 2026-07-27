# Tasks: Company Progression Tracking

**Input**: Design documents from `specs/057-company-progression-tracking/` (spec.md, plan.md)

**Tests**: Included — spec.md's Success Criteria (SC-002) explicitly requires new automated tests, and no test file currently exists for this service.

**Organization**: Single cohesive change (one service, one behavior); tasks are grouped by user story per spec.md priorities, but all three stories are implemented by the same rewrite since they share one algorithm.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to spec.md User Story 1/2/3

## Phase 1: Setup

- [X] T001 Confirm no existing test fixture combines `activeEmployees >= 5` with a completed (`"Done"`) task in the same scenario, across `src/features/city-view/scene/office/**/*.test.ts` (verified during spec research: `OfficeProjectPortalController.*.test.ts` files use 1-2 employees each; the only `status: "Done"` fixture is paired with 2 employees). No code change — this gates that the rewrite is a safe, non-breaking change.

## Phase 2: Foundational

- [X] T002 Read current `src/features/city-view/scene/office/progression/CompanyProgressionService.ts` and `CompanyProgressionTypes.ts` in full to confirm the exact static data (zone lists, `maxEmployees`, `layoutId`, milestone ids/labels/targets) that must be preserved byte-for-byte during the rewrite.

## Phase 3: User Story 1 - Company levels up as it grows (Priority: P1) 🎯 MVP

**Goal**: `resolveCurrentCompanyLevel`/`getProgressionSnapshot` compute a real level from `activeEmployees`/`completedProjects`.

**Independent Test**: Unit tests calling `getProgressionSnapshot` with inputs at/around each level's thresholds.

### Tests for User Story 1

- [ ] T003 [P] [US1] In new `src/features/city-view/scene/office/progression/CompanyProgressionService.test.ts`: test `getProgressionSnapshot({})` (and no-arg call) resolves `companyLevel: 1` with the existing garage-startup zones/layout/maxEmployees.
- [ ] T004 [P] [US1] Same file: test `{ activeEmployees: 5, completedProjects: 1 }` resolves `companyLevel: 2`, `maxEmployees: 10`, `layoutId: "small-office-level-2"`, and includes `"reception"`/`"storage"` in `unlockedOfficeZones`.
- [ ] T005 [P] [US1] Same file: test `{ activeEmployees: 6, completedProjects: 0 }` (only one of two level-2 milestones met) stays at `companyLevel: 1`.
- [ ] T006 [P] [US1] Same file: test `{ activeEmployees: 20, completedProjects: 10 }` resolves the highest defined level (`companyLevel: 4`), not beyond it.
- [ ] T007 [P] [US1] Same file: test that inputs exactly equal to a milestone's `targetValue` count as met (boundary, not "almost met").

### Implementation for User Story 1

- [ ] T008 [US1] Rewrite `CompanyProgressionService.ts`: add a private milestone-metric table (see plan.md "Milestone metric mapping") and an `evaluateMilestones(milestones, input)` helper computing real `currentValue`/`isMet` per milestone.
- [ ] T009 [US1] Same file: rewrite `resolveCurrentCompanyLevel(input)` to walk levels 2→4 ascending, advancing only while all of a level's milestones evaluate as met (sequential, no skipping — depends on T008).
- [ ] T010 [US1] Same file: update `getProgressionSnapshot(input)` to use the new `resolveCurrentCompanyLevel(input)` result for the base snapshot (depends on T009).

**Checkpoint**: `getProgressionSnapshot` reports real levels; T003-T007 pass.

---

## Phase 4: User Story 2 - Real milestone progress is visible (Priority: P2)

**Goal**: The snapshot's `requiredMilestones` show live progress toward the *next* level, empty at the max level.

**Independent Test**: Unit tests asserting `requiredMilestones` contents at partial progress and at the max level.

### Tests for User Story 2

- [ ] T011 [P] [US2] Same test file: test `{ activeEmployees: 3, completedProjects: 0 }` at level 1 returns `requiredMilestones` containing `hire-five-employees` with `currentValue: 3, targetValue: 5, isMet: false`.
- [ ] T012 [P] [US2] Same test file: test that once all of level 2's milestones are met (company is level 2), `requiredMilestones` describes level 3's milestones (real values), not the already-met level-2 ones.
- [ ] T013 [P] [US2] Same test file: test that at the highest defined level (level 4, all its milestones met), `requiredMilestones` is `[]`.

### Implementation for User Story 2

- [ ] T014 [US2] In `getProgressionSnapshot(input)`, after resolving the current level, evaluate the *next* level's static `requiredMilestones` (if any) against `input` and use that as the returned snapshot's `requiredMilestones`; return `[]` when no next level is defined (depends on T008-T010).

**Checkpoint**: T011-T013 pass; dashboard/project-dashboard consumers (unmodified) now receive live milestone data through this field.

---

## Phase 5: User Story 3 - Future levels stay visible ahead of time (Priority: P3)

**Goal**: `getFutureProgressionMetadata(input)` returns real, evaluated data for levels beyond current.

**Independent Test**: Unit test calling `getFutureProgressionMetadata` at level 1 and confirming all returned levels are `> 1` with real (non-hardcoded-zero) milestone evaluation.

### Tests for User Story 3

- [ ] T015 [P] [US3] Same test file: test `getFutureProgressionMetadata({ activeEmployees: 0, completedProjects: 0 })` returns snapshots for levels 2, 3, 4 only, each with milestones evaluated (all `isMet: false`, real `currentValue: 0`).
- [ ] T016 [P] [US3] Same test file: test `getFutureProgressionMetadata({ activeEmployees: 5, completedProjects: 1 })` (now effectively level 2) returns only levels 3 and 4.

### Implementation for User Story 3

- [ ] T017 [US3] Update `getFutureProgressionMetadata(input)` signature to accept `input: CompanyProgressionInput = {}`, resolve the current level via T009's logic, and evaluate each returned level's own `requiredMilestones` against `input` (depends on T008-T009).

**Checkpoint**: T015-T016 pass. All public methods on the service now consume real input.

---

## Phase 6: Polish & Regression Safety

- [ ] T018 [P] Re-run the pre-existing suites identified in T001 (`OfficeProjectPortalController.employee-ai.test.ts`, `OfficeProjectPortalController.employee-insight.test.ts`, `OfficeProjectPortalController.company-influence.test.ts`, `OfficeProjectPortalController.work-simulation.test.ts`, `OfficeProjectPortalController.project-dashboard.test.ts`, `OfficeProjectPortalController.employee-knowledge.test.ts`) to confirm zero regressions from the rewrite.
- [ ] T019 Run `npm test` (focused: `vitest run src/features/city-view/scene/office/progression`, then full `npm test` before final review) to confirm the full suite is green.
- [ ] T020 Run `npx tsc --noEmit` to confirm no type regressions (return shapes unchanged; `getFutureProgressionMetadata` signature change has zero existing callers, verified in plan.md).
- [ ] T021 Manually walk `quickstart.md` once implementation is complete.

## Dependencies & Execution Order

- Phase 1 (T001) and Phase 2 (T002) are read-only checks — no dependencies, can run first.
- All test tasks (T003-T007, T011-T013, T015-T016) can be written in parallel in the same new file before implementation (they will fail until T008-T010, T014, T017 land).
- Implementation tasks are sequential within `CompanyProgressionService.ts` (T008 → T009 → T010 → T014 → T017), since each builds on the previous evaluation helper.
- Phase 6 depends on all prior phases.

## Notes

- All tasks touch at most two files (`CompanyProgressionService.ts`, `CompanyProgressionService.test.ts`); the `[P]` markers above reflect that multiple test cases can be drafted concurrently within that one new test file, not that they touch different files.
- No task modifies `OfficeProjectPortalController.ts`, either dashboard provider, `OfficeLayoutService.ts`, or `EmployeeKnowledgeService.ts` — per spec.md Out of Scope.
