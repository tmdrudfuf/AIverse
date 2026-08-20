# Feature Specification: Implementer Runtime Blocked Result Inspect Action

**Feature Branch**: `codex/113-implementer-runtime-blocked-result-inspect-action`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Implementer Runtime Blocked Result Inspect Action"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Inspect Cue On Blocked Implementer Result (Priority: P1)

As a player reviewing the project dashboard after an Implementer Runtime is blocked, I want the blocked result row to explicitly tell me to inspect the result so that I know the next action is diagnosis instead of reviewer, validation, or mutation work.

**Why this priority**: A blocked Implementer Runtime is an interruption state. Without an inspect cue, the row tells the player that requirements must be resolved but does not identify the immediate action needed to understand the block.

**Independent Test**: Open a project whose Runtime Start has reached a started state and whose latest Implementer Runtime result is blocked, then verify the Implementer Runtime row includes a visible inspect cue while preserving the Codex-not-started safety wording.

**Acceptance Scenarios**:

1. **Given** Runtime Start has started for a project and the latest Implementer Runtime result is blocked, **When** the dashboard row is shown, **Then** the row identifies the blocked state and tells the player to inspect the result.
2. **Given** an Implementer Runtime result is completed, timed out, cancelled, or failed, **When** the dashboard row is shown, **Then** the row continues to report that outcome without replacing it with blocked-result wording.
3. **Given** no Implementer Runtime result exists yet, **When** the dashboard row is shown, **Then** the row continues to show the ready start cue rather than an inspect cue.

### Edge Cases

- If multiple Implementer Runtime results exist, only the latest result controls whether the blocked inspect cue is shown.
- The blocked row must remain short enough for the existing dashboard row width.
- The blocked row must not claim reviewer, validation, repository mutation, GitHub mutation, merge readiness, or approval work has started.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a visible inspect cue on the Implementer Runtime row when the latest Implementer Runtime result is blocked.
- **FR-002**: The system MUST keep the blocked row's existing safety signal that Codex/reviewer work has not started.
- **FR-003**: The system MUST keep non-blocked Implementer Runtime outcome rows unchanged except for already-established outcome-specific inspect wording.
- **FR-004**: The system MUST keep the ready Implementer Runtime row unchanged when no Implementer Runtime result exists.
- **FR-005**: The system MUST keep the blocked row within the dashboard row text budget.
- **FR-006**: The system MUST avoid wording that suggests reviewer, validation, repository mutation, GitHub mutation, merge, approval, publish, or deployment work has started.

### Key Entities

- **Implementer Runtime Result Row**: The project dashboard status row that summarizes the latest Implementer Runtime result.
- **Blocked Inspect Cue**: The visible instruction that a blocked Implementer Runtime result should be inspected before further workflow steps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of blocked-result checks, the Implementer Runtime row includes both the blocked outcome and an inspect cue.
- **SC-002**: In 100% of blocked-result checks, the row preserves the Codex-not-started safety wording.
- **SC-003**: In 100% of ready-state checks, the row continues to present the Implementer Runtime start cue rather than a blocked inspect cue.
- **SC-004**: In 100% of completed, timed-out, cancelled, and failed outcome checks, the row continues to display the appropriate outcome instead of blocked-result wording.
- **SC-005**: The blocked row remains within the existing one-line dashboard row budget.

## Assumptions

- The existing dashboard text row is the intended surface for the inspect action cue.
- This feature changes only visible blocked-result wording; it does not start reviewer, validation, fix, repository mutation, GitHub mutation, publish, merge, deployment, or external inspection work.
