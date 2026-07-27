# Quickstart: Focused Validation Review Loop

## Prerequisites

- Work from a clean local branch.
- Do not push, create PRs, mark PRs ready, merge, delete branches, or perform remote mutations.
- Keep `.agent-workflow/` gitignored.

## Manual Smoke Scenario

1. Create or reuse a local orchestration state file under `.agent-workflow/`, for example:

   ```json
   {
     "featureId": "055-focused-validation-review-loop",
     "featureName": "Focused Validation Review Loop",
     "baseBranch": "main",
     "results": [],
     "validationPolicy": {
       "strategy": "focused-final-full",
       "focusedCommands": ["node --test tools/agent-workflow/validationPolicy.test.ts"],
       "fullCommands": ["npm test", "npx tsc --noEmit", "npm run build", "git diff --check"]
     }
   }
   ```

2. Preview dry-run behavior — confirm the strategy and both command lists print, no command executes, and no artifact is written:

   ```powershell
   node tools/agent-workflow/cli.js orchestrate `
     --state .agent-workflow/spec-055-state.json `
     --implementer claude `
     --validation-strategy focused-final-full `
     --dry-run
   ```

3. Run a real orchestration with mock runners (see `validationPolicy.test.ts`/`orchestrateCommand.test.ts` for fixture shape) through two Changes-Requested/fix cycles then Approved, and confirm:

   - `validate`/`revalidate` occurrences ran only the configured focused commands,
   - `final-verification` ran the full command list exactly once,
   - `run-summary.json`'s `validation.focused.attempts` and `validation.full.attempts` are reported separately,
   - `humanGate.ready` is `true` only once `validation.full.status` is `"passed"`.

4. Drive a mock run where `final-verification` fails after Approved. Confirm the run does not hard-block; it transitions to `fix`, `fullValidationFixCycleCount` increments, and a fresh focused validation + Reviewer decision are required before `final-verification` runs again.

5. Run using `--validation-strategy full-every-cycle` (or omit the flag entirely) and confirm every `validate`/`revalidate`/`final-verification` occurrence uses the same full command list, exactly matching pre-Spec-055 behavior.

6. Point `summary` at the same state file and confirm the Markdown output shows the strategy, focused attempts/result, and full attempts/result as distinct lines:

   ```powershell
   node tools/agent-workflow/cli.js summary --state .agent-workflow/spec-055-state.json
   ```

## Automated Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Independent Review

After implementation, tests, and smoke tests, request a fresh independent review using **Codex CLI** as Reviewer (Claude CLI is the Implementer for this feature):

```powershell
node tools/agent-workflow/cli.js run-review --state .agent-workflow/spec-055-focused-validation-state.json --implementer claude --timeout-ms 1800000
```

This resolves Reviewer=codex automatically via Spec 053's runtime role selection. Stop after the printed decision and next action; do not perform remote mutations.
