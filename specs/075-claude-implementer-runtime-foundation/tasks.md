---
description: "Task list for Spec 075 — Claude Implementer Runtime Foundation"
---

# Tasks: Claude Implementer Runtime Foundation

**Input**: Design documents from `/specs/075-claude-implementer-runtime-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the feature specification.

## Phase 1: Setup

- [X] T001 Update `.specify/feature.json` and the `AGENTS.md` `<!-- SPECKIT START/END -->` pointer block to reference `specs/075-claude-implementer-runtime-foundation/plan.md`.

---

## Phase 2: Foundational

- [X] T002 [P] Add Implementer Runtime domain model, deterministic IDs, and defensive-copy helpers in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeTypes.ts`.
- [X] T003 [P] Add the provider-neutral `ImplementerRuntimeProvider` interface in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeProvider.ts`.
- [X] T004 Add `ClaudeImplementerRuntimeProvider` (guarded dynamic `node:child_process` import, timeout-bounded `spawnSync`, additional command-safety checks layered on the reused `isSafeCommandLine`, bounded/sanitized evidence mapping) in `src/features/city-view/scene/office/implementer-runtime/ClaudeImplementerRuntimeProvider.ts`.
- [X] T005 Add `ImplementerRuntimeService` (full revalidation chain, explicit role-binding verification, duplicate-active-attempt guard, prompt construction hookup) in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeService.ts`.
- [X] T006 [P] Add deterministic `ImplementerPrompt` construction (bounded, secret-free, negative-allowlist-tested) in `src/features/city-view/scene/office/implementer-runtime/ImplementerPrompt.ts`.

---

## Phase 3: User Story 1 - Start the Claude Implementer Runtime (Priority: P1)

**Goal**: A distinct explicit human action, after full revalidation and an approved role binding, safely invokes the exact configured Claude command and produces exactly one bounded terminal result.

**Independent Test**: Valid chain through Runtime Start with an approved Claude=Implementer/Codex=Reviewer binding, explicit Start-Implementer action, exactly one result with a truthful status and `reviewerStarted`/`validationStarted`/`githubMutationStarted` false.

- [X] T007 [P] [US1] Add `ImplementerRuntimeTypes` identity/immutability tests in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeTypes.test.ts`.
- [X] T008 [P] [US1] Add `ClaudeImplementerRuntimeProvider` tests (exact command/argument equivalence, success/timeout/spawn-failure/non-zero-exit mapping, output truncation/sanitization, browser-guard `Blocked` path) in `src/features/city-view/scene/office/implementer-runtime/ClaudeImplementerRuntimeProvider.test.ts`.
- [X] T009 [US1] Add `ImplementerRuntimeService` tests (validation order, explicit-action-only invocation, service-level result mapping) in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeService.test.ts`.
- [X] T010 [US1] Add the `startImplementerPressed` field to `OfficeProjectPortalInput` and update every existing controller test's input factory in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` and its existing `*.test.ts` files.
- [X] T011 [US1] Add Implementer Runtime collections to `ProjectPortalState` and `createProjectPortalState()` in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`.
- [X] T012 [US1] Wire `ImplementerRuntimeService`/`ClaudeImplementerRuntimeProvider` construction and `startImplementerRuntimeForPromotion` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, dispatched only from `input.startImplementerPressed`.

---

## Phase 4: User Story 2 - Block Stale, Mismatched, or Unsafe Starts (Priority: P2)

**Goal**: Stale upstream state, an unapproved role binding, an unsafe/mismatched command, a worktree mismatch, or an active duplicate attempt all block before any provider invocation.

**Independent Test**: Individually stale/mismatch each upstream layer and the role binding; verify each blocks with a distinct reason code and zero provider invocations.

- [X] T013 [P] [US2] Add role-binding tests (approved binding passes; default-mapping-does-not-override; Codex-as-Implementer blocks; Claude-as-Reviewer blocks; same-agent-both-roles blocks; generic-label mismatch blocks) in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeService.test.ts`.
- [X] T014 [P] [US2] Add staleness tests (changed plan/approval/preflight/Runtime Start invalidates current applicability; dashboard never shows a stale completion) in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeService.test.ts`.
- [X] T015 [P] [US2] Add working-directory/command-safety tests (correct worktree passes; primary-worktree/foreign-worktree/branch/spec-path mismatches block; unsafe command/shell-chaining/substitution/encoded-command/traversal blocks; no bypass via `--version`) in `src/features/city-view/scene/office/implementer-runtime/ClaudeImplementerRuntimeProvider.test.ts`.
- [X] T016 [US2] Add concurrency/duplicate-start tests (active attempt blocks a second start; one provider invocation per explicit action; no automatic retry after a terminal result) in `src/features/city-view/scene/office/OfficeProjectPortalController.implementer-runtime.test.ts`.
- [X] T017 [US2] Extend `clearRuntimePreflightForProject` in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` to also delete the project's Implementer Runtime collections, with a regression test proving a stale plan clears the Implementer Runtime record.
- [X] T018 [US2] Add project-isolation tests (foreign project/plan/Runtime Start/worktree/provider-evidence never cross-resolve; matching raw IDs across projects stay isolated) in `src/features/city-view/scene/office/OfficeProjectPortalController.implementer-runtime.test.ts`.

---

## Phase 5: User Story 3 - Display Implementer Runtime State Safely (Priority: P3)

**Goal**: The dashboard shows every Implementer Runtime state with safe wording, and the new row never overlaps the drawn panel alongside the existing Runtime Start row.

**Independent Test**: View tests assert safe wording for every state and a realistic full-layout regression test proves both `[RUNTIME START]` and `[IMPLEMENTER RUNTIME]` render inside the drawn panel.

- [X] T019 [P] [US3] Add `ImplementerRuntimeView` (row-text construction, per-status wording) and its tests in `src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeView.ts` and `ImplementerRuntimeView.test.ts`.
- [X] T020 [US3] Integrate `[IMPLEMENTER RUNTIME]` rows (`dropPriority: 15`, `usePriorityFit: true`) into `createProjectDashboardLowerRows` in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [X] T021 [US3] Add the realistic full-layout regression test (both `[RUNTIME START]` and `[IMPLEMENTER RUNTIME]` present, containment-helper-verified, not presence-only) in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`.
- [X] T022 [US3] Add a short clarifying comment for the existing two-Enter Runtime Start gate at the point this controller path is touched, per the spec's own instruction, without unrelated UI redesign.

---

## Final Phase: Polish & Validation

- [X] T023 Run focused Implementer Runtime tests (`quickstart.md`'s focused-test command) and record exact file/test counts.
- [X] T024 Run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.
- [X] T025 Complete every task checkbox above (this file) before the commit that will be submitted for independent review — not after — so no post-approval documentation-only recommit is needed.
- [X] T026 Commit the complete implementation and run an independent Codex CLI review (Codex = Reviewer, Claude = Implementer, per the approved role swap) until Approved on the exact committed HEAD, fixing every blocking finding and re-validating/re-reviewing as needed.

## Dependencies & Execution Order

- Phase 1 precedes all implementation.
- Phase 2 blocks all user stories.
- User Stories 1, 2, and 3 can be validated independently after foundational service/provider behavior exists, but US1's controller/registry wiring (T010-T012) must land before US2/US3's controller-level tests can run.
- Final validation and independent review happen after every task, including T025, is complete.

## Parallel Opportunities

- T002, T003, and T006 can run in parallel.
- T007, T008 can be drafted in parallel after T002-T004.
- T013, T014, T015 can be drafted in parallel after T005.
- T019 can be drafted in parallel with Phase 4.

## Implementation Strategy

Deliver the Implementer Runtime domain (types, provider, service, prompt) first, with the two empirically-verified architecture decisions (guarded Node/browser split, explicit role-binding data) already resolved before writing any of this code. Then controller/registry integration, then dashboard rows and the full-layout regression test. Keep every mutation scoped to Spec 075's new files plus the minimal, precisely-targeted existing-file edits `plan.md` documents (input type, invalidation helper, dashboard row assembly) — no unrelated refactor of Execution Plan/Readiness/Approval/Preflight/Runtime Start.
