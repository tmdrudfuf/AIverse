# Data Model: Spec 085 - Approved Re-Review Promotion Eligibility Foundation

## ReviewDecisionClassification

- **Purpose**: Derived current review decision state for a selected project/candidate task.
- **Key fields**: state, reviewerRuntimeId, decision.
- **Validation rules**: Approved is promotable only when tied to the current reviewer runtime selected for the active review target.

## ReviewPromotion

- **Purpose**: Immutable human promotion record for an Approved reviewer runtime.
- **Key fields**: reviewPromotionId, projectId, reviewerRuntimeId, reviewTargetId, planId, promotedBy, promotedAt, safety flags, rulesVersion.
- **Validation rules**: A promotion counts as current only when its deterministic identity matches the current Approved reviewer runtime.

## PostValidationReviewTarget

- **Purpose**: Fresh review target produced from a completed validation runtime after review fixes.
- **Key fields**: reviewTargetId, validationRuntimeId, reviewTargetSha, source.
- **Validation rules**: Must be the active review target for post-validation re-review classification and promotion eligibility.

## State Transitions

```text
Validation Completed
  -> Post-Validation Target Prepared
  -> Post-Validation Reviewer Runtime Completed Approved
  -> Eligible for explicit Promote
  -> Review Promotion Recorded
```

Historical Review Promotions do not transition or mutate when the post-validation reviewer runtime becomes eligible.
