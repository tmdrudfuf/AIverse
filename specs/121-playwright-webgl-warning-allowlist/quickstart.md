# Quickstart: Playwright WebGL Warning Allowlist

## Scope

This feature updates the focused home canvas browser smoke so known benign warning-level WebGL fallback notices do not fail the check, while unknown warnings, console errors, and page errors remain failures.

## Validation Commands

Run these only from an allowed validation runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

## Expected Results

- Unit coverage proves the allowlist ignores only the documented WebGL warning text.
- Unit coverage proves unknown warnings and console errors are still collected.
- The Playwright smoke still visits `/`, finds `.city-scene-canvas`, and finds a `canvas` inside it.
- The Playwright smoke fails only when non-allowed browser failure signals are collected.

## ADOS Runtime Note

Validation is intentionally not run from this implementation runtime per the handoff execution policy.
