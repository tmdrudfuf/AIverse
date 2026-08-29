# Research: Live Agent Work Visualization

## Decision: Add a semantic office work-state translation layer

**Rationale**: ADOS state is spread across preparation, execution, result, persisted status, and existing runtime collections. A normalized semantic model keeps raw status strings from leaking into rendering and lets semantic roles drive locations separately from provider identity.

**Alternatives considered**: Rendering directly from raw ADOS display strings was rejected because it would couple UI behavior to unstable text. A fake timer workflow was rejected because the requirements prohibit simulation disconnected from real run state.

## Decision: Reuse selected-project persisted state and existing status derivation

**Rationale**: `deriveExternalProjectAdosRunStatus` already prefers newest real evidence over stale persisted status and is keyed by project. Using the selected project state prevents cross-project leakage and avoids redundant polling.

**Alternatives considered**: Creating a new project-status subsystem was rejected because the repository already has ADOS status surfaces and browser-session persistence.

## Decision: Reuse existing NPC movement and rendered office anchors

**Rationale**: Spec 135 established physical workplace anchors and the NPC movement service already handles target hints and stale timestamps. Feeding semantic destinations into that path satisfies movement requirements without a second movement engine.

**Alternatives considered**: Teleporting independent sprites or creating a parallel animation service was rejected because it would bypass existing NPC infrastructure.

## Decision: Render truthful stage pipeline text, not percentages

**Rationale**: Project Status should communicate known stage and lifecycle information without fabricating numeric progress. A stage-based representation is both truthful and testable from existing state.

**Alternatives considered**: Generated progress percentages were rejected because the requirements explicitly prohibit fabricated percentages.
