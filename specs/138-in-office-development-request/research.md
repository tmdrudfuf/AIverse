# Research: In-Office Development Request

## Decision: Active company context is authoritative for mutation targets

**Rationale**: Spec 137 introduced `activeProjectCompanyContext` to prevent stale portal browsing state from driving project-specific actions. Development execution is a mutation and must use that context when present.

**Alternatives considered**: Reusing `selectedProjectId` was rejected because read-only portal browsing may intentionally select a different project.

## Decision: Reuse existing external request/preparation/execution/status records

**Rationale**: These modules already persist project-scoped request and ADOS state through `BrowserOfficeSessionService` and feed portal/status rendering.

**Alternatives considered**: A new request pipeline was rejected because it would duplicate registry and run-status behavior.

## Decision: Request text becomes durable requirements content, not command syntax

**Rationale**: The raw request is untrusted input. Preserving it in request-bound requirements metadata avoids shell interpolation while keeping ADOS requirements complete.

**Alternatives considered**: Passing request text in CLI arguments was rejected due to injection risk and command length/quoting ambiguity.

## Decision: Deterministic feature identity uses sanitized request/project text plus timestamp

**Rationale**: The old hard-coded Spec 130 identity is incorrect for arbitrary projects. A deterministic per-request identity avoids collisions for repeated projects while remaining auditable.

**Alternatives considered**: Guessing a global next spec number was rejected because browser-side code cannot safely inspect arbitrary target repositories.
