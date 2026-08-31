# Runtime Visual Verification: Project Portfolio Operations

## Required Evidence Fixture

Use a deterministic fixture with at least four city companies visible at once:

- Project A: Active implementation
- Project B: Needs Attention or Blocked
- Project C: Idle
- Project D: Recently Completed or Disconnected

## Evidence To Capture

1. City view shows distinct compact building treatments for multiple states without replacing the pixel-art city with a dashboard.
2. Selecting or approaching Project B shows a concise Project B summary.
3. Entering Project B opens the office with Project B as the canonical context and matching project status/live visualization.
4. Returning to the city and entering Project A opens Project A with Project A state restored.
5. Returning again does not contaminate any other company state.

## Runtime Boundary

The fixture must use safe persisted/session state. It must not start autonomous ADOS work, mutate GitHub, publish, merge, or deploy.

## Captured Evidence

- `runtime-portfolio-city.png` was captured by `e2e/portfolio-operations-city.spec.ts`.
- The seeded runtime showed `daily-proof:ACTIVE`, `ai-lab:NEEDS ATTENTION`, and `portfolio:RECENTLY COMPLETED` at the city canvas probe while rendering the city canvas.
