# Research: Physical Department Office Composition

## Decision: Model Departments as Layout Metadata

**Rationale**: The existing office layout service already owns floors, zones, slots, and future layouts. Department areas are spatial composition records tied to those same concepts, so placing them in layout snapshots avoids adding rendering or workflow responsibilities.

**Alternatives considered**: Adding department data to visual environment metadata was rejected because those details are non-interactive visual markers. Adding employee-routing behavior was rejected because this feature only establishes physical composition.

## Decision: Keep Active Level 1 Departments Empty

**Rationale**: Daily Proof's current garage office is still a shared startup space. Future department areas belong to the growing-company layout and should not alter the current office.
