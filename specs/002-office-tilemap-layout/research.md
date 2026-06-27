# Research: Office Tilemap Layout

## Decision: Use a Phaser tilemap for the office layout

**Rationale**: A tilemap provides visual layers, collision, object markers, and reserved future interaction anchors in one static asset format. This directly supports future furniture, NPC spawn points, interactive objects, and pathfinding.

**Alternatives considered**: Continue code-native graphics. Rejected because rectangular drawings do not provide a scalable collision/object-marker model.

## Decision: Keep gameplay systems separate from tilemap data

**Rationale**: The tilemap should define spatial layout only. Existing movement, input, camera, and transition controllers already own runtime behavior and should remain reusable.

**Alternatives considered**: Encode gameplay behavior directly in tilemap objects. Rejected because this would couple future simulation logic to map authoring.

## Decision: Use office-specific collision utilities for Phase 8

**Rationale**: City collision code is similar, but keeping an office-specific wrapper avoids broad refactoring while the office map shape and object-marker needs settle.

**Alternatives considered**: Immediately generalize city collision. Rejected because it expands the change surface without current need.
