# Contract: Promotion History Timeline

## Input

- Optional Review Promotion collection for a project.
- Optional Review Promotion Result collection for the same project.
- Optional current Review Promotion resolved from the live review classification.

## Output

- A per-project timeline with deterministic event order.
- Each event identifies whether it is current, historical, granted, already-promoted, or blocked.
- A compact display row reports zero activity, current status, historical count, and blocked count.

## Invariants

- Reading history never mutates source promotion or result collections.
- Historical promotion records are never hidden or rewritten.
- A result-only blocked Promote request appears without fabricating a Review Promotion.
- Display text never implies validation, push, PR, merge, deployment, publication, repository mutation, or GitHub mutation.
