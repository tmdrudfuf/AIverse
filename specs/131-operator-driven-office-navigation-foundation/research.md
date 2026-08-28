# Research: Operator-Driven Office Navigation Foundation

## Decision: Extend existing scene navigation intent for pointer panning

**Rationale**: Keyboard movement, wheel zoom, camera target focus, and scene bounds already flow through `NavigationInputController` and `CameraController`. Adding pointer pan intent there preserves one navigation path for city and office scenes.

**Alternatives considered**:
- Add separate scene-specific drag handlers: rejected because it would duplicate camera bounds and focus behavior.
- Move Founder directly from pointer input: rejected because the feature is operator camera navigation, not pathfinding or avatar movement.

## Decision: Treat click entry as queued interaction controller state

**Rationale**: Existing building and office object interaction controllers already validate active objects and consume interactions once per update. Queueing direct clicks there keeps click handling consistent with keyboard/proximity consumption.

**Alternatives considered**:
- Start scene transitions directly from pointer event callbacks: rejected because transitions should stay in scene update flow with existing guards.
- Reuse proximity-only active object state for direct clicks: rejected because direct clicks must work without moving the Founder into a zone.

## Decision: Suppress pointer navigation and office clicks while the portal overlay is open

**Rationale**: The project portal is a blocking overlay. Pointer events behind it should not queue camera movement or stale object interactions that execute after the overlay closes.

**Alternatives considered**:
- Let overlay state ignore only click results: rejected because stale drag deltas could still move the camera.
- Destroy and recreate controllers around overlays: rejected because enable/disable flags are smaller and preserve existing controller lifecycle.
