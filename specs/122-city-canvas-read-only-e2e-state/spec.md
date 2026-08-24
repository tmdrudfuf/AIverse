# Feature Specification: City Canvas Read-Only E2E State Probe

**Feature Branch**: `codex/122-city-canvas-read-only-e2e-state`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "City Canvas Read-Only E2E State Probe"

## User Scenarios & Testing

### User Story 1 - Observe Canvas Boot State (Priority: P1)

As an implementer or reviewer running the home canvas smoke check, I can observe a read-only city canvas boot state from the page so the check proves the mounted canvas is the expected AIverse city scene and not only an empty canvas element.

**Why this priority**: The home canvas smoke is an ADOS validation gate. A visible canvas alone is too weak if the app renders a host element but the city scene configuration is missing or incomplete.

**Independent Test**: Open the home route and verify the city canvas host exposes a ready read-only state with expected scene count and dimensions while browser errors and unknown warnings still fail the smoke.

**Acceptance Scenarios**:

1. **Given** the home route has loaded, **When** the city canvas game finishes booting, **Then** the canvas host exposes a ready state that an automated check can read without triggering any user action.
2. **Given** the city canvas boot state is exposed, **When** the automated check reads it, **Then** it can verify the configured logical width, logical height, scene count, and rendered canvas count.
3. **Given** the automated check observes the canvas state, **When** browser console errors, page errors, or unknown warnings occur, **Then** the smoke still reports those signals as failures.

### Edge Cases

- If the canvas host is absent, no probe state is exposed and existing smoke visibility assertions fail.
- If game creation is skipped before mounting completes, the probe must not report a ready state.
- If the rendered canvas is missing or duplicated, the read-only state must let the smoke fail on the unexpected canvas count.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST expose a read-only city canvas boot state on the existing canvas host after successful boot.
- **FR-002**: The exposed state MUST include a lifecycle status, configured logical width, configured logical height, configured scene count, and rendered canvas count.
- **FR-003**: The exposed state MUST be observable by automated browser checks without keyboard, pointer, storage, network, repository, or application-state mutation.
- **FR-004**: The home canvas smoke MUST assert the ready state and expected state values in addition to existing host and canvas visibility checks.
- **FR-005**: The home canvas smoke MUST preserve strict failure behavior for console errors, page errors, and unknown warnings.

### Key Entities

- **City Canvas Probe State**: Read-only observable facts about the city canvas boot lifecycle and mounted canvas configuration.
- **Browser Failure Signal**: Existing page error, console error, or non-allowed console warning collected while the smoke runs.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The home canvas smoke can distinguish a ready city canvas from a merely visible empty host in one page load.
- **SC-002**: The smoke verifies exactly one rendered canvas with logical dimensions of 1200 by 720 and exactly two configured scenes.
- **SC-003**: The probe adds zero player-facing controls and requires zero user input.
- **SC-004**: Unknown warnings, console errors, and page errors remain reported as failures by the smoke.

## Assumptions

- The first E2E state probe should cover only the home route city canvas boot state.
- The probe is for local and CI validation, not a public gameplay feature.
- Existing ADOS policy prohibits running validation from this implementation runtime.
