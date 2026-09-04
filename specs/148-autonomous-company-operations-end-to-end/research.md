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

## Decision 3 - ADOS boundary in automated tests vs. real ADOS evidence

**Decision**: Automated tests use the existing injectable
`externalProjectAdosExecutionService.start` adapter (as Spec 144 tests do).
Real ADOS durable semantics are evidenced by the ADOS run that produced this
implementation handoff.

**Rationale**: Requirement 23 permits existing injectable runtime adapters in
automated tests "where necessary", but requires runtime evidence to also
demonstrate the real configured ADOS integration path. This handoff was itself
produced by ADOS run `cc6ed14815c049ed1b97ce1c` with durable state under
`.agent-workflow/runs/148-autonomous-company-operations-end-to-end/ados-run.json`
containing `status: READY_FOR_IMPLEMENTATION`, the authoritative base SHA, the
feature branch, the ADOS project execution path, and the durable role
assignment. That run is the real ADOS integration evidence.

**Alternatives rejected**: A mock-only ADOS shortcut - explicitly barred by
requirement 9.

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

## Decision 7 - The controller cascades Spec 145 -> Spec 146 synchronously

**Decision**: The E2E chain test enables Spec 146 only after asserting the
Spec 145 acceptance result, so the intermediate `backlog` state is observable.

**Rationale**: `OfficeProjectPortalController.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()`
(and `acceptSelectedBacklogSuggestion()`) call
`evaluateSelectedProjectBacklogReadinessPromotion()` at their tail. This is a
*sanctioned* safe trigger: Spec 146 FR-016 lists "Spec 145 acceptance
evaluation completion" as an allowed trigger. Spec 146 still runs its own
independent policy evaluation with its own gates; Spec 145 never sets a task to
`ready` itself. When both policies are enabled the acceptance and promotion
happen in one synchronous cascade, so reading final state alone cannot
attribute the `backlog` step to Spec 145. The chain test therefore enables
Spec 146 after the Spec 145 assertion; the "independently disableable" test
additionally asserts `suggestionAutoAcceptAcceptedCount === 1` and
`backlogReadinessPromotionPromotedCount === 1` so each transition is attributed
to its correct policy owner even in the both-enabled configuration.

**Alternatives rejected**: Enabling all four policies before the lifecycle
event - rejected because the synchronous 145 -> 146 cascade would hide the
`backlog`-not-`ready` intermediate that authoritative requirement 5 demands be
verified.
