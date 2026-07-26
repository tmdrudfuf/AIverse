# Quickstart: Runtime Role Selection

## Prerequisites

- Work from a clean local branch.
- Do not push, create PRs, mark PRs ready, merge, delete branches, or perform remote mutations.
- Keep `.agent-workflow/` gitignored.

## Manual Smoke Scenario

1. Create or reuse a local orchestration state file under `.agent-workflow/`, for example:

   ```json
   {
     "featureId": "053-runtime-role-selection",
     "featureName": "Runtime Role Selection",
     "baseBranch": "main",
     "results": []
   }
   ```

2. Preview the opposite-role resolution without spawning anything:

   ```powershell
   node tools/agent-workflow/cli.js orchestrate `
     --state .agent-workflow/spec-053-state.json `
     --implementer claude `
     --dry-run
   ```

   Verify the output shows:

   - `Resolved roles` block with `Implementer: ... (claude)` and `Reviewer: ... (codex)`
   - `Role source: cli-override`
   - `Will spawn: false`

3. Repeat with `--implementer codex` and verify the opposite Reviewer (`claude`) is resolved.

4. Verify unsupported input is rejected before spawn:

   ```powershell
   node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/spec-053-state.json --implementer nonexistent-agent --dry-run
   node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/spec-053-state.json --implementer --dry-run
   node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/spec-053-state.json --implementer claude --implementer codex --dry-run
   ```

   Each must exit non-zero with a diagnostic and must not print `Will spawn: true` or spawn any process.

5. Run a real orchestration with mock runners configured for both `codex` and `claude` agent IDs (see `roleResolver.test.ts`/`orchestrateCommand.test.ts` for fixture shape) and confirm:

   - the implementation prompt is sent to the requested Implementer's command,
   - the review prompt is sent to the auto-derived Reviewer's command,
   - `state.latestResolvedRoles` and `state.orchestration.resolvedImplementerId`/`resolvedReviewerId` reflect the run.

6. Simulate a resume: take the state file from step 5 mid-run (before it reaches `human-merge-decision`/`blocked`), and re-run `orchestrate` on the same state file with a *different* `--implementer` value. Verify it is rejected before any process spawns, and that `state.orchestration.resolvedImplementerId`/`resolvedReviewerId` are unchanged.

## Automated Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Independent Review

After implementation, tests, and smoke tests, request a fresh independent review using **Codex CLI** as Reviewer (since Claude CLI is the Implementer for this feature):

```powershell
node tools/agent-workflow/cli.js run-review --state .agent-workflow/spec-053-review-state.json --implementer claude
```

This resolves Reviewer=codex automatically. Stop after the printed decision and next action; do not perform remote mutations.
