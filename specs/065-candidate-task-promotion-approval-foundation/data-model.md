# Data Model: Candidate Task Promotion Approval Foundation

## CandidatePromotionStatus

- `PendingReview`
- `Approved`
- `Rejected`
- `Deferred`
- `NeedsReview`
- `Ineligible`
- `Unavailable`

`Approved` means approved for a later promotion step only.

## CandidatePromotionEligibility

Fields:

- `status`: current promotion status implied by eligibility when no human decision overrides it.
- `isApprovable`: true only for open Candidate Tasks with valid `Recommended` assignment recommendations.
- `reasonCodes`: deterministic reason-code array.
- `summary`: bounded human-readable reason.

Validation:

- Closed Candidate Tasks are not approvable.
- Missing or stale assignment recommendations are not approvable.
- Unavailable upstream state is not approvable.

## CandidatePromotionDecision

Fields:

- `id`
- `projectId`
- `candidateTaskId`
- `candidateTaskTitle`
- `candidateTaskType`
- `candidateTaskPriority`
- `candidateTaskProvenance`
- `assignmentRecommendationId`
- `recommendedEmployeeId`
- `recommendedEmployeeName`
- `promotionStatus`
- `eligibility`
- `eligibilityReasonCodes`
- `decisionReasonCode`
- `humanNote`
- `decisionSource`
- `createdAt`
- `updatedAt`
- `decisionVersion`
- `rulesetVersion`
- `activeTaskCreated`
- `executionStarted`

Invariants:

- `activeTaskCreated` is always `false`.
- `executionStarted` is always `false`.
- `id` is deterministic from project ID, Candidate Task ID, and ruleset version.
- Human status changes update the same logical decision record.

## CandidatePromotionReview

Fields:

- copied Candidate Task summary fields
- copied assignment recommendation summary fields when present
- current local decision
- current eligibility
- available action labels

Relationships:

- exactly one current review row per visible Candidate Task.
- optional matching assignment recommendation.
- optional current local decision.

## CandidatePromotionReviewCollection

Fields:

- `projectId`
- source Candidate Task status
- source assignment recommendation status
- `reviewStatus`
- `reviews`
- `reviewCount`
- `selectedIndex`
- `generatedAt`
- `rulesetVersion`
- optional `errorSummary`

Ordering:

1. Candidate Task collection order
2. Candidate Task ID fallback

## State Transitions

Allowed:

- `PendingReview` -> `Approved`, `Rejected`, `Deferred`, `NeedsReview`
- `Deferred` -> `Approved`, `Rejected`, `PendingReview`
- `NeedsReview` -> `Approved` only when eligible, `Deferred`, `Rejected`, `PendingReview`
- `Rejected` -> `PendingReview`, `Deferred`
- `Approved` -> `PendingReview`, `Rejected`, `Deferred`

Invalid transitions fail without side effects.
