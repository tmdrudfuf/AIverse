# Contract: Daily Proof Canvas Boot Console Smoke

## Focused Smoke Scenario

**Command for an allowed validation runtime**:

```bash
npx vitest run src/features/city-view/CitySceneCanvas.boot-smoke.test.ts
```

**Expected outcomes**:

- The canvas boot helper requests exactly one game instance when given a host.
- The requested game configuration uses the supplied host as its parent.
- The requested game configuration contains the Daily Proof city scene collection.
- `console.warn` is not called.
- `console.error` is not called.

## Absent Host Scenario

**Expected outcomes**:

- The canvas boot helper returns no game instance when the host is absent.
- No game constructor is called.
- `console.warn` is not called.
- `console.error` is not called.

## Prohibited Side Effects

The smoke scenario must not start validation, review, agent runtimes, publication, merge, deployment, GitHub mutation, or primary repository mutation.
