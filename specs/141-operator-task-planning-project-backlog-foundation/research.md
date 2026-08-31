# Research: Operator Task Planning Project Backlog Foundation

## Decision: Use a focused ProjectBacklogService

**Rationale**: Existing office features use small project-scoped services with deterministic local state transitions. A dedicated backlog service keeps planning artifacts separate from Spec 138 development requests and ADOS runtime state.

**Alternatives considered**: Reusing `ProjectTaskService` was rejected because employee tasks represent work execution/progression and include assignment/progress semantics. Extending development request drafts was rejected because backlog tasks must be editable long-lived planning artifacts.

## Decision: Persist through BrowserOfficeSessionService

**Rationale**: Browser office session already persists project-scoped office state across reload and is keyed by canonical ids. Adding backlog collections there avoids a second persistence channel.

**Alternatives considered**: A separate localStorage key was rejected because it would duplicate snapshot validation and could drift from registered project context.

## Decision: Office project portal planning view

**Rationale**: The portal is the existing operator surface inside the office and already supports project dashboards, task lists, and development request input. A backlog view fits without redesigning the office.

**Alternatives considered**: A full city dashboard was rejected because the feature requires city awareness to remain compact and secondary.

## Decision: Deterministic operator-controlled ordering

**Rationale**: Ready and Blocked tasks should surface first, then priority and timestamps. This supports "what next" without AI-based reprioritization.

**Alternatives considered**: Manual drag ordering is not required by the Spec and would add interaction complexity beyond the foundation.
