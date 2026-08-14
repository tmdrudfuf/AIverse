# Research: Progression Event Feed Visible Panel Integration

## Decision: Render the feed as a Phaser HUD panel

**Rationale**: The source feed currently lives in city scene world-state snapshots, and existing city prompts are Phaser display objects with fixed scroll factor and high depth. A Phaser HUD keeps the first visible integration local to the scene and avoids adding a React bridge before the feed needs page-level state.

**Alternatives considered**: A React overlay would be useful for richer UI later, but it would require an additional scene-to-React state channel for a compact read-only panel.

## Decision: Hide the panel when the feed is empty

**Rationale**: The city should not show placeholder feed UI until progression events exist. This keeps the feature visibly additive only after office progression activity.

**Alternatives considered**: Always showing an empty panel. That would add screen clutter without user value.

## Decision: Bound visible rows to three

**Rationale**: The panel is a HUD element over a navigation scene. Limiting visible rows protects navigation and existing prompts while still confirming recent progression.

**Alternatives considered**: Showing the full feed list. That risks covering city content when several levels are granted at once.
