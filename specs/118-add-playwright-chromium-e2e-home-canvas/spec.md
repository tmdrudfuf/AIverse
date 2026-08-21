# Feature Specification: Add Playwright Chromium E2E Home Canvas Smoke Script

**Feature Branch**: `codex/118-add-playwright-chromium-e2e-home-canvas`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Add Playwright Chromium E2E Home Canvas Smoke Script"

## User Scenarios & Testing

### User Story 1 - Run Home Canvas Browser Smoke (Priority: P1)

An implementer or reviewer can run one focused browser smoke command that opens the home route in Chromium and proves the city canvas experience reaches a rendered canvas host without browser page errors, console warnings, or console errors.

**Why this priority**: The home route is the first visible browser entry into AIverse. A real Chromium smoke script catches browser-only regressions that route composition and mocked canvas boot checks cannot observe.

**Independent Test**: Execute the focused home canvas browser smoke command and confirm it starts the local app, visits the home route, finds the city canvas host, observes a canvas element inside it, and reports no page errors, console warnings, or console errors.

**Acceptance Scenarios**:

1. **Given** a developer checkout with dependencies installed, **When** the focused home canvas smoke command is run, **Then** it launches the app in Chromium and visits the home route.
2. **Given** the home route loads, **When** the smoke check inspects the page, **Then** the city canvas host is visible and contains a rendered canvas element.
3. **Given** the browser smoke check runs, **When** page errors, console warnings, or console errors occur, **Then** the smoke check fails and reports the collected signals.

### Edge Cases

- The smoke script must be focused on Chromium and the home route so it remains fast enough for a targeted ADOS validation step.
- The smoke script must not start agent runtimes, review, publication, merge, deployment, GitHub mutation, or primary repository mutation flows.
- The check must fail clearly if the route loads non-city content, the canvas host is missing, the Phaser canvas never appears, or browser error signals are emitted.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a focused command for running the home route canvas smoke check in Chromium.
- **FR-002**: The smoke check MUST navigate to the home route through a real browser session.
- **FR-003**: The smoke check MUST assert that the city canvas host is visible.
- **FR-004**: The smoke check MUST assert that a canvas element is created inside the city canvas host.
- **FR-005**: The smoke check MUST fail on browser page errors, console warnings, or console errors emitted during the run.
- **FR-006**: The smoke check MUST be documented in the feature quickstart for a later validation runtime to execute.

### Key Entities

- **Home Canvas E2E Smoke Result**: The pass or fail outcome from visiting the home route in Chromium and observing the city canvas.
- **Browser Error Signal**: A page error, console warning, or console error emitted while the smoke check runs.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A maintainer can run one documented focused command to exercise the home canvas browser smoke.
- **SC-002**: The focused command completes in under 60 seconds on a local development machine after dependencies and browser binaries are available.
- **SC-003**: The smoke check detects missing home route canvas rendering before broader browser validation is attempted.
- **SC-004**: Browser page errors, console warnings, and console errors are reported with enough detail to identify the failing signal.

## Assumptions

- The home route remains the application root route.
- The city canvas host remains the intended first-screen canvas surface for the home route.
- Playwright browser installation and full validation are handled by an allowed validation runtime, not this ADOS implementer runtime.
