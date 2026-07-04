# Tasks: Task Status Progression

## Implementation
- [x] Add selected task action dispatcher in OfficeProjectPortalController.
- [x] Preserve Assign Employee behavior for unassigned Todo tasks.
- [x] Preserve Start Work behavior for assigned Todo tasks.
- [x] Add In Progress to Review transition with status_changed activity.
- [x] Add Review to Done transition with status_changed activity.
- [x] Make Done task action Completed and no-op.
- [x] Release assigned employee to Idle on Done when no other loaded task is assigned.
- [x] Preserve Done release behavior for assigned tasks with an assignee name and no assigneeId.
- [x] Update Task Detail action label rendering.

## Validation
- [ ] Run npx tsc --noEmit.
- [ ] Run npm run build.
- [ ] Run git diff --check.
- [ ] Manually verify the full Todo to Done status progression.
