# Quickstart: Review Run Summary and Audit Trail

## Prerequisites

- Work from a clean local branch.
- Do not push, create PRs, mark PRs ready, merge, delete branches, or perform remote mutations.
- Keep `.agent-workflow/` gitignored.

## Manual Smoke Scenario

1. Create or reuse a local orchestration state file under `.agent-workflow/`, for example:

   ```json
   {
     "featureId": "054-review-run-summary-audit-trail",
     "featureName": "Review Run Summary and Audit Trail",
     "baseBranch": "main",
     "results": []
   }
   ```

2. Preview dry-run behavior — confirm zero summary artifacts are written:

   ```powershell
   node tools/agent-workflow/cli.js orchestrate `
     --state .agent-workflow/spec-054-state.json `
     --implementer claude `
     --dry-run
   ```

   Verify no `run-summary.json`/`run-summary.md` appear under `.agent-workflow/runs/054-review-run-summary-audit-trail/`, no state is written, and no process spawns.

3. Run a real orchestration with mock runners configured for both `codex` and `claude` agent IDs (see `runSummary.test.ts`/`orchestrateCommand.test.ts` for fixture shape) through to Approved → final-verification → human-merge-decision, and confirm:

   - `.agent-workflow/runs/054-review-run-summary-audit-trail/run-summary.json` and `run-summary.md` both exist,
   - `run.status` is `"awaiting-human-decision"`,
   - `roles.implementer.agentId`/`roles.reviewer.agentId` match the resolved run,
   - `humanGate.ready` is `true` and `validation.status` is `"passed"`.

4. Inspect the same run read-only, without depending on the cached file:

   ```powershell
   node tools/agent-workflow/cli.js summary --state .agent-workflow/spec-054-state.json
   node tools/agent-workflow/cli.js summary --state .agent-workflow/spec-054-state.json --format json
   ```

   Confirm neither invocation spawns a process, writes state, or rewrites the cached artifacts (compare file mtimes before/after).

5. Drive a mock run through Changes Requested with one blocking finding, then a fix cycle, then Approved with that finding resolved. Confirm the summary reports `review.fixCycles: 1`, `findings.opened: 1`, `findings.resolved: 1`, `findings.remainingBlocking: 0`.

6. Simulate a resume: stop a mock run after `Changes Requested` (before the fix cycle completes), then resume it to `Approved`. Confirm the stage timeline has no duplicate entries for stages that did not re-run, and that `roles.source` is unchanged from the original resolution.

7. Point `summary` at an old state file with no Spec 054/053/052 fields at all. Confirm it prints a safe partial summary (explicit `"unknown"` markers) instead of crashing, and that the old file is not modified.

## Automated Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manually confirm JSON parses cleanly:

```powershell
Get-Content .agent-workflow/runs/054-review-run-summary-audit-trail/run-summary.json -Raw | ConvertFrom-Json | Out-Null
```

## Independent Review

After implementation, tests, and smoke tests, request a fresh independent review using **Codex CLI** as Reviewer (since Claude CLI is the Implementer for this feature):

```powershell
node tools/agent-workflow/cli.js run-review --state .agent-workflow/spec-054-review-state.json --implementer claude --timeout-ms 900000
```

This resolves Reviewer=codex automatically via Spec 053's runtime role selection. Stop after the printed decision and next action; do not perform remote mutations.
