# Quickstart

## Validation Commands
- npx tsc --noEmit
- npm run build
- npm run lint if available
- git diff --check

## Manual Regression Checklist
1. Open Daily Proof workspace.
2. Open Tasks.
3. Move Up/Down through the task list.
4. Open Task Detail.
5. Assign an employee.
6. Start Work and confirm work session/activity behavior remains unchanged.
7. Move task to Review and Done.
8. Confirm no task analysis UI is visible.
9. Confirm no external API calls, timers, save/load, background workers, or provider configuration were added.