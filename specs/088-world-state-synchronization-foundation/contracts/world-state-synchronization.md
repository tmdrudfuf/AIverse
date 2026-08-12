# Contract: World State Synchronization

## Boundary

World state synchronization is a local scene boundary. It reads already-available city scene facts and returns a copied in-memory snapshot. It does not execute tools, persist state, call external services, or mutate project repositories.

## Synchronization Input

- `worldId`: required stable world identifier.
- `activeWorldSpaceId`: required stable world-space identifier.
- `sceneKey`: required scene key.
- `bounds`: required world-space rectangle.
- `buildings`: required configured building definitions.
- `founderState`: optional Founder actor state.
- `syncedAt`: optional ISO timestamp; callers may pass a deterministic value for tests.

## Result

- A successful synchronization returns `status: "Succeeded"`, a copied snapshot, and `changed: true` when semantic world facts changed.
- A repeated synchronization with unchanged semantic facts returns the previous successful snapshot and `changed: false`.
- A not-started synchronizer exposes a `NotStarted` snapshot with no buildings or actors.

## Safety Guarantees

- Returned snapshots cannot be altered by later mutations to source inputs.
- Disabled building destinations remain represented as disabled, never as enterable.
- Runtime input/camera velocity and visual object references are excluded.
- Validation, review, publication, merge, deployment, repository mutation, GitHub mutation, and AI runtime starts are outside this contract.
