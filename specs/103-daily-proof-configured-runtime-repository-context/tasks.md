# Tasks: Daily Proof Configured Runtime Repository Context

**Input**: Design documents from `specs/103-daily-proof-configured-runtime-repository-context/`

**Tests**: Included for configured portal state, execution-plan repository context, and branch mismatch behavior. Validation is not run from this ADOS runtime.

## Phase 1: Setup

**Purpose**: Restore active Spec Kit pointers for spec 103.

- [X] T001 Update `.specify/feature.json` and `AGENTS.md` to point at `specs/103-daily-proof-configured-runtime-repository-context/plan.md`

---

## Phase 2: Foundational

**Purpose**: Add configured Daily Proof runtime metadata before controller consumption.

- [X] T002 Add default Daily Proof local repository binding in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T003 [P] Update configured binding expectations in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts`

---

## Phase 3: User Story 1 - Use the configured Daily Proof worktree for runtime planning (Priority: P1)

**Goal**: Execution plans and runtime starts preserve configured repository root, worktree, branch, and spec context.

**Independent Test**: Drive Daily Proof through execution-plan creation and read back exact configured metadata.

- [X] T004 [US1] Update execution-plan feature/spec constants and repository-context resolution in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T005 [P] [US1] Update controller runtime-chain fixtures in `src/features/city-view/scene/office/OfficeProjectPortalController.testHelpers.ts`
- [X] T006 [P] [US1] Update execution-plan creation expectations in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 4: User Story 2 - Preserve stale-context blocking (Priority: P2)

**Goal**: Missing branch evidence can use configured branch context, but explicit branch mismatch still blocks.

**Independent Test**: Omit repository snapshot branch and confirm plan creation succeeds; provide mismatched branch and confirm branch blocking.

- [X] T007 [US2] Allow configured branch context when repository snapshots omit `currentBranch` in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.ts`
- [X] T008 [P] [US2] Add branch-evidence tests in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts`

---

## Phase 5: Polish

- [X] T009 Confirm no feature code imports `fs`, `child_process`, or `node:*`, and do not run validation from this runtime
- [X] T010 Mark all completed tasks in `specs/103-daily-proof-configured-runtime-repository-context/tasks.md`

## Dependencies & Execution Order

- Phase 1 before implementation.
- Phase 2 blocks controller consumption.
- User Story 1 is the MVP.
- User Story 2 depends on repository-context resolution.

## Implementation Strategy

Implement sequentially in task order. Mark each task complete in this file after its edit is made.
