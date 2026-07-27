# Quickstart: Agent Workflow Performance and Review Convergence

## Prerequisites

- Work from a clean local branch.
- Do not push, create PRs, mark PRs ready, merge, delete branches, or perform remote mutations.
- Keep `.agent-workflow/` gitignored.

## Manual Smoke Scenario

1. Create or reuse a local orchestration state file under `.agent-workflow/`, for example:

   ```json
   {
     "featureId": "056-agent-workflow-performance-convergence",
     "featureName": "Agent Workflow Performance and Review Convergence",
     "baseBranch": "main",
     "results": [],
     "reviewBudget": {
       "maxReviewAttempts": 3,
       "maxAutomaticFixCycles": 2,
       "maxIncompleteReviewRetries": 1,
       "maxReviewerQuestionCycles": 1
     },
     "validationPolicy": {
       "strategy": "focused-final-full",
       "focusedCommands": ["npx vitest run tools/agent-workflow/reviewConvergence.test.ts"],
       "fullCommands": ["npm test", "npx tsc --noEmit", "npm run build", "git diff --check"]
     }
   }
   ```

2. Preview dry-run behavior — confirm the changed-file inventory, high-risk files, review-budget usage, open finding count, and next review action print, with zero spawn/validation/state-write/artifact-write:

   ```powershell
   node tools/agent-workflow/cli.js orchestrate `
     --state .agent-workflow/spec-056-state.json `
     --implementer claude `
     --validation-strategy focused-final-full `
     --max-fix-cycles 2 `
     --dry-run
   ```

3. Run a mock orchestration (see `orchestrateCommand.test.ts`'s fake-adapter tests and Smoke A) where Review 1 returns three blocking findings in one pass, one consolidated fix cycle resolves all three, and Review 2 is a complete Approved review. Confirm:

   - `reviewAttempts = 2`, `automaticFixCycles = 1`,
   - `reviewConvergence.firstReviewBlockingFindings = 3`, `newBlockingFindingsAfterFirstReview = 0`,
   - `reviewConvergence.status = "converged"`,
   - `humanGate.ready = true` only once full validation has also passed against the exact reviewed target.

4. Drive Smoke D: set `reviewBudget.maxReviewAttempts = 2`, force a scenario needing a third review. Confirm the run stops with `stopReason: "review-convergence-failed"`, `ready = false`, open findings preserved, and no remote mutation.

5. Drive Smoke B: have the mock Reviewer return one finding but report incomplete changed-file coverage. Confirm `completeness = "incomplete"`, the review does not count as `Approved`, and the incomplete-review retry budget (not the full review-attempt budget) is consumed.

6. Point `summary` at the same state file and confirm the Markdown output shows a "Review Convergence" section (review attempts, first-review blocking findings, new findings after first review, reopened findings, automatic fix cycles, status) and a "Performance" section (Reviewer time, focused/full validation time):

   ```powershell
   node tools/agent-workflow/cli.js summary --state .agent-workflow/spec-056-state.json
   ```

## Automated Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
npx vitest run tools/agent-workflow/orchestrateCommand.test.ts --reporter=verbose
```

## Independent Review

After implementation, tests, and smoke tests, request a fresh independent review using **Codex CLI** as Reviewer (Claude CLI is the Implementer for this feature) under the new comprehensive-review protocol:

```powershell
node tools/agent-workflow/cli.js run-review --state .agent-workflow/spec-056-performance-convergence-state.json --implementer claude --timeout-ms 1800000
```

This resolves Reviewer=codex automatically via Spec 053's runtime role selection. Stop after the printed decision, completeness status, and next action; do not perform remote mutations.
