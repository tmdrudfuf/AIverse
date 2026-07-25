# Quickstart: Reviewer Question Loop

## Dry-Run Preview

```powershell
node tools/agent-workflow/cli.js orchestrate `
  --state .agent-workflow/051-reviewer-question-loop-state.json `
  --dry-run `
  --max-fix-cycles 1
```

Expected:

- Implementer and Reviewer resolve.
- Conditional question-loop stages are shown.
- Answer and final-review prompt paths are previewed.
- `Will spawn: false`.
- No state, artifacts, files, or remote resources are mutated.

## Mock E2E Smoke

Use a gitignored state file with local mock runners:

1. Implementer makes one documentation-only change.
2. Reviewer returns valid structured `questions`.
3. Implementer returns valid structured answers without editing files.
4. Final Reviewer returns valid structured `approved`.
5. Validation command is `git diff --check`.

Expected terminal state:

- `human-merge-decision`
- `latestReviewerQuestionStatus: "valid"`
- `latestImplementerAnswerStatus: "valid"`
- `latestStructuredReviewStatus: "valid"`
- `questionCycle: 1`
- `fixCycleCount: 0`
- raw Markdown question, answer, and final-review artifacts exist
- structured question review, answer, and final-review JSON artifacts exist

## Failure Smoke

Repeat with a final Reviewer returning `questions` again. Expected result: `blocked`; no second answer stage, no fix stage, and no final verification.

## Smoke Result

A local mock-runner smoke should complete the one-round question loop with no fix cycle.
