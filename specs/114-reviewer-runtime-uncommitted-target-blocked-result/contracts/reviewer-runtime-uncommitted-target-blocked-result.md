# Contract: Reviewer Runtime Uncommitted Target Blocked Result Explanation

## Scenario: Uncommitted target blocked result

**Given** the latest Implementer Runtime result is completed
**And** the latest Reviewer Runtime result is blocked
**And** the latest Reviewer Runtime result includes the uncommitted target reason
**When** the Reviewer Runtime dashboard row is rendered
**Then** the row includes:

- `Blocked`
- `uncommitted target`
- `inspect`
- `not started`

**And** the row does not claim validation, mutation, approval, merge, publish, or deployment work has started.

## Scenario: Other blocked result

**Given** the latest Implementer Runtime result is completed
**And** the latest Reviewer Runtime result is blocked for a reason other than uncommitted target
**When** the Reviewer Runtime dashboard row is rendered
**Then** the row continues to prompt requirement resolution using the existing generic blocked wording.

## Scenario: Non-blocked result

**Given** the latest Reviewer Runtime result is completed, timed out, or failed
**When** the Reviewer Runtime dashboard row is rendered
**Then** the row continues to present that latest outcome and does not replace it with uncommitted-target wording.
