# Tasks: Review Fix Request Foundation

**Input**: Design documents from `specs/079-review-fix-request-foundation/`

## Phase 1: Setup

- [x] T001 Verify feature worktree and branch are isolated from primary main.
- [x] T002 Confirm Spec Kit artifacts exist: spec, plan, data model, contract, quickstart, tasks.

## Phase 2: Domain Model

- [x] T003 Add Review Fix Request types, deterministic IDs, copy helpers, and collections.
- [x] T004 Add Review Fix Request service with classification reuse, actor validation, exact-context binding, idempotency, and blocked results.
- [x] T005 Add view formatter for safe `[REVIEW FIX REQUEST]` wording.

## Phase 3: State and Controller Integration

- [x] T006 Add per-project request/result collections to portal state and registry defaults.
- [x] T007 Add a distinct controller input action for requesting review fixes.
- [x] T008 Wire controller command handling through the new service without starting agents, subprocesses, validation runtime, repository mutation, or GitHub mutation.

## Phase 4: Dashboard Integration

- [x] T009 Render Review Fix Request rows using the existing review decision resolver and priority-aware lower-panel behavior.
- [x] T010 Preserve Review Decision, Review Promotion, runtime, source, sync, focus, task, employee, and repository rows.

## Phase 5: Tests

- [x] T011 Add service tests for deterministic IDs, successful request, blocked states, actor rejection, idempotency, stale repeat, immutability, project isolation, and no-mutation flags.
- [x] T012 Add view tests for unavailable, requestable, recorded, blocked, and no-execution wording.
- [x] T013 Add controller tests for explicit action, no automatic request, no request on Approved/Unknown/stale states, and no duplicate on repeat.
- [x] T014 Add layout/row regression coverage where touched.

## Phase 6: Documentation Completion

- [x] T015 Update AGENTS.md Spec Kit pointer according to repository convention.
- [x] T016 Mark tasks complete only after implementation and validation evidence exists.

## Phase 7: Validation and Review

- [x] T017 Run focused tests and record counts.
- [x] T018 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`.
- [ ] T019 Commit local implementation.
- [ ] T020 Run independent Claude review against exact HEAD.
- [ ] T021 Fix blocking findings, revalidate, recommit, and re-review until Approved.
- [ ] T022 Verify exact-head gate: approved review SHA equals validated SHA equals current HEAD, with clean working tree.
