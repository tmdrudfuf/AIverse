# Quickstart: Agent Workflow Dry Run Preview

## Prerequisites

- Work from a clean local branch.
- Do not push, create PRs, mark PRs ready, merge, delete branches, or perform remote mutations.
- Keep `.agent-workflow/` gitignored.

## Manual Smoke Scenario

1. Create or reuse a local workflow state file under `.agent-workflow/`.

2. Run the dry-run preview:

   ```powershell
   node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --dry-run
   ```

3. Verify the output shows:

   - current stage
   - selected agent
   - command preview
   - prompt path
   - run directory
   - next expected step
   - `Will spawn: false`

4. Verify no Codex or Claude process is spawned by the dry-run preview.

5. Verify state is not advanced and no stage result is recorded.

## Automated Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Live E2E Readiness

After implementation and validation, run this feature through the existing Codex -> Claude workflow as a small production-code smoke test. Stop at the human gate and do not perform remote mutations.
