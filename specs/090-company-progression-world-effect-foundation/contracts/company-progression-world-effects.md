# Contract: Company Progression World Effects

## Effect Conversion

Input:

- `triggers`: ordered company progression trigger records

Output:

- Ordered company progression world effects

Rules:

- Each trigger maps to exactly one effect.
- The effect id is derived from the trigger id.
- The effect includes reached-level progression context and milestone identifiers.
- Output arrays and nested arrays are copies.

## World-State Synchronization

Input:

- Existing world-state synchronization input
- Optional ordered world effect records

Output:

- `WorldStateSnapshot` with an `effects` list
- `WorldStateSyncResult.changed` reflects world, building, actor, or effect semantic changes

Rules:

- Missing effects are treated as an empty list.
- Effects are copied into returned snapshots.
- Identical effects do not force a new snapshot.
- Changed effects produce a changed snapshot.

## Office-to-City Handoff

Input:

- Existing office exit request
- Latest copied company progression triggers from the portal controller

Output:

- Existing city return payload with optional copied world effects

Rules:

- No visible UI changes.
- No persistence or network behavior.
- No effects are attached when no progression triggers exist.
