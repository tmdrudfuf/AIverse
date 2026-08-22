# Quickstart: Persistent ADOS Playwright Home Canvas Validation Command

This ADOS implementation runtime must not run validation, review, publication, merge, deployment, GitHub mutation, or primary repository mutation.

## Focused Checks For Allowed Validation Runtime

Run outside this runtime:

```powershell
npm test -- tools/agent-workflow/agentWorkflow.test.ts tools/agent-workflow/agentRunner.test.ts tools/agent-workflow/agentWorkflowRun.test.ts
```

Expected outcome:

- Default workflow fixtures include `npm run test:e2e:home-canvas`.
- Generated prompts based on default state render the command.
- Explicit override tests continue to use their supplied command lists.

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
