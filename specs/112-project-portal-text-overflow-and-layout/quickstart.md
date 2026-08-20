# Quickstart: Project Portal Text Overflow and Layout Stability

## Prerequisites

- Feature worktree checked out on `codex/112-project-portal-text-overflow-and-layout`.
- Dependencies already installed.

## Focused Scenarios

1. Open the office Project Portal list view with long company dashboard summary/source text.
2. Open the Project Dashboard view with long active work titles, employee names, advisory text, source rows, and runtime status rows.
3. Open Project Detail with long repository and owner metadata.
4. Open Task Detail with a long title, description, completion feedback, and activity rows.
5. Open Candidate Detail with long issue title, labels, assignees, summary, and decision context.
6. Confirm body rows remain separated from footer instructions in each view.

## Validation Commands

These commands are required by repository policy but are not to be run from the current handoff runtime:

```bash
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
