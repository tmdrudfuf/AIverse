# Contract: Visible Progression Feed Panel

## Feed Row Formatting

**Input**: Ordered `WorldEventFeedState[]`.

**Output**: Ordered bounded display rows.

**Rules**:

- No more than the latest three rows are returned, preserving feed order within that bounded set.
- Each row includes the source event id.
- Each row title includes the reached company level and stage.
- Each row detail includes unlocked-zone and milestone summaries.
- Empty input returns an empty row list.
- Source feed event arrays are never mutated.

## City Scene Rendering

**Input**: `WorldStateSnapshot` returned from city synchronization.

**Output**: A visible or hidden Phaser HUD panel.

**Rules**:

- Snapshots with feed events show the panel.
- Snapshots without feed events hide the panel and clear previous text.
- The panel uses fixed screen positioning and does not scroll with the world camera.
