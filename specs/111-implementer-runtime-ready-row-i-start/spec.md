# Feature Specification: Implementer Runtime Ready Row I Start Label

**Feature Branch**: `codex/111-implementer-runtime-ready-row-i-start`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Implementer Runtime Ready Row I Start Label"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Start Key On Ready Implementer Row (Priority: P1)

As a player reviewing the project dashboard, I want the ready Implementer Runtime row to name the `I` start action so that I know which explicit input starts the implementer after Runtime Start is ready.

**Why this priority**: The ready state is the exact moment when the player needs the prompt; without the visible key label, "explicit start required" is less actionable.

**Independent Test**: Open a project whose Runtime Start has reached a started state but has no Implementer Runtime result, then verify the Implementer Runtime row includes the `I` start label and still shows that Codex/reviewer work has not started.

**Acceptance Scenarios**:

1. **Given** Runtime Start has started for a project and no Implementer Runtime attempt exists, **When** the dashboard row is shown, **Then** the Implementer Runtime row identifies the `I` start action.
2. **Given** no Runtime Start exists for a project, **When** the dashboard row is shown, **Then** the Implementer Runtime row remains an unavailable state and does not imply `I` can start it yet.
3. **Given** an Implementer Runtime has completed, failed, timed out, cancelled, or blocked, **When** the dashboard row is shown, **Then** the row continues to report the outcome and does not replace it with the ready start label.

### Edge Cases

- If Runtime Start is already started from a previous request, the ready Implementer Runtime row should still show the same `I` start label.
- The ready row must remain short enough for the existing dashboard row width.
- The row must not claim reviewer, validation, repository mutation, GitHub mutation, merge readiness, or approval work has started.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a visible `I` start label on the Implementer Runtime ready row when Runtime Start exists and no Implementer Runtime attempt has been made.
- **FR-002**: The system MUST keep the Implementer Runtime unavailable row unchanged when Runtime Start has not reached a started state.
- **FR-003**: The system MUST keep existing Implementer Runtime outcome rows unchanged after an attempt has produced a result.
- **FR-004**: The system MUST keep the ready row within the dashboard row text budget.
- **FR-005**: The system MUST avoid wording that suggests reviewer, validation, repository mutation, GitHub mutation, merge, or approval work has started.

### Key Entities

- **Implementer Runtime Ready Row**: The dashboard status row shown after Runtime Start is ready and before an Implementer Runtime attempt exists.
- **Start Label**: The visible `I` input cue that tells the player how to explicitly start the Implementer Runtime from the ready row.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of ready-state checks, the Implementer Runtime row includes the `I` start label.
- **SC-002**: In 100% of unavailable-state checks, the row does not present the `I` start label as currently actionable.
- **SC-003**: In 100% of completed, timed-out, cancelled, failed, and blocked outcome checks, the row continues to display the outcome instead of the ready start label.
- **SC-004**: The ready row remains within the existing one-line dashboard row budget.

## Assumptions

- The existing `I` key remains the explicit start input for Implementer Runtime.
- This feature changes only the visible ready-state label; it does not change runtime gating, start behavior, reviewer behavior, validation behavior, or mutation policy.
