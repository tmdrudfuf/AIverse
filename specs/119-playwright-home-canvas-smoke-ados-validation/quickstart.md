# Quickstart: Playwright Home Canvas Smoke ADOS Validation Gate

This ADOS implementation runtime must not run validation, review, publication, merge, deployment, GitHub mutation, or primary repository mutation.

## Focused Checks For Allowed Validation Runtime

Run outside this runtime:

```powershell
npm test -- tools/agent-workflow/validationPolicy.test.ts tools/agent-workflow/agentWorkflow.test.ts
```

Expected outcome:

- Default full validation command resolution includes `npm run test:e2e:home-canvas`.
- Generated workflow prompts include `npm run test:e2e:home-canvas`.
- Custom validation command overrides remain unchanged.

## Full ADOS Validation For Allowed Validation Runtime

Run outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

Expected outcome:

- All commands pass.
- No validation command mutates GitHub, publishes, merges, deploys, or modifies the primary repository.
