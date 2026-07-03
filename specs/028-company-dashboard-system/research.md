# Research: Company Dashboard System

## Decisions

### Decision: Use a provider-neutral dashboard snapshot

**Rationale**: The dashboard must become the future company hub while the first vertical slice uses only internal simulation data. A provider-neutral snapshot lets the UI render company information without coupling to Employee AI, projects, conversations, or future external providers directly.

**Alternatives considered**:

- Directly read simulation services from UI components. Rejected because it would make future connectors require UI rewrites.
- Create dashboard-owned simulation state. Rejected because the feature must aggregate existing state without duplicating it.

### Decision: Implement only the Internal Simulation provider

**Rationale**: The feature requires connector-ready architecture but explicitly excludes external integrations. The Internal Simulation provider proves the provider boundary with existing game systems while keeping the vertical slice playable and small.

**Alternatives considered**:

- Stub future providers. Rejected because stubs can imply unsupported integrations and add maintenance noise.
- Build a generic connector registry with external provider placeholders. Rejected for MVP scope.

### Decision: Treat dashboard data as derived runtime read models

**Rationale**: The dashboard should observe the simulation rather than become a source of truth. Derived read models can be recomputed from Employee AI, schedule, project, progression, office layout, conversation, insight, and knowledge systems.

**Alternatives considered**:

- Persist dashboard summaries. Rejected because it duplicates simulation state and creates stale-data risk.
- Store presentation-only employee/project state. Rejected by project governance.

### Decision: Make the first slice read-only and non-managerial

**Rationale**: AIverse progresses from Observe to Understand to Influence. The Company Dashboard belongs to Observe and early Understand. Management controls should wait until a later feature.

**Alternatives considered**:

- Include quick assignment or project controls. Rejected because it skips the observation-first slice and introduces gameplay decisions outside this feature.

### Decision: Use deterministic internal summaries first

**Rationale**: The feature can include a short company summary without adding external AI calls. The Internal Simulation provider can derive a concise summary from existing company signals and leave richer AI-generated summaries to future provider or AI-service phases.

**Alternatives considered**:

- Add a new AI summarization integration. Rejected because external or new AI behavior is not required for the first dashboard slice.

## Open Questions Resolved by Scope

- **Should future connectors be implemented now?** No. Only the Internal Simulation provider belongs to this feature.
- **Should the dashboard control employees or projects?** No. It is read-only observation.
- **Should missing data be fabricated for better presentation?** No. Missing data uses empty or unavailable states.
- **Should the UI know which provider supplied the data?** Only for lightweight source labeling or diagnostics; rendering should depend on the provider-neutral contract.
