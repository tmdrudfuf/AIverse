# Research: Spec 091 - Company Progression Reward Foundation

## Decision: Use an in-memory reward projection

**Rationale**: Existing progression world effects already represent level-up facts at the city world-state boundary. Projecting them into reward records creates a clean reward-specific boundary without introducing persistence, presentation, or duplicate threshold evaluation.

**Alternatives considered**:

- Store rewards directly in progression triggers: rejected because reward consumers should not need office portal trigger data.
- Infer rewards in each future consumer: rejected because it duplicates mapping and copy behavior.
- Add durable reward history: rejected as follow-up scope because the handoff asks for a foundation only.

## Decision: Carry rewards through the existing office return payload

**Rationale**: The office already returns to the city through `CityReturnPayload`, and Spec 090 already carries progression world effects on that path. Extending the same handoff keeps the reward feature local and avoids global state.

**Alternatives considered**:

- Global event bus: rejected because it would create a broader lifecycle surface than needed.
- Direct reward service dependency in the city scene: rejected because the city scene should consume payload/world-state inputs, not derive office progression events.

## Decision: Include rewards in world-state semantic comparison

**Rationale**: Future reward consumers need to know when granted rewards change even if buildings, actors, and effects are unchanged. Treating rewards as semantic state preserves the existing synchronizer contract.

**Alternatives considered**:

- Ignore rewards for change detection: rejected because consumers could miss reward changes.
- Always mark snapshots changed when rewards are present: rejected because unchanged repeated synchronizations should remain stable.
