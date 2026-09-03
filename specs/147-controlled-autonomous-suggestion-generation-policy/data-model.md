# Data Model: Controlled Autonomous Suggestion Generation Policy

## ProjectAutonomousSuggestionPolicy

- `projectId`: canonical registered project ID and storage key.
- `enabled`: operator-controlled boolean, default false.
- `maxSuggestionsPerEvaluation`: bounded integer, default 1, maximum 5.
- `cooldownMs`: persistent cooldown in milliseconds, default at least 900000.
- `requireNoActiveExecution`: default true.
- `requireNoPendingReadyTask`: default true.
- `requireNoExistingEligibleSuggestion`: default true.
- `minimumPlanningCapacity`: minimum remaining unresolved-work capacity required to generate, default 1.
- `maxUnresolvedPlanningItems`: bounded capacity ceiling across backlog, Ready, In Progress, and proposed suggestions.
- `updatedAt`: timestamp of latest policy change.
- `updatedByOperator`: true only after explicit operator update.
- `lastEvaluation`: optional persisted audit metadata.

## ProjectAutonomousSuggestionEvaluationEvent

- `projectId`: exact canonical project targeted by the event.
- `eventId`: durable identity for idempotency.
- `eventType`: deterministic lifecycle event type such as policy change, task completion, project idle, execution completion, or explicit operator evaluation.
- `occurredAt`: event timestamp.

## ProjectAutonomousSuggestionEvaluationResult

- `projectId`: evaluated project.
- `eventId`: evaluated event identity.
- `generated`: suggestions generated during this evaluation.
- `skipped`: deterministic skip reason when generation is not allowed.
- `evaluatedAt`: timestamp.
- `latestResultText`: concise operator-facing audit message.
- `providerInvoked`: true only when Spec 143 generation was called.

## State Relationships

- One canonical project owns one persisted Spec 147 policy.
- A policy evaluation targets exactly one canonical project and never falls back to selected/global project state.
- Generated records are existing Spec 143 `ProjectBacklogSuggestionCandidate` entries with status `proposed`.
- Spec 147 does not create, update, or transition backlog tasks.
