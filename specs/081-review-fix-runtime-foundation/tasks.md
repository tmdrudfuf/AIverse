# Tasks: Review Fix Runtime Foundation

**Input**: Design documents from `/specs/081-review-fix-runtime-foundation/`  
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [x] T001 Verify Spec 081 branch/worktree and baseline main HEAD.
- [x] T002 Create Spec 081 Spec Kit artifacts and point `.specify/feature.json` at Spec 081.
- [x] T003 Inspect existing Review Fix Plan, Review Fix Request, Review Decision, Implementer Runtime, Reviewer Runtime, controller, registry, view, and input patterns.

## Phase 2: Foundation

- [x] T004 Add Review Fix Runtime domain types, statuses, reasons, deterministic IDs, evidence, command, runtime/result records, and immutable collection helpers.
- [x] T005 Add Review Fix Runtime prompt builder bound to the exact Review Fix Plan and safety exclusions.
- [x] T006 Add Review Fix Runtime provider adapter that reuses the implementer-runtime provider safety boundary.
- [x] T007 Add Review Fix Runtime service with actor-first validation, upstream revalidation, stale-context blocking, command safety checks, provider invocation, and idempotency.

## Phase 3: User Story 1 - Explicit Human Runtime Start

- [x] T008 Add controller state maps and active-attempt guard for Review Fix Runtime.
- [x] T009 Add distinct Start Review Fix Runtime input routing using `KeyX`.
- [x] T010 Add controller start path for the current Review Fix Plan without triggering validation, reviewer runtime, GitHub mutation, push, PR, Ready, merge, deploy, or cleanup.
- [x] T011 Add dashboard Review Fix Runtime row with truthful ready/blocked/completed/timed-out/failed wording and downstream-not-run wording.
- [x] T012 Add tests for valid explicit human start, no automatic start during render/refresh, successful runtime/result parity, evidence linkage, and distinct input routing.

## Phase 4: User Story 2 - Stale and Unsafe Context Blocking

- [x] T013 Add tests and service behavior for missing Review Fix Plan.
- [x] T014 Add tests and service behavior for stale Review Fix Plan and mismatched Review Fix Request.
- [x] T015 Add tests and service behavior for changed review decision and runtime chain integrity failure.
- [x] T016 Add tests and service behavior for cross-project, repository, worktree, branch, and relevant SHA mismatches.
- [x] T017 Add tests and service behavior for provider/role mismatch and unsafe command blocking before spawn.
- [x] T018 Add tests and service behavior for provider failure and timeout where supported by existing runtime pattern.
- [x] T019 Add tests proving no GitHub mutation, no push, no PR/merge/deploy, no automatic validation runtime, and no automatic reviewer runtime.

## Phase 5: User Story 3 - Idempotency and Identity

- [x] T020 Add idempotency behavior for repeated exact completed runtime start after actor/current-context revalidation.
- [x] T021 Add tests proving historical runtimes do not mask changed current context.
- [x] T022 Add tests for immutable collection behavior, deterministic ID behavior, and cross-project deterministic-ID isolation.

## Phase 6: Validation and Review

- [x] T023 Run focused tests for Review Fix Runtime, input, controller, review decision, fix request, and fix plan regressions.
- [x] T024 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`.
- [x] T025 Commit the validated implementation locally.
- [ ] T026 Run independent Claude review of the exact validated HEAD.
- [ ] T027 If required, fix blocking findings, rerun validation, commit, and request Claude re-review.
- [ ] T028 Verify exact-head gate and stop at human approval boundary.
