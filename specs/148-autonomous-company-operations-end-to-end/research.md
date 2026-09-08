# Research: Autonomous Company Operations End-to-End Verification

## Decision 1 - Drive the real controller, not a new coordinator

**Decision**: The E2E harness drives `OfficeProjectPortalController` and the real
Spec 141-147 services in order and asserts observed state.

**Rationale**: `OfficeProjectPortalController` already constructs and wires every
stage: `ProjectAutonomousSuggestionCoordinator` (147),
`ProjectBacklogSuggestionAcceptancePolicyService` (145), `ProjectBacklogService`
(141), `ProjectBacklogReadinessPromotionPolicyService` (146),
`ProjectAutonomousExecutionPolicyService` (144),
`ProjectBacklogDevelopmentBridgeService` (142/138), and
`ExternalProjectAdosExecutionService` (ADOS). Authoritative requirement 24 bars a
second production orchestration engine. A test-only harness satisfies "an E2E
verification coordinator/harness only if needed for evidence".

**Alternatives rejected**: A new `AutonomousCompanyOperationsCoordinator`
production class - rejected as a second source of truth. Calling each service
directly without the controller - rejected because it would not exercise the
real cross-stage wiring, idempotency keys, or persistence.

## Decision 2 - Deterministic suggestion provider fixture

**Decision**: Inject a deterministic `projectBacklogSuggestionProvider` via the
existing controller constructor option.

**Rationale**: Authoritative requirement 23 explicitly allows a deterministic
suggestion fixture while still proving Spec 147 invokes the authoritative
Spec 143 abstraction. The controller already accepts
`projectBacklogSuggestionProvider`; existing Spec 147 tests use
`{ generateSuggestions: vi.fn(() => candidates) }`.

**Alternatives rejected**: A live model call - rejected; requirement 23 bars
dependence on uncontrolled random AI output.

## Decision 3 - ADOS boundary: real service, faked process spawn only

**Decision**: The chain test constructs the real
`ExternalProjectAdosExecutionService` and injects only a deterministic
`ImplementerRuntimeProvider` (the OS process spawn). The real service still runs
preparation validation, the trusted-policy check, the safe-command check, the
structured requirements-file assembly, and durable
execution / result / run-status record creation that the office observes. The
ADOS run that produced this handoff (`cc6ed14815c049ed1b97ce1c`) records
`status: READY_FOR_IMPLEMENTATION` at the handoff checkpoint. ADOS then runs
full configured validation and an independent Codex review against the exact
candidate HEAD after every handoff; the live per-candidate verdict lives in the
durable `.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json`
sources (see `runtime-evidence.json.shaAlignment.durableSources`), not frozen in
tracked evidence.

**Rationale**: Requirement 23 permits "existing injectable runtime adapters ...
where necessary" for the "external provider/ADOS process boundaries" - i.e. the
process spawn, not the whole service. Stubbing
`externalProjectAdosExecutionService.start` wholesale (the reviewed candidate's
approach) bypassed preparation validation, execution-record creation, and
run-status persistence, so it did not prove the development request reaches the
configured ADOS project execution path or produces durable run status
observable by the office (requirements 9, 23). Injecting at the
`ImplementerRuntimeProvider` boundary - the same seam
`ExternalProjectAdosExecutionService.test.ts` already uses - keeps every layer
of the real service in the test. ADOS then runs the authoritative full
validation pipeline and an independent Codex review against the exact candidate
HEAD after every handoff. Exact-HEAD convergence and publication remain the
human-only gate, the same external boundary Specs 142-147 declare.

**Alternatives rejected**: A mock-only ADOS shortcut - barred by requirement 9.
Freezing validated / reviewed / exact-HEAD SHA literals and a review decision
into tracked evidence - they go stale the moment the commit lands (it changes
HEAD), which is exactly why an earlier candidate's frozen `693a07b...` block was
rejected. `runtime-evidence.json.shaAlignment` instead names the durable ADOS
sources where those SHAs are available and `spec148RoleAssignmentEvidence.test.ts`
resolves them at run time.

**Fake outcome shape**: `ImplementerRuntimeStatus` `"Completed"` means only that
the spawn succeeded and the subprocess exited - it is NOT ADOS run-level
completion. Run-level completion is `evidence.completed`, which every automation
policy's `countActiveExecutions` and `OfficeProjectPortalController.isActiveExternalProjectAdosExecution`
key on (`status === "Completed" && implementerStarted && !evidence.completed` =
active). The main chain test therefore holds the run in flight
(`evidence.completed: false`) so the active-run safety checks (requirements
15-16) have something to gate on, while `ExternalProjectAdosExecution` carries
`validationStarted / reviewStarted / publishStarted` as literal `false` (Spec
130, unchanged). The dedicated Test X drives both values: `evidence.completed:
true` drops the office-observable Spec 144 active-execution count from 1 to 0
(`ProjectAutonomousExecutionPolicyService.countActiveExecutions`), which is how
the office distinguishes a finished ADOS run from a launched one, with
`deriveExternalProjectAdosRunStatus` stage `Started`/`Completed` as a derivation
unit check - the daily-proof cycle then closes to a truthful terminal
`completed` through the existing operator transition. `evidence.completed: true`
is a *terminated* run and correctly does not register as active.

## Decision 4 - `.agent-workflow/` is gitignored; commit a sanitized ADOS mirror

**Decision**: Commit `specs/148-.../ados-run.sanitized.json` - a
repository-relative mirror of the durable ADOS run record carrying the
`agentAssignment` block, `runId`, `specNumber`, `featureBranch`,
`authoritativeBaseSha`, `executionPolicyVersion`, `status`, and no absolute
paths. `spec148RoleAssignmentEvidence.test.ts` asserts `runtime-evidence.json`
transcribes those values unchanged **and**, when the durable
`.agent-workflow/runs/148-.../ados-run.json` is present in the worktree, that the
sanitized copy still deep-equals it minus the stripped path fields.

**Rationale**: `git check-ignore -v` resolves
`.agent-workflow/runs/148-.../ados-run.json` to `.gitignore:11:.agent-workflow/`.
A test reading only the tracked `runtime-evidence.json` and asserting its own
transcribed strings would pass even if those strings were a fabricated label -
the review's blocking finding. Binding the evidence to a committed sanitized
ADOS artifact (and cross-checking the live durable file when available) makes the
role and candidate-ownership values verifiable against ADOS durable state, per
requirement 10, while staying portable across worktrees (requirement 21 bars
persisting absolute worktree paths).

**Alternatives rejected**: Reading only the untracked path at test time -
non-portable across worktrees. Committing `.agent-workflow/` verbatim - carries
absolute worktree/repository/source paths, barred by requirement 21.

## Decision 5 - Existing enforcement of role / exact-HEAD / no-self-review

**Decision**: Reuse `tools/agent-workflow/roleResolver.js` and
`tools/agent-workflow/reviewConvergence.js`.

**Rationale**:

- `roleResolver.js` `resolveCliOverride` / `resolveEffectiveRoles` already
  rejects a reviewer equal to the implementer ("Resolved reviewer cannot be the
  same agent as implementer") and requires a distinct reviewer candidate.
- `reviewConvergence.js` `computeConvergenceStatus` only returns `CONVERGED`
  when `latestReviewOutcome === "Approved" && latestCompletenessStatus ===
  "complete" && activeBlockingFindingsCount === 0 && exactTargetMatch`. Setting
  `exactTargetMatch` false (stale approval / SHA mismatch) blocks convergence.
- Reviewer-unavailable handling and no-self-review fallback are already enforced
  in the agent runner and role resolver.

Spec 148 asserts these behaviors for this run rather than re-implementing them.

**Alternatives rejected**: Parallel assertions in `src/` - duplicates logic and
drifts from the authoritative modules.

## Decision 6 - Office lifecycle and portfolio states already exist

**Decision**: §12 and §13 are assert-only; no view or portfolio code changes.

**Rationale**: The office already renders Implementer Runtime, Reviewer Runtime,
Review Decision, Validation Runtime, and Post-Validation Review Target stages
(`OfficeProjectPortalView.ts`). `PortfolioOperationsService.ts` already derives
`attentionState` values `active`, `needs-attention`, `blocked`,
`recently-completed`, `disconnected`, plus planning/ready derivation from
backlog summary. Non-goals bar an office redesign. Existing status-derived
progress (`getTaskStatusProgressPercent`) is discrete and not introduced by
Spec 148, so §Y is a negative assertion that Spec 148 adds no new fabricated
percentage.

**Alternatives rejected**: New lifecycle enum or portfolio field - unnecessary
and against non-goals.

## Decision 7 - Auto Ready enabled after acceptance, as its own distinct event

**Decision**: The chain test enables Auto Accept and Auto Execute before the
bounded lifecycle event, but leaves Auto Ready off until *after* Spec 145
acceptance is asserted. Auto Ready is then enabled as a separate,
independently-triggered step, which is what performs the backlog -> Ready
promotion (Test D). All four controls are still independently toggled (Test A)
and all four end up on before the cycle completes; they are just not all
enabled simultaneously before the suggestion is generated.

**Rationale**: An earlier candidate enabled all four controls before the
bounded lifecycle event. `OfficeProjectPortalController.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()`
calls `evaluateSelectedProjectBacklogReadinessPromotion()` at its tail - a
*sanctioned* trigger (Spec 146 FR-016 lists "Spec 145 acceptance evaluation
completion"). With Auto Ready already on at that point, acceptance and
promotion happened in one synchronous cascade, and the review's blocking
finding was that the test never observed the intermediate `backlog` state
before promotion - it asserted the *counts* of each stage's audit trail but not
the task's own status in between, so a construction that folded Spec 145
straight into Spec 146 would have passed the same assertions. Leaving Auto
Ready off until after acceptance makes `acceptedTask.status === "backlog"`
directly observable (Test C), with `backlogReadinessPromotionPromotedCount ===
0` proving Spec 146 has not run yet. Enabling Auto Ready afterward is itself
the "task is valid and same-project" / "deterministic selection" trigger
requirement 6 describes, and its resulting `backlogReadinessPromotionPromotedCount
=== 1` plus the task's transition to `ready` (Test D) is attributed to that
event, never to Spec 145. `expect(invoke).not.toHaveBeenCalled()` is checked
right after this promotion - with Auto Execute demonstrably already on - to
prove Spec 146 did not invoke Spec 144 directly. Requirement 2 ("each stage is
independently enabled for the test project") is satisfied because each control
is still toggled and asserted on its own (Test A), and all four are on by the
time execution starts (Test E); nothing requires all four to be enabled before
the first suggestion exists. The same-call cascade this decision no longer
exercises inline is still covered by a dedicated test ("attributes accept and
promote to their own policy audit records when both are enabled") that enables
Auto Accept and Auto Ready together before generation and asserts the audit
counters plus final `ready` status.

**Alternatives rejected**: Keeping all four controls enabled before generation
and only asserting audit counters (the reviewed candidate) - rejected: it does
not prove the intermediate `backlog` state, narrowing requirement 5. Asserting
the intermediate state via a mock/spy inside the cascade - rejected: adds
test-only instrumentation to production code paths for no reason when
reordering already makes the state observable through the real controller
methods.

## Decision 8 - validated / reviewed / exact-HEAD SHAs are resolved at run time, never frozen

**Decision**: `runtime-evidence.json.shaAlignment` does not carry a candidate,
validated, or reviewed SHA literal, nor a review decision. It records the
`candidateBaseSha` (stable), the `exactHeadInvariant` and the module that
enforces it, `staleApprovalReuseAllowed: false`, and `durableSources`: the
`.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json`
paths where the SHAs are durably available.
`spec148RoleAssignmentEvidence.test.ts` reads those sources when present and,
whenever a durable record's SHA actually names the exact current candidate,
asserts every validation command for it exited `0`; because this suite itself
runs as part of the repository's own `npm test` (one of the validation
commands ADOS runs *before* it writes `validation-runtime.json` and *before* it
runs review at all), a durable record is expected to name an older, already-
finished candidate whenever this test executes as part of a live ADOS
validation pass on a fresh candidate - the test checks shape only in that case,
not a false cross-cycle equality. When durable sources are absent entirely it
asserts the enforcement gate directly.
`publicationResult` is a standing condition ("blocked until ADOS records an
Approved independent Codex review with `validated == reviewed == exact HEAD`"),
not a per-candidate snapshot.

**Rationale**: An earlier candidate froze `candidateSha == validatedSha ==
reviewedSha == 693a07b...` plus `reviewDecision: "Changes Requested"` into this
tracked file. The review's blocking finding: the moment that commit landed it
described a two-commits-stale candidate, and a frozen "Changes Requested" /
"publication pending" reads as a stale verdict, failing `validated == reviewed ==
exact HEAD`, no-stale-approval, and completion-only-after-Approved. A tracked
artifact structurally cannot contain its own post-commit SHA or its own
not-yet-performed review outcome. Requirement 21's "candidate/validated/reviewed
SHA **where available**" is satisfied by naming the durable location and the test
that resolves it; requirement 18's ban on fabricated completion is satisfied
because no approval is asserted anywhere. Publication stays gated by
`tools/agent-workflow/reviewConvergence.js` `computeConvergenceStatus`, which
only returns `CONVERGED` when `latestReviewOutcome === "Approved"`,
`latestCompletenessStatus === "complete"`, `activeBlockingFindingsCount === 0`
and `exactTargetMatch` (validated SHA == reviewed SHA == exact HEAD).
`spec148RoleAssignmentEvidence.test.ts` exercises that gate, including the
stale-approval (`exactTargetMatch: false`) rejection and the durable-source
validation-exit-code cross-check (gated on the durable record actually naming
the current candidate, since `validation-runtime.json` is only ever written
*after* the full validation command sequence - which includes this very test -
returns).

**Alternatives rejected**: Freezing SHA literals / a review decision into
tracked evidence - stale on landing, the rejected approach. Declaring the SHAs
"not available in this runtime" - an even earlier rejected approach; they are
available in the durable ADOS artifacts, which the test now reads. Starting the
publish/merge pipeline from this runtime - barred by the execution policy, and
not required (publication stays the human-only gate).

## Decision 9 - Canonical registered projects for the E2E context

**Decision**: `seedTwoProjects` builds Project A / Project B from
`createDefaultProjectRegistryEntries()` (the canonical registry seed) registered
through `new ProjectRegistryService(seed, bindings)`. Project A is the canonical
Active company workspace `daily-proof`; its local repository/worktree binding is
applied through the real `applyLocalProjectRepositoryBindings` path and points at
the actual repository the test runs in (`process.cwd()`). Project B is the
canonical `ai-lab`, left in its seeded not-connected state for isolation
assertions. Identity strings (`daily-proof:suggestion:1`, `daily-proof:backlog:1`,
the draft / preparation / execution / result ids) and `runtime-evidence.json`
move in lockstep.

**Rationale**: The review's blocking finding: hand-rolled `project-a` /
`project-b` records with invented `C:/repos/...` / `C:/worktrees/...` paths
assigned straight into controller internals do not demonstrate a real canonical
registered project context or an exact configured repository/worktree binding
(requirements 3, 8). Using the canonical seed + real `ProjectRegistryService`
registration + real local-binding application exercises the actual registration
and binding logic, and the bridge then receives `projectId = daily-proof` bound
to a real on-disk worktree path. `daily-proof` is deliberately the E2E project
because it is the only seeded `Active` `Company` entry; `ai-lab` is a genuine
second registered project, so second-project isolation is proven against real
registry state rather than a fixture.

**Alternatives rejected**: Keeping synthetic ids but routing them through
`registerProject` - still a synthetic, non-canonical project, which the finding
rejects. Hardcoding an AIverse-specific path into a reusable service - barred by
requirement 3; the path is derived at test time and never persisted into tracked
evidence.
