# Feature Specification: Playwright WebGL Warning Allowlist

**Feature Branch**: `codex/121-playwright-webgl-warning-allowlist`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Playwright WebGL Warning Allowlist"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep Home Canvas Smoke Stable For Benign WebGL Warnings (Priority: P1)

An implementer or reviewer can run the focused home canvas browser smoke check and receive failures only for actionable browser error signals, while known benign WebGL environment warnings do not block the check.

**Why this priority**: The home canvas smoke is part of the ADOS validation command set. Environment-specific WebGL warnings can make the check noisy even when the canvas boots correctly.

**Independent Test**: Run or inspect the home canvas browser smoke behavior and confirm known benign WebGL warnings are ignored while unknown console warnings, console errors, and page errors still fail the check.

**Acceptance Scenarios**:

1. **Given** the home route boots and emits a known benign WebGL warning, **When** the smoke check collects browser signals, **Then** the known warning is not treated as a failure.
2. **Given** the home route emits an unknown console warning or console error, **When** the smoke check completes, **Then** the smoke check reports that signal and fails.
3. **Given** the home route emits a page error, **When** the smoke check completes, **Then** the smoke check reports the page error and fails.

### Edge Cases

- A warning that mentions graphics or canvas but does not match the documented allowlist must remain a failure.
- A known WebGL warning emitted as a console error must remain a failure unless explicitly documented as safe in a future feature.
- Multiple browser signals should preserve the actionable unknown signals even when benign warnings are also present.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home canvas smoke check MUST ignore only explicitly documented benign WebGL warning text.
- **FR-002**: The home canvas smoke check MUST continue to fail on unknown console warnings.
- **FR-003**: The home canvas smoke check MUST continue to fail on all console errors.
- **FR-004**: The home canvas smoke check MUST continue to fail on all page errors.
- **FR-005**: The allowlist MUST be easy to inspect and update without changing the main smoke test control flow.
- **FR-006**: The feature documentation MUST state that validation is not run from this ADOS implementation runtime.

### Key Entities

- **Browser Signal**: A page error, console warning, or console error emitted while the home canvas smoke runs.
- **Allowed WebGL Warning**: A documented browser console warning considered benign for the smoke check when emitted as a warning.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Known benign WebGL warnings no longer cause the focused home canvas smoke check to fail.
- **SC-002**: 100% of unknown console warnings, console errors, and page errors remain visible as failure signals.
- **SC-003**: The allowlist is represented in one clearly named location with documented match criteria.
- **SC-004**: A reviewer can inspect the feature artifacts and implementation in under 5 minutes to verify the bounded scope.

## Assumptions

- Chromium can emit environment-specific WebGL warnings while the canvas is otherwise rendered and usable.
- The only current allowed signal is a warning-level WebGL fallback/performance notice; page errors and console errors are out of scope for allowlisting.
- Validation commands are supplied by the handoff but must not be run in this ADOS implementation runtime.
