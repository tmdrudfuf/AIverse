# Quickstart

## Validation Commands
- npx tsc --noEmit
- npm run build
- npm run lint if available
- git diff --check

## Manual Regression Checklist
1. Open Daily Proof workspace.
2. Open Tasks.
3. Assign an employee to a Todo task.
4. Start Work.
5. Confirm task becomes In Progress.
6. Confirm Work Session is created and rendered.
7. Confirm Activity shows "GPT Engineer started placeholder work session".
8. Move task to Review and Done.
9. Confirm no new AI UI, API keys, network calls, timers, background workers, or provider configuration were added.