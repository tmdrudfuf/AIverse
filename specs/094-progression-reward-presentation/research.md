# Research: Spec 094 - Progression Reward Presentation

## Decision: Read rewards from world-state snapshots

**Rationale**: Rewards are already copied into `WorldStateSnapshot.rewards` during office-to-city synchronization. Reading from that boundary keeps presentation behavior aligned with existing city state and avoids reinterpreting world effects or feed events.

**Alternatives considered**: Read reward data from the office return payload directly. That would duplicate city synchronization behavior and make repeated synchronization less stable.

## Decision: Use a compact in-scene HUD panel

**Rationale**: The existing progression event feed panel uses an in-scene Phaser HUD. Reward presentation should follow that established pattern, stay visible in the city scene, and avoid introducing a React overlay for one copied snapshot consumer.

**Alternatives considered**: Add a modal, toast queue, or persistent reward history. Those need separate interaction and retention decisions outside this handoff.

## Decision: Keep reward presentation bounded and read-only

**Rationale**: A capped display prevents the city HUD from covering navigation content and keeps formatting deterministic. Pure row formatting returns new display data so UI mutation cannot alter copied reward records.

**Alternatives considered**: Show all rewards or allow player dismissal. Showing all rewards risks UI overflow, while dismissal implies state persistence or additional scene-local lifecycle rules.
