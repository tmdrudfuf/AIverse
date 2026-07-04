# Contract: GitHub Project Provider

## Purpose

Define the read-only provider boundary that maps GitHub repository data into the provider-neutral Project Dashboard structure.

## Scope

The first implementation is read-only and must not mutate repositories.

## Provider Responsibilities

- Accept an AIverse project id and repository mapping.
- Read repository metadata according to the approved auth/refresh model.
- Produce provider-neutral Project Dashboard source metadata and project detail fields.
- Report source status, freshness, stale data, unauthorized access, rate limits, and offline failures.
- Keep GitHub API response shapes behind the provider/adapter boundary.

## Provider Must Not

- create issues
- create pull requests
- create branches
- commit code
- merge pull requests
- modify GitHub Actions
- configure webhooks
- edit repository settings
- mutate AIverse internal simulation state
- expose credentials or token values in snapshots or UI

## Output Mapping

GitHub provider output may map:

- repository identity to source metadata
- owner/name to project source labels
- default branch to source detail
- open issue summary to external work signal
- open pull request summary to external review signal
- recent commit summary to activity
- check/build status to source health
- latest activity timestamp to freshness

## Approval Gate

The provider cannot be implemented until authentication, credential handling, repository selection, refresh/sync, and public/private behavior are approved.
