# Tasks: Employee Work Simulation Placeholder

## Implementation
- [x] Add work_started to TaskActivityType.
- [x] Add controller helper for starting placeholder work on the selected assigned task.
- [x] Route Task Detail Enter/Space to Assign Employee or Start Work based on assignee state.
- [x] Prepend work_started activity to ProjectTask.activityLog.
- [x] Move Todo tasks to In Progress when placeholder work starts.
- [x] Render Task Detail action as Assign Employee or Start Work (placeholder).

## Validation
- [ ] Run npx tsc --noEmit.
- [ ] Run npm run build.
- [ ] Run git diff --check.
- [ ] Manually verify task assignment, placeholder work, activity ordering, task list status, and employee Working state.