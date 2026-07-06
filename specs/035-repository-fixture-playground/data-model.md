# Data Model: Repository Fixture Playground

## Overview

The Repository Fixture Playground uses deterministic local GitHub-like summaries to exercise existing Company Dashboard and Project Dashboard source paths. Internal simulation remains authoritative for projects, tasks, employees, schedules, progression, work sessions, influence, insight, knowledge, and advisory suggestions.

## Entities

### Repository Fixture Dataset

Local deterministic collection of fake repository summaries.

**Fields**:

- `projectId`: AIverse project id used for lookup.
- `summary`: Fixture repository summary.

**Validation rules**:

- Must be local and deterministic.
- Must not contain credentials, secrets, tokens, real user data, or live API response data.
- Must not mutate source mappings, projects, tasks, employees, or advisory suggestions.

### Fixture Repository Summary

Summary-level GitHub-like source data compatible with the existing repository summary contract.

**Fields**:

- `owner`
- `name`
- `defaultBranch`
- `latestCommit`
- `openIssueCount`
- `openPullRequestCount`
- `checkStatus`
- `sourceStatus`
- `lastUpdatedAt`
- `connectionStatus`
- `errorMessage`

**Validation rules**:

- Owner and repository name must be display-safe.
- Timestamps must be fixed fixture values.
- Missing or unavailable data must be explicit.
- Issue and pull request data stays summary-level for this slice.

### Fixture Source Scenario

Readable source state represented through one fixture summary.

**Examples**:

- Fresh connected repository with passing checks and recent activity.
- Stale repository with open issues or pull requests.
- Connected repository with failing checks.
- Unavailable repository summary for unknown projects.

**Validation rules**:

- Scenarios must be addressable in tests without user-facing selector UI.
- Scenarios must use existing `sourceStatus` and `checkStatus` concepts.

### Dashboard Source Signal

Existing provider-neutral Company Dashboard and Project Dashboard source metadata derived from repository mappings and summaries.

**Validation rules**:

- Must remain read-only.
- Must consume summaries through existing dashboard/provider paths.
- Must not import real GitHub API, auth, credentials, or sync behavior.

## Relationships

- `Repository Fixture Dataset` is read by the existing mock repository provider.
- `AIverseProjectRepositoryMapping` decides whether a project may display fixture data as a linked repository source.
- `GitHubRepositorySummary` maps into Company Dashboard source signals and Project Dashboard source metadata.
- Project Advisory Signals remain separate and are not generated from fixture data.

## State Transitions

1. Project has valid mapping and fixture summary: dashboards show fixture-backed source context.
2. Project has valid mapping and no fixture summary: dashboards show unavailable source data.
3. Project has invalid, disabled, or private mapping: existing unavailable/unauthenticated status remains.
4. Fixture has stale/failing source context: dashboards show status as read-only context only.

## Out of Scope State

- No persisted repository records.
- No live sync state.
- No credentials or auth sessions.
- No repository mutation state.
- No player-facing fixture selection state.
