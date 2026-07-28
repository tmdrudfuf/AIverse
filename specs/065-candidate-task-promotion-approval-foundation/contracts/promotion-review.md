# Contract: Candidate Promotion Review

This is an internal UI/controller contract, not an external API.

## Inputs

- `CandidateTaskCollection`
- `CandidateAssignmentRecommendationCollection | undefined`
- local `CandidatePromotionDecision` records
- selected review index

## Output

One `CandidatePromotionReviewCollection` per project.

## Guarantees

- No GitHub reads.
- No GitHub writes.
- No Candidate Task remapping.
- No assignment rematching.
- No employee mutation.
- No `ProjectTask` creation.
- No work-session creation.
- No AI provider invocation.
- Defensive copies for exposed arrays and provenance metadata.

## Dashboard Contract

Promotion review appears as a bounded `[PROMOTION REVIEW]` row after assignment recommendation rows.

The row may include:

- review count
- selected item marker
- status
- eligibility
- Candidate Task priority/type/title
- recommended employee or no-employee reason
- actions
- `+N more`

The row must not use wording that suggests execution has started.
