# Data Model: Progression Event Feed Visible Panel Integration

## Visible Progression Feed Panel

**Purpose**: A fixed city HUD panel that displays latest progression feed event summaries.

**Fields**:

- `visible`: true when at least one display row exists
- `rows`: bounded list of feed panel rows

**Validation Rules**:

- Hidden when `rows` is empty.
- Displays no more than three rows.
- Does not mutate source world-state feed event records.

## Feed Panel Row

**Purpose**: Display-safe summary of one world-state progression feed event.

**Fields**:

- `id`: source event id
- `title`: level and stage summary
- `detail`: unlocked-zone and milestone summary

**Validation Rules**:

- Title includes reached level and company stage.
- Detail includes unlocked-zone summary and milestone-count summary.
- Long zone lists are summarized rather than rendered in full.

## World-State Feed Snapshot

**Purpose**: Existing copied event-feed list supplied by city world-state synchronization.

**Fields**:

- `eventFeed`: copied list of `WorldEventFeedState`

**Validation Rules**:

- Empty lists hide the panel.
- Non-empty lists render bounded rows in feed order.
