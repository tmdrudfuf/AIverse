# Research: Project Company Office Interior Foundation

## Decision: Store interior foundation metadata on office definitions

**Rationale**: The office definition already owns scene identity, bounds, tilemap configuration, spawn, and exit geometry. Adding optional foundation zones there keeps layout intent close to the office configuration and avoids a separate global registry.

**Alternatives considered**: Hard-code zones inside `OfficeVisualLayer`; rejected because it would hide office-specific layout data inside rendering code. Add zones to the tilemap asset; rejected for this foundation because it would require asset editing while existing marker geometry is already available in code.

## Decision: Render zones as non-interactive Phaser primitives in the existing visual layer

**Rationale**: `OfficeVisualLayer` already renders office title, exit marker, and interactive object markers. Static interior foundation visuals fit this responsibility and can be destroyed with the same lifecycle.

**Alternatives considered**: Add a new scene controller; rejected because no independent state or input lifecycle is needed. Use React overlay DOM; rejected because zones must stay spatially anchored to world coordinates while the Phaser camera pans.

## Decision: Keep validation focused on metadata and visual lifecycle

**Rationale**: The user handoff explicitly defers full ADOS validation. Focused tests cover the new contract while ADOS runs the authoritative pipeline later.

**Alternatives considered**: Run the full configured validation pipeline; rejected by the handoff policy for this runtime.
