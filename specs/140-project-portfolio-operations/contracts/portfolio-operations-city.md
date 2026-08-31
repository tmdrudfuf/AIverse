# Contract: Portfolio Operations City Surface

## Portfolio Aggregation

Given a list of city buildings and project portal state, the system returns one portfolio summary per building id. Each summary is independently derived for that building's canonical project id. Missing or unavailable registry data returns a Disconnected summary with mutation disabled.

## Attention Mapping

- `implementation`, `validation`, `review`, `publication`, `preparing` -> Active
- blocked or failed validation/review/runtime/preparation state -> Blocked or Needs Attention with normalized reason
- completed persisted run state -> Recently Completed
- no active/resumable run -> Idle
- missing/unavailable binding -> Disconnected

## Selection Summary

When a building is active or selected, the city prompt exposes:

- company/project identity
- attention state
- run/request indicator
- blocked reason when applicable
- whether explicit operator entry is available

## Filtering

Filters are pure selections over summaries:

- `all`: every company
- `active`: Active
- `attention`: Needs Attention and Blocked
- `idle`: Idle
- `completed`: Recently Completed
- `disconnected`: Disconnected

Applying a filter must not mutate any project execution, request, blocker, registry, binding, or office state.

## Re-entry

Entering a building passes the existing building id, project binding id, and canonical project id into the office entry request. Office state remains project-scoped and must not infer a project by display name.
