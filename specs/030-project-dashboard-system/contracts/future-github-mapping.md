# Contract: Future GitHub Mapping

## Purpose

Document how a future GitHub repository or project provider can map into the Project Dashboard without changing the UI contract.

## Current Scope

This feature does not implement GitHub integration. It only preserves the provider-neutral shape needed for a future mapper.

## Future Mapping Targets

A future GitHub provider may map:

- repository name to project name
- repository/project status to project status
- issues or project items to active work
- assignees to related employees when identity mapping exists
- labels or blocked issue state to blockers/risks
- commits, pull requests, issue comments, or project item changes to recent activity
- repository/project URL to external source metadata

## Current Placeholders

Only optional external source metadata is allowed now:

- source type
- source id
- optional external URL
- optional mapping confidence

## Boundaries

- No GitHub credentials.
- No GitHub API calls.
- No repository synchronization.
- No issue creation.
- No project item editing.
- No webhook handling.
- No automatic employee assignment from GitHub data.
- No replacement of internal simulation project state.
