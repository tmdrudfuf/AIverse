# Data Model: GitHub Read Integration Preflight

## Overview

This feature defines the future public read-only GitHub boundary at the existing repository summary level. It does not introduce a real provider, network calls, credentials, persistence, or new dashboard state.

## Entities

### Public Repository Read Boundary

Approved first-slice public repository fields.

**Fields**:

- repository owner
- repository name
- repository URL when already mapped
- default branch
- latest commit summary
- open issue count
- open pull request count
- check/build status summary
- source freshness/status
- latest activity timestamp

**Validation rules**:

- Must be summary-level.
- Must not include credentials, tokens, raw API payloads, issue bodies, PR bodies, comments, reviews, workflow logs, repository settings, or mutation permissions.

### Repository Summary Mapping

Mapping from public repository read data into `GitHubRepositorySummary`.

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

- Must be compatible with fixture provider summaries.
- Must be accepted by existing Company Dashboard and Project Dashboard providers.
- Must keep raw provider responses out of dashboard read models.

### Source Availability State

Display-safe repository availability state.

**States**:

- fresh
- stale
- unavailable
- unauthenticated
- rate_limited
- offline
- unknown

**Validation rules**:

- Must include safe labels and reasons.
- Must not trigger auth prompts, retries, sync, or mutation.
- Must preserve internal dashboard data when source data is missing.

### Provider Contract Guard

Test/documentation boundary that keeps future real and fixture providers interchangeable.

**Validation rules**:

- Provider exposes `getRepositorySummary(projectId)`.
- Provider returns a `GitHubRepositorySummary`.
- Provider consumers stay provider-neutral.
- Preflight tests must not add `fetch` or real network behavior.

## Relationships

- Repository mappings identify which AIverse project is associated with a repository.
- Providers return repository summaries.
- Company Dashboard derives compact project source signals from repository mappings and summaries.
- Project Dashboard derives source rows, health, and recent source activity from repository summaries.
- Project Advisory Signals remain separate from repository summaries.

## State Transitions

1. Valid mapping plus summary: dashboards show provider-neutral source context.
2. Missing summary: dashboards show unavailable source status.
3. Private mapping: dashboards show unauthenticated status without credential prompts.
4. Provider error: service returns display-safe unavailable source data.
5. Rate-limited/offline/stale state: dashboards show status without retrying or syncing.

## Out of Scope State

- No tokens.
- No auth session.
- No repository sync state.
- No persisted repository snapshot.
- No issue/PR detail state.
- No mutation permissions.
