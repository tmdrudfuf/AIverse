# Contract: Project Portal Layout Stability

## Scope

The Project Portal layout contract applies to existing portal view modes and their visible text rows.

## Guarantees

- Body content does not overlap footer instruction text.
- Rows inside the Project Dashboard lower panel fit inside the drawn lower panel.
- Long single-line repository, branch, task, title, and status identifiers are compacted with `...`.
- Multi-line summaries are clamped to the row budget for their view.
- Low-priority optional Project Dashboard lower rows may be dropped when all rows cannot fit.
- Portal navigation, selected-row behavior, read-only boundaries, repository mutation boundaries, GitHub mutation boundaries, and runtime behavior are unchanged.

## Non-Goals

- No new scrolling system.
- No new portal data source.
- No repository, GitHub, validation, review, publish, merge, or deploy action.
