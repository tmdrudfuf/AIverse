# Research: Spec 085 - Approved Re-Review Promotion Eligibility Foundation

## Decision: Reuse ReviewDecisionService eligibility

**Rationale**: ReviewDecisionService already classifies against the supplied active review target and revalidates the reviewer runtime chain before promotion. Reusing it keeps dashboard display and Promote preconditions aligned.

**Alternatives considered**: Add a separate post-validation promotion service. Rejected because it would duplicate existing Review Promotion rules and increase the chance of divergence.

## Decision: Use current-promotion resolver for historical promotion isolation

**Rationale**: `findCurrentReviewPromotion` is already the shared resolver used by Promote idempotency and dashboard display. A historical promotion should remain immutable in state but not count as current unless its deterministic reviewer runtime identity matches the fresh classification.

**Alternatives considered**: Delete or hide older promotions when post-validation re-review begins. Rejected because prior records must remain auditable and immutable.

## Decision: Add focused regression coverage only unless a gap appears

**Rationale**: The implementation path appears present after specs 083 and 084. The main risk is regression: a dashboard or controller path accidentally treating any project promotion as current after re-review approval.

**Alternatives considered**: Refactor controller state selection. Rejected unless tests prove a behavioral gap.
