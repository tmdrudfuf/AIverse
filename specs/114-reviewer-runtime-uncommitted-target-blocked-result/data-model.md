# Data Model: Reviewer Runtime Uncommitted Target Blocked Result Explanation

## Reviewer Runtime Result Row

Represents the compact dashboard summary for the latest Reviewer Runtime result.

### Fields Used

- `status`: Determines the broad row outcome.
- `decision`: Determines completed review wording.
- `blockingFindingCount`: Preserved for completed review decisions.
- `reasonCodes`: Determines whether a blocked result is specifically caused by an uncommitted target.

### Validation Rules

- If the latest Reviewer Runtime result is blocked and its reason codes include the uncommitted target condition, the row text includes blocked, uncommitted target, inspect, and not-started wording.
- If the latest Reviewer Runtime result is blocked without the uncommitted target condition, the row text keeps the existing generic blocked requirements-resolution wording.
- Ready, completed, timed-out, and failed rows keep their existing meanings and safety signals.
- Every rendered Reviewer Runtime row fits within the existing dashboard row wrap budget.

## State Transitions

1. Implementer Runtime not completed: show Reviewer Runtime unavailable.
2. Implementer Runtime completed and no Reviewer Runtime result exists: show Reviewer Runtime ready.
3. Latest Reviewer Runtime result is blocked for an uncommitted target: show uncommitted-target blocked explanation.
4. Latest Reviewer Runtime result is blocked for another reason: show generic blocked requirements-resolution wording.
5. Latest Reviewer Runtime result is completed, timed out, or failed: show the existing outcome-specific wording.
