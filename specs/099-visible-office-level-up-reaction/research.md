# Research: Visible Office Level-Up Reaction

## Decision: Use Existing Company Progression Triggers

**Rationale**: `CompanyProgressionTrigger` already contains reached level, stage, layout, capacity, floors, unlocked zones, and milestones. The office reaction can consume copied triggers exposed by the portal controller without creating a parallel progression source.

**Alternatives considered**: Recompute level-up changes in the scene was rejected because it would duplicate trigger logic. Reading city reward records was rejected because this reaction happens inside the office before city handoff.

## Decision: Add A Separate Office Reaction Layer

**Rationale**: The existing office progression visual-state layer is static current-state HUD. A separate layer keeps transient level-up reaction concerns independent while preserving the existing summary and zone marker behavior.

**Alternatives considered**: Expanding the existing visual-state layer was rejected because it would mix current-state display with event reaction display. A React overlay was rejected because existing office HUD elements are Phaser scene objects.

## Decision: Show The Newest Current Trigger

**Rationale**: Trigger arrays are already ordered by reached level. When multiple triggers exist, showing the newest reached level gives the player the most advanced outcome in the compact reaction area.

**Alternatives considered**: Rendering one row per trigger was rejected because it risks crowding the office scene. Cycling or timed queues were deferred because timing and dismissal are follow-up scope.
