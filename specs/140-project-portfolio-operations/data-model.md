# Data Model: Project Portfolio Operations

## PortfolioOperationsSummary

- `buildingId`: city building id.
- `projectId`: canonical project id when a binding can resolve.
- `projectName`: registered project display name or building fallback for disconnected cases.
- `companyName`: company/building identity shown in the city.
- `bindingStatus`: `bound` or `unavailable`.
- `workflowStage`: detailed project-scoped stage derived from existing live work state.
- `attentionState`: `active`, `idle`, `needs-attention`, `blocked`, `recently-completed`, or `disconnected`.
- `attentionLabel`: compact operator-facing label.
- `tone`: visual tone for city rendering.
- `activeOrResumableRunId`: run/execution/draft id when known.
- `developmentRequest`: absent or a safe short status/title/summary indicator.
- `blockedReasonSummary`: concise normalized blocker reason when available.
- `recentCompletedSummary`: persisted completed run summary when available.
- `operatorActionAvailable`: false for unavailable/disconnected bindings, true when the project can be entered/operated by explicit user action.

## PortfolioFilter

- Values: `all`, `active`, `attention`, `idle`, `completed`, `disconnected`.
- Behavior: pure predicate over `PortfolioOperationsSummary`.
- Mutation rule: applying a filter never changes project registry, request, run, blocker, or office state.

## State Relationships

- Each summary is generated independently for one building and one canonical project id.
- Project identity comes from ProjectRegistryService and ProjectCompanyBindingService.
- Request awareness comes from project-scoped external development request drafts.
- Run and blocked/completed state comes from project-scoped ADOS status/runtime/result collections.
- Office re-entry continues through existing building entry request metadata.
