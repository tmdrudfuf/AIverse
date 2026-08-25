# Research: External Project Development Request Draft

## Decision: Use Local-Only Workflow Draft State

**Rationale**: Existing Project Dashboard workflow slices store draft/intermediate workflow records directly on `ProjectPortalState` in keyed records. A development request draft is not project registry identity and should not mutate registry entries or repository mappings.

**Alternatives considered**: Add the request to project registry metadata. Rejected because it would mix workflow intent with repository identity and project listing data.

## Decision: Require Configured Repository Identity Before Request Draft Creation

**Rationale**: The request draft needs a target repository context. If identity remains unknown, the existing repository identity edit overlay is the correct next action.

**Alternatives considered**: Create a request draft with unknown repository context. Rejected because it creates an incomplete request immediately after a feature specifically added repository identity configuration.

## Decision: Reuse Browser Office Session Persistence

**Rationale**: Specs 125 and 126 already persist external project and repository identity state through `BrowserOfficeSessionService`. The request draft should follow the same continuity path.

**Alternatives considered**: Add separate storage. Rejected because separate persistence would make restore behavior harder to reason about and validate.
