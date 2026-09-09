# Tasks: Autonomous Company Operations End-to-End Verification

**Input**: Design documents from `/specs/148-autonomous-company-operations-end-to-end/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the authoritative requirements (Required Tests A-Z).

**Organization**: Verification-only feature. No production source changes.

## Phase 1: Setup

- [X] T001 Create Spec 148 docs and update the active feature pointer in `.specify/feature.json` and the `AGENTS.md` SPECKIT block

---

## Phase 2: E2E Chain Coverage

**Purpose**: One deterministic ordered cycle across Specs 141-147 plus the
Spec 142/138 bridge and the real ADOS execution service (only the process
spawn faked).

- [X] T002 Add `src/features/city-view/scene/office/project-backlog/AutonomousCompanyOperationsE2E.test.ts` driving `OfficeProjectPortalController` with a deterministic Spec 143 suggestion provider and the real `ExternalProjectAdosExecutionService` (only its `ImplementerRuntimeProvider` process spawn faked)
- [X] T003 [US1] Cover ordered single cycle and each transition once: Test H (sequencing), Test B (suggestion project-scoped), Test C (Spec 145 acceptance owns the backlog task; Ready transition attributed to Spec 146's counter with all four controls enabled), Test D (Ready exactly once), Test E (Spec 144 sole execution authority), Test F (bridge + process boundary exact project/task context, structured requirements as file payload)
- [X] T004 [US2] Cover four independent automation controls: Test A
- [X] T005 [US2] Cover no direct ADOS invocation from Specs 145-147: Test G (structural import assertion on the three service modules)
- [X] T006 [US3] Cover idempotency: Test I (duplicate planning event), Test J (duplicate acceptance), Test K (duplicate readiness evaluation), Test L (duplicate execution event)
- [X] T007 [US2] Cover active-run safety: Test M (active run blocks prohibited extra planning/Ready/execution; concurrency enforced)
- [X] T008 [US3] Cover second-project isolation: Test N
- [X] T009 [US3] Cover reload persistence: Test O (policy + lifecycle state preserved, no re-execution)
- [X] T010 [US2] Cover manual workflows remain functional: Test Z
- [X] T011 [US4] Cover completion reflects actual ADOS status (Test X) and no fabricated percentage progress introduced (Test Y)
- [X] T011a [US2] Cover the sanctioned Spec 145 -> Spec 146 cascade: each transition is attributed to its own policy audit record when both are enabled
- [X] T011b [US4] Cite existing `src/features/city-view/scene/PortfolioOperationsService.test.ts` for Spec 140 portfolio truthfulness (authoritative requirement 13); run it in targeted validation

---

## Phase 3: Role and Publication-Gate Coverage

**Purpose**: Prove the durable role assignment and the independent-review /
exact-HEAD guarantees for this run using existing agent-workflow modules.

- [X] T012 Add `tools/agent-workflow/spec148RoleAssignmentEvidence.test.ts`
- [X] T013 [US4] Cover durable role assignment observable: Test P (Claude implementer), Test Q (Codex reviewer), against transcribed `runtime-evidence.json`
- [X] T014 [US4] Cover implementer/reviewer distinct: Test R; candidate owner is Claude: Test S
- [X] T015 [US4] Cover stale approval cannot authorize a newer candidate: Test T; validated/reviewed/exact-HEAD alignment enforced: Test U
- [X] T016 [US4] Cover reviewer unavailable blocks safely: Test V; no self-review fallback: Test W

---

## Phase 4: Evidence and Validation

- [X] T017 Write `specs/148-autonomous-company-operations-end-to-end/runtime-evidence.json` with repository-relative paths and transcribed ADOS role assignment (no absolute worktree paths)
- [X] T018 Write `specs/148-autonomous-company-operations-end-to-end/runtime-verification.md` summarizing the demonstrated cycle and non-invocations
- [X] T019 Run targeted Vitest for both new test files
- [X] T020 Run `git diff --check` and `git diff --cached --check`

---

## Phase 5: Independent-review fix cycle

- [X] T021 Commit `ados-run.sanitized.json` (path-stripped mirror of the durable ADOS run record) and bind `spec148RoleAssignmentEvidence.test.ts` to it plus the durable file when present, so role/candidate ownership is verified against ADOS durable state (not a self-asserting evidence label)
- [X] T022 Stop freezing candidate/validated/reviewed SHA literals and the review decision into `runtime-evidence.json`; record `shaAlignment.durableSources` + `exactHeadInvariant` + a standing `publicationResult` gate, and resolve the SHAs from the durable ADOS files at test time
- [X] T023 Replace hand-rolled `project-a` / `project-b` records with canonical `daily-proof` / `ai-lab` entries registered through `ProjectRegistryService` + `applyLocalProjectRepositoryBindings`, bound to the real repository worktree path, and projected into controller state through the same canonical adapters production uses (`toProjectPortalProject`, `ProjectCompanyBindingService.createBindings`) instead of fabricated object literals; update identity strings in the test and `runtime-evidence.json` in lockstep
- [X] T024 Re-run targeted Vitest, `npx tsc --noEmit`, and diff checks
- [X] T025 Fix `spec148RoleAssignmentEvidence.test.ts` cross-cycle self-reference: the suite runs as part of the repository's own `npm test`, one of the validation commands ADOS runs *before* writing `validation-runtime.json` and *before* running review at all, so an unconditional `reviewed_sha === candidate_sha` / all-commands-exit-0 assertion fails by construction on every live validation pass after the first cycle; gate those checks on the durable record's SHA actually naming the current candidate instead of dropping them to shape-only, and move the path/allowlist check for the tracked sanitized artifact outside the optional live-durable-run branch so it always runs

---

## Phase 6: Independent-review fix cycle (2)

- [X] T026 Stop framing the target chain as "two exercised halves" in `runtime-verification.md` and `runtime-evidence.json` (`acceptanceCriteriaMapping`, `verifiedCycleCompletion`, `requirementsChainProof`); replace with one continuous chain whose review/validation/exact-HEAD/publication legs are executed by the real ADOS pipeline (section 23, acceptance criterion 20). Move acceptance criterion 11 out of the pending list — it is enforced now.
- [X] T027 De-narrow `spec.md` User Story 1: the independent test runs through review (reviewer Codex, distinct from Claude implementer), the `validated == reviewed == exact HEAD` convergence gate, and the human-only publication gate — not "ADOS run". Add acceptance scenario 6.
- [X] T028 Continue the single Project A chain in `AutonomousCompanyOperationsE2E.test.ts` past ADOS execution: assert `roleResolver.js` resolves a distinct Codex reviewer and `reviewConvergence.js` `computeConvergenceStatus` stays below `CONVERGED` without an aligned Approved review, with the task not advancing past `in_progress` (Test H continuation).
- [X] T029 Add deterministic failure-visibility coverage (authoritative requirement 18): suggestion provider unavailable halts at Spec 147 with a block reason and no backlog task; acceptance ineligible (`PriorityNotAllowed`) halts at Spec 145 without mutating the backlog; ADOS execution-stage failure via the real `ExternalProjectAdosExecutionService` leaves the task `ready`, records a `Failed` result, and fabricates no completion. Record reasons in `runtime-evidence.json.failureVisibility` and `runtime-verification.md`.

---

## Phase 7: Independent-review fix cycle (3)

- [X] T030 Fix Test X so it proves *run-level* ADOS completion fidelity, not subprocess exit: add a dedicated `AutonomousCompanyOperationsE2E.test.ts` test that drives the real `ExternalProjectAdosExecutionService` twice differing only in `execution.evidence.completed`, and asserts production's `deriveExternalProjectAdosRunStatus` stage (`Started` vs `Completed`) and the Spec 144 active-execution count (`1` vs `0`) track it, then closes the daily-proof cycle to a truthful terminal `completed` via the existing operator transition (no autonomous completion path added). The `computeConvergenceStatus` biconditional is enforced unconditionally against the real durable ADOS records by `spec148RoleAssignmentEvidence.test.ts` (not simulated in-cycle with a hand-built object).
- [X] T031 Restructure `runtime-evidence.json`: split the buried-in-prose distinction into two top-level blocks — `dailyProofCycleCompletion` (daily-proof cycle's truthful terminal state + full-validation-PASS-at-exact-HEAD evidence, derived not transcribed) and `spec148CandidatePublicationGate` (this candidate's own human-only gate, citing the Spec 130 literal-`false` schema types). Update `acceptanceCriteriaMapping` (criteria 19-20 are standing ADOS gates enforced now from durable state, not a deferred half), `requirementsChainProof.links`, `publicationResult`, and the `executionDurableRecord.status` meaning; record no publish/merge/deploy boolean verdict. Mirror the rename in `runtime-verification.md`, `quickstart.md`, `data-model.md`.

---

## Dependencies & Execution Order

- Phase 1 before all phases.
- Phase 2 and Phase 3 are independent and may proceed in parallel.
- Phase 4 depends on Phase 2 and Phase 3.

## Implementation Strategy

Drive the real controller and real Spec 141-147 services in order; assert
observed state. Use the existing deterministic suggestion provider injection and
the existing injectable ADOS adapter. Reuse `roleResolver.js` and
`reviewConvergence.js` for role and convergence assertions. Add no production
module.
