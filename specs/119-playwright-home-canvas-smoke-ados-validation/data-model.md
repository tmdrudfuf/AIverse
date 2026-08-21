# Data Model: Playwright Home Canvas Smoke ADOS Validation Gate

## Full Validation Gate

- **Description**: Default command sequence used by the ADOS workflow when no explicit validation override is supplied.
- **Fields**:
  - `commands`: Ordered command labels to run in the allowed validation runtime.
- **Validation rules**:
  - Includes `npm run test:e2e:home-canvas` exactly once.
  - Keeps the command after build validation and before diff cleanliness checks.
  - Does not include remote-mutating commands.

## Home Canvas Browser Smoke Command

- **Description**: Existing Spec 118 command that opens the home route in Chromium and verifies the city canvas surface.
- **Fields**:
  - `command`: `npm run test:e2e:home-canvas`
- **Validation rules**:
  - Treated as part of the full validation gate.
  - Does not replace final full validation readiness by itself.

## Custom Validation Policy

- **Description**: Operator-supplied validation commands from state or CLI options.
- **Validation rules**:
  - Continues to take precedence over default validation commands.
  - Is not automatically modified by this feature.
