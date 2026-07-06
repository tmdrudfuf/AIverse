# Contract: GitHub Public Read Provider

## Purpose

Define exactly what `GitHubPublicRepositoryProvider` may do, matching the spec 036 preflight boundary and `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`.

## Provider Interface

```text
new GitHubPublicRepositoryProvider(resolveRepositoryReference, fetchImpl?)
getRepositorySummary(projectId) -> Promise<GitHubRepositorySummary>
```

Same signature as `MockGitHubRepositoryProvider`; fully interchangeable at the `GitHubRepositoryProvider` interface level.

## Allowed Network Calls (unauthenticated `GET` only)

1. `GET https://api.github.com/repos/{owner}/{name}`
2. `GET https://api.github.com/repos/{owner}/{name}/commits?sha={defaultBranch}&per_page=1`
3. `GET https://api.github.com/repos/{owner}/{name}/pulls?state=open&per_page=100`

No other endpoints, methods, or headers (no `Authorization`, no tokens) are permitted.

## Field Mapping

| GitHub response | Summary field |
| --- | --- |
| `owner`/`name` (input reference, echoed from response when present) | `owner`, `name` |
| `default_branch` | `defaultBranch` |
| Commit `sha`/`commit.message`/`commit.author.name`/`commit.author.date` | `latestCommit` |
| `open_issues_count` minus open PR count | `openIssueCount` |
| Length of open pulls response (capped at 100) | `openPullRequestCount` |
| Not read in this slice | `checkStatus` (left `undefined`; existing fallback renders "Checks unavailable") |
| Derived from success/failure path | `sourceStatus` |
| `pushed_at` (fallback `updated_at`) | `lastUpdatedAt` |
| Derived from success/failure path | `connectionStatus` |
| Display-safe generic string only | `errorMessage` |

## Error Mapping

| Condition | `sourceStatus.state` | `connectionStatus` |
| --- | --- | --- |
| Success | `fresh` | `connected` |
| HTTP 403 with `x-ratelimit-remaining: 0`, or HTTP 429 | `rate_limited` | `error` |
| `fetch` rejects (network/DNS failure) | `offline` | `error` |
| HTTP 404 or other non-2xx | `unavailable` | `error` |
| Malformed/unexpected JSON body | `unavailable` | `error` |
| No repository reference resolvable for `projectId` | n/a (mirrors mock's unmapped-project shape) | `not_connected` |

Every `errorMessage` is a fixed, generic, display-safe string. None interpolate the request URL, response body, or header values.

## Hard Prohibitions

- No credentials, tokens, OAuth, or `Authorization` headers.
- No `POST`/`PATCH`/`PUT`/`DELETE` requests.
- No sync, polling, background refresh, retries, or persistence.
- No wiring into `OfficeProjectPortalController` as the active provider in this feature.
- No mutation of project, task, employee, company focus, repository mapping, repository summary, or advisory state.
- No new `GitHubRepositorySummary` fields beyond `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`.
