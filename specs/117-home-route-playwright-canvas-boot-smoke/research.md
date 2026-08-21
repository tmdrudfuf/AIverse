# Research: Home Route Playwright Canvas Boot Smoke

## Decision: Test home route composition without live browser automation

**Rationale**: The handoff prohibits validation and live browser automation in this runtime. A focused route composition smoke test proves the home route still reaches the city canvas entry point while staying deterministic and fast.

**Alternatives considered**:

- Run Playwright against the Next.js app: rejected because this runtime must not run validation or start browser automation.
- Add Playwright as a dependency: rejected because the feature can be covered by existing tooling and should not expand dependencies.
- Only rely on the existing canvas boot smoke: rejected because it does not prove `/` still routes to the canvas experience.

## Decision: Keep route smoke coverage next to the home route

**Rationale**: `src/app/page.tsx` is the route boundary. A colocated smoke test makes route regressions easy to find and keeps the test close to the behavior it protects.

**Alternatives considered**:

- Place the test in `src/features/city-view`: rejected because the feature targets home route composition rather than city-view internals.
- Add an end-to-end test directory: rejected because there is no current browser automation dependency and this runtime cannot execute one.
