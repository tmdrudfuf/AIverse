# Feature Specification: Persistent ADOS Playwright Home Canvas Validation Command

**Feature Branch**: `codex/120-persistent-ados-playwright-home-canvas-validation`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "ADOS Implementer Handoff: Persistent ADOS Playwright Home Canvas Validation Command"

## User Scenarios & Testing

### User Story 1 - Persist Home Canvas Validation In ADOS Defaults (Priority: P1)

An implementer or reviewer using local ADOS workflow fixtures, generated prompts, or persisted workflow state sees the home canvas browser smoke command in the default full validation command list, so handoffs do not regress to the older four-command list.

**Why this priority**: The workflow default already includes the home canvas smoke command, but stale local fixtures can preserve the older command sequence and make future ADOS handoffs omit the browser gate.

**Independent Test**: Inspect default workflow state fixtures and generated prompts; every default full validation list includes `npm run test:e2e:home-canvas` after build validation and before diff checks.

**Acceptance Scenarios**:

1. **Given** a local ADOS workflow state fixture using default validation commands, **When** it is used to generate a prompt, **Then** the home canvas smoke command appears in the validation list.
2. **Given** a workflow test or helper constructs a default state, **When** repository defaults change, **Then** the helper uses the shared default validation command list instead of a stale copied list.
3. **Given** this ADOS implementer runtime, **When** implementation completes, **Then** validation and review remain deferred to an allowed validation runtime.

### Edge Cases

- Explicit validation command overrides must continue to take precedence over defaults.
- The command must remain part of full validation, not a standalone readiness signal.
- This work must not start validation, review, publication, merge, deployment, GitHub mutation, or primary repository mutation.

## Requirements

### Functional Requirements

- **FR-001**: Default ADOS workflow test fixtures MUST include the home canvas browser smoke command through the shared default validation list.
- **FR-002**: Generated prompts based on default workflow state MUST show the home canvas browser smoke command.
- **FR-003**: Custom validation command override behavior MUST remain unchanged.
- **FR-004**: The active Spec Kit feature context MUST point to this feature's plan for subsequent agents.
- **FR-005**: The implementation MUST NOT run validation, review, publication, merge, deployment, GitHub mutation, or primary repository mutation from this runtime.

### Key Entities

- **Default Validation Command List**: The canonical full validation sequence used when no explicit override is supplied.
- **Workflow State Fixture**: A local test state shape used to exercise prompt generation and run orchestration behavior.
- **Home Canvas Browser Smoke Command**: The existing focused command that verifies the home route canvas path.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Default workflow helpers reference one canonical command list that includes exactly one home canvas smoke command.
- **SC-002**: The home canvas smoke command remains ordered after build validation and before diff cleanliness checks.
- **SC-003**: No validation, review, publication, merge, deployment, GitHub mutation, or primary repository mutation is performed from this runtime.

## Assumptions

- Spec 119 already added the command to the canonical default full validation gate.
- This feature closes persistence and fixture drift around that canonical default.
