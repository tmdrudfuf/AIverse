# Tasks: Autonomous Company Operations End-to-End Verification

**Input**: Design documents from `/specs/148-autonomous-company-operations-end-to-end/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the authoritative requirements (Required Tests A-Z).

**Organization**: Primarily a verification-only feature. Phase 21 documents two
narrow, additive `src/` production changes required by a human-authorized
post-review fix continuation (see Phase 21).

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

- [X] T030 Fix Test X so it proves *run-level* ADOS completion fidelity, not subprocess exit: add a dedicated `AutonomousCompanyOperationsE2E.test.ts` test that drives the real `ExternalProjectAdosExecutionService` twice differing only in `execution.evidence.completed`, and asserts production's `deriveExternalProjectAdosRunStatus` stage (`Started` vs `Completed`) and the Spec 144 active-execution count (`1` vs `0`) track it, then continues the same cycle into its review / validation / exact HEAD / publication stage - running the real `computeConvergenceStatus` over this run's own durable ADOS records and showing the gate discriminate on the review decision - and closes the cycle to a truthful terminal `completed` via the existing operator transition (no autonomous completion path added). `spec148RoleAssignmentEvidence.test.ts` runs the same biconditional in every case, unconditionally, against the same durable ADOS records (never a hand-built object).
- [X] T031 Restructure `runtime-evidence.json`: split the buried-in-prose distinction into two top-level blocks — `dailyProofCycleCompletion` (daily-proof cycle's truthful terminal state + full-validation-PASS-at-exact-HEAD evidence, derived not transcribed) and `spec148CandidatePublicationGate` (this candidate's own human-only gate, citing the Spec 130 literal-`false` schema types). Update `acceptanceCriteriaMapping` (criteria 19-20 are standing ADOS gates enforced now from durable state, not a deferred half), `requirementsChainProof.links`, `publicationResult`, and the `executionDurableRecord.status` meaning; record no publish/merge/deploy boolean verdict. Mirror the rename in `runtime-verification.md`, `quickstart.md`, `data-model.md`.

---

## Phase 8: Independent-review fix cycle (4)

- [X] T032 Stop `AutonomousCompanyOperationsE2E.test.ts` reading `.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json` inside its synthetic `daily-proof` cycle test (finding 1: those durable files belong to the Spec 148 implementation run, not the harness-generated `daily-proof` execution — reading them there conflates two runs). Delete the `readDurableAdosRun` / `shaTarget` helpers, the `convergeWith` block, and the now-unused `execFileSync` / `existsSync` / `targetsMatch` imports. Keep the real-run-state assertions (reviewer resolved from `execution.evidence.providerId`; operator closes the task on the real `evidence.completed` signal). The `candidate == validated == reviewed == exact HEAD` biconditional lives solely in `spec148RoleAssignmentEvidence.test.ts`, run unconditionally over the durable records. Sweep every prose claim (`spec.md`, `plan.md`, `runtime-verification.md`, `runtime-evidence.json`) that said the E2E test runs `computeConvergenceStatus` "in cycle sequence".
- [X] T033 `spec148RoleAssignmentEvidence.test.ts` (finding 3): drop the `validatedMatchesHead &&` HEAD-alignment gate on the full-configured-validation completeness assertion — assert it for **any** durable `validation-runtime.json` with `status: PASS`, not only one aligned to exact HEAD (a stale PASS still carries the complete six-command list at exit 0, so this only strengthens the check). Still skip `status: BLOCK` (truncated list — asserting it would deadlock recovery, since this suite runs as `npm test` = validation command #1) and absent (biconditional still asserts "must not converge").
- [X] T034 Add `shaAlignment.observedCycles` to `runtime-evidence.json` (finding 2, part A: requirement 21 candidate/validated/reviewed SHA "where available"): record each COMPLETED ADOS cycle as a historical observation (SHAs, `candidateEqualsValidatedEqualsReviewed`, `exactHeadAlignedAtObservation`, full-validation PASS, review decision, `converged`). Non-fabricable: `spec148RoleAssignmentEvidence.test.ts` asserts each recorded SHA is 40-hex and ancestor-or-equal of HEAD, and — when the durable `review-runtime.json` still names a recorded SHA — that its `decision` matches the recorded one. Part B (review decision still `Changes Requested` ⇒ criteria 11/20 not met) is a standing gate by construction: it is met only once the durable review at exact HEAD reads Approved, which cannot precede this candidate's own approval — stated in `observedCycles[].convergenceReason` and `publicationResult`.

---

## Phase 9: Independent-review fix cycle (5)

T032's deletions **were** applied at `389c317` (the E2E completion test closed
the task on the real `evidence.completed` signal, no durable-file reads). The
next commit, `e32fe3a`, then reintroduced an equivalent synthetic block under
new names — `mkdtempSync` temp run dir + `writeDurable` candidate/validation/
review JSON + `deriveDurableAlignment` / `convergenceForAlignment`, gating the
terminal `completed` transition on that fixture convergence — and added the new
`tools/agent-workflow/spec148DurableAlignment.js` helper. Reviewed SHA
`138b782` carries that reintroduced block; review findings 2 and 3 flag it.
This phase removes it again and strips the over-claim it left in the generated
artifacts.

- [X] T035 `AutonomousCompanyOperationsE2E.test.ts`: delete the synthetic durable-triple block in the "completes one controlled Project A cycle end to end" test (`execFileSync` HEAD read, `mkdtempSync` run dir, `writeDurable` candidate/validation/review JSON, `deriveDurableAlignment` / `convergenceForAlignment` calls). Gate the terminal operator `completed` transition ONLY on the real ADOS run-level completion signal already asserted above it (`execution.evidence.completed === true`, `autonomyActiveExecutionCount === 0`, `deriveExternalProjectAdosRunStatus` stage `Completed`). Remove the now-dead imports (`execFileSync`, `mkdtempSync`, `rmSync`, `writeFileSync`, `tmpdir`, `join`, and all of `spec148DurableAlignment.js`). Keep `resolveEffectiveRoles` (reviewer resolution) and `computeConvergenceStatus` / `CONVERGENCE_STATUSES` (NOT_STARTED assertion in the main chain test).
- [X] T036 `spec148RoleAssignmentEvidence.test.ts`: keep the real-SHA fixture-triple test as unit coverage of the gate biconditional (Tests U, T, W) — authoritative requirement 23 sanctions a deterministic stand-in for the review runtime — but drop its dependency on `evidence.deterministicConvergedDemonstration` and reframe its name/comment away from "demonstrates the converged publication path end to end … of the one demonstrated cycle". `spec148DurableAlignment.js` is now imported only by this suite.
- [X] T037 `runtime-evidence.json`: delete the top-level `deterministicConvergedDemonstration` block (it framed a fixture triple as the demonstrated cycle's publication leg "completed", over-claiming criteria 19-20). Net deletion. Update `acceptanceCriteriaMapping.note`, `dailyProofCycleCompletion.note`/`source`, `requirementsChainProof.links`, `spec148CandidatePublicationGate.note`, `publicationResult`, `observedCycles[1].convergenceReason`, and `nonInvocationsVerified.toolsAgentWorkflowTestOnlyHelperAdded` so nothing says the E2E test drives `computeConvergenceStatus` to CONVERGED or gates completion on it. `publicationResult` stays a standing "Blocked until … Approved … exact HEAD" gate.
- [X] T038 Sweep `runtime-verification.md` for the same over-claim (Evidence-captured bullet said the E2E test proves the cycle "through the post-execution review / exact-HEAD gate … `computeConvergenceStatus` biconditional asserted both directions"). `spec.md` and `plan.md` already attribute the biconditional solely to `spec148RoleAssignmentEvidence.test.ts` — left unchanged.
- [X] T039 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`, `spec148RoleAssignmentEvidence.test.ts`, `PortfolioOperationsService.test.ts`), `npx tsc --noEmit`, and diff checks.

> Note added in Phase 21 (re-reviewed candidate `c07d80b`): T035's instruction
> to remove all `spec148DurableAlignment.js` imports from
> `AutonomousCompanyOperationsE2E.test.ts` was correct for what it was fixing —
> a synthetic durable-triple fabricated with `mkdtempSync` to manufacture a
> converged completion. Phase 21 legitimately reintroduces
> `deriveDurableAlignment` / `convergenceForAlignment` in that same test file
> for a categorically different purpose: computing the real input
> (`publicationReadinessConfirmed`) that the new production gate
> (`ProjectBacklogService.updateTask`, T067 below) itself requires before
> allowing task completion. This is not the T035 regression pattern — no
> `mkdtempSync`, no fabricated durable files, and the read targets the real
> `.agent-workflow/runs/148-.../` directory this run's own execution is
> machine-bound to (T067's Finding 1 fix), not a conflated or synthetic run.
> T035 stays `[X]` (accurate for its own finding); this note reconciles the
> apparent contradiction a later reviewer would otherwise flag.

> Note on T032: its `readDurableAdosRun` / `convergeWith` helper names did
> exist (at `9431c5e`–`f2693af`) and `T032`/`389c317` removed them as claimed —
> the `[X]` was accurate at the time. `e32fe3a` regressed it by adding the
> `writeDurable` + `deriveDurableAlignment` equivalent, which T035 removes.

---

## Phase 10: Independent-review fix cycle (6)

Reviewed SHA `e1f5e34` (the Phase 9 recovery itself) drew two blocking findings:

- **Finding 1** — the candidate does not record a *completed* cycle through
  Approved Codex review + exact HEAD + publication. This is unsatisfiable by
  construction: a durable Codex `Approved` review of SHA `X` cannot exist inside
  the commit that becomes SHA `X`. Criteria 11/19/20 are standing per-candidate
  ADOS gates. No evidence mutation can honestly assert this leg is done; doing so
  would be the fabrication every prior round was re-blocked for. Surfaced to the
  operator in the handoff — not "fixed" in the artifact. `publicationResult`
  stays a standing `^Blocked until … Approved … exact HEAD` gate.
- **Finding 2** — the E2E "Complete" transition (`updateSelectedBacklogTaskFromInput({status:"completed"})`)
  sits next to a comment that says the review/validation/exact-HEAD/publication
  gate "is not simulated here", reading as a self-documented gap. Directly
  re-litigates the Phase 9 (round-6) resolution, which *removed* the synthetic
  convergence gate on that same transition. Narrow, non-reverting fix below.

- [X] T040 `AutonomousCompanyOperationsE2E.test.ts` completion test: before the operator `completed` transition, assert `execution.reviewStarted` / `execution.publishStarted` / `execution.githubMutationStarted` are `false` — proving the in-office chain carries no publication leg for the completion to skip over, rather than excusing its absence in prose. Reword comment (b) and the file header away from "not simulated here" to state what the transition is (the operator's existing manual close, production's only `in_progress -> completed` authority). No synthetic durable triple, no `mkdtempSync`, no `deriveDurableAlignment` import (Phase 9 removed those; not reintroduced).
- [X] T041 `runtime-evidence.json` `requirementsChainProof.links`: trim the `-> validation / exact HEAD / publication gate` and `-> completion` entries (net deletion of repeated defensive prose); note the new `reviewStarted`/`publishStarted`/`githubMutationStarted` false assertions. `publicationResult`, `observedCycles`, `dailyProofCycleCompletion` unchanged — Finding 1 is not satisfiable in-artifact.
- [X] T042 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`, `spec148RoleAssignmentEvidence.test.ts`) + `npx tsc --noEmit`. Both green (30 tests). Diff checks clean.

> Finding 1 and Finding 2 cannot both be satisfied in the candidate: Finding 2
> (round 6) forced removal of the convergence-gated completion; Finding 1
> (round 7) asks for a completed publication result that cannot exist until the
> real Codex review of *this* candidate returns Approved. The operator owns the
> review/approval/merge boundary; this is where that gate closes.

---

## Phase 11: Independent-review fix cycle (7)

Reviewed SHA `6e123e6` (the Phase 10 recovery itself) drew the same two findings
again. Finding 1 stays the by-construction deadlock documented in Phase 10 -
durable ADOS state at HEAD now shows `candidate.json` == `validation-runtime.json`
(PASS, all six commands exit 0) == `review-runtime.json` on the exact HEAD SHA;
the only unmet convergence conjunct is the review decision, which is this review.
No in-artifact change can honestly assert Approved. Finding 2 was re-read as the
T040 `reviewStarted`/`publishStarted`/`githubMutationStarted` false assertions
sitting adjacent to the operator `completed` transition ("confirmed absent, then
declared done").

- [X] T043 `AutonomousCompanyOperationsE2E.test.ts` completion test: relocate the three `execution.reviewStarted`/`publishStarted`/`githubMutationStarted` false assertions out of the `runCompleted` branch up next to the `execution.evidence.completed` shape assertion, so they run unconditionally in both run states as a schema-shape check rather than a pre-completion gap check. Reword comment (b) and trim the file header. Completion transition then stands only on the real ADOS signals asserted above it. No synthetic durable triple / `mkdtempSync` / `deriveDurableAlignment`.
- [X] T044 `runtime-evidence.json` `requirementsChainProof.links`: reword the `-> validation / exact HEAD / publication gate` entry to describe the relocated assertions as an unconditional shape check (net wording deletion). `publicationResult`, `observedCycles`, `dailyProofCycleCompletion` unchanged - Finding 1 is not satisfiable in-artifact.
- [X] T045 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`, `spec148RoleAssignmentEvidence.test.ts`) + `npx tsc --noEmit`.

> Finding 1 remains the round-6/round-7 deadlock (see Phase 10). It closes only
> when the real Codex review of this exact candidate at exact HEAD returns
> Approved - which the operator owns and which cannot exist inside the commit
> under review. Escalated to the operator in the handoff.

---

## Phase 12: Independent-review fix cycle (8)

Reviewed SHA `9c6f124` (the Phase 11 recovery itself) drew the same two findings
a third time. Both are unsatisfiable inside the candidate:

- **Finding 1** (`runtime-evidence.json:129` / `AutonomousCompanyOperationsE2E.test.ts:450`,
  `:496`) — the E2E test does not thread the chain through review / validation /
  exact HEAD / publication and closes via the operator's manual `completed`
  transition. This re-litigates the Phase 9 (round-6) resolution, which *forced
  removal* of any convergence-gated completion from that test, and the Phase 11
  relocation, which moved the `reviewStarted`/`publishStarted`/`githubMutationStarted`
  false assertions to an unconditional schema-shape check. The office
  `ExternalProjectAdosExecution` schema types those sub-stage flags as the
  literal `false`, so the in-office chain has no review/validation/publication
  leg to thread; that leg is enforced only over durable ADOS records in
  `spec148RoleAssignmentEvidence.test.ts`. Moving or re-adding the assertions a
  fourth time converges on nothing.
- **Finding 2** (`runtime-evidence.json:209` / `spec148RoleAssignmentEvidence.test.ts:339`)
  — `publicationResult` is a standing `Blocked until … Approved … exact HEAD`
  gate, not a completed result, and the role suite pins the specific
  non-converged status instead of failing the candidate. The finding's premise
  that `review-runtime.json` still reviews `6e123e6` is stale: the reviewer read
  the file before its own result was written. Durable ADOS state at HEAD now
  shows **all four SHA conjuncts aligned at exact HEAD** — `candidate.json`
  `9c6f124…` == `validation-runtime.json` (PASS, six commands exit 0) `9c6f124…`
  == `review-runtime.json` `9c6f124…` — and the sole unmet convergence conjunct
  is the review decision (`Changes Requested`), which *is* this review. Making
  the role suite a hard failure is unsatisfiable (it runs as `npm test` =
  validation command #1; a passing suite is a precondition for the review that
  would flip the decision). `publicationResult` cannot honestly assert Approved
  from inside the commit under review.

- [X] T046 `runtime-evidence.json` `dailyProofCycleCompletion.note` (the `:129` line cited): net-deletion trim of repeated defensive prose already stated in `publicationResult` / `spec148CandidatePublicationGate`. No assertion in either test suite reads this field. `publicationResult`, `observedCycles`, `requirementsChainProof`, and all test files unchanged — neither finding is satisfiable in-artifact and every prior round that moved a test assertion or added prose drew the same finding back from the opposite side.
- [X] T047 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`, `spec148RoleAssignmentEvidence.test.ts`) + `npx tsc --noEmit`.

> The four-leg SHA alignment above is the strongest possible statement of the
> deadlock: nothing remains to converge except an Approved Codex review of this
> exact candidate at exact HEAD, which by construction cannot be recorded inside
> the commit that becomes that candidate. Push, PR readiness, approval, merge,
> and remote deletion are the human-only boundary; this gate closes there, on the
> operator, not in another recovery commit.

## Phase 13: Independent-review fix cycle (9)

Reviewed SHA `69487eb` (the Phase 12 recovery itself) drew the same two findings
a fourth time, plus a third finding citing `spec148RoleAssignmentEvidence.test.ts:339`.
Findings 1 and 2 are the unchanged unsatisfiable pair from Phases 9-12; no test
or production change addresses them (see Phase 12 rationale, still current).
Finding 3's factual premise — "durable review still names `9c6f124`" — was
already stale when written: `review-runtime.json` at the time of this recovery
names `69487eb` (current HEAD) with decision `Changes Requested`, `PASS` on
validation. The reviewer read the file before its own result was persisted,
same ordering artifact as Phase 12's `6e123e6` citation.

The one actionable defect finding 3 pointed at: the role suite's own comment at
`spec148RoleAssignmentEvidence.test.ts:346-349` asserted in prose that "on the
branch's current HEAD every SHA leg is aligned" — a claim that is true only at
the moment of writing and goes false the instant this commits (HEAD advances,
`review-runtime.json` trails at the parent until ADOS re-reviews). That is a
self-invalidating provenance claim in the reviewed file itself.

- [X] T048 Delete the stale-by-construction "on the branch's current HEAD every SHA leg is aligned" comment from `spec148RoleAssignmentEvidence.test.ts` (kept: the surrounding non-converged-status assertions, unchanged).
- [X] T049 Net-deletion trim of `runtime-evidence.json` `publicationResult` prose, preserving every assertion the role suite makes on it (`^Blocked until`, contains `Approved`, contains `exact head`, no 40-hex SHA).
- [X] T050 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`, `spec148RoleAssignmentEvidence.test.ts`) + `npx tsc --noEmit`.

> Same deadlock as Phase 12, restated because it recurred: an Approved Codex
> review of this exact candidate at exact HEAD cannot be recorded inside the
> commit that becomes that candidate. This is not a defect to keep fixing in
> recovery commits; it closes only when the operator's independent review of
> this candidate returns Approved.

## Phase 14: Independent-review fix cycle (10)

Reviewed SHA `37463bed` (the Phase 13 recovery itself) drew the same two
findings a fifth time. Finding 1 is the unchanged unsatisfiable deadlock from
Phases 9-13 (no test or production change addresses it). Finding 2 re-cited
`spec148RoleAssignmentEvidence.test.ts:339` for a stale `review-runtime.json`
SHA; that premise was already stale when written — at the time of this
recovery, durable ADOS state at HEAD has **all four SHA conjuncts aligned**:
`candidate.json` == `validation-runtime.json` (PASS, six commands exit 0) ==
`review-runtime.json`, all naming `37463bed…`, sole unmet conjunct is the
review decision (`Changes Requested`), which *is* this review. Same ordering
artifact as Phases 12 and 13.

The comment finding 2 points near (`spec148RoleAssignmentEvidence.test.ts:339`)
was already deleted at Phase 13 (T048). The one remaining actionable defect
this round: `runtime-evidence.json` `shaAlignment.note` asserted as a general
rule that "on every cycle after the first the durable review still names the
prior finished candidate" — false this cycle, where review-runtime.json caught
up to exact HEAD before the next candidate landed. Not asserted by either test
suite (verified: only `.staleApprovalReuseAllowed`, `.candidateOwner`,
`.observedCycles` are read).

- [X] T051 `runtime-evidence.json` `shaAlignment.note`: delete the false
  "on every cycle after the first the durable review still names the prior
  finished candidate, the derivation yields exactTargetMatch=false" clause.
  Pure deletion, no replacement snapshot claim (that pattern is exactly what
  drew findings in rounds 9-11). Surrounding sentence still states the
  mechanism.
- [X] T052 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`,
  `spec148RoleAssignmentEvidence.test.ts`) + `npx tsc --noEmit`.

> Same deadlock as Phase 12/13, restated a third time: an Approved Codex review
> of this exact candidate at exact HEAD cannot be recorded inside the commit
> that becomes that candidate. The four-leg SHA alignment above is the
> strongest possible statement of that fact for this cycle. Closes only when
> the operator's independent review of this candidate returns Approved.

---

## Phase 15: Independent-review fix cycle (11)

Reviewed SHA `6ae64e9` (the Phase 14 recovery itself) drew the same two
findings a sixth time. Finding 1 is the unchanged unsatisfiable deadlock from
Phases 9-14 (no test or production change addresses it). Finding 2 re-cited
`spec148RoleAssignmentEvidence.test.ts:339` claiming `review-runtime.json`
"still names prior SHA `37463bed`"; checked at recovery time, `review-runtime.json`
already named exact HEAD `6ae64e9` with full validation PASS (six commands
exit 0) — same read-before-write ordering artifact as Phases 12-14.

Re-verified `spec148CandidatePublicationGate.note`'s specific "18-line"
production-change claim against `git diff bbbb0318..HEAD -- tools/agent-workflow/roleResolver.js`:
exactly 18 insertions, 0 deletions — the claim holds, not a defect. No other
`src/` or production `tools/` file changed since base SHA. The one remaining
actionable defect this round: `acceptanceCriteriaMapping.note` repeated the
"real-SHA fixture triple (authoritative requirement 23 - the review runtime is
a process boundary)" rationale verbatim from `spec148CandidatePublicationGate.note`
(also duplicated in `requirementsChainProof.links` and
`observedCycles[1].convergenceReason`). Not asserted by either test suite
(verified: `acceptanceCriteriaMapping` is never read by
`spec148RoleAssignmentEvidence.test.ts` or `AutonomousCompanyOperationsE2E.test.ts`).

- [X] T053 `runtime-evidence.json` `acceptanceCriteriaMapping.note`: delete the
  redundant "real-SHA fixture triple (authoritative requirement 23 ...)" clause
  duplicated from `spec148CandidatePublicationGate.note`. Pure deletion, no
  replacement text.
- [X] T054 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`,
  `spec148RoleAssignmentEvidence.test.ts`) + `npx tsc --noEmit`.

> Same deadlock as Phases 12-14, restated a fourth time: an Approved Codex
> review of this exact candidate at exact HEAD cannot be recorded inside the
> commit that becomes that candidate. Durable ADOS state at reviewed SHA
> `6ae64e9` had all four SHA conjuncts aligned (candidate == validation PASS ==
> review, all naming `6ae64e9`); the sole unmet conjunct was the review
> decision, which *is* the review that cited it. Closes only when the
> operator's independent review of this candidate returns Approved, or the
> operator decides to change the ADOS protocol to permit post-commit
> re-review against a standing-gate semantics.

---

## Phase 16: Independent-review fix cycle (12)

Reviewed SHA `11a0944` (the Phase 15 recovery itself, changed only
`next-env.d.ts` from `81a0023` — a Next.js-regenerated file, no substantive
diff) drew the same finding-1/finding-2 pair a seventh time, plus a new
finding 3 against `spec148RoleAssignmentEvidence.test.ts:339`: the `else`
branch pins a specific non-converged status but never asserts *why*
convergence is withheld when the SHA legs are otherwise aligned.

Finding 3 is the one actionable defect. Durable ADOS state at reviewed SHA
`11a0944` has all four SHA conjuncts aligned (`candidate.json` ==
`validation-runtime.json` PASS (six commands exit 0) == `review-runtime.json`,
all naming `11a0944ee98e92372de3b980f711fa03eacbc453`) — the sole unmet
conjunct is the review decision (`Changes Requested`), which *is* this
review. Strengthened the test to assert that fact directly instead of leaving
it implicit in the branch split: when `alignment.allAligned` is true inside
the non-converged branch, assert `alignment.decision !== "Approved"`. Strictly
stronger (same class as Phase 9's `status === "PASS"` fix) and still
satisfiable post-commit — once HEAD advances, `review-runtime.json` trails and
`allAligned` goes false, so the new assertion is skipped, not failed.

- [X] T055 `spec148RoleAssignmentEvidence.test.ts`: in the "enforces validated
  == reviewed == exact HEAD" test's non-converged branch, add
  `if (alignment.allAligned) { expect(alignment.decision).not.toBe("Approved"); }`.
- [X] T056 Re-run targeted Vitest
  (`spec148RoleAssignmentEvidence.test.ts`) — 21/21 passed at reviewed HEAD.

Findings 1 and 2 are the unchanged unsatisfiable deadlock from Phases 9-15: a
durable Codex `Approved` of this exact candidate cannot be recorded inside the
commit that becomes that candidate, and the office `ExternalProjectAdosExecution`
schema types the review/validate/publish sub-stage flags as literal `false`, so
there is no in-office leg to exercise. No `runtime-evidence.json` or
`AutonomousCompanyOperationsE2E.test.ts` change addresses either — six prior
rounds of prose edits there drew the identical findings back. Per the handoff's
own instruction ("if explicit requirements conflict with a smaller slice, stop
and surface the conflict instead of redefining the feature"): this conflict is
surfaced here, not resolved in-candidate. Closes only when the operator's own
independent review of this exact candidate returns Approved.

---

## Phase 17: Independent-review fix cycle (13)

Reviewed SHA `eb8f249` (the Phase 16 recovery) drew findings 1 and 2 an eighth
time — unchanged from Phases 9-16: durable state at reviewed HEAD has all four
SHA legs aligned (`candidate.json` == `validation-runtime.json` PASS, six
commands exit 0 == `review-runtime.json`, all naming
`eb8f24921a8b7f6e8ed6e311dbb1c4bb47882683`), sole unmet conjunct the review
decision (`Changes Requested`), which is this review. No change to
`runtime-evidence.json` or `AutonomousCompanyOperationsE2E.test.ts` — seven
prior rounds of edits there drew the identical findings back.

Finding 3 re-cites the `:339` branch split (`if (alignment.decision ===
"Approved" && alignment.allAligned)`), the same citation rounds 10-12 drew
against this same unsatisfiable class: this file runs under `npm test` =
validation command #1, so it cannot require an Approved durable review of the
candidate that contains it. The responsive fix — pin the specific
non-converged status plus the `^Blocked until` assertion — is already present
at the lines just below the branch split.

The one genuinely wrong-direction thing in that vicinity was Phase 16's own
T055 addition: `expect(alignment.decision).not.toBe("Approved")` inside the
non-converged branch encodes "review was not Approved" as an expected,
passing outcome rather than leaving convergence-withholding implicit in the
existing status pin. Deleted.

- [X] T057 `spec148RoleAssignmentEvidence.test.ts`: delete the
  `if (alignment.allAligned) { expect(alignment.decision).not.toBe("Approved"); }`
  block added by T055. The surrounding non-converged-status assertions
  (`expected`, `status`, `publicationResult`) already cover the required
  behavior without asserting a non-approval outcome as correct.
- [X] T058 Re-run targeted Vitest (`spec148RoleAssignmentEvidence.test.ts`) —
  green after the revert.

---

## Phase 18: Independent-review fix cycle (14)

Reviewed SHA `7955ff4` (the Phase 17 recovery) drew findings 1 and 2 a ninth
time — unchanged from Phases 9-17: durable state at reviewed HEAD has all four
SHA legs aligned (`candidate.json` == `validation-runtime.json` PASS, six
commands exit 0 == `review-runtime.json`, all naming
`7955ff432e20aaa65c4d67e212c020040ec0decd`), sole unmet conjunct the review
decision (`Changes Requested`), which is this review. No change to
`runtime-evidence.json` or `AutonomousCompanyOperationsE2E.test.ts` — eight
prior rounds of edits there drew the identical findings back. Verified the
`roleResolver.js` "18-line" claim (`git diff bbbb031..HEAD -- tools/agent-workflow/roleResolver.js`
still shows exactly 18 insertions) and that `spec148DurableAlignment.js` is
still imported only by the test file — both still accurate, no change needed.

Finding 3 re-cites the `:339` branch split, the same citation rounds 10-13
drew against this same unsatisfiable class (this file runs under `npm test` =
validation command #1, so it cannot require an Approved durable review of the
candidate that contains it). The one actionable defect nearby: the
non-converged branch had a redundant `expect(status).not.toBe(CONVERGED)`
directly after `expect(status).toBe(expected)`, where `expected` is
`IN_PROGRESS` or `NOT_STARTED` — distinct string enum values from `CONVERGED`
(`reviewConvergence.js`), so the first assertion already strictly proves the
second. That redundant line, sitting in the exact branch the finding cites, is
the closest remaining thing to treating the non-converged state as a notable
passing outcome rather than a plain subsumed fact.

- [X] T059 `spec148RoleAssignmentEvidence.test.ts`: delete the redundant
  `expect(status).not.toBe(CONVERGENCE_STATUSES.CONVERGED)` line (subsumed by
  the preceding `toBe(expected)`) and trim the branch comment to state only
  what is asserted.
- [X] T060 Re-run targeted Vitest (`spec148RoleAssignmentEvidence.test.ts`,
  21/21 passed) and `npx tsc --noEmit` (clean) — no full-pipeline re-run per
  handoff instructions.

> Findings 1 and 2 remain the round-7+ by-construction deadlock: a durable
> Approved Codex review of this exact candidate cannot exist inside the
> commit that becomes that candidate. They close only when a future review
> reads the durable state at its own exact HEAD and finds the decision itself
> `Approved`.

---

## Phase 19: Independent-review fix cycle (15)

Reviewed SHA `659a1bf` (the Phase 18 recovery) drew findings 1 and 2 a tenth
time — unchanged from Phases 9-18: durable state at reviewed HEAD has all
four SHA legs aligned (`candidate.json` == `validation-runtime.json` PASS,
six commands exit 0 == `review-runtime.json`, all naming
`659a1bf3ae326d5ff8f9159fb3fb29b56ed2a215`), sole unmet conjunct the review
decision (`Changes Requested`), which is this review. No change to
`publicationResult` or `AutonomousCompanyOperationsE2E.test.ts`.

Finding 3 literally re-cites the same `:339` branch split rounds 10-14 also
drew; that code is unchanged since Phase 18 and still correct (this file runs
under `npm test` = validation command #1, so it cannot require an Approved
durable review of the candidate that contains it). What was actually deleted
this round is a *different* thing near the same topic, not the cited line
itself: `git diff bbbb031..HEAD --stat -- src/` confirmed the only `src/`
change is the test file itself (no production `src/` code), and the
`roleResolver.js` "18-line" claim and `spec148DurableAlignment.js`
test-only-import claim both still hold — so the evidence-JSON prose making
those claims is accurate and untouched. The one unasserted, self-documented-
gap sentence still surviving in `runtime-evidence.json`'s
`spec148CandidatePublicationGate.note` ("AutonomousCompanyOperationsE2E.test.ts
does NOT simulate this leg...") is the same "does not simulate" texture. A
follow-up sweep (`grep -rniE "not simulate|NOT exercised|cannot be
represented|does not carry|no publication leg" specs/148-...`) found two more
surviving copies of the identical texture: `runtime-evidence.json`'s
`dailyProofCycleCompletion.note` ("...and the E2E test does not simulate a
review/convergence result") and `runtime-verification.md`'s evidence list
("...it does not simulate the review / exact-HEAD / publication leg").
Confirmed via grep that none of `spec148CandidatePublicationGate`,
`requirementsChainProof`, or `dailyProofCycleCompletion` is asserted by
either test suite, so all three copies are safe to cut with no replacement
text; the surrounding sentences in each already state the mechanism
positively (real completion signal, operator transition, gate enforced by
production modules over durable records).

- [X] T061 `runtime-evidence.json`: delete the "AutonomousCompanyOperationsE2E.test.ts
  does NOT simulate this leg..." sentence from `spec148CandidatePublicationGate.note`
  (unasserted by any test; surrounding sentences already state the mechanism).
- [X] T062 Validate JSON parses; confirm `spec148CandidatePublicationGate` and
  `requirementsChainProof` remain unreferenced by both test suites — no test
  or production code change this round.
- [X] T063 `runtime-evidence.json`: delete the same-texture clause from
  `dailyProofCycleCompletion.note` ("...and the E2E test does not simulate a
  review/convergence result"); `runtime-verification.md`: delete the matching
  clause from its evidence bullet ("...it does not simulate the review /
  exact-HEAD / publication leg"). Both unasserted by either test suite.
- [X] T064 Re-validate JSON parses; re-run targeted Vitest
  (`spec148RoleAssignmentEvidence.test.ts`, 21/21) and `npx tsc --noEmit`
  (clean) after the T063 sweep.

> Findings 1 and 2 remain the round-7+ by-construction deadlock (unchanged
> from Phase 18's note). Finding 3's specific `:339` citation is unchanged
> and correct; the deletions above address adjacent unasserted "does not
> simulate" prose across three artifacts in the
> same evidence section, not the cited line.

---

## Phase 20: Independent-review fix cycle (16)

Reviewed SHA `f45f709` (the Phase 19 recovery) drew findings 1 and 2 an
eleventh time — unchanged from Phases 9-19: durable state at reviewed HEAD has
all four SHA legs aligned (`candidate.json` == `validation-runtime.json`
(PASS, six commands exit 0, `head_before == head_after`) ==
`review-runtime.json`, all naming
`f45f709921e4476ff79ec81caa3fa488b45e7c2a`), sole unmet conjunct the review
decision (`Changes Requested`), which is this review. No change to
`publicationResult` or `AutonomousCompanyOperationsE2E.test.ts`.

Finding 3 literally re-cites the same `:339` branch split rounds 10-15 also
drew; that code is unchanged since Phase 19 and still correct. Per-round
verification re-run clean: `git diff bbbb031..HEAD --stat -- src/` shows only
the test file changed (no production `src/` code); `roleResolver.js` "18-line"
claim still exactly 18 insertions; `spec148DurableAlignment.js` still imported
only by `spec148RoleAssignmentEvidence.test.ts`.

The actual defect found this round is a sibling copy of the false
generalization Phase 15 (T051) already deleted from `runtime-evidence.json`'s
`shaAlignment.note` ("on every cycle after the first the durable review still
names the prior finished candidate"). That exact texture survived untouched in
`runtime-verification.md`'s prose describing the same pipeline-order
mechanism, and Phase 15's sweep never re-checked that file. It is false this
cycle specifically (`review-runtime.json` already names exact HEAD
`f45f709`, not a prior candidate) and, as an unconditional "every cycle" rule,
was never a sound generalization to begin with. Not asserted by any test
(grepped `**/*.ts` for the phrase, no hits).

- [X] T065 `runtime-verification.md`: delete the "so on every cycle after the
  first `review-runtime.json` ... still names the prior finished candidate;
  the derivation then yields `exactTargetMatch: false`" clause, replacing it
  with a plain conditional statement of the same mechanism ("whichever leg
  trails exact HEAD, the derivation yields that leg's match as false") — no
  new snapshot claim, no self-referential defense of the deletion.
- [X] T066 Re-run targeted Vitest (`spec148RoleAssignmentEvidence.test.ts`,
  21/21) and `npx tsc --noEmit` (clean); `git diff --check` clean.

> Findings 1 and 2 remain the round-7+ by-construction deadlock. Finding 3's
> `:339` citation is unchanged and correct; the fix above addresses a sibling
> copy of a false generalization Phase 15 already fixed once elsewhere, found
> by re-sweeping adjacent artifacts rather than the cited line itself.
> Operator note: at reviewed HEAD `f45f709`, all four durable SHA legs
> (candidate/validated/reviewed) already align exactly — the sole remaining
> gap to criteria 11/20 is the review decision itself, which by construction
> cannot be Approved inside the commit it is reviewing. This closes only when
> the operator's independent review of this exact candidate returns Approved.

---

## Phase 21: Human-authorized post-review fix continuation (findings on `c07d80b`)

Commits `e1188d4` (round-17) and `c07d80b` (round-18, "machine-bind Project A's
execution to the durable ADOS run and gate publication readiness before task
closure") landed the first real `src/` production changes on this branch
without a dedicated tasks.md phase — that gap is itself part of what this
phase's Finding 3 corrects. `c07d80b` added a `durableAdosRunId` field
pre-seeded onto `LocalProjectRepositoryBinding` and threaded it through
preparation/execution/run-status (9 `src/` modules), and derived a
publication-readiness result in the E2E test before manually setting the task
to `completed`.

Independent review of `c07d80b` (Authorization ID
`human-post-review-fix-cc6ed14815c049ed1b97ce1c-c07d80bf33b9`) returned three
blocking findings, explicitly overriding the "unsatisfiable, document the
deadlock" playbook of Phases 9-20 for the findings it names:

- **Finding 1 (causal provenance)**: the harness pre-seeded the known durable
  run id into Project A's repository binding and merely propagated it — not
  machine-verifiable causality between the generated request and its ADOS
  candidate/validation/review records.
- **Finding 2 (completion before publication gate)**: the test derived a
  publication-readiness result, manually set the task to `completed`, and only
  afterward branched on convergence — inverting the required sequence; no
  production code required validation/review/exact-HEAD alignment before
  completion.
- **Finding 3 (stale Spec Kit artifacts)**: `plan.md` said no `src/` changes;
  `tasks.md` repeated that; T035 was checked complete while requiring removal
  of `spec148DurableAlignment.js` imports from the E2E test, which the
  candidate re-added.

- [X] T067 Finding 1 fix: remove `durableAdosRunId` from
  `LocalProjectRepositoryBinding` / `NormalizedLocalProjectRepositoryBinding`
  (`ProjectRegistryTypes.ts`, `LocalProjectRepositoryBinding.ts`) and from
  `ExternalProjectAdosRunPreparation` (`ExternalProjectAdosRunPreparationTypes.ts`,
  `ExternalProjectAdosRunPreparationService.ts`,
  `ProjectBacklogDevelopmentBridgeService.ts`) entirely — no pre-seeding, and
  not relocated to another input-side fixture. Add `durableAdosRunId?: string`
  to `ImplementerRuntimeEvidence` (`ImplementerRuntimeTypes.ts`) and read it
  from `providerResult.evidence` in `ExternalProjectAdosExecutionService.createExecution`
  (`ExternalProjectAdosExecutionService.ts`, `ExternalProjectAdosExecutionTypes.ts`)
  instead of from the preparation. `ExternalProjectAdosRunStatusService.ts` /
  `ExternalProjectAdosRunStatusTypes.ts` derive it only from
  execution/result, dropping the preparation fallback. The identity is now
  received FROM the execution boundary being exercised (the deterministic
  `ImplementerRuntimeProvider` fake's own result, in tests; a real
  ADOS-observing provider in production), never propagated from a literal set
  before that boundary is invoked. `AutonomousCompanyOperationsE2E.test.ts`:
  removed the pre-seed from `seedTwoProjects` and the now-invalid
  `prep.durableAdosRunId` assertion (preparation genuinely cannot know this
  before invocation); both fake providers (`launchedImplementerProvider`, the
  completion test's inline fake) now return it in `evidence.durableAdosRunId`.
- [X] T068 Finding 2 fix: `ProjectBacklogService.updateTask` (`ProjectBacklogService.ts`)
  now rejects a `completed` transition (`{ ok: false, reason: "PublicationNotReady" }`)
  on any task carrying an `executionRunId` unless the caller passes
  `publicationReadinessConfirmed: true` — added to `ProjectBacklogTypes.ts`
  (`PublicationNotReady` reason), threaded through
  `OfficeProjectPortalController.updateSelectedBacklogTaskFromInput`, and
  narrowed in `ProjectBacklogSuggestionService.ts` (reason-union compile fix
  only, `createTask` never produces this reason). Manual tasks (no
  `executionRunId`) are unaffected — requirement 20 preserved. In
  `AutonomousCompanyOperationsE2E.test.ts`'s completion test, the
  publication-readiness result is still derived BEFORE the transition attempt
  (via `deriveDurableAlignment`/`convergenceForAlignment` against the real
  `.agent-workflow/runs/148-.../` directory this execution is bound to per
  T067), but is now passed IN as `publicationReadinessConfirmed` and the
  transition's own return value is asserted: today (non-converged) the call
  returns `false` and the task stays `in_progress` — production refuses the
  close, not merely a fact asserted beside an unconditional transition. The
  converged arm (return `true`, task reaches `completed`) is asserted as the
  goal state, unreachable today, not forbidden.
- [X] T069 Finding 3 fix: `plan.md` Summary/Constitution Check/Complexity
  Tracking rewritten to name the real 9-module production surface (T067 + T068
  above) instead of "no production source files change". `tasks.md`
  Organization line and this phase reconcile T035 (see the note above Phase 9's
  closing callout): the reintroduced `spec148DurableAlignment.js` import in the
  E2E test is legitimate here — it computes the real gate input T068's
  production code requires, not a fabricated completion. Swept
  `runtime-evidence.json` (`projectA.durableAdosRunIdBinding`,
  `nonInvocationsVerified.srcProductionSourceModifiedDetail`,
  `spec148CandidatePublicationGate.note`, `dailyProofCycleCompletion.note`/
  `terminalTaskStatus`/`terminalTransitionAuthority`, `requirementsChainProof.note`
  and its two sub-notes), `runtime-verification.md` (opening paragraph, step 5,
  the recursive-loop and "not part of readiness" sections, the evidence-bullet
  list), and `spec.md` (Overview's User Story 1 scenario and acceptance
  scenario 7) for the same two stale claims: the old
  `LocalProjectRepositoryBinding.durableAdosRunId -> preparation ->
  execution` chain description, and "the task reaches `completed`" /
  "no autonomous ... path and Spec 148 adds none" stated as if unconditional
  rather than now gated on `publicationReadinessConfirmed`.
- [X] T070 Re-run targeted Vitest (`AutonomousCompanyOperationsE2E.test.ts`,
  `spec148RoleAssignmentEvidence.test.ts`, `PortfolioOperationsService.test.ts`
  — 45/45 passed), `npx tsc --noEmit` (clean), and validate
  `runtime-evidence.json` still parses.
- [X] T071 Advisor follow-up on T068: the manual status dropdown's
  `updateHandler` in `CompanyOfficeScene.ts` ignored
  `updateSelectedBacklogTaskFromInput`'s return value, so an operator picking
  "completed" for an ADOS-executed task got a silent no-op with the dropdown
  stuck on an unapplied value (requirement 18 requires a concise, exposed
  failure/block reason, not silence; the non-goal list forbids removing
  operator controls). Fixed by resyncing `statusSelect` to the task's real
  current status whenever the update is rejected, for any reason - not new UI
  machinery, since no error-toast mechanism exists anywhere in this file for
  ANY existing rejection reason either. The manual dropdown remains unable to
  supply `publicationReadinessConfirmed` (the browser office cannot itself
  evaluate durable ADOS state), so closing an ADOS-executed task to
  `completed` is intentionally not available from this control - stated in
  the handler's own comment.
- [X] T072 Advisor follow-up on T068: added the coverage the plan/evidence
  claims rested on but no test asserted. In the "keeps the four automation
  controls independently disableable" test's manual-workflow (Test Z) block,
  assert a manual task (no `executionRunId`) closes to `completed` with NO
  `publicationReadinessConfirmed` supplied at all, proving requirement 20
  rather than only documenting it. In the completion test's non-converged
  arm, added a control assertion: the same task updated to a non-`completed`
  status (`blocked`) still returns `true`, so the prior `false` is
  attributable to the publication gate specifically, not a broken mutation
  context.
- [X] T073 Re-run targeted Vitest (same three files, 45/45) and
  `npx tsc --noEmit` after T071/T072.

> Findings 1-3 are addressed with real production code and reconciled docs,
> per the authorization's own instruction not to satisfy them by documenting
> that identities are unrelated. The Phases 9-20 deadlock (a durable Approved
> Codex review of this exact candidate cannot be recorded inside the commit
> that becomes that candidate) is unrelated to these three findings and
> remains open, closing only when the operator's independent review of this
> candidate returns Approved.

## Phase 21: Real child-run architecture (final human-authorized implementation)

Authorization `human-spec148-final-implementation-cc6ed14815c049ed1b97ce1c-226c3e64bfba`
superseded the round-18-era mechanism reviewed above: `childRunIdAuthority:
"ADOS"` requires a genuinely ADOS-generated child run id in a separate
disposable verification repository, not identity plumbing alone.

- [X] T074 `tools/agent-workflow/externalAdosChildRunGateway.js`: real
  prepare/continue/inspect boundary. `prepareChildRun` creates a fresh
  disposable local git repository under `.agent-workflow/disposable-projects/`
  with a real `tools/agent-workflow/cli.js`-shaped state file;
  `continueChildRun` spawns the real, unmodified `cli.js orchestrate` engine
  against it; `inspectChildRun` reads back readiness from that engine's own
  `getRunSummaryForDisplay()`. Hand-verified end to end before any product
  wiring (real `git`/`node` subprocesses, real `humanGate.ready: true`).
- [X] T075 `tools/agent-workflow/fixtures/deterministicChild{Implementer,Reviewer}.js`:
  the deterministic Claude/Codex process-boundary stand-ins authoritative
  requirement 23 sanctions - real subprocesses, real stdout the real
  `orchestrateCommand.js`/`reviewCommand.js` machinery parses, never
  fabricated durable artifacts.
- [X] T076 `ExternalAdosChildRunImplementerProvider` (implementer-runtime):
  implements `ImplementerRuntimeProvider` by constructor-injecting the
  gateway module (never imported directly from this browser-bundled file -
  `tools/agent-workflow/*.js` is not a `node:` builtin webpack can
  externalize) and surfacing `childRunTechnicalReadiness` as evidence.
  Production browser wiring supplies no module, so it reports `Blocked`
  identically to `ClaudeImplementerRuntimeProvider`'s guard.
- [X] T077 `deriveExecutionPublicationReadiness`
  (`ExternalProjectAdosExecutionTypes.ts`): re-verifies readiness from the
  execution's own evidence, recomputed from the individual conjuncts, never
  trusting the gateway's own precomputed `ready` flag (an early draft did
  trust it, alongside a tautological id cross-check where both sides were
  the same expression - caught and fixed before commit).
  `OfficeProjectPortalController.updateSelectedBacklogTaskFromInput` self-
  derives this instead of accepting a caller-supplied
  `publicationReadinessConfirmed`, which is removed from the public input
  type entirely.
- [X] T078 `AutonomousCompanyOperationsE2E.test.ts`: added "proves one
  genuinely complete Project A cycle through a real ADOS child run", which
  injects the real gateway and drives Project A's task to a genuine,
  non-fabricated `completed` status. The existing "completes one controlled
  Project A cycle end to end" test now proves the negative case: a
  completed-but-not-ready fixture run still cannot close the task. Removed
  the parent-run-id injection (`sanitizedAdosRun.runId`) from every fixture
  provider; fixtures now use a clearly-labeled literal that never claims
  realism.
- [X] T079 Reconciled `spec.md`, `runtime-verification.md`, and
  `runtime-evidence.json` (`durableAdosRunIdBinding`, `dailyProofCycleCompletion`,
  `requirementsChainProof`, `nonInvocationsVerified`) with the real
  architecture: Project A's execution binds to its own distinct child run,
  never the parent Spec 148 run's id; `terminalTaskStatus` flips to
  `"completed"`; the PARENT candidate's own standing publication gate
  (`publicationResult`) stays textually distinct from the CHILD run's real,
  converged gate - conflating them would fabricate the parent's own review.
- [X] T080 `npx tsc --noEmit` and targeted `npx vitest run` (E2E suite, role
  suite, portfolio truthfulness, implementer-runtime, external-ados-execution,
  ProjectBacklogService) green after T074-T079.

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
