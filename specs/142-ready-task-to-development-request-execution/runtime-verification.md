# Runtime Verification: Ready Task to Development Request Execution Bridge

Runtime evidence must be captured against a safe disposable/test project, not AIverse itself.

## Captured Evidence

Evidence was captured by running:

```bash
npx vitest run specs/142-ready-task-to-development-request-execution/runtime-verification.test.ts
```

The deterministic evidence payload is recorded in `runtime-evidence.json`.

## Evidence Summary

- Disposable project: `spec-142-disposable-project` / `Spec 142 Disposable Project`, bound to a disposable local worktree path under `.agent-workflow/disposable-projects/spec-142-disposable-project`.
- Ready task: `Bridge Ready backlog task to ADOS`, priority `urgent`, status `ready`, with multiline operator-authored text containing quotes, PowerShell syntax, shell-like text, and a code block.
- Selection-only preview: eligible for the same canonical project; provider invocation count stayed `0`; development request count stayed `0`.
- Explicit Start Development: accepted only after `startSelectedBacklogTaskDevelopment`; exactly one trusted ADOS provider invocation occurred.
- Development request: `spec-142-disposable-project:backlog-task:spec-142-disposable-project:backlog:1:external-development-request-draft`, project id `spec-142-disposable-project`, source backlog task id `spec-142-disposable-project:backlog:1`, full task description preserved.
- Durable requirements artifact: `.aiverse/external-requests/spec-142-disposable-project/20260831T12000000-requirements.md`, 972 bytes written by the provider file payload; contains the full task content, source backlog task id, development request id via preparation linkage, and prepared execution id.
- Trusted execution path: existing `ExternalProjectAdosExecutionService` launched command `claude` with fixed arguments `--dangerously-skip-permissions`, `-p`, `{{prompt}}`; task text was absent from prompt and command arguments and present only in the structured file payload.
- Association: task persisted `developmentRequestId`, `executionPreparationId`, and `executionRunId`; associated run/status records stayed keyed by `spec-142-disposable-project:backlog-task:spec-142-disposable-project:backlog:1`.
- Reload/re-entry: restored the same request, preparation, and run ids; no relaunch occurred.
- Live Project Status: derived lifecycle `complete`, stage `complete`, and rows including `Request Bridge Ready backlog task to ADOS`, `Spec 202608311200-bridge-ready-backlog-task-to-ados`, and the compacted task-scoped run id.

This evidence is distinct from ordinary home-canvas smoke.
