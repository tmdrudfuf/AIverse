# Tasks: Assigned Task Work Session Preparation Foundation

**Input**: Design documents from `specs/068-assigned-task-work-session-preparation-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused tests are required by the feature specification.

## Phase 1: Setup

- [x] T001 Update `.specify/feature.json` to point at `specs/068-assigned-task-work-session-preparation-foundation`
- [x] T002 Update the Spec Kit pointer in `AGENTS.md` to `specs/068-assigned-task-work-session-preparation-foundation/plan.md`

---

## Phase 2: Foundational

- [x] T003 [P] Create prepared-session domain types and copy helpers in `src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionTypes.ts`
- [x] T004 [P] Add type/immutability tests in `src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionTypes.test.ts`
- [x] T005 Create preparation service in `src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionService.ts`
- [x] T006 Add service eligibility, idempotency, atomicity, conflict, and safety tests in `src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionService.test.ts`

---

## Phase 3: User Story 1 - Prepare a Confirmed Assignment (Priority: P1)

**Goal**: Explicitly prepare one valid confirmed assignment without starting work.

**Independent Test**: Service and controller tests create one prepared-session record while task and employee state remain unchanged.

- [x] T007 [US1] Add prepared-session state fields to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [x] T008 [US1] Initialize prepared-session state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [x] T009 [US1] Wire `PreparedWorkSessionService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T010 [US1] Add controller tests for explicit preparation, no auto-preparation, and repeated command idempotency in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 4: User Story 2 - Block Unsafe or Stale Preparation (Priority: P2)

**Goal**: Reject stale, unavailable, conflicting, started, completed, or mismatched inputs without mutation.

**Independent Test**: Service and controller tests verify blocked results and unchanged inputs.

- [x] T011 [US2] Implement command-time validation for task, assignment, employee, provenance, active sessions, stores, and project scope in `PreparedWorkSessionService.ts`
- [x] T012 [US2] Add project-switch, input-boundary, active-session, stale-assignment, employee-conflict, and no-subprocess controller tests in `OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 5: User Story 3 - Review Preparation State on the Dashboard (Priority: P3)

**Goal**: Display bounded low-priority preparation rows with safe non-execution wording.

**Independent Test**: View tests render preparation rows and crowded layouts without overlap.

- [x] T013 [P] Create dashboard row formatter in `src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionView.ts`
- [x] T014 [P] Add formatter tests in `src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionView.test.ts`
- [x] T015 [US3] Integrate preparation rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [x] T016 [US3] Add dashboard rendering and low-priority layout regression tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Polish & Validation

- [x] T017 Run focused prepared-session and controller/view tests
- [x] T018 Run `npm test`
- [x] T019 Run `npx tsc --noEmit`
- [x] T020 Run `npm run build`
- [x] T021 Run `git diff --check` and `git diff --cached --check`
- [x] T022 Commit complete implementation and run exact-HEAD independent review

## Dependencies & Execution Order

- Phase 1 precedes all code changes.
- Phase 2 blocks all user stories.
- US1 provides the core preparation path.
- US2 extends validation and safety.
- US3 depends on the result collection shape from US1.
- Phase 6 follows all implementation tasks.

## Parallel Opportunities

- T003 and T004 can be developed together.
- T013 and T014 can be developed together after result types exist.
- Service failure tests can be expanded independently from view tests.

## Implementation Strategy

1. Build the immutable domain and service first.
2. Wire one explicit controller action after confirmed assignment.
3. Add dashboard rows as a low-priority optional display.
4. Validate focused tests, then full suite.
