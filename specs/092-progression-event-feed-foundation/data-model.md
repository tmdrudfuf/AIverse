# Data Model: Spec 092 - Progression Event Feed Foundation

## Progression Feed Event

**Purpose**: World-state-visible event-feed record derived from a company progression reward.

**Fields**:

- `eventId`: stable id derived from the source reward id
- `eventType`: `company_progression_feed_event`
- `source`: `company_progression`
- `rewardId`: source reward id
- `effectId`: source world effect id
- `triggerId`: source progression trigger id
- `fromLevel`: previous company progression level
- `toLevel`: reached company progression level
- `companyStage`: stage reached by the new level
- `layoutId`: office layout associated with the reached level
- `floorCount`: office floor count granted at the reached level
- `maxEmployees`: employee capacity granted at the reached level
- `unlockedOfficeZones`: copied unlocked-zone identifiers
- `milestoneIds`: copied reached milestone identifiers

**Validation Rules**:

- One feed event is created per source reward.
- Feed event order matches source reward order.
- Returned feed events must be copied so callers cannot mutate source rewards or synchronizer state.

## World State Snapshot Feed Events

**Purpose**: Current progression feed events exposed through the city world-state snapshot.

**Fields**:

- `eventFeed`: copied list of progression feed events

**Validation Rules**:

- Missing event-feed input is treated as an empty list.
- Changed event-feed contents are semantic world-state changes.
- Status snapshots preserve copied previous feed events unless new feed events are supplied.

## Office Return Feed Events

**Purpose**: Office-to-city handoff for feed events generated during office exit.

**Fields**:

- `eventFeed`: optional copied list of progression feed events

**Validation Rules**:

- Empty feed event lists are omitted from the return payload.
- Non-empty feed event lists are copied into the return payload.
