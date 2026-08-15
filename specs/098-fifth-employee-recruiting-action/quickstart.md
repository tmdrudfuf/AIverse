# Quickstart: Fifth Employee Recruiting Action

## Validation Scenarios

1. Start from the operating terminal with the default roster source available.
2. Move selection to the recruiting row.
3. Activate the action.
4. Confirm the roster count updates from 4 to 5 and the new employee is idle.
5. Activate the action again and confirm no duplicate employee is created.
6. Confirm projects, task collections, work sessions, repository mappings, repository summaries, and runtime records are unchanged.

## Validation Commands

The ADOS handoff for this runtime disallows running validation here. The expected validation suite for the reviewer or local validation runtime is:

```text
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
