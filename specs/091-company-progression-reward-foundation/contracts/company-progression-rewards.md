# Contract: Company Progression Rewards

## Reward Conversion

Input:

- `effects`: ordered company progression world effect records

Output:

- Ordered company progression reward records

Rules:

- Each effect maps to exactly one reward.
- The reward id is derived from the effect id.
- The reward includes reached-level progression context and milestone identifiers.
- Output arrays and nested arrays are copies.

## World-State Synchronization

Input:

- Existing world-state synchronization input
- Optional ordered reward records

Output:

- `WorldStateSnapshot` with a `rewards` list
- `WorldStateSyncResult.changed` reflects world, building, actor, effect, or reward semantic changes

Rules:

- Missing rewards are treated as an empty list.
- Rewards are copied into returned snapshots.
- Identical rewards do not force a new snapshot.
- Changed rewards produce a changed snapshot.

## Office-to-City Handoff

Input:

- Existing office exit request
- Latest company progression world effects created for the office exit

Output:

- Existing city return payload with optional copied rewards

Rules:

- No visible UI changes.
- No persistence or network behavior.
- No rewards are attached when no progression world effects exist.
