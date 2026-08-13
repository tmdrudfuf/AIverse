# Research: Spec 090 - Company Progression World Effect Foundation

## Decision: Use an in-memory world effect projection

**Rationale**: Existing progression triggers are already provider-neutral and copied. Projecting them into world-state effects creates a clean boundary for future city reactions without introducing persistence or UI changes.

**Alternatives considered**:

- Store progression triggers directly in world state: rejected because world-state consumers should not need to depend on portal trigger terminology.
- Add durable event history: rejected as follow-up scope because the handoff asks for a foundation only.

## Decision: Carry effects through the existing office return payload

**Rationale**: The office already returns to the city through `CityReturnPayload`, and the city scene already synchronizes world state from scene inputs. Extending that handoff keeps the feature local and avoids global state.

**Alternatives considered**:

- Global event bus: rejected because it would create a broader lifecycle surface than needed.
- Direct portal-to-city dependency: rejected because the city scene should consume payload/world-state inputs, not office portal internals.

## Decision: Include effects in world-state semantic comparison

**Rationale**: Future consumers need to know when world effects change even if buildings and actors are unchanged. Treating effects as semantic state preserves the existing synchronizer contract.

**Alternatives considered**:

- Ignore effects for change detection: rejected because consumers could miss level-up reactions.
- Always mark snapshots changed when effects are present: rejected because unchanged repeated synchronizations should remain stable.
