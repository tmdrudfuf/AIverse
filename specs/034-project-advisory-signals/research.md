# Research: Project Advisory Signals

## Decision: Reuse Existing ProjectManagementSuggestion State

**Rationale**: `ProjectPortalState.projectManagementSuggestions` already stores local AI project-manager suggestions with health, risks, next action, and timestamp. Reusing it exposes hidden simulation-derived guidance without adding new state or changing suggestion generation.

**Alternatives Considered**:

- Generate suggestions when Project Dashboard opens: rejected because the feature is read-only display and should not add async generation or mutate state.
- Derive advisory text from dashboard health/blocker fields: rejected because the spec asks to expose existing project-manager suggestions and avoid fabricated advisory data.

## Decision: Add Advisory to ProjectDashboardSnapshot

**Rationale**: The Project Dashboard UI already consumes provider-neutral snapshot data. Adding a small advisory read model keeps the UI independent from `AIProjectManagerService` and from any future external provider implementation.

**Alternatives Considered**:

- Let `ProjectDashboardView` read portal state directly: rejected because it would break the provider/view boundary.
- Add a generic advisory framework: rejected because this feature needs one focused vertical slice.

## Decision: Missing Suggestions Render as Empty State

**Rationale**: Current Project Dashboard flows do not guarantee prepared suggestions. Showing "waiting/unavailable" is honest, deterministic, and avoids inventing data.

**Alternatives Considered**:

- Hide the advisory area when missing: rejected because the spec requires a clear unavailable state.
- Fall back to GitHub/source metadata: rejected because advisory signals must be local project-manager data only.

## Decision: Compact Terminal Rows

**Rationale**: The office computer portal uses a compact CMD-inspired dashboard surface. Advisory rows should fit that style and avoid changing existing dashboard behavior beyond the added read-only signal.

**Alternatives Considered**:

- Add a large new panel: rejected as too much layout churn for one small PR.
- Add action buttons: rejected by non-goals and read-only requirements.
