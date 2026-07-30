# Research: Human Execution Approval Foundation

## Decision: Keep Approval Separate From Readiness and Runtime

**Rationale**: Spec 071 readiness is technical product-side validation. Human permission is a separate decision and still must not start runtime.

**Alternatives considered**: Treat Ready as approval. Rejected because it would collapse the required human boundary.

## Decision: Reuse Plan and Readiness Services

**Rationale**: Spec 070 and Spec 071 already own validation for plan and readiness state. The approval service should validate approval-specific constraints and exact context binding.

**Alternatives considered**: Duplicate all validation rules in approval. Rejected because it would create drift.

## Decision: Local Human Actor Label

**Rationale**: The product does not have authentication. `Local Human` is provider-neutral and avoids identifying Codex or Claude as approver.

**Alternatives considered**: Add user accounts. Rejected as out of scope.

## Decision: Latest Deterministic Approval Record

**Rationale**: Existing local services use deterministic IDs and upsert-like collections. The approval record is immutable, and repeated commands return AlreadyApproved only after current revalidation.

**Alternatives considered**: Event-sourced approval history. Rejected as overbuilt for this foundation.
