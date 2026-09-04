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
`status: READY_FOR_IMPLEMENTATION` at the handoff checkpoint; after that
checkpoint its durable artifacts show full configured validation PASSED and an
independent Codex review ran against candidate
`693a07b0ffbeca0919589ba40fadf69b183f1b12`
(see `runtime-evidence.json.shaAlignment`).

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
of the real service in the test. The authoritative full ADOS pipeline then ran:
implementation validation PASSED and an independent Codex review was performed
against candidate `693a07b0ffbeca0919589ba40fadf69b183f1b12`
(`runtime-evidence.json.shaAlignment`). Exact-HEAD convergence and publication
remain the human-only gate, the same external boundary Specs 142-147 declare.

**Alternatives rejected**: A mock-only ADOS shortcut - barred by requirement 9.
Claiming validated / reviewed / exact-HEAD SHAs are "not available in this
runtime" - they are available in the durable ADOS run artifacts and are now
transcribed into `runtime-evidence.json.shaAlignment` (same mechanism as the
role assignment).

**Fake outcome shape**: the fake `ImplementerRuntimeProvider` returns
`status: "Completed"` (the spawn succeeded, the run is launched) with
`evidence.started: true` and `evidence.completed: false` - a *launched but not
finished* run. This is the office's model of an ADOS execution, not a bug fit
to a test: `ExternalProjectAdosExecution` carries
`validationStarted / reviewStarted / publishStarted: false` for exactly this
reason, `ProjectAutonomousSuggestionPolicyService.countActiveExecutions` keys
the active-run gate on `status === "Completed" && implementerStarted &&
!evidence.completed`, and the pre-existing `execution()` helper in this test
file and the Spec 144 suite already encode the same shape. Returning
`evidence.completed: true` would represent a *terminated* run and would
(correctly) not register as an active run, defeating the active-run safety
checks in requirements 15-16.

## Decision 4 - `.agent-workflow/` is gitignored; transcribe role evidence

**Decision**: Transcribe the durable role assignment values into the tracked
`runtime-evidence.json`; tests assert against tracked values and against the
real `roleResolver.js` / `reviewConvergence.js` enforcement logic.

**Rationale**: `git check-ignore -v` resolves
`.agent-workflow/runs/148-.../ados-run.json` to `.gitignore:11:.agent-workflow/`.
The session-start `git status` was clean while those files existed, confirming
they are untracked. A test reading that path would pass in this worktree and
fail for the reviewer and in CI. The `runId` (`cc6ed14815c049ed1b97ce1c`) and
role fields are provable, so transcription still satisfies "from ADOS durable
state, not a fake UI label".

**Alternatives rejected**: Reading the untracked path at test time - non-portable
across worktrees, violates acceptance criterion 18. Committing
`.agent-workflow/` - out of scope and against repo boundaries.

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

## Decision 7 - All four controls enabled; attribute by audit counter

**Decision**: The chain test enables all four automation controls (Auto
Suggestions, Auto Accept, Auto Ready, Auto Execute) for project A *before* the
bounded lifecycle event, and attributes each state transition to its owning
policy through that policy's per-evaluation audit counter, not by disabling a
downstream stage.

**Rationale**: `OfficeProjectPortalController.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()`
calls `evaluateSelectedProjectBacklogReadinessPromotion()` at its tail - a
*sanctioned* trigger (Spec 146 FR-016 lists "Spec 145 acceptance evaluation
completion"). With Auto Accept and Auto Ready both on, acceptance and promotion
happen in one synchronous cascade. Requirement 2 requires all four controls
independently enabled for the test project, so the test must not disable
Auto Ready to make the intermediate `backlog` state observable. Instead:
`suggestionAutoAcceptAcceptedCount === 1` proves Spec 145 performed exactly one
acceptance and `backlogReadinessPromotionPromotedCount === 1` proves Spec 146's
own independent evaluation performed exactly one promotion - the Ready
transition is attributed to Spec 146's counter, never to Spec 145. Spec 145
never writes `ready` itself (covered by the non-invocation test G and Spec 145's
own suite). `expect(invoke).not.toHaveBeenCalled()` after the cascade proves
Spec 146 did not invoke Spec 144 even though Auto Execute was enabled the whole
time - a stronger check than the reviewed candidate's, where Auto Execute was
still off at that point.

**Alternatives rejected**: Enabling Auto Ready only after the Spec 145 assertion
(the reviewed candidate) - rejected: it narrows requirement 2's "all four
independently enabled for the test project" to make an intermediate assertion
observable.

## Decision 8 - validated / reviewed / exact-HEAD SHAs are transcribed from durable ADOS state

**Decision**: `runtime-evidence.json.shaAlignment` transcribes the candidate
SHA, validated SHA, reviewed SHA, the full-validation command results, and the
review decision from the durable
`.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json`
artifacts - the same provenance mechanism already used for the role assignment -
rather than declaring them unavailable. It also records
`convergenceStatusForTranscribedCandidate` (not converged, latest decision is
Changes Requested) and the enforced convergence gate.

**Rationale**: The full configured validation pipeline and an independent Codex
review both ran against candidate `693a07b0ffbeca0919589ba40fadf69b183f1b12`
after the implementation-handoff checkpoint, and their results are durable in
the ADOS run directory. Requirement 21 asks for "candidate/validated/reviewed
SHA **where available**" - they are available, so they are recorded:
`candidateSha == validatedSha == reviewedSha == 693a07b...`, validation
`PASS` with the working tree unmodified (`headBefore == headAfter`,
`violations: []`). Requirement 18 forbids fabricating completion, so the
evidence records the non-converged status rather than an approval, and marks
every value `evidenceCycle: 1` / `transcribedAsOfCandidateSha`: the fix commit
that adds this block is a new candidate that ADOS must re-validate and Codex
must independently re-review. Publication is still gated by
`tools/agent-workflow/reviewConvergence.js` `computeConvergenceStatus`, which
only returns `CONVERGED` when `latestReviewOutcome === "Approved"`,
`latestCompletenessStatus === "complete"`, `activeBlockingFindingsCount === 0`
and `exactTargetMatch` (validated SHA == reviewed SHA == exact HEAD).
`spec148RoleAssignmentEvidence.test.ts` exercises that gate, including the
stale-approval (`exactTargetMatch: false`) rejection and the
`candidateSha == validatedSha == reviewedSha` alignment.

**Alternatives rejected**: Writing placeholder SHAs that read as real - a
fabricated completion, barred by requirement 18. Declaring the SHAs "not
available in this runtime" - false: they are in the durable ADOS artifacts.
Starting the publish/merge pipeline from this runtime - barred by the execution
policy, and not required (publication stays the human-only gate).
