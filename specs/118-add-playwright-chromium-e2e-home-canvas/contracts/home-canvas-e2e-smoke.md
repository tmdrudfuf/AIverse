# Contract: Home Canvas E2E Smoke

## Focused Command

`npm run test:e2e:home-canvas`

## Expected Behavior

1. Starts or reuses the local web app server configured for the Playwright run.
2. Launches Chromium.
3. Navigates to the home route.
4. Waits for the city canvas host to be visible.
5. Waits for a canvas element inside the city canvas host.
6. Fails if page errors, console warnings, or console errors were emitted.

## Failure Signals

- Home route cannot load.
- City canvas host is not visible.
- Canvas element does not appear inside the host.
- Any page error is emitted.
- Any console warning is emitted.
- Any console error is emitted.
