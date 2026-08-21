# Research: Add Playwright Chromium E2E Home Canvas Smoke Script

## Decision: Add Playwright as the focused browser E2E runner

**Rationale**: The feature explicitly requires Chromium E2E browser smoke coverage. Existing Vitest smoke checks cover route composition and mocked canvas boot behavior, but they do not open a real browser or observe a rendered canvas element.

**Alternatives considered**:

- Keep only Vitest coverage: rejected because it cannot satisfy the real Chromium E2E requirement.
- Use ad hoc browser automation without a test runner: rejected because Playwright provides a standard runner, web server orchestration, reporting, and Chromium targeting.

## Decision: Keep the smoke test route-focused and signal-focused

**Rationale**: The smoke test should prove the home route reaches the canvas and remains free of browser error signals. It should not duplicate deeper gameplay validation or broad browser coverage.

**Alternatives considered**:

- Assert detailed canvas pixels or Phaser internals: rejected because that would make a smoke test brittle and broaden the feature beyond route/canvas boot confidence.
- Exercise navigation and gameplay inputs: rejected because this feature is only the home canvas smoke script.

## Decision: Let Playwright manage the local web server for the smoke command

**Rationale**: A single command is easier for implementers and reviewers to run and makes the validation path repeatable.

**Alternatives considered**:

- Require users to start the dev server manually: rejected because it adds coordination failure points.
- Use a production build server: rejected for this focused smoke because build validation is already a separate ADOS validation command.
