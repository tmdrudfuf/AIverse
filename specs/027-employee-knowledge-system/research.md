# Research: Employee Knowledge System

## Decision: Extend Employee Insight Targeting

**Rationale**: Employee Knowledge should describe the same employee the player is already observing through Employee Insight. Reusing the Insight target avoids conflicting nearby-employee selection rules and preserves the existing passive observation behavior.

**Alternatives considered**:

- Create a separate knowledge proximity service: rejected because it could select a different employee than Employee Insight.
- Attach knowledge directly to conversation targeting: rejected because knowledge is passive and must not require dialogue or interaction input.

## Decision: Derive Knowledge from Existing Simulation Sources

**Rationale**: The feature goal is to make autonomous behavior legible. Reasoning, current goal, schedule, timeline, and next activity should be derived from Employee AI snapshots, schedule snapshots, task/project state, progression state, conversation context where already available, and Employee Insight source data.

**Alternatives considered**:

- Store a separate knowledge state model: rejected because it duplicates simulation state for presentation.
- Generate knowledge through new AI provider calls: rejected because the first slice should be deterministic, lightweight, and available without external latency or cost.

## Decision: Keep Knowledge Derivation Pure and Rendering Separate

**Rationale**: A pure derivation service can be tested independently and reused later by dialogue, memory, relationship, management, save/load, and multiplayer systems. Rendering can remain an office-scene concern.

**Alternatives considered**:

- Put derivation inside the Phaser overlay: rejected because it couples business rules to rendering.
- Put all knowledge logic inside the portal controller: rejected because the controller should compose source snapshots, while a feature service owns derived view context.

## Decision: First Vertical Slice Prioritizes Why, Goal, and Next Activity

**Rationale**: The complete panel is capable of showing many fields, but the first playable slice should prove the Observe -> Understand transition with the smallest useful explanation layer.

**Alternatives considered**:

- Build the full timeline and confidence system first: rejected because optional fields are not required to validate the core loop.
- Build future influence controls first: rejected because influence comes after observation and understanding.

## Decision: Conversation Remains Read-Only Context

**Rationale**: Conversation systems may provide context about current employee behavior, but Employee Knowledge must not start dialogue, route choices, or mutate conversation state.

**Alternatives considered**:

- Reuse conversation view models for knowledge text: rejected because dialogue text and choices are distinct from passive reasoning.
- Ignore conversation entirely: rejected because existing conversation state can be useful context as long as it remains read-only.

## Decision: Confidence Is Optional and Source-Driven

**Rationale**: AI confidence is useful only if an existing source exposes it. The panel must not invent confidence scores.

**Alternatives considered**:

- Always display a heuristic confidence score: rejected because it creates presentation-only state that appears authoritative.
- Remove confidence from the system: rejected because the panel should be capable of displaying it later when real source data exists.
