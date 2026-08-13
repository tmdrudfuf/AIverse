# Research: Spec 092 - Progression Event Feed Foundation

## Decision: Use rewards as the feed-event source

**Rationale**: Rewards are already the stable record of granted progression benefits. Building feed entries from rewards prevents future feed consumers from duplicating effect interpretation and keeps one ordered handoff path from triggers to effects to rewards to feed events.

**Alternatives considered**: Build feed events directly from triggers or world effects. Both would bypass reward records and make reward/feed copy behavior easier to diverge.

## Decision: Store feed events in world-state snapshots

**Rationale**: Existing progression effects and rewards are already exposed through `WorldStateSnapshot`. Feed events should follow that boundary so future city notifications or timelines can read one copied snapshot instead of reaching into office controllers.

**Alternatives considered**: Store feed entries only on the office return payload. That would prove handoff but leave no stable city-side observation point.

## Decision: Keep scope in-memory and UI-free

**Rationale**: This foundation prepares event data without changing visible game behavior. Persistence, rendering, history retention, and notification timing can be specified separately once the feed event contract exists.

**Alternatives considered**: Add a visible feed panel now. That would expand product scope beyond the foundation and require UX decisions not present in this handoff.
