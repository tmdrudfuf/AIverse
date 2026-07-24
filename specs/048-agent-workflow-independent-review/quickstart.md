# Quickstart: Agent Workflow Independent Review

## Prerequisites

- Work from a clean local branch.
- Do not push, create PRs, mark PRs ready, merge, delete branches, or perform remote mutations.
- Keep `.agent-workflow/` gitignored.

## Manual Smoke Scenario

1. Create or reuse a local workflow state file under `.agent-workflow/`, for example:

   ```json
   {
     "featureId": "048-agent-workflow-independent-review",
     "featureName": "Agent Workflow Independent Review",
     "baseBranch": "main",
     "results": []
   }
   ```

2. Preview the independent review without spawning the Reviewer:

   ```powershell
   node tools/agent-workflow/cli.js run-review --state .agent-workflow/example-state.json --dry-run
   ```

3. Verify the output shows:

   - resolved Implementer and Reviewer (identity and command)
   - sanitized command preview
   - prompt path and run directory
   - repository context: current branch, base branch, merge base, and whether staged/unstaged/committed changes exist
   - `Will spawn: false`
   - the same-runner warning, if the Implementer and Reviewer resolve identically

4. Run the independent review for real:

   ```powershell
   node tools/agent-workflow/cli.js run-review --state .agent-workflow/example-state.json
   ```

5. Verify:

   - the Reviewer CLI actually runs (or fails/times out, if unavailable)
   - a prompt file, a JSON execution record, and the raw Reviewer output are written under `.agent-workflow/runs/<feature-id>/`
   - `state.reviewRuns` gains one entry with the outcome
   - the printed decision is one of `Approved`, `Changes Requested`, `Unknown`, `Execution Failed`, or `Timed Out`
   - the printed next action matches the decision
   - no push, PR, merge, or branch deletion occurs

## Automated Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Live E2E Readiness

After implementation and validation, this command can be run against the real repository as a read-only smoke test (aside from local run records). Stop after the printed decision and next action; do not perform remote mutations.
