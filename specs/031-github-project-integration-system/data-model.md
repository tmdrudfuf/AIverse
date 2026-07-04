# Data Model: GitHub Project Integration System

## Overview

The GitHub Project Integration System adds read-only external source models that map into the existing Project Dashboard provider-neutral contract. Internal simulation remains authoritative for AIverse employee, project, task, schedule, progression, insight, knowledge, and work-session state.

## Entities

### AIverseProjectRepositoryMapping

Associates one AIverse project with one GitHub repository reference.

**Fields**:

- `projectId`: AIverse project identity.
- `sourceId`: Stable source identity for the mapping.
- `repository`: GitHub repository reference.
- `enabled`: Whether the mapping is active.
- `createdAt`: Mapping creation timestamp when available.
- `updatedAt`: Mapping update timestamp when available.

**Validation rules**:

- Must not duplicate AIverse project state.
- Must not imply repository mutation permission.
- Must be safe when disabled or invalid.

### GitHubRepositoryReference

Identifies a GitHub repository without storing repository data as simulation state.

**Fields**:

- `owner`: Repository owner.
- `name`: Repository name.
- `url`: Repository URL metadata.
- `visibility`: `public`, `private`, or `unknown`.
- `defaultBranchHint`: Optional known default branch.

**Validation rules**:

- Owner/name must be display-safe.
- Private repositories require approved auth/credential strategy before implementation.

### GitHubRepositorySnapshot

Read-only repository data captured at one refresh point.

**Fields**:

- `repositoryId`: Provider source identity.
- `owner`
- `name`
- `url`
- `defaultBranch`
- `currentBranchMetadata`: Optional read-only branch metadata.
- `openIssueSummary`
- `openPullRequestSummary`
- `recentCommitSummary`
- `checkStatusSummary`
- `latestActivityAt`
- `fetchedAt`
- `sourceStatus`

**Validation rules**:

- Must not contain credentials or secrets.
- Must distinguish missing, empty, stale, unauthorized, and rate-limited data.
- Must not mutate internal simulation state.

### GitHubIssueSummary

Read-only aggregate issue context.

**Fields**:

- `openCount`
- `staleCount`: Optional.
- `labels`: Optional top labels.
- `latestIssueUpdatedAt`: Optional.

### GitHubPullRequestSummary

Read-only aggregate pull request context.

**Fields**:

- `openCount`
- `draftCount`: Optional.
- `reviewRequestedCount`: Optional.
- `latestPullRequestUpdatedAt`: Optional.

### GitHubCommitSummary

Read-only recent commit context.

**Fields**:

- `sha`
- `message`
- `authorName`
- `committedAt`
- `branchName`

### GitHubCheckStatusSummary

Read-only build/check context.

**Fields**:

- `state`: `passing`, `failing`, `pending`, `unavailable`, or `unknown`.
- `label`
- `checkedAt`: Optional.
- `source`: Optional check suite or status source label.

### ExternalSourceStatus

Describes whether GitHub source data can be trusted.

**Fields**:

- `state`: `fresh`, `stale`, `unavailable`, `unauthenticated`, `rate_limited`, `offline`, or `unknown`.
- `label`
- `reason`: Optional display-safe reason.
- `lastSuccessfulFetchAt`: Optional.
- `nextRefreshAllowedAt`: Optional.

### GitHubProjectDashboardProviderContext

Read-only context passed into the GitHub provider/adapter.

**Sources**:

- AIverse project repository mappings.
- Approved GitHub access strategy.
- Existing Project Dashboard provider context.

**Validation rules**:

- Must not expose UI-only duplicated project state.
- Must keep credentials out of snapshot/view models unless a future security design explicitly permits secure handling.

## Relationships

- `AIverseProjectRepositoryMapping` links an AIverse project to `GitHubRepositoryReference`.
- `GitHubProjectDashboardProvider` reads the mapping and derives `GitHubRepositorySnapshot`.
- `GitHubRepositorySnapshot` maps into provider-neutral Project Dashboard source metadata and detail sections.
- Internal Simulation provider remains valid and separate.

## Source-of-Truth Boundaries

- Internal simulation owns AIverse project, task, employee, schedule, progression, insight, knowledge, and work-session state.
- GitHub owns repository metadata, commits, issues, pull requests, checks, and source freshness.
- Mapping data owns only the relationship between an AIverse project and a GitHub repository reference.

## State Transitions

1. Project has no repository mapping: Project Dashboard remains internal-only.
2. Mapping is added: Project Dashboard can request read-only GitHub source data.
3. Source data is fresh: Repository summary appears in provider-neutral project detail fields.
4. Source data is stale/unavailable: Dashboard shows explicit status while internal simulation remains visible.
5. Mapping is disabled or invalid: GitHub source sections are empty/unavailable and no simulation state changes.
