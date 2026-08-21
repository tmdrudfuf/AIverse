# Feature Specification: Playwright Home Canvas Smoke ADOS Validation Gate

**Feature Branch**: `codex/119-playwright-home-canvas-smoke-ados-validation`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "ADOS Implementer Handoff: Playwright Home Canvas Smoke ADOS Validation Gate"

## User Scenarios & Testing

### User Story 1 - Gate ADOS Validation With Home Canvas Smoke (Priority: P1)

An implementer or reviewer using the local ADOS workflow gets the existing home canvas browser smoke check as part of the default full validation gate, so a candidate cannot reach the human merge decision without exercising the real home route canvas smoke in the allowed validation runtime.

**Why this priority**: Spec 118 added the focused browser smoke command, but it is only effective as a gate if the workflow's default full validation includes it.

**Independent Test**: Inspect the default validation command resolution and generated workflow prompt; both include the home canvas smoke command in the full validation list after build validation.

**Acceptance Scenarios**:

1. **Given** an ADOS workflow state with no custom validation policy, **When** the workflow resolves full validation commands, **Then** the command list includes the home canvas smoke command.
2. **Given** a generated implementer prompt that uses default validation commands, **When** the prompt displays validation requirements, **Then** it includes the home canvas smoke command.
3. **Given** this ADOS implementer runtime, **When** implementation completes, **Then** the browser smoke and full validation commands remain documented for a later validation runtime and are not executed here.

### Edge Cases

- Custom validation commands supplied by a state file or CLI override must still take precedence over defaults.
- The new browser smoke gate must remain local-only and must not introduce push, pull request, merge, deployment, or GitHub mutation behavior.
- The command must appear in full validation rather than being treated as final readiness by itself.

## Requirements

### Functional Requirements

- **FR-001**: The default full validation gate MUST include the home canvas browser smoke command.
- **FR-002**: Existing custom validation command override behavior MUST remain unchanged.
- **FR-003**: Generated workflow prompts that use default validation commands MUST show the home canvas browser smoke command.
- **FR-004**: The feature documentation MUST identify that validation is performed by an allowed validation runtime, not this ADOS implementer runtime.
- **FR-005**: The validation gate MUST remain local and MUST NOT add remote mutation, publication, merge, deployment, or GitHub mutation behavior.

### Key Entities

- **Full Validation Gate**: The default command sequence that must pass before a candidate can proceed to human merge decision.
- **Home Canvas Browser Smoke Command**: The existing focused check that opens the home route in Chromium and verifies the canvas surface.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Default full validation command resolution includes exactly one home canvas smoke command.
- **SC-002**: Generated default workflow prompts list the home canvas smoke command.
- **SC-003**: The home canvas smoke command remains ordered after build validation and before diff cleanliness checks.
- **SC-004**: No validation, review, publication, merge, deployment, GitHub mutation, or primary repository mutation occurs from this runtime.

## Assumptions

- Spec 118 already provides the `npm run test:e2e:home-canvas` command.
- ADOS full validation is intentionally run by a later allowed validation runtime.
- State files or CLI invocations that explicitly override validation commands remain responsible for their own command set.
