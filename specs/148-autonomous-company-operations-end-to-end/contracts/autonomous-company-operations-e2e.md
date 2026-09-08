# Contract: Autonomous Company Operations End-to-End Verification

This feature adds no new production API. The contract below fixes the observable
behavior the deterministic harness asserts against existing services.

## C1 - Ordered single cycle

Given Project A with Auto Suggestions, Auto Accept, Auto Ready, and Auto Execute
all independently enabled, one bounded planning lifecycle event MUST produce, in
this order and each exactly once:

1. `projectBacklogSuggestionCollections[A].candidates.length` increases by at
   most the configured bounded count (default 1), all `projectId === A`,
   `status === "proposed"`.
2. `projectBacklogCollections[A].tasks` gains one task with `status ===
   "backlog"`, `suggestionAcceptanceMode === "automatic"`, `sourceSuggestionId`
   set; `status !== "ready"`.
3. That task transitions to `status === "ready"` exactly once; Spec 146
   `lastEvaluation.promotedCount === 1`.
4. `externalProjectAdosExecutionService.start` is called exactly once; the task
   gains `developmentRequestId`, `executionPreparationId`, `executionRunId` and
   `status === "in_progress"`.

## C2 - Independent controls

Toggling any one of the four `updateSelectedProject*Policy({ enabled })` calls
MUST NOT change the `enabled` value of the other three policies for the same or
any other project. No single flag enables more than one stage.

## C3 - Stage boundaries

- Spec 147 MUST NOT create a `projectBacklogCollections` entry directly.
- Spec 145 MUST NOT set a task `status` to `"ready"`.
- Spec 146 MUST NOT call `externalProjectAdosExecutionService.start` and MUST
  NOT set a task to `"in_progress"`.
- Spec 144 is the only path that calls `externalProjectAdosExecutionService.start`.
- The Spec 142/138 bridge draft/preparation MUST carry the exact `projectId`
  and `sourceBacklogTaskId`; no cross-project id, no global latest-project
  singleton, and the request text is structured (no shell interpolation of task
  text).

## C4 - Idempotency

Replaying the planning event, the acceptance evaluation, the readiness
evaluation, or the execution evaluation MUST leave all of the following counts
unchanged: proposed suggestions, accepted backlog tasks, Ready transitions,
`externalProjectAdosExecutions` entries.

## C5 - Active-run gating

With an active `externalProjectAdosRunStatus` or `externalProjectAdosExecution`
for Project A:

- Spec 147 evaluation returns a skip with an active-execution reason where
  policy prohibits new work.
- Spec 146 evaluation returns a skip with an active-execution reason where
  policy requires no active execution.
- Spec 144 evaluation does not start a second execution
  (`maxConcurrentExecutions` enforced).

## C6 - Isolation

After the full cycle for Project A, every Project B collection
(`projectBacklogSuggestionCollections`, `projectBacklogCollections`,
`externalProjectDevelopmentRequestDrafts`, `externalProjectAdosRunPreparations`,
`externalProjectAdosExecutions`, `externalProjectAdosRunStatuses`) and every
Project B policy `enabled` flag MUST be unchanged from its pre-cycle value.

## C7 - Reload

Constructing a new `OfficeProjectPortalController` over the same storage MUST
restore the four Project A policies and the task lifecycle state, and MUST NOT
re-invoke `externalProjectAdosExecutionService.start` for the already-associated
task.

## C8 - Role assignment and review independence

For this run:

- Durable role assignment reports `implementerId === "claude"`,
  `reviewerId === "codex"`, `mode === "adaptive"`,
  `candidateOwnerId === "claude"`, reason referencing the explicit operator
  preference for a Claude implementer.
- `resolveEffectiveRoles` / `resolveCliOverride` MUST reject `implementer ===
  reviewer` (no self-review) and require a distinct reviewer.
- `computeConvergenceStatus` MUST NOT return `CONVERGED` when `exactTargetMatch`
  is false (stale approval or validated/reviewed/HEAD SHA mismatch).
- If the reviewer runtime is unavailable, convergence MUST NOT be `CONVERGED`
  and the run stays blocked (no self-review fallback).

## C9 - Truthful representation

No new fabricated percentage-progress field is introduced. Completion state
reflects actual ADOS completion, not a hardcoded value.

## C10 - Failure visibility

When a stage fails, the authoritative prior state MUST be preserved, a concise
block reason MUST be observable, and the chain MUST NOT advance / auto-approve /
fabricate completion:

- Suggestion provider throws: Spec 147 `lastEvaluation.latestResultText ===
  "Failed: suggestion generation unavailable"`; no suggestion, no backlog task;
  policy `enabled` stays `true`.
- Suggestion ineligible for Auto Accept (e.g. priority not allowed): Spec 145
  `lastEvaluation.skipped[0].reason === "PriorityNotAllowed"`;
  `projectBacklogCollections` unchanged; suggestion `status === "proposed"`.
- ADOS execution stage fails (implementer runtime error): the real service
  returns `status === "Failed"`, `started === false`,
  `reasonCodes` includes `EXTERNAL_ADOS_EXECUTION_INTERNAL_FAILURE`; no
  `externalProjectAdosExecutions` entry; task `status` stays `"ready"`;
  development request draft `status === "Failed"`.
