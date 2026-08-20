# Research: Reviewer Runtime Uncommitted Target Blocked Result Explanation

## Decision: Use existing Reviewer Runtime reason codes

**Rationale**: Reviewer Runtime results already carry specific reason codes, including the uncommitted target condition. The display helper can select a clearer blocked row without adding new state or changing runtime execution behavior.

**Alternatives considered**: Add a new status value or review-target display row. Rejected because the existing status and reason-code model already represents this state, and a new status would widen the workflow contract unnecessarily.

## Decision: Preserve generic blocked wording for other blockers

**Rationale**: The request targets uncommitted target explanations only. Other blocked states may still be caused by requirements, stale chain evidence, role mismatch, or safety checks, so the existing generic wording remains appropriate.

**Alternatives considered**: Add custom wording for every blocked reason code. Rejected as broader than the feature and likely to create text-budget churn unrelated to the user need.

## Decision: Keep row text compact and safety-focused

**Rationale**: The dashboard row has an established one-line wrap budget and must not imply that review, validation, mutation, merge, publish, or deployment work started. The new wording should name the cause, point to inspection, and preserve not-started safety wording.

**Alternatives considered**: Add a longer explanatory sentence. Rejected because it would risk wrapping or truncation in the existing dashboard panel.
