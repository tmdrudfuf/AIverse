# Research: Multi-Project Company Operations

## Decision: Reuse Existing Project Registry and Binding Services

**Rationale**: Spec 137 already established canonical project identity and company binding. City status derivation can resolve every building through ProjectCompanyBindingService and fail closed for missing projects.

**Alternatives considered**: A second city-only registry was rejected because it would split canonical identity and violate Spec 139.

## Decision: Use Persisted Project-Scoped ADOS Statuses for City Projection

**Rationale**: BrowserOfficeSessionService already persists external ADOS run statuses by project id. The city can derive concise statuses from those records without global latest-run lookup.

**Alternatives considered**: Scanning all run records and choosing the newest globally was rejected because it contaminates unrelated projects.

## Decision: Render Secondary Building-Attached Badges

**Rationale**: The requirement asks to preserve the game-like city view. A small status badge and treatment attached to each building provides readable state without turning the city into a dashboard.

**Alternatives considered**: A full city dashboard was rejected as a product non-goal.
