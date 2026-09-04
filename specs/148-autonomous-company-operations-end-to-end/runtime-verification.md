# Runtime Verification: Autonomous Company Operations End-to-End

The deterministic evidence payload is recorded in `runtime-evidence.json`. All
tracked paths are repository-relative; the durable ADOS role assignment is
transcribed from the gitignored
`.agent-workflow/runs/148-autonomous-company-operations-end-to-end/ados-run.json`
so the evidence is stable across worktree locations.

## Demonstrated controlled cycle (Project A)

Runtime verification drives the real `OfficeProjectPortalController` and the real
Spec 141-147 services through one controlled autonomous cycle, using a
deterministic Spec 143 suggestion provider fixture and the real
`ExternalProjectAdosExecutionService` with only its `ImplementerRuntimeProvider`
(the OS process spawn) replaced by a deterministic fake:

1. **Planning** - Project A has Auto Suggestions, Auto Accept, Auto Ready, and
   Auto Execute independently enabled. Enabling Auto Suggestions is the single
   bounded lifecycle event; Spec 147 invokes the existing Spec 143 path and
   produces exactly one proposed, project-scoped suggestion
   (`project-a:suggestion:1`). Spec 147 creates no backlog task. A replayed
   planning event produces no second suggestion (cooldown).
2. **Backlog** - Spec 145 converts the suggestion through the existing
   Spec 143 -> Spec 141 path into a backlog-state task (`project-a:backlog:1`,
   `suggestionAcceptanceMode: automatic`). Spec 145 does not mark the task
   Ready. A replayed acceptance evaluation creates no duplicate task.
3. **Ready** - Spec 146 transitions the task backlog -> Ready exactly once
   (`promotedCount: 1`) through existing Spec 141 transition semantics. Spec 146
   starts no development and does not invoke Spec 144. A replayed readiness
   evaluation performs no second promotion.
4. **Engineering** - Spec 144 alone authorizes one bounded execution. It reuses
   the Spec 142 / Spec 138 bridge, which binds the exact
   `projectId = project-a` and `sourceBacklogTaskId = project-a:backlog:1`, with
   no cross-project id and no global latest-project singleton. The real
   `ExternalProjectAdosExecutionService` runs once: it validates the
   preparation, checks the trusted policy and the safe command, assembles the
   structured requirements file, invokes the process boundary once (fake
   `ImplementerRuntimeProvider`), and persists a durable execution + result +
   run-status record the office observes (`implementerStarted: true`,
   `reviewStarted: false`, `githubMutationStarted: false`, `publishStarted:
   false`). The task becomes `in_progress` with the real execution id
   `project-a:external-ados-execution:...:external-ados-execution-v1`. A
   replayed execution event starts no second run and no second process spawn.
5. **Review / Validation / Complete** - The independent reviewer is Codex per the
   durable ADOS role assignment. Completion state derives from the real
   execution result, not a hardcoded value; no fabricated percentage progress
   is introduced. Full configured validation (`npm test`, `npx tsc --noEmit`,
   `npm run build`, `npm run test:e2e:home-canvas`, `git diff --check`,
   `git diff --cached --check`) PASSED against candidate
   `693a07b0ffbeca0919589ba40fadf69b183f1b12` and an independent Codex review
   ran against the same SHA (see *External safety boundary* below). Exact-HEAD
   convergence and publication remain gated by
   `tools/agent-workflow/reviewConvergence.js`, which requires
   `validated == reviewed == exact HEAD` plus an Approved independent review.

### Attribution of the Spec 145 -> Spec 146 cascade

`OfficeProjectPortalController.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()`
calls `evaluateSelectedProjectBacklogReadinessPromotion()` at its tail - a
sanctioned trigger (Spec 146 FR-016 lists "Spec 145 acceptance evaluation
completion"). With all four controls enabled, acceptance and promotion happen
in one synchronous cascade. Each transition is attributed to its owning policy
by that policy's per-evaluation audit counter, not by disabling a stage:
`suggestionAutoAcceptAcceptedCount === 1` (Spec 145 accepted once) and
`backlogReadinessPromotionPromotedCount === 1` (Spec 146's own evaluation
promoted once). Spec 145 never sets `ready` itself, and
`expect(invoke).not.toHaveBeenCalled()` immediately after the cascade proves
Spec 146 did not invoke Spec 144 despite Auto Execute being enabled throughout.

## Independent automation controls

The four policies (Auto Suggestions, Auto Accept, Auto Ready, Auto Execute) are
toggled on and off one at a time; each toggle leaves the other three unchanged.
No single "Full Auto" flag exists.

## Active-run safety

While Project A has an active execution:

- Spec 147 evaluation is skipped with `Skipped: active execution exists`; no
  extra suggestion is generated.
- A new high-priority backlog task is not auto-promoted; Spec 146 records
  `Skipped: active execution exists`.
- Spec 144 does not start a second execution; the probe reports
  `autonomyReason: ActiveRunExists`.

## Second-project isolation

Project B receives no suggestion, backlog task, Ready transition, execution,
ADOS status, or candidate/reviewer state, and its four automation policies stay
Off. No development request, preparation, execution, or run status references
`project-b`.

## Reload / re-entry

A brand-new controller constructed over the same persisted storage restores all
four Project A policies and the `in_progress` task lifecycle state, and does not
re-invoke the ADOS adapter for the already-associated task. Project B remains
disabled; no consent is granted on remount.

## Manual workflows remain valid

With all automation disabled, manual backlog task creation, manual
backlog -> Ready promotion, and manual suggestion generation all continue to
work. Each automation stage can be disabled independently.

## External safety boundary

This implementation runtime does not publish, merge, or deploy, and does not
mutate GitHub (execution policy; the same boundary Specs 142-147 declare).
Full configured validation and an independent Codex review, however, *did* run
against candidate `693a07b0ffbeca0919589ba40fadf69b183f1b12` after the
implementation-handoff checkpoint. `runtime-evidence.json.externalSafetyBoundary`
records `validationStarted: true`, `reviewStarted: true`,
`fullAdosValidationPipelineRun: true`
(`fullAdosValidationPipelineResult: PASS`),
`independentReviewDecisionForTranscribedCandidate: "Changes Requested"`, and
`published/merged/deployed/githubMutated: false`. `runtime-evidence.json.shaAlignment`
transcribes, from the durable
`.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json`
artifacts, `candidateSha == validatedSha == reviewedSha ==
693a07b0ffbeca0919589ba40fadf69b183f1b12`, the six validation commands and
their exit codes, `validationTreeMutated: false`, and
`convergenceStatusForTranscribedCandidate: not converged` (latest decision is
Changes Requested). Requirement 21 asks for those SHAs "where available" - they
are now available and recorded; requirement 18 forbids fabricating completion,
so the evidence records the non-converged status rather than an approval. Every
value is scoped to `transcribedAsOfCandidateSha` (not current HEAD): the fix
commit that adds this block is itself a **new** candidate that ADOS must
re-validate and Codex must independently re-review, and `reviewConvergence.js`
evaluates `validated == reviewed == exact HEAD` against that new SHA before
publication.

## Adaptive role and publication-gate evidence

`tools/agent-workflow/spec148RoleAssignmentEvidence.test.ts` asserts the
transcribed durable role assignment (implementer Claude, reviewer Codex, mode
adaptive, candidate owner Claude, run id `cc6ed14815c049ed1b97ce1c`) and
exercises the real agent-workflow enforcement modules:

- `roleResolver.js` resolves a Claude implementer to a distinct Codex reviewer,
  and refuses to resolve any reviewer when Claude is the only roster agent
  (no self-review).
- `roleResolver.js` blocks when the Codex reviewer runtime is disabled
  (reviewer unavailable blocks safely).
- `reviewConvergence.js` `computeConvergenceStatus` returns `converged` only
  when the review is Approved, complete, unblocked, and `exactTargetMatch` is
  true; a stale approval against an older SHA (`exactTargetMatch: false`) or any
  validated/reviewed/HEAD SHA mismatch does not converge.

## Office lifecycle representation (authoritative requirement 12)

Spec 148 changes no view code. The lifecycle stages are already rendered by
existing office modules: `ExternalProjectAdosExecutionView` (Engineering),
`ImplementerRuntimeView` / `ReviewerRuntimeView` / `ReviewDecisionView`
(Review), `ValidationRuntimeView` / `PostValidationReviewTargetView`
(Validation/QA), and the backlog planning surface (Planning / Backlog / Ready).
Existing status-derived progress is discrete; Spec 148 introduces no new
percentage field (asserted by the chain test).

## Portfolio truthfulness (authoritative requirement 13)

Spec 148 changes no portfolio code. Spec 140 project-scoped, read-only,
no-leak derivation is covered by
`src/features/city-view/scene/PortfolioOperationsService.test.ts`, which maps
`active` / `needs-attention` / `blocked` / `idle` / `recently-completed` /
`disconnected` states independently, proves a global run does not contaminate
another portfolio item, and proves each per-policy summary (AI suggestions, AI
Accept, Auto Plan, autonomy, Auto Ready) is derived without mutating state. The
Spec 148 chain test additionally demonstrates no cross-project state (Test N).

## No uncontrolled recursive autonomy loop (authoritative requirement 19)

By construction: Spec 148 adds no production code and therefore introduces no
new trigger. The existing cooldown, planning-capacity, concurrency, and
idempotency gates of Specs 144-147 are unchanged, and the chain test proves one
sequential cycle with replayed events producing no further work.

## Not part of readiness / execution

No second orchestration engine, no change to Spec 144-147 policy semantics, no
production source modification, no bypass of independent Codex review, no bypass
of exact HEAD, and no removal of operator controls. Push, PR readiness,
approval, merge, and remote deletion remain human-only.

## Evidence captured in this runtime

- `src/features/city-view/scene/office/project-backlog/AutonomousCompanyOperationsE2E.test.ts`
  proves the ordered single cycle, four independent controls, no direct ADOS
  invocation from Specs 145-147, idempotency on replayed events, active-run
  gating, second-project isolation, reload persistence, manual-workflow
  continuity, and the absence of a fabricated percentage-progress field.
- `tools/agent-workflow/spec148RoleAssignmentEvidence.test.ts` proves the
  durable role assignment, implementer/reviewer distinctness, candidate owner
  Claude, stale-approval rejection, validated/reviewed/exact-HEAD alignment,
  reviewer-unavailable blocking, and no self-review fallback.
