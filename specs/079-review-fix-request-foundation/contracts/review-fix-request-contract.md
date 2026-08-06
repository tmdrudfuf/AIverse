# Contract: Review Fix Request

## Command

```ts
type ReviewFixRequestCommand = {
  projectId: string;
  reviewerRuntimeId: string;
  actor: string;
  requestedAt: string;
};
```

## Service API

```ts
class ReviewFixRequestService {
  requestFix(input: ReviewDecisionInput, command: ReviewFixRequestCommand): ReviewFixRequestOutcome;
}
```

## Preconditions

The service must evaluate preconditions in this order:

1. Freshly classify the current review decision using `ReviewDecisionService.classify(input)`.
2. Require `classification.reviewerRuntimeId === command.reviewerRuntimeId`.
3. Require `classification.state === "ChangesRequested"` and `classification.decision === "ChangesRequested"`.
4. Validate actor through the shared human-actor guard.
5. Compare any existing request only after the above current-state validation passes.
6. Create or idempotently return the immutable request/result.

## Outcomes

- `Requested`: New request created.
- `AlreadyRequested`: Existing request exactly matches current context after revalidation.
- `Blocked`: Expected stale, non-requestable, or unsafe state.
- `Failed`: Malformed or internally inconsistent state that cannot be represented as ordinary blocked state.

## Non-Effects

The service must not:

- invoke Codex or Claude
- spawn subprocesses
- start Validation Runtime
- execute validation commands
- edit files
- mutate repositories
- mutate GitHub
- rewrite Review Decision, Review Promotion, runtime evidence, task, employee, or repository state

## Dashboard Contract

The dashboard may render one compact `[REVIEW FIX REQUEST]` row. Safe wording examples:

- `Unavailable; needs Changes Requested review; no execution`
- `Request fixes (F); no execution`
- `Fix request recorded; no execution`
- `Blocked; resolve review state; no execution`

The row must not claim fixing, validation, Codex, Claude, repository mutation, GitHub mutation, or subprocess activity has started.
