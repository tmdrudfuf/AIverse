# Research: GitHub Public Read Provider

## Unauthenticated GitHub REST API rate limits

Unauthenticated requests to `api.github.com` are limited to ~60 requests/hour per client IP, tracked via `X-RateLimit-Remaining` and `X-RateLimit-Reset` response headers. Exceeding the limit returns HTTP 403 (occasionally 429 for secondary/abuse limits) with a `X-RateLimit-Remaining: 0` header. Decision: detect this signal and map to `rate_limited`; never retry automatically.

## Open issue vs. open pull request counts

GitHub's `GET /repos/{owner}/{name}` response field `open_issues_count` includes open pull requests, because PRs are implemented as a superset of issues internally. There is no separate "issues only" count on this endpoint. Decision: fetch open pull requests separately (`GET /repos/{owner}/{name}/pulls?state=open`) and derive `openIssueCount = open_issues_count - openPullRequestCount`, clamped at zero. This avoids an additional Search API call, which has its own (stricter, unauthenticated) rate limit.

## Distinguishing private vs. missing repositories

Unauthenticated requests receive HTTP 404 for both nonexistent repositories and private repositories the requester cannot see — there is no reliable way to distinguish the two without authentication. Decision: this feature does not attempt to guess; `validateAIverseProjectRepositoryMapping` already resolves private repositories to `unauthenticated` upstream, before this provider is ever invoked, using AIverse's own mapping metadata (`repository.visibility`). A 404 from this provider therefore always maps to `unavailable`, not `unauthenticated`.

## Check/build status

Reading commit check runs requires a separate `GET /repos/{owner}/{name}/commits/{sha}/check-runs` call (after first resolving the latest commit sha), doubling the network surface for a single field. Decision: defer check-run reads to a future feature; leave `checkStatus` unset in this slice. The existing `createGitHubRepositorySnapshot` mapping already falls back to a "Checks unavailable" display state when `checkStatus` is undefined, so this degrades gracefully with no code changes required elsewhere.

## Pull request count pagination

Fetching `per_page=100` and using the response array length approximates the open PR count without parsing `Link` response headers for full pagination. This undercounts repositories with more than 100 open PRs. Decision: accept this as a documented limitation for the first minimal slice; full pagination is deferred.
