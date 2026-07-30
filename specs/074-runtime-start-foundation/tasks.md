# Tasks: Runtime Start Foundation

**Input**: Design documents from `/specs/074-runtime-start-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the feature specification.

## Phase 1: Setup

- [x] T001 Update `.specify/feature.json` and `AGENTS.md` pointers for Spec 074.

---

## Phase 2: Foundational

- [x] T002 [P] Add Runtime Start domain model and defensive-copy helpers in `src/features/city-view/scene/office/runtime-start/RuntimeStartTypes.ts`.
- [x] T003 [P] Add Runtime Start dashboard formatter in `src/features/city-view/scene/office/runtime-start/RuntimeStartView.ts`.
- [x] T004 Add Runtime Start service validation, idempotency, and atomic collection behavior in `src/features/city-view/scene/office/runtime-start/RuntimeStartService.ts`.

---

## Phase 3: User Story 1 - Record Runtime Start (Priority: P1)

**Goal**: Explicit human action records one Runtime Start after current Ready preflight.

**Independent Test**: Valid chain creates Started with executionStarted true and all agent/mutation flags false.

- [x] T005 [P] [US1] Add Runtime Start service creation and identity tests in `src/features/city-view/scene/office/runtime-start/RuntimeStartService.test.ts`.
- [x] T006 [US1] Integrate Runtime Start service into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T007 [US1] Add project state and registry fields for Runtime Start collections in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`.

---

## Phase 4: User Story 2 - Block Stale or Unsafe Starts (Priority: P2)

**Goal**: Stale plans, approvals, preflights, actor labels, and changed runtime evidence block Runtime Start.

**Independent Test**: Previously Ready preflight becomes Blocked after current-state change and creates no Runtime Start.

- [x] T008 [P] [US2] Add stale, idempotency, project-isolation, and no-execution service tests in `src/features/city-view/scene/office/runtime-start/RuntimeStartService.test.ts`.
- [x] T009 [US2] Add controller transition and upstream-block regression coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`.

---

## Phase 5: User Story 3 - Display Runtime Start Safely (Priority: P3)

**Goal**: Dashboard displays unavailable, available, blocked, and started states without agent-running claims.

**Independent Test**: View tests assert safe wording and priority-aware row preservation.

- [x] T010 [P] [US3] Add Runtime Start view tests in `src/features/city-view/scene/office/runtime-start/RuntimeStartView.test.ts`.
- [x] T011 [US3] Integrate Runtime Start rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [x] T012 [US3] Add dashboard layout regression coverage in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`.

---

## Final Phase: Polish & Validation

- [x] T013 Run focused Runtime Start tests and record counts.
- [x] T014 Run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.
- [x] T015 Complete task checkboxes after implementation and validation evidence exists.
- [x] T016 Commit complete implementation and run independent Claude review until Approved.

## Dependencies & Execution Order

- Phase 1 precedes all implementation.
- Phase 2 blocks all user stories.
- User Stories 1, 2, and 3 can be validated independently after foundational service behavior exists.
- Final validation and independent review happen after every task is complete.

## Parallel Opportunities

- T002 and T003 can run in parallel.
- T005, T008, and T010 can be drafted in parallel after T004.

## Implementation Strategy

Deliver the Runtime Start domain first, then controller integration, then dashboard rows and layout regression tests. Keep every mutation scoped to Spec 074 files and existing portal integration points.
