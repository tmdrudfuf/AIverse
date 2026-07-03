# Contract: Project Dashboard Provider

## Purpose

Define the provider-neutral contract for deriving one read-only Project Dashboard snapshot from an existing project source.

## Current Provider

Only the Internal Simulation provider is in scope for this feature.

## Future Providers

Future providers such as GitHub may map their source data into the same snapshot contract, but no external provider is implemented in this feature.

## Contract

### Provider Identity

- A provider has a stable `id`.
- A provider has a player-facing `label`.
- Provider identity must not leak UI implementation details.

### Project List

A provider can expose selectable project summaries for dashboard navigation.

Each summary includes:

- project identity
- project name
- current status
- progress label or unknown progress state
- optional health label

### Project Snapshot

A provider can return one Project Dashboard snapshot for a selected project.

The snapshot includes:

- provider identity
- generation timestamp
- project identity
- project name
- project status
- progress summary
- project health summary
- active work summaries
- related employee context
- blocker/risk summaries
- recent activity
- advisory related focus or next suggested focus when derivable
- optional external source metadata
- section availability metadata where helpful

### Unavailable Project

If the requested project cannot be found, the provider returns an unavailable snapshot or equivalent safe state. The UI must be able to show this state and let the player return to the Company Dashboard.

## Invariants

- Provider operations are read-only in this feature.
- Provider operations do not assign tasks, edit tasks, complete work, mutate employee AI, mutate schedules, change company focus, or alter progression.
- Provider operations do not call GitHub, external APIs, AI providers, credentials, webhooks, or network connectors.
- Provider data is derived from authoritative source systems and not duplicated simulation state.
