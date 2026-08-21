# Feature Specification: Home Route Playwright Canvas Boot Smoke

**Feature Branch**: `codex/117-home-route-playwright-canvas-boot-smoke`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Home Route Playwright Canvas Boot Smoke"

## User Scenarios & Testing

### User Story 1 - Smoke Validate Home Canvas Entry (Priority: P1)

An implementer or reviewer can rely on a repeatable smoke check that proves the home route still enters the city canvas experience expected by downstream browser smoke workflows.

**Why this priority**: The home route is the first route exercised by browser automation. If it stops composing the city view and canvas entry point, later Playwright canvas checks can fail for routing reasons instead of real canvas boot behavior.

**Independent Test**: Inspect the home route composition locally and confirm it reaches the city view shell and city canvas entry point without opening a live browser, running Playwright, or requiring GPU availability.

**Acceptance Scenarios**:

1. **Given** the home route module is loaded, **When** its route component is evaluated, **Then** it returns the city view experience as the route content.
2. **Given** the city view experience is evaluated, **When** the route content is inspected, **Then** it includes the city canvas entry point used by the browser scene.
3. **Given** the smoke check runs in the ADOS implementer runtime, **When** it completes, **Then** it does not start validation, review, publication, merge, deployment, GitHub mutation, or live browser automation.

### Edge Cases

- The smoke check must stay deterministic when Playwright is unavailable in the implementer runtime.
- The smoke check must not render a real canvas, depend on GPU support, or start external services.
- The check must fail if the home route is replaced with non-city content that bypasses the canvas entry point.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST include repeatable smoke coverage for the home route's city canvas entry path.
- **FR-002**: The smoke coverage MUST confirm the home route returns the city view experience.
- **FR-003**: The smoke coverage MUST confirm the city view includes the city canvas entry point.
- **FR-004**: The smoke coverage MUST run locally without live browser automation, external services, CLI agents, deployment access, or repository mutation.
- **FR-005**: The smoke coverage MUST complement the existing canvas boot configuration smoke without duplicating browser rendering responsibilities.

### Key Entities

- **Home Route Smoke Result**: The observed local result of evaluating the home route composition.
- **Canvas Entry Signal**: Evidence that the home route still reaches the city canvas entry point.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A maintainer can execute the focused smoke coverage in under 10 seconds on a local development machine.
- **SC-002**: The smoke check catches a broken home route canvas entry before downstream browser automation is exercised.
- **SC-003**: The smoke check runs without live GitHub credentials, CLI agent availability, browser automation services, deployment access, GPU rendering, or primary repository mutation.
- **SC-004**: The smoke check provides clear failure output identifying whether the route-level city view entry or city canvas entry is missing.

## Assumptions

- The home route remains the Next.js `/` route implemented by `src/app/page.tsx`.
- The city view remains the intended first-screen experience for the home route.
- In this ADOS runtime, "Playwright" identifies the downstream browser smoke concern; implementation here provides deterministic preflight coverage and does not install or run Playwright.
