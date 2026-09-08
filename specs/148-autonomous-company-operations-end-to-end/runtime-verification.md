# Runtime Verification: Autonomous Company Operations End-to-End

The deterministic evidence payload is recorded in `runtime-evidence.json`. All
tracked paths are repository-relative. The durable ADOS role assignment lives in
the gitignored
`.agent-workflow/runs/148-autonomous-company-operations-end-to-end/ados-run.json`;
its non-path fields are mirrored into the tracked, sanitized
`ados-run.sanitized.json`, and `spec148RoleAssignmentEvidence.test.ts` asserts
`runtime-evidence.json` transcribes them unchanged (and, when the durable file is
present, that the sanitized copy still matches it). Role and candidate ownership
therefore come from ADOS durable state, not a free-standing evidence label.

## Demonstrated controlled cycle (Project A = canonical `daily-proof`)

Runtime verification drives the real `OfficeProjectPortalController` and the real
Spec 141-147 services through one controlled autonomous cycle, using a
deterministic Spec 143 suggestion provider fixture and the real
`ExternalProjectAdosExecutionService` with only its `ImplementerRuntimeProvider`
(the OS process spawn) replaced by a deterministic fake:

1. **Planning** - Project A has Auto Suggestions, Auto Accept, Auto Ready, and
   Auto Execute independently enabled. Enabling Auto Suggestions is the single
   bounded lifecycle event; Spec 147 invokes the existing Spec 143 path and
   produces exactly one proposed, project-scoped suggestion
   (`daily-proof:suggestion:1`). Spec 147 creates no backlog task. A replayed
   planning event produces no second suggestion (cooldown).
2. **Backlog** - Spec 145 converts the suggestion through the existing
   Spec 143 -> Spec 141 path into a backlog-state task (`daily-proof:backlog:1`,
   `suggestionAcceptanceMode: automatic`). Spec 145 does not mark the task
   Ready. A replayed acceptance evaluation creates no duplicate task.
3. **Ready** - Spec 146 transitions the task backlog -> Ready exactly once
   (`promotedCount: 1`) through existing Spec 141 transition semantics. Spec 146
   starts no development and does not invoke Spec 144. A replayed readiness
   evaluation performs no second promotion.
4. **Engineering** - Spec 144 alone authorizes one bounded execution. It reuses
   the Spec 142 / Spec 138 bridge, which binds the exact
   `projectId = daily-proof` and `sourceBacklogTaskId = daily-proof:backlog:1`,
   against Project A's real registered local repository/worktree binding (the
   actual repository this verification runs in, applied through
   `ProjectRegistryService` + `applyLocalProjectRepositoryBindings`), with no
   cross-project id and no global latest-project singleton. The real
   `ExternalProjectAdosExecutionService` runs once: it validates the
   preparation, checks the trusted policy and the safe command, assembles the
   structured requirements file, invokes the process boundary once (fake
   `ImplementerRuntimeProvider`), and persists a durable execution + result +
   run-status record the office observes (`implementerStarted: true`,
   `reviewStarted: false`, `githubMutationStarted: false`, `publishStarted:
   false`). The task becomes `in_progress` with the real execution id
   `daily-proof:external-ados-execution:...:external-ados-execution-v1`. A
   replayed execution event starts no second run and no second process spawn.
5. **Review / Validation / exact HEAD / Complete** - the same Project A chain
   continues past ADOS execution. `AutonomousCompanyOperationsE2E.test.ts`
   drives the real `roleResolver.js` and `reviewConvergence.js` immediately
   after execution: the reviewer for this run resolves to Codex, distinct from
   the Claude implementer, and `computeConvergenceStatus` does not reach
   `CONVERGED` without an Approved independent review aligned on
   `candidate == validated == reviewed == exact HEAD`, so publication stays
   blocked and the task does not advance past `in_progress`. The review /
   validation / exact-HEAD / publication legs are executed by the real ADOS
   pipeline against this exact feature branch and worktree (authoritative
   section 23; acceptance criterion 20), and enforced from durable ADOS state
   by `spec148RoleAssignmentEvidence.test.ts`. The independent reviewer is
   Codex per the durable ADOS role assignment.
   Completion state derives from the real execution result, not a hardcoded
   value; no fabricated percentage progress is introduced. ADOS runs full
   configured validation (`npm test`, `npx tsc --noEmit`, `npm run build`,
   `npm run test:e2e:home-canvas`, `git diff --check`, `git diff --cached
   --check`) and an independent Codex review against the exact candidate HEAD
   after every implementation handoff, including the one that adds this
   evidence. The live per-candidate verdict is in the durable
   `.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json`
   sources; this tracked artifact does not freeze it, because committing the
   artifact advances HEAD and staleifies any frozen verdict. Exact-HEAD
   convergence and publication remain gated in production by
   `validationPlan.js` `isFinalValidationSatisfied` (`validationPolicy.js`
   `targetsMatch`) at the `orchestrateCommand.js` final-verification stage plus
   `reviewConvergence.js` `computeConvergenceStatus`, which together require
   `validated == reviewed == exact HEAD` plus an Approved independent review;
   `spec148RoleAssignmentEvidence.test.ts` cross-checks the same three durable
   SHAs with the same `targetsMatch` comparator against `git rev-parse HEAD`.

### Backlog before Ready, then attribution of the Spec 145 -> Spec 146 cascade

The chain test leaves Auto Ready off through Spec 145 acceptance, so the
intermediate `backlog` state is directly observable:
`acceptedTask.status === "backlog"` and
`backlogReadinessPromotionPromotedCount === 0` immediately after acceptance,
with Spec 145 never having set `ready`. Auto Ready is then enabled as its own
distinct, independently-triggered event, which is what performs the
backlog -> Ready promotion (`backlogReadinessPromotionPromotedCount === 1`,
task status `ready`); `expect(invoke).not.toHaveBeenCalled()` right after that
promotion - with Auto Execute demonstrably already on - proves Spec 146 did
not invoke Spec 144 directly.

`OfficeProjectPortalController.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()`
also calls `evaluateSelectedProjectBacklogReadinessPromotion()` at its tail - a
sanctioned trigger (Spec 146 FR-016 lists "Spec 145 acceptance evaluation
completion") - so when Auto Accept and Auto Ready are *both already* enabled
before generation, acceptance and promotion happen in one synchronous cascade
instead. A dedicated test ("attributes accept and promote to their own policy
audit records when both are enabled") exercises that shape and asserts each
transition against its owning policy's per-evaluation audit counter, not by
disabling a stage.

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

## Failure visibility (authoritative requirement 18)

Deterministic coverage in `AutonomousCompanyOperationsE2E.test.ts` for stage
failures preserving prior state and exposing a concise block reason:

- **Suggestion provider unavailable** - the Spec 143 provider throws; Spec 147
  records `Failed: suggestion generation unavailable`, no suggestion and no
  backlog task are created, and the policy stays enabled (not silently flipped).
- **Acceptance ineligible** - a `normal`-priority suggestion under an Auto
  Accept policy that allows only `high`; Spec 145 skips it with structured
  reason `PriorityNotAllowed` (`latestResultText` `Skipped: ...`), the backlog
  is not mutated, and the suggestion stays `proposed`.
- **ADOS execution-stage failure** - the real `ExternalProjectAdosExecutionService`
  with an implementer runtime that fails to spawn; the service returns a
  `Failed` result (`EXTERNAL_ADOS_EXECUTION_INTERNAL_FAILURE`, `started: false`)
  with no execution record. The task stays `ready` (never `in_progress`), the
  development request draft is marked `Failed`, and no completion is fabricated.

Reviewer-unavailable and exact-HEAD-mismatch failure visibility is covered by
`spec148RoleAssignmentEvidence.test.ts` (`roleResolver.js` blocks when the Codex
runtime is disabled; `computeConvergenceStatus` never reaches `CONVERGED` on a
stale or unaligned SHA target).

## Second-project isolation

Project B (canonical `ai-lab`) receives no suggestion, backlog task, Ready
transition, execution, ADOS status, or candidate/reviewer state, and its four
automation policies stay Off. No development request, preparation, execution, or
run status references `ai-lab`.

## Reload / re-entry

A brand-new controller constructed over the same persisted storage restores all
four Project A policies and the `in_progress` task lifecycle state, and does not
re-invoke the ADOS adapter for the already-associated task. Project B remains
disabled; no consent is granted on remount.

## Manual workflows remain valid

With all automation disabled, manual backlog task creation, manual backlog ->
Ready promotion, manual suggestion generation, manual suggestion review and
acceptance (`controller.acceptSelectedBacklogSuggestion()`, landing in
`backlog` with `suggestionAcceptanceMode: "manual"` since Auto Ready is off),
and manual Start Development (`controller.startSelectedBacklogTaskDevelopment()`,
reaching `in_progress` with an execution id) all continue to work. Each
automation stage can be disabled independently.

## The target chain and where each leg is enforced

One controlled Project A cycle is demonstrated end to end. The in-office ADOS
execution/run-status records track only their own stage; the Spec 130 schema
types `validationStarted` / `reviewStarted` / `repositoryMutationStarted` /
`githubMutationStarted` / `publishStarted` / `mergeStarted` / `deployStarted`
as the literal `false`
(`src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionTypes.ts:41-47`,
`src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusTypes.ts:29-35`),
unchanged by Spec 148. The review / validation / exact-HEAD / publication legs
of the same chain are executed by the real ADOS pipeline against this exact
feature branch and worktree, as authoritative section 23 directs and acceptance
criterion 20 requires, and enforced from durable ADOS state.

| Chain leg | Enforcement site |
| --- | --- |
| Spec 147 bounded suggestion generation | `AutonomousCompanyOperationsE2E.test.ts` Test B |
| -> Spec 145 controlled acceptance -> Spec 141 backlog | Test C |
| -> Spec 146 controlled Ready promotion | Test D |
| -> Spec 144 controlled autonomous execution | Test E |
| -> Spec 142 / Spec 138 development bridge | Test F |
| -> ADOS -> implementer | Tests E/F/X drive the real `ExternalProjectAdosExecutionService`; durable execution/result/run-status records observable by the office |
| -> independent reviewer (Codex, distinct from Claude) | `AutonomousCompanyOperationsE2E.test.ts` Test H continuation (`roleResolver.js`); `spec148RoleAssignmentEvidence.test.ts` Tests P-W |
| -> validation -> exact HEAD | `spec148RoleAssignmentEvidence.test.ts` (`validationPolicy.js` `targetsMatch` via `validationPlan.js` `isFinalValidationSatisfied`; durable `candidate/validation-runtime/review-runtime.json` cross-checked against `git rev-parse HEAD`) |
| -> publication | `reviewConvergence.js` `computeConvergenceStatus` reaches `CONVERGED` only with an Approved review aligned on `candidate == validated == reviewed == exact HEAD`. Push, PR readiness, approval, merge, and remote deletion are human-only per execution policy, so publication is pending at implementation handoff. |

## External safety boundary

This implementation runtime does not publish, merge, or deploy, and does not
mutate GitHub (execution policy; the same boundary Specs 142-147 declare). ADOS
runs full configured validation and an independent Codex review against the
exact candidate HEAD after every implementation handoff.
`runtime-evidence.json.externalSafetyBoundary` records
`validationAndReviewRunByAdosPerCandidate: true` and
`published/merged/deployed/githubMutated: false`. It deliberately does **not**
record a per-candidate validation result or review decision: committing this
tracked artifact advances HEAD, so any frozen verdict is immediately stale.

`runtime-evidence.json.shaAlignment` names, rather than transcribes, the durable
sources where the candidate/validated/reviewed SHAs are available
(`.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json`)
- a SHA literal committed into a tracked file is stale the moment the commit
lands. `spec148RoleAssignmentEvidence.test.ts` reads those sources; in a
populated run dir it requires `validation-runtime.json` and `review-runtime.json`
to be present (a selectively-deleted sibling fails, not skips). It asserts
`candidate.json`'s `candidate_sha` equals `git rev-parse HEAD` unconditionally
(`candidate.json` is written for the exact commit before validation runs, so
this leg has no pipeline-order circularity), asserts validation left the
worktree unmutated (`head_before == head_after`), then compares
candidate/validated/reviewed targets against exact HEAD with the **same
comparator production uses** - `validationPolicy.js` `targetsMatch`, reached in
production via `validationPlan.js` `isFinalValidationSatisfied` at the
`orchestrateCommand.js` final-verification stage - and feeds that *derived*
`exactTargetMatch` plus the *real* durable review decision into
`computeConvergenceStatus`, asserting it converges iff an Approved review is
aligned on all three SHAs. The ADOS pipeline order is candidate -> validate
(this repository's own `npm test` included) -> review, so on every cycle after
the first `review-runtime.json` (and briefly `validation-runtime.json`) still
names the prior finished candidate; the derivation then yields
`exactTargetMatch: false` and the assertion is "must not authorize publication"
- a real invariant on both branches, and the validation-command exit-0 loop
runs only when the durable validation record itself names exact HEAD. When
durable sources are absent entirely (clean checkout) the enforcement gate is
still exercised directly by the tests below. Requirement 21's "where available"
is satisfied by naming the durable location plus the test that resolves it;
requirement 18's ban on fabricated completion is satisfied because no approval
is asserted anywhere.

## Adaptive role and publication-gate evidence

`tools/agent-workflow/spec148RoleAssignmentEvidence.test.ts` asserts the durable
role assignment (implementer Claude, reviewer Codex, mode adaptive, candidate
owner Claude, run id `cc6ed14815c049ed1b97ce1c`) from the sanitized ADOS
artifact `ados-run.sanitized.json`, cross-checks it against the durable
`.agent-workflow/runs/148-.../ados-run.json` when present, checks
`runtime-evidence.json` transcribes it unchanged, and exercises the real
agent-workflow enforcement modules:

- `roleResolver.js` resolves a Claude implementer to a distinct Codex reviewer,
  and refuses to resolve any reviewer when Claude is the only roster agent
  (no self-review).
- `roleResolver.js` blocks when the Codex reviewer runtime is disabled
  (reviewer unavailable blocks safely).
- `reviewConvergence.js` `computeConvergenceStatus` returns `converged` only
  when the review is Approved, complete, unblocked, and `exactTargetMatch` is
  true; a stale approval against an older SHA (`exactTargetMatch: false`) or any
  validated/reviewed/HEAD SHA mismatch does not converge.
- The durable ADOS records `candidate.json` / `validation-runtime.json` /
  `review-runtime.json` are cross-checked with the production comparator
  `validationPolicy.js` `targetsMatch` against `git rev-parse HEAD`; the
  resulting `exactTargetMatch` is fed to `computeConvergenceStatus` with the
  real durable review decision, and convergence is asserted iff an Approved
  review is aligned on candidate == validated == reviewed == exact HEAD.

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
  proves the ordered single cycle (through the post-execution review /
  exact-HEAD / publication gate), four independent controls, no direct ADOS
  invocation from Specs 145-147, idempotency on replayed events, active-run
  gating, second-project isolation, reload persistence, manual-workflow
  continuity, failure visibility for suggestion-provider-unavailable /
  acceptance-ineligible / ADOS-execution-stage failure, and the absence of a
  fabricated percentage-progress field.
- `tools/agent-workflow/spec148RoleAssignmentEvidence.test.ts` proves the
  durable role assignment, implementer/reviewer distinctness, candidate owner
  Claude, stale-approval rejection, validated/reviewed/exact-HEAD alignment,
  reviewer-unavailable blocking, and no self-review fallback.
