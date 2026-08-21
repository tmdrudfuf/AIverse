# Quickstart: Daily Proof Canvas Boot Console Smoke

## Prerequisites

- Work in the feature worktree, not the primary repository.
- Use the existing project dependencies.
- Do not start review, publish, merge, deploy, mutate GitHub, or modify the primary repository.

## Focused Smoke Command

For an allowed validation runtime:

```bash
npx vitest run src/features/city-view/CitySceneCanvas.boot-smoke.test.ts
```

## Full Validation Commands

For an allowed validation runtime after implementation:

```bash
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Expected Result

- Daily Proof city canvas boot requests one game instance for the supplied host.
- The configured scene collection includes the city and office scenes.
- Boot with an absent host creates no game instance.
- No console warnings or errors are emitted by either smoke path.
