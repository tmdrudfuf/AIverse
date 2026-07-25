# Quickstart: Finding Lifecycle Tracking

## Prerequisites

- Branch: `codex/finding-lifecycle-tracking`
- Working tree clean except intended Spec 052 changes
- No live AI agents required for automated tests

## Focused Validation

```powershell
npx vitest run `
  tools/agent-workflow/structuredReview.test.ts `
  tools/agent-workflow/findingLifecycle.test.ts `
  tools/agent-workflow/reviewCommand.test.ts `
  tools/agent-workflow/orchestrateCommand.test.ts
```

Expected:

- Initial findings are recorded as new.
- Re-review resolved/still_open/new classifications normalize correctly.
- Invalid lifecycle data blocks.
- Spec 050/051 compatibility remains.

## Mock E2E: Resolve One Finding

Run an orchestrate state with deterministic mock Implementer and Reviewer runners:

```powershell
node tools/agent-workflow/cli.js orchestrate `
  --state .agent-workflow/052-lifecycle-resolved-smoke-state.json `
  --timeout-ms 30000 `
  --max-fix-cycles 2
```

Expected flow:

```text
initial review changes_requested with F1
→ fix
→ re-review marks F1 resolved
→ approved
→ final verification
→ human-merge-decision
```

## Mock E2E: Resolve Old, Introduce New

```powershell
node tools/agent-workflow/cli.js orchestrate `
  --state .agent-workflow/052-lifecycle-new-blocker-smoke-state.json `
  --timeout-ms 30000 `
  --max-fix-cycles 2
```

Expected:

- `F1` is resolved.
- `F2` is recorded as new and active.
- The next fix prompt targets `F2` only.

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Safety

The workflow automates local implementation, validation, review, fixes, and re-review only. Push, PR creation/readiness/approval, merge, and remote deletion remain human-only.

## Smoke Results

- Resolved-finding smoke completed: `F1` moved from active blocking to `resolved`, final review approved, final verification passed, and the workflow reached `human-merge-decision`.
- New-blocker smoke completed: `F1` resolved, `F2` was introduced as `new`, the second fix prompt targeted `F2`, final re-review approved, final verification passed, and the workflow reached `human-merge-decision`.
