# Quickstart: Structured Review Handoff

## Preview an Independent Review

```powershell
node tools/agent-workflow/cli.js run-review `
  --state .agent-workflow/050-structured-review-state.json `
  --dry-run
```

Dry-run resolves roles, command previews, repository context, prompt path, and run directory without spawning the Reviewer or writing execution/result/structured artifacts.

## Run an Independent Review

```powershell
node tools/agent-workflow/cli.js run-review `
  --state .agent-workflow/050-structured-review-state.json `
  --timeout-ms 300000
```

When Reviewer output includes a valid `## Structured Review` JSON fence, the command writes:

- raw Markdown result artifact
- JSON execution artifact
- structured review JSON artifact
- additive structured review fields in `reviewRuns`

When no structured block is present, the command keeps Markdown-only behavior.

## Run the Automated Loop

```powershell
node tools/agent-workflow/cli.js orchestrate `
  --state .agent-workflow/050-structured-review-state.json `
  --timeout-ms 300000 `
  --max-fix-cycles 2
```

If a valid structured `changes_requested` review is returned, fix prompts use the structured blocking findings. If structured data is invalid or conflicts with Markdown, the loop blocks conservatively.

## Human Responsibilities

The workflow automates local implementation, validation, review, and bounded fixes only. Push, PR creation, readiness, approval, merge, and remote deletion remain human-only.

## Documentation-Only Smoke Test

For an end-to-end smoke, configure local mock Implementer and Reviewer runners in a gitignored
state file, then run `orchestrate` with `--max-fix-cycles 1`. The Implementer should make a
single documentation-only edit, and the Reviewer should return `Approved` with a valid
`schemaVersion: 1` structured review block.

The expected result is `human-merge-decision`, `latestStructuredReviewStatus: "valid"`, one raw
Markdown review artifact, one structured JSON review artifact, passing validation, and no fix
cycle.
