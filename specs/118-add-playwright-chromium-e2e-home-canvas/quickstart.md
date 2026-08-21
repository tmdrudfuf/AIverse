# Quickstart: Add Playwright Chromium E2E Home Canvas Smoke Script

## Prerequisites

- Dependencies installed with `npm install`.
- Playwright Chromium browser binaries installed for the local environment.

## Focused Smoke Command

```powershell
npm run test:e2e:home-canvas
```

## Full Validation Commands

These commands are required by the repository workflow, but must be run by an allowed validation runtime, not this ADOS implementer runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Expected Outcome

- The focused smoke command opens the home route in Chromium.
- The city canvas host is visible.
- A canvas element appears inside the city canvas host.
- No page errors, console warnings, or console errors are reported.
