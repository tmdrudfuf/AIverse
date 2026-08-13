# Contract: Progression Event Feed Foundation

## Feed Event Creation

**Input**: Ordered company progression rewards.

**Output**: Ordered copied progression feed events.

**Rules**:

- Each reward produces exactly one feed event.
- `eventId` is derived from the source reward id as `<rewardId>:feed-event`.
- Feed event context mirrors the source reward context.
- Array fields are copied.

## World-State Synchronization

**Input**: Existing synchronization input plus optional `eventFeed`.

**Output**: Copied world-state snapshot with an `eventFeed` list.

**Rules**:

- Missing `eventFeed` means `[]`.
- Supplied feed events are copied before storage.
- Returned snapshots are copied.
- Semantic equality includes `eventFeed`.

## Office-to-City Return Payload

**Input**: Existing office exit payload data plus optional progression feed events.

**Output**: City return payload with optional copied `eventFeed`.

**Rules**:

- Empty event-feed lists are omitted.
- Non-empty event-feed lists are copied.
- City synchronization consumes return payload feed events without adding UI.
