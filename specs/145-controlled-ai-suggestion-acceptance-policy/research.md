# Research: Controlled AI Suggestion Acceptance Policy

## Decision: Reuse Manual Suggestion Acceptance

Rationale: `ProjectBacklogSuggestionService.acceptSuggestion` already performs the Spec 143 to Spec 141 conversion and creates `backlog` tasks. Automatic acceptance will call that primitive with automatic provenance rather than creating a second conversion path.

Alternatives considered: Creating tasks directly in a new coordinator was rejected because it would duplicate conversion semantics.

## Decision: Project-Scoped Policy Map

Rationale: Browser session state already persists project-scoped backlog, suggestion, and autonomy maps. A sibling map for suggestion acceptance policies preserves isolation and defaults missing/malformed records to disabled.

Alternatives considered: A global policy was rejected by requirement.

## Decision: Deterministic Eligibility

Rationale: Policy evaluation can be synchronous over persisted suggestions/tasks and use operator priority order, generated timestamp, and id for stable selection without extra AI calls.

Alternatives considered: AI duplicate or safety classification was rejected by requirement.
