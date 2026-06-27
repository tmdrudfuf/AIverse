# Data Model: Office Tilemap Layout

## OfficeDefinition

Represents one office scene entry.

Fields:

- `sceneKey`: Phaser scene key for the office.
- `buildingId`: City building that routes to this office.
- `companyName`: Display title.
- `worldBounds`: Office camera and scene bounds.
- `walkableBounds`: Fallback Phase 7 walkable area retained for config compatibility.
- `founderSpawn`: Fallback spawn point.
- `exitZone`: Fallback return zone.
- `tilemap`: Static tilemap asset and layer configuration.

Validation:

- World bounds must remain 960 by 600 for Daily Proof.
- Tilemap dimensions must match world bounds.
- Required layers must exist.

## OfficeLayoutMarkers

Resolved semantic anchors from the tilemap object layer.

Fields:

- `founderSpawn`: Marker point for the founder spawn.
- `exitZone`: Marker rectangle for returning to city.
- `receptionZone`: Reserved future zone.
- `futureDeskZone01`: Reserved future zone.
- `futureDeskZone02`: Reserved future zone.
- `futureComputerZone01`: Reserved future zone.

Validation:

- Missing founder spawn or exit zone may use configured fallback.
- Spawn and exit center must not be blocked by collision.

## OfficeCollisionMap

Runtime query surface for office walkability.

Fields:

- `maxStepSize`: Maximum movement substep size derived from tile dimensions.
- `collisionLayer`: The tile layer where present tiles block movement.

Validation:

- Empty collision tile is walkable.
- Present collision tile is blocked.
- Outside map is blocked.
