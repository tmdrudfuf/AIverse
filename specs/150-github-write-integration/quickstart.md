# Quickstart: GitHub Write Integration

## Prerequisites

- `gh auth status` already succeeds on this machine with `repo` scope (verified for this project in research.md Decision 1).
- A project already registered in the app (Spec 123/137) whose local directory is a real git repository with a configured `origin` remote pointing at a real GitHub repository you are safe to open a disposable test PR against — use a disposable scratch repository for first verification, not one you care about (same caution as Spec 149's quickstart).

## Verify authorization status

```bash
curl -s http://localhost:3000/api/github-publish/status
```
Expected: `{"authorized":true}` (or `false` if `gh auth status` fails on this machine).

## Verify the preview before publishing

1. Make a small, harmless local change in the scratch project (edit a file, do not commit).
2. ```bash
   curl -s "http://localhost:3000/api/github-publish/preview?workingDirectory=<path>"
   ```
   Expected: `changedFiles` lists the file you edited, `hasAnythingToPublish: true`.

## Verify a real publish end to end

1. With the same uncommitted change still in place, trigger the publish action in the office UI (or call `POST /api/github-publish/publish` directly with the same `workingDirectory`).
2. Confirm the response's `status` is `"published"`, and `pullRequestUrl` is a real URL.
3. Open that URL and confirm a real pull request exists, as a draft, against the scratch repository's default branch, containing exactly the change you made.
4. Confirm the branch was **not** merged, approved, or marked ready — only opened.
5. Inspect the audit record:
   ```bash
   cat .agent-workflow/github-publishes/<attemptId>.json
   ```

## Verify "nothing to publish"

1. With no uncommitted changes and the current branch not ahead of the default branch, trigger publish again for the same project.
2. Expected: `status: "refused"`, `refusalReason: "nothing_to_publish"`, and no new branch/PR created.

## Verify the concurrency guard

1. Trigger publish for a project, and while it is still running, trigger it again for the same project.
2. Expected: the second request is `refused` with reason `already_running`.

## Verify the human-only boundary is untouched

1. After a successful publish, confirm from the GitHub UI that nothing but the operator's own later action can merge, approve, or ready that pull request — this feature never attempts any of those on its own.
