# Contract: Approved Re-Review Promotion Eligibility

## Input Boundary

Promotion eligibility is evaluated from the selected project/candidate task's current execution plan, active review target, reviewer runtime/result collections, and existing Review Promotion collection.

## Eligibility Contract

- If the active review target is a post-validation target and the matching reviewer runtime completed with Approved, the current classification is Approved.
- If no Review Promotion exists for that exact reviewer runtime, the dashboard displays the existing Promote action as available.
- If a historical Review Promotion exists for a different reviewer runtime, it is ignored for current eligibility and remains unchanged in state.
- If the human presses Promote, the new Review Promotion records the post-validation reviewer runtime id and post-validation review target id.

## Side-Effect Contract

Eligibility display and promotion recording must not start validation, reviewer execution, implementer execution, repository mutation, GitHub mutation, push, PR creation, merge, deployment, or publication.
