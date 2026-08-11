# Contract: Approved Re-Review Promotion Execution

## Input Boundary

- The only user input that executes promotion is the existing human Promote action.
- Render, navigation, re-review completion, validation completion, and target preparation do not execute promotion.

## Successful Execution

- If the active review target is a post-validation target and the matching reviewer runtime completed Approved, Promote records a Review Promotion for that reviewer runtime and review target.
- The corresponding Review Promotion Result is granted, names the created promotion, and carries the same reviewer runtime identity.
- All promotion and result side-effect flags remain false.

## Idempotency

- If a current Review Promotion already exists for the same post-validation reviewer runtime, repeated Promote does not create a duplicate.
- The current result reports the already-promoted reason for the same deterministic result identity.

## Side-Effect Boundary

Promotion execution must not start validation, implementer runtime, reviewer runtime, repository mutation, GitHub mutation, push, pull request, ready-for-review, merge, deployment, publication, or branch deletion.
