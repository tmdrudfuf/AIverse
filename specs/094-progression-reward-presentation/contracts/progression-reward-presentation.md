# Contract: Progression Reward Presentation

## Reward Row Formatting

**Input**: Ordered copied world-state progression rewards.

**Output**: Ordered display rows for a compact city reward presentation.

**Rules**:

- Empty reward input returns no rows.
- More than three rewards returns the latest three rewards in original reward order.
- Each row id equals the source reward id.
- Each row title includes reached level and formatted company stage.
- Each row detail includes employee capacity, floor count, and unlocked-zone summary.
- Long detail text is truncated to the compact row budget.
- Formatting does not mutate source reward arrays.

## City Scene Presentation

**Input**: The `WorldStateSnapshot` returned by city world-state synchronization.

**Output**: Visible or hidden in-scene reward presentation.

**Rules**:

- Snapshot rewards with at least one item make the presentation visible.
- Missing or empty snapshot rewards hide the presentation and clear previous row text.
- Presentation updates run after synchronization and before the next frame can observe stale reward rows.
- Presentation is destroyed on scene shutdown with other scene controllers.
