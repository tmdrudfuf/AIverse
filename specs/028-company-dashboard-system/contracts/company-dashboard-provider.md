# Contract: Company Dashboard Provider

## Purpose

The Company Dashboard Provider contract defines how dashboard data sources supply normalized, provider-neutral company snapshots. The UI must consume this contract rather than any single provider implementation.

## Provider Interface

```ts
export interface CompanyDashboardProvider {
  readonly id: string;
  readonly label: string;
  getSnapshot(context: CompanyDashboardProviderContext): CompanyDashboardSnapshot;
}
```

## Snapshot Requirements

Every provider snapshot must:

- Identify the provider with `providerId`.
- Include a `generatedAt` timestamp.
- Return provider-neutral dashboard sections.
- Represent missing source data with empty or unavailable section states.
- Avoid storing or fabricating simulation state.
- Avoid exposing provider-specific objects directly to UI components.

## Internal Simulation Provider

The first feature slice implements only:

```ts
providerId: "internal-simulation"
label: "Internal Simulation"
```

The provider derives data from existing systems where available:

- Employee AI
- Schedule
- Projects
- Company Progression
- Office Layout
- Conversation
- Employee Insight
- Employee Knowledge
- Work sessions and activity logs

## Future Provider Rules

Future providers such as GitHub, Firebase, Notion, Jira, Linear, and Figma must:

- Implement the same provider contract.
- Normalize source data before it reaches the UI.
- Avoid changing dashboard UI components for provider-specific fields.
- Keep authentication, synchronization, caching, and write operations outside this feature unless a future Spec Kit feature explicitly requires them.

## Out of Scope

- External provider implementation.
- Connector authentication.
- Network synchronization.
- Management actions.
- Editing or write-back behavior.
