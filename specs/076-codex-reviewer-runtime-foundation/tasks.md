---
description: "Task list for Spec 076 — Codex Reviewer Runtime Foundation"
---

# Tasks: Codex Reviewer Runtime Foundation

**Input**: Design documents from `/specs/076-codex-reviewer-runtime-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the feature specification.

## Phase 1: Setup

- [X] T001 Update `.specify/feature.json` and the `AGENTS.md` `<!-- SPECKIT START/END -->` pointer block to reference `specs/076-codex-reviewer-runtime-foundation/plan.md`.

---

## Phase 2: Foundational

- [X] T002 [P] Add Reviewer Runtime domain model, deterministic IDs, and defensive-copy helpers in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeTypes.ts`.
- [X] T003 [P] Add the provider-neutral `ReviewerRuntimeProvider` interface in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeProvider.ts`.
- [X] T004 [P] Add the deterministic, zero-I/O `ReviewTarget` resolver (always `Uncommitted` in this repository — see plan.md, Architecture Decision 1) in `src/features/city-view/scene/office/reviewer-runtime/ReviewTarget.ts`.
- [X] T005 Add `CodexReviewerRuntimeProvider` (guarded dynamic `node:child_process` import behind a second, Reviewer-specific spawn-allow env var, timeout-bounded `spawnSync`, safety checks reused from `isSafeCommandLine`/`isSafeImplementerCommandLine`, bounded/sanitized evidence mapping) in `src/features/city-view/scene/office/reviewer-runtime/CodexReviewerRuntimeProvider.ts`.
- [X] T006 [P] Add deterministic `ReviewerPrompt` construction (bounded, secret-free, diff-free, negative-allowlist-tested) in `src/features/city-view/scene/office/reviewer-runtime/ReviewerPrompt.ts`.
- [X] T007 [P] Add `ReviewDecisionParser` (bounded decision/finding parsing, conflicting-marker and non-zero-exit downgrade rules) in `src/features/city-view/scene/office/reviewer-runtime/ReviewDecisionParser.ts`.
- [X] T008 Add `ReviewerRuntimeService` (full revalidation chain including Implementer Runtime completion, explicit role-binding verification, review-target resolution + Exact-HEAD Gate, duplicate-active-attempt guard, approved-command-config check, prompt construction hookup) in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeService.ts`.

---

## Phase 3: User Story 1 - Start the Codex Reviewer Runtime (Priority: P1)

**Goal**: A distinct explicit human action, after full revalidation (including a Completed Implementer Runtime) and an approved role binding, resolves a review target and safely invokes the exact configured Codex command, producing exactly one bounded terminal result with a status kept strictly separate from its decision.

**Independent Test**: Valid chain through a Completed Implementer Runtime with an approved Claude=Implementer/Codex=Reviewer binding, explicit Start-Reviewer action, exactly one result with a truthful status, a separate decision, and `validationStarted`/`githubMutationStarted` false.

- [X] T009 [P] [US1] Add `ReviewerRuntimeTypes` identity/immutability tests in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeTypes.test.ts`.
- [X] T010 [P] [US1] Add `CodexReviewerRuntimeProvider` tests (exact command/argument equivalence, success/timeout/spawn-failure/non-zero-exit mapping, output truncation/sanitization, browser-guard `Blocked` path, spawn-allow env-var gate) in `src/features/city-view/scene/office/reviewer-runtime/CodexReviewerRuntimeProvider.test.ts`.
- [X] T011 [P] [US1] Add `ReviewDecisionParser` tests (explicit-marker precedence, conflicting-marker downgrade, blocking-finding downgrade, non-zero-exit downgrade, finding bounds/sanitization) in `src/features/city-view/scene/office/reviewer-runtime/ReviewDecisionParser.test.ts`.
- [X] T012 [US1] Add `ReviewerRuntimeService` tests (validation order, explicit-action-only invocation, Exact-HEAD Gate, service-level result mapping) in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeService.test.ts`.
- [X] T013 [US1] Add the `startReviewerPressed` field to `OfficeProjectPortalInput` and update every existing controller test's input factory in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` and its existing `*.test.ts` files.
- [X] T014 [US1] Add Reviewer Runtime collections to `ProjectPortalState` and `createProjectPortalState()` in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`.
- [X] T015 [US1] Wire `ReviewerRuntimeService`/`CodexReviewerRuntimeProvider` construction and `startReviewerRuntimeForPromotion` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, dispatched only from `input.startReviewerPressed`.
- [X] T016 [US1] Add `KeyR`/"Start Reviewer" input wiring, distinct from `KeyI`/Start-Implementer, in `src/features/city-view/scene/office/OfficeActionInputController.ts`.

---

## Phase 4: User Story 2 - Block Stale, Mismatched, Uncommitted, or Unsafe Starts (Priority: P2)

**Goal**: Stale upstream state, a non-Completed or stale Implementer Runtime, an unapproved role binding, an uncommitted review target, an unsafe/mismatched command, or an active duplicate attempt all block before any provider invocation.

**Independent Test**: Individually stale/mismatch each upstream layer, the Implementer Runtime, and the role binding; construct an uncommitted review target; verify each blocks with a distinct reason code and zero provider invocations.

- [X] T017 [P] [US2] Add Implementer Runtime revalidation tests (missing, non-Completed, stale-because-already-started-Reviewer/Validation/GitHub-mutation all block) in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeService.test.ts`.
- [X] T018 [P] [US2] Add role-binding tests (approved binding passes; default-mapping-does-not-override; Claude-as-Reviewer blocks; Codex-as-Implementer-only blocks; same-agent-both-roles blocks; generic-label mismatch blocks) in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeService.test.ts`.
- [X] T019 [P] [US2] Add Exact-HEAD Gate tests (always-`Uncommitted` resolution blocks; a directly constructed `Clean` fixture passes the gate) in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeService.test.ts` and `ReviewTarget.test.ts`.
- [X] T020 [P] [US2] Add working-directory/command-safety tests (correct worktree passes; foreign-worktree/branch/spec-path mismatches block; unsafe command/shell-chaining/substitution/encoded-command/traversal/unsafe-redirection blocks; no bypass via a substituted `--version` command) in `src/features/city-view/scene/office/reviewer-runtime/CodexReviewerRuntimeProvider.test.ts`.
- [X] T021 [US2] Add concurrency/duplicate-start tests (active attempt blocks a second start; one provider invocation per explicit action; no automatic retry after a terminal result) in `src/features/city-view/scene/office/OfficeProjectPortalController.reviewer-runtime.test.ts`.
- [X] T022 [US2] Extend the shared invalidation helper in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` to also delete the project's Reviewer Runtime collections, with a regression test proving a stale plan or a stale Implementer Runtime clears the Reviewer Runtime record.
- [X] T023 [US2] Add project-isolation tests (foreign project/plan/Implementer Runtime/review target/provider-evidence never cross-resolve; matching raw IDs across projects stay isolated) in `src/features/city-view/scene/office/OfficeProjectPortalController.reviewer-runtime.test.ts`.

---

## Phase 5: User Story 3 - Display Reviewer Runtime State Safely (Priority: P3)

**Goal**: The dashboard shows every Reviewer Runtime state with safe wording, and the new row never overlaps the drawn panel alongside the existing Runtime Start and Implementer Runtime rows.

**Independent Test**: View tests assert safe wording for every state and a realistic full-layout regression test proves `[RUNTIME START]`, `[IMPLEMENTER RUNTIME]`, and `[REVIEWER RUNTIME]` all render inside the drawn panel.

- [X] T024 [P] [US3] Add `ReviewerRuntimeView` (row-text construction, per-status/decision wording) and its tests in `src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeView.ts` and `ReviewerRuntimeView.test.ts`.
- [X] T025 [US3] Integrate `[REVIEWER RUNTIME]` rows (`dropPriority: 16`, `usePriorityFit: true`) into `createProjectDashboardLowerRows` in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [X] T026 [US3] Add the realistic full-layout regression test (`[RUNTIME START]`, `[IMPLEMENTER RUNTIME]`, and `[REVIEWER RUNTIME]` present, containment-helper-verified, not presence-only) in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`.

---

## Final Phase: Polish & Validation

- [X] T027 Extract shared, non-suite-specific controller test helpers into `src/features/city-view/scene/office/OfficeProjectPortalController.testHelpers.ts` (a plain module, not `*.test.ts`) so the Reviewer Runtime controller test file does not import from and re-register the Implementer Runtime controller test file's `describe` blocks.
- [X] T028 Run focused Reviewer Runtime tests (`quickstart.md`'s focused-test command) and record exact file/test counts.
- [X] T029 Run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.
- [X] T030 Complete every task checkbox above (this file) before the commit that will be submitted for independent review — not after — so no post-approval documentation-only recommit is needed.
- [ ] T031 Commit the complete implementation and run an independent Codex CLI review (Codex = Reviewer, Claude = Implementer, per the approved role swap) until Approved on the exact committed HEAD, fixing every blocking finding and re-validating/re-reviewing as needed.

## Dependencies & Execution Order

- Phase 1 precedes all implementation.
- Phase 2 blocks all user stories.
- User Stories 1, 2, and 3 can be validated independently after foundational service/provider behavior exists, but US1's controller/registry wiring (T013-T016) must land before US2/US3's controller-level tests can run.
- T027 (test-helper extraction) must land before or alongside T021/T023 (the controller-level Reviewer Runtime tests that would otherwise duplicate the Implementer Runtime test file's suite).
- Final validation and independent review happen after every task, including T030, is complete.

## Parallel Opportunities

- T002, T003, T004, and T006 can run in parallel.
- T009, T010, T011 can be drafted in parallel after T002-T005.
- T017, T018, T019, T020 can be drafted in parallel after T008.
- T024 can be drafted in parallel with Phase 4.

## Implementation Strategy

Deliver the Reviewer Runtime domain (types, provider, review target, prompt, decision parser, service) first, with the five empirically-grounded architecture decisions already resolved before writing any of this code. Then controller/registry integration, then dashboard rows and the full-layout regression test. Keep every mutation scoped to Spec 076's new files plus the minimal, precisely-targeted existing-file edits `plan.md` documents (input type, invalidation helper, dashboard row assembly) — no unrelated refactor of Execution Plan/Readiness/Approval/Preflight/Runtime Start/Implementer Runtime.
