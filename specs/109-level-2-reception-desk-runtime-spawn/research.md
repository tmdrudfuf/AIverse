# Research: Level 2 Reception Desk Runtime Spawn

## Decision: Derive The Desk From Progression And Layout Snapshots

**Rationale**: Company level and reception unlock state already live in the progression snapshot, while placement data already lives in the active office layout. Deriving the interactable from both keeps the desk synchronized with existing progression behavior.

**Alternatives considered**: Hard-coding the desk into the tilemap was rejected because spec 108 introduced dynamic interactable registration for progression-driven office changes.

## Decision: Use The Existing Workspace Action

**Rationale**: The runtime workspace is already available through the project portal surface. Mapping the reception desk to that existing action avoids starting real external runtimes from this ADOS implementation runtime.

**Alternatives considered**: Adding a new runtime action was rejected because the current scope only needs a level-gated entry point to existing workspace/runtime controls.

## Decision: Render Desk Markers In The Existing Visual Layer

**Rationale**: Office interactable markers are already refreshed by `OfficeVisualLayer`, so extending it to render desk objects keeps marker lifecycle behavior in one place.

**Alternatives considered**: A separate reception layer was rejected because it would duplicate marker refresh and stale-marker removal behavior.
