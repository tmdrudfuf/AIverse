# Research: Office Interactive Objects

## Decision: Capture Space once at the office scene level

**Rationale**: Exit already uses Space. A shared office action input prevents two independent global key listeners and allows CompanyOfficeScene to dispatch by priority.

**Alternatives considered**: Let OfficeExitController and OfficeInteractionController each listen for Space. Rejected because queued input and priority would become ambiguous.

## Decision: Use Interaction Layer for real interactables

**Rationale**: Object Layer already contains structural markers for spawn, exit, and reserved zones. Interaction Layer should become the source for gameplay-affordance markers.

**Alternatives considered**: Convert every reserved Object Layer zone into an interactable. Rejected because it would prematurely implement desks and future objects.

## Decision: Placeholder action result only

**Rationale**: Phase 9 needs interaction plumbing, not dashboards, integrations, NPC assignment, or simulation.

**Alternatives considered**: Open UI panels or connect external services. Rejected as out of scope and higher risk.
