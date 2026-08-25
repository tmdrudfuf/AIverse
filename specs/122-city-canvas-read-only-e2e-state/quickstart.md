# Quickstart: City Canvas Read-Only E2E State Probe

This feature extends the home canvas smoke so browser automation can verify the mounted city canvas reaches a ready state with the expected scene configuration.

## Validation Commands

Run these only from an allowed validation runtime:

```bash
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

## Expected Outcomes

- The home route renders `.city-scene-canvas`.
- The host contains exactly one rendered `canvas`.
- The host exposes `data-aiverse-city-canvas-state="ready"`.
- The host exposes logical width `1200`, logical height `720`, scene count `2`, and rendered count `1`.
- Unknown warnings, console errors, and page errors still fail the smoke.
