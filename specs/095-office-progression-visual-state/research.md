# Research: Office Progression Visual State

## Decision: Use Existing Progression And Layout Snapshots

**Rationale**: `OfficeProjectPortalController` already exposes copied company progression and active layout snapshots. Reading those values avoids adding persistence or new cross-scene state and keeps the visual layer aligned with dashboard progression behavior.

**Alternatives considered**: Reading city world-state rewards was rejected because this feature is office-local and should reflect current office state before the player exits. Adding a new progression store was rejected as unnecessary persistence scope.

## Decision: Phaser Scene Objects, Not React Overlay Or Tilemap Art

**Rationale**: Office rendering already uses Phaser text/graphics objects for titles, prompts, markers, NPCs, and overlays. A small scene layer keeps the implementation consistent and avoids new asset dependencies.

**Alternatives considered**: React overlay was rejected because the office scene is already rendered in Phaser. New tilemap art was rejected because current logical layout data is sufficient for compact markers.

## Decision: Bound Zone Markers To Six

**Rationale**: Later levels can expose many zones. A hard cap protects movement, interaction prompts, NPCs, and portal surfaces from visual clutter while still making progression visible.

**Alternatives considered**: Showing every zone was rejected due to overlap risk. Dismissible or scrollable marker UI was rejected as follow-up scope.
