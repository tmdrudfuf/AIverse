# Contract: Home Route Playwright Canvas Boot Smoke

## Focused Smoke Command

```bash
npx vitest run src/app/page.canvas-boot-smoke.test.ts
```

## Expected Route Entry Signal

- The home route component evaluates successfully.
- The returned route content is the city view experience.
- No live browser, Playwright process, GPU, external service, CLI agent, deployment, or GitHub mutation is required.

## Expected Canvas Entry Signal

- The city view component evaluates successfully.
- The city view contains the city canvas entry point used by the browser scene.
- The focused check complements `src/features/city-view/CitySceneCanvas.boot-smoke.test.ts`.
