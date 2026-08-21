# Quickstart: Home Route Playwright Canvas Boot Smoke

## Scope

This guide documents focused validation for the home route canvas entry path. The ADOS implementer runtime must not execute these commands; they are for a later validation runtime.

## Focused Smoke

```bash
npx vitest run src/app/page.canvas-boot-smoke.test.ts
```

## Related Canvas Boot Smoke

```bash
npx vitest run src/features/city-view/CitySceneCanvas.boot-smoke.test.ts
```

## Full Validation Commands

```bash
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Expected Results

- The home route returns the city view experience.
- The city view includes the city canvas entry point.
- The checks do not start Playwright, live browser automation, validation review, publication, merge, deployment, GitHub mutation, or primary repository mutation flows.
