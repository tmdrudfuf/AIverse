# Data Model: Add Playwright Chromium E2E Home Canvas Smoke Script

## Home Canvas E2E Smoke Result

Represents the observed outcome of the focused Chromium browser smoke run.

**Fields**:

- `routeLoaded`: whether the browser successfully reached the home route
- `canvasHostVisible`: whether the city canvas host was visible
- `canvasRendered`: whether a canvas element appeared inside the host
- `browserSignals`: collected page errors, console warnings, and console errors

**Validation Rules**:

- `routeLoaded` must be true.
- `canvasHostVisible` must be true.
- `canvasRendered` must be true.
- `browserSignals` must be empty for the run to pass.

## Browser Error Signal

Represents a browser-side signal that should fail the smoke check.

**Fields**:

- `type`: page error, console warning, or console error
- `message`: human-readable signal detail

**Validation Rules**:

- Any collected signal fails the focused smoke result.
