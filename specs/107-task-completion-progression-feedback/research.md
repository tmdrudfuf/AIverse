# Research: Task Completion Progression Feedback

## Decision: Reuse Existing Progression Services

**Rationale**: `CompanyProgressionService` already derives company level and milestone state from loaded completed projects and active employees. `CompanyProgressionTriggerService` already compares previous and current snapshots and emits level-reached triggers.

**Alternatives considered**: Adding a new task-completion progression service was rejected because it would duplicate existing milestone and trigger rules.

## Decision: Refresh Triggers During Done Transition Only

**Rationale**: The user-facing moment is the Review to Done transition. Refreshing triggers there avoids false positives for In Progress to Review transitions and avoids repeated triggers for already Done tasks.

**Alternatives considered**: Refreshing triggers on every portal render was rejected because it could create stale or repeated feedback unrelated to a completion action.

## Decision: Store Last Completion Feedback in Portal State

**Rationale**: The task detail view needs a small, renderable summary after completion. Keeping the latest feedback in portal state matches existing in-memory UI state and avoids new persistence or external side effects.

**Alternatives considered**: Deriving feedback only in the view was rejected because the controller owns progression trigger evaluation and can capture the before/after completion context accurately.
