# Data Model: Spec 086 - Approved Re-Review Promotion Execution Foundation

## ReviewPromotion

- **Purpose**: Immutable human record that an Approved reviewer runtime was promoted.
- **Key fields**: reviewPromotionId, projectId, reviewerRuntimeId, reviewTargetId, planId, promotedBy, promotedAt, safety flags, rulesVersion.
- **Validation rules**: For post-validation promotion execution, reviewerRuntimeId and reviewTargetId must match the fresh post-validation reviewer runtime and target. Repeated promotion for the same reviewer runtime must not duplicate the record.

## ReviewPromotionResult

- **Purpose**: Deterministic audit result for a human Promote request.
- **Key fields**: id, projectId, reviewerRuntimeId, reviewPromotionId, granted, reasonCodes, alreadyPromoted, safety flags, resultAt, rulesVersion.
- **Validation rules**: A successful first request is granted with REVIEW_PROMOTION_GRANTED. A repeated request for the same reviewer runtime remains granted through the existing promotion and reports alreadyPromoted with REVIEW_PROMOTION_ALREADY_PROMOTED.

## PostValidationReviewTarget

- **Purpose**: Fresh review target produced after validation for the re-review continuation.
- **Key fields**: reviewTargetId, source, reviewTargetSha, validationRuntimeId.
- **Validation rules**: Promotion execution must use the active post-validation target and must not fall back to the original review target.

## State Transitions

```text
Approved post-validation re-review
  -> Explicit human Promote
  -> ReviewPromotion recorded
  -> ReviewPromotionResult granted
  -> Repeated Promote returns already-promoted result without duplicate records
```

Historical pre-validation promotions do not transition or mutate when the post-validation promotion executes.
