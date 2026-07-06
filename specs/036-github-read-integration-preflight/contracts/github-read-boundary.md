# Contract: GitHub Read Integration Preflight

## Purpose

Define the exact contract a future public read-only GitHub provider must satisfy before real network behavior is implemented.

## Provider Boundary

The future provider must remain interchangeable with the fixture provider:

```text
getRepositorySummary(projectId) -> Promise<GitHubRepositorySummary>
```

The provider may only return summary-level fields approved by this preflight:

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

## Data Mapping

Future public repository reads must map into existing summary fields:

| Public source concept | Summary field |
| --- | --- |
| Repository owner | `owner` |
| Repository name | `name` |
| Default branch | `defaultBranch` |
| Most recent commit SHA/message/author/time | `latestCommit` |
| Open issue count | `openIssueCount` |
| Open pull request count | `openPullRequestCount` |
| Check/build status | `checkStatus` |
| Fresh/stale/unavailable/rate-limited/offline/private status | `sourceStatus` |
| Latest known source activity | `lastUpdatedAt` |
| Provider load status | `connectionStatus` |
| Display-safe failure reason | `errorMessage` |

## Error and Availability Mapping

- Missing/unmapped repository -> unavailable.
- Disabled/invalid mapping -> unavailable.
- Private or auth-required repository -> unauthenticated.
- Rate limit -> rate_limited with display-safe reason.
- Offline/network unavailable -> offline with display-safe reason.
- Malformed or unexpected response -> unavailable with display-safe reason.
- No latest commit -> recent commit unavailable.
- Missing default branch -> unknown branch.
- No issues or pull requests -> zero counts.

## Hard Prohibitions

This preflight feature and the future first real-read provider boundary must not include:

- real GitHub API calls in this feature
- `fetch` in this feature
- credentials, tokens, OAuth, auth UI, or private repository access
- sync, polling, webhooks, background jobs, or persistence
- repository mutation
- issue/PR creation or editing
- branch creation, commits, merges, check reruns, or repository settings
- task/project/employee/advisory mutation
- dashboard redesign or repository URL entry UI

## Dashboard Contract

Company Dashboard and Project Dashboard must continue consuming provider-neutral summaries. They must not import raw provider response shapes or real GitHub API response types.
