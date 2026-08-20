# Feature Specification: Reviewer Runtime Uncommitted Target Blocked Result Explanation

**Feature Branch**: `codex/114-reviewer-runtime-uncommitted-target-blocked-result`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Reviewer Runtime Uncommitted Target Blocked Result Explanation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Uncommitted Target Block (Priority: P1)

As a player reviewing the project dashboard after Reviewer Runtime is blocked because its target is uncommitted, I want the row to name the uncommitted target issue so that I know the next step is inspection and preparation rather than assuming review, validation, or mutation work started.

**Why this priority**: An uncommitted review target is a specific interruption state. Generic blocked wording does not explain why Reviewer Runtime could not start, which can make the player choose the wrong next workflow action.

**Independent Test**: Render a Reviewer Runtime blocked result with an uncommitted-target reason and verify the Reviewer Runtime row includes blocked, uncommitted target, inspect, and not-started wording while staying within the row budget.

**Acceptance Scenarios**:

1. **Given** Implementer Runtime has completed and the latest Reviewer Runtime result is blocked for an uncommitted target, **When** the dashboard row is shown, **Then** the row identifies the blocked state, names the uncommitted target, and tells the player to inspect the result.
2. **Given** Reviewer Runtime is blocked for a reason other than an uncommitted target, **When** the dashboard row is shown, **Then** the row continues to use the existing generic requirements-resolution blocked wording.
3. **Given** Reviewer Runtime completed, timed out, or failed, **When** the dashboard row is shown, **Then** the row continues to report that outcome without replacing it with uncommitted-target wording.
4. **Given** no Reviewer Runtime result exists yet, **When** the dashboard row is shown, **Then** the row continues to show the ready start cue rather than a blocked explanation.

### Edge Cases

- If multiple Reviewer Runtime results exist, only the latest result controls whether the uncommitted-target explanation is shown.
- The uncommitted-target row must remain short enough for the existing dashboard row width.
- The row must not claim validation, repository mutation, GitHub mutation, merge readiness, approval, publishing, or deployment work has started.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a visible uncommitted-target explanation when the latest Reviewer Runtime result is blocked for an uncommitted target.
- **FR-002**: The system MUST include an inspect cue in the uncommitted-target blocked row.
- **FR-003**: The system MUST preserve a not-started safety signal for the uncommitted-target blocked row.
- **FR-004**: The system MUST keep generic blocked wording for Reviewer Runtime blocked results that are not caused by an uncommitted target.
- **FR-005**: The system MUST keep ready, completed, timed-out, and failed Reviewer Runtime rows unchanged.
- **FR-006**: The system MUST keep the uncommitted-target blocked row within the dashboard row text budget.
- **FR-007**: The system MUST avoid wording that suggests validation, repository mutation, GitHub mutation, merge, approval, publish, or deployment work has started.

### Key Entities

- **Reviewer Runtime Result Row**: The project dashboard status row that summarizes the latest Reviewer Runtime result.
- **Uncommitted Target Block Explanation**: The visible blocked-result wording that names an uncommitted review target as the reason Reviewer Runtime could not start.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of uncommitted-target blocked-result checks, the Reviewer Runtime row includes blocked, uncommitted target, and inspect wording.
- **SC-002**: In 100% of uncommitted-target blocked-result checks, the row preserves not-started safety wording.
- **SC-003**: In 100% of non-uncommitted blocked-result checks, the row continues to show the generic blocked requirements-resolution wording.
- **SC-004**: In 100% of ready, completed, timed-out, and failed checks, the row continues to display the appropriate existing outcome wording.
- **SC-005**: The uncommitted-target blocked row remains within the existing one-line dashboard row budget.

## Assumptions

- The existing Reviewer Runtime row is the intended surface for this explanation.
- The uncommitted target condition is represented by the existing Reviewer Runtime reason code for target uncommitted.
- This feature changes only visible blocked-result wording; it does not start reviewer, validation, fix, repository mutation, GitHub mutation, publish, merge, deployment, or external inspection work.
