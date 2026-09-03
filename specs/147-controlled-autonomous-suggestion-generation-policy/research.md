# Research: Controlled Autonomous Suggestion Generation Policy

## Decision: Implement Spec 147 as a project-backlog policy service plus coordinator

**Rationale**: Existing Spec 144, 145, and 146 automation controls live in `src/features/city-view/scene/office/project-backlog/` and are wired through the office portal. A sibling policy service keeps validation and deterministic eligibility close to existing planning state while a coordinator owns event idempotency and the single Spec 143 invocation.

**Alternatives considered**: A global scheduler was rejected because requirements prohibit polling and global fallback policies. Embedding the trigger directly in the UI render path was rejected because reloads/render cycles must not invoke generation.

## Decision: Persist policies and evaluation metadata in browser office session state

**Rationale**: Existing project-scoped autonomy policies persist through `BrowserOfficeSessionService`, and Spec 147 needs the same reload behavior for operator consent, cooldown, and last evaluation metadata.

**Alternatives considered**: In-memory metadata was rejected because cooldown must survive reload where persistence allows. New storage was rejected because it would duplicate existing office session persistence.

## Decision: Reuse `ProjectBacklogSuggestionService.generateSuggestions`

**Rationale**: Spec 143 already owns prompt context, validation, duplicate filtering, canonical ownership checks, provider abstraction, and suggestion persistence. Spec 147 is only a bounded trigger and must not create a second suggestion path.

**Alternatives considered**: A new provider call or prompt schema was rejected because it would bypass Spec 143 and create parallel planning semantics.

## Decision: Bound the initial automatic generation limit to one through five

**Rationale**: One is the safe default required by the feature. Five matches existing bounded automation policy conventions and prevents unbounded roadmap generation.

**Alternatives considered**: Unbounded or provider-chosen limits were rejected because eligibility and cost boundaries must be deterministic.
