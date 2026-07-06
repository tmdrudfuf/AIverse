# Contract: Repository Fixture Playground

## Purpose

Define the expected behavior for local repository fixtures that feed existing dashboard source paths.

## Fixture Provider Contract

The local fixture provider must expose repository summaries through the existing `GitHubRepositoryProvider` interface:

```text
getRepositorySummary(projectId) -> GitHubRepositorySummary
```

### Requirements

- Return a cloned summary so callers cannot mutate the fixture dataset.
- Return deterministic fake repository data for configured fixture projects.
- Return an explicit unavailable summary for unknown projects.
- Never call external APIs or browser/network primitives.
- Never read credentials, auth state, environment secrets, or persisted repository data.

## Dashboard Consumption Contract

Company Dashboard and Project Dashboard consumers must continue to use existing provider-neutral inputs:

- `repositoryMappings`
- `repositorySummaries`
- `sourceStatus`
- `checkStatus`
- `latestCommit`
- issue and pull request summary counts

### Requirements

- Company Dashboard source signals show fixture source status without hiding internal project data.
- Project Dashboard source rows show repository, branch, issues, pull requests, recent commit, checks, and latest activity when fixture data exists.
- Missing fixture data uses existing unavailable source states.
- Advisory rows must remain sourced only from local project-manager suggestions.

## Read-Only Boundary

Fixture-backed dashboard rendering must not mutate:

- projects
- tasks
- employees
- work sessions
- company influence state
- repository mappings
- fixture source records
- advisory suggestions

Existing in-memory repository summary loading may occur through the current controller path, but it must be deterministic and local.
