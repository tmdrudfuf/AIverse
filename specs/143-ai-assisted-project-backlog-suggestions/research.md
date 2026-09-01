# Research: AI-Assisted Project Backlog Suggestions

## Decision: Use A Provider-Neutral Suggestion Service

**Rationale**: A `ProjectBacklogSuggestionProvider` interface lets tests use deterministic fixtures and keeps business logic independent from Codex, Claude, or any single model vendor.

**Alternatives considered**: Hardcoding one AI runtime was rejected because requirements prohibit vendor-specific project logic.

## Decision: Persist Candidates In Browser Office Session State

**Rationale**: Existing project backlog and execution state already survive reload through `BrowserOfficeSessionService`. Extending that snapshot keeps suggestions project-scoped without a second store.

**Alternatives considered**: A standalone localStorage key was rejected as a parallel persistence path.

## Decision: Duplicate Filtering Uses Same-Project Normalized Title/Description Keys

**Rationale**: Deterministic normalization is testable, avoids obvious duplicates, and never needs cross-project comparison.

**Alternatives considered**: AI-based duplicate judgment was rejected because it is less deterministic and could leak prompt context.

## Decision: Acceptance Delegates To ProjectBacklogService

**Rationale**: Spec 141 backlog creation rules, default status, canonical binding checks, and ordering already live there.

**Alternatives considered**: Creating backlog task objects inside the suggestion service was rejected because it risks a second backlog system.
