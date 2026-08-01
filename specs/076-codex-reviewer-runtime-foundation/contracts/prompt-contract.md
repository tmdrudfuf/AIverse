# Reviewer Prompt Contract

## Review Input Boundary

Codex reviews the exact repository/commit in `workingDirectory` itself — the prompt never embeds a diff, patch, or full file contents. `createReviewerPrompt` (`ReviewerPrompt.ts`) builds a bounded, deterministic prompt from approved product state only:

**Included**:

- Role statement ("You are the independent Reviewer.")
- `approvedImplementerAgent`/`approvedReviewerAgent` labels (Claude CLI / Codex CLI)
- `projectId`, `featureId`, `specificationPath`
- `worktreePath`, `baseBranch` + `baseSha`, `featureBranch`, `reviewTargetSha`, `mergeBaseSha`
- Changed-file list, capped at 25 entries with an explicit overflow count (`+N more`) — never the full list unbounded, never file contents
- An explicit instruction to inspect the exact review target commit in the worktree itself
- Explicit prohibition clauses (see below)
- The required decision-marker output format (see `output-decision-contract.md`)

**Excluded, unconditionally**:

- Secrets, tokens, credentials, or raw environment variables
- Any embedded diff, patch, or full file content
- Hidden/system prompts, unrelated transcripts, or any product state not listed above

## Explicit Prohibition Clauses

Every prompt includes, verbatim, an instruction that Codex must not:

- Modify any file
- Implement a fix
- Stage or commit any change
- Push
- Create or update a PR
- Merge
- Perform any GitHub mutation
- Invoke Claude
- Modify user-level Claude settings
- Modify user-level Codex settings
- Modify global Git configuration

These clauses exist because Codex, as Reviewer, is invoked with full local execution access (`--sandbox danger-full-access --ask-for-approval never`) — the prohibition list is the only boundary preventing an over-permissioned review session from mutating the reviewed change or the surrounding environment. `ReviewerRuntimeService`/`CodexReviewerRuntimeProvider` do not independently sandbox the file system; they trust this explicit prompt boundary, consistent with Spec 075's identical trust model for the Claude Implementer prompt.

## Bounding

- `promptId`: deterministic, `<projectId>:reviewer-prompt:<reviewTargetId>:<rulesVersion>`.
- `text`: bounded to 4000 characters (`PROMPT_MAX_LENGTH`); a prompt that would exceed this is truncated with a trailing `...` rather than silently dropping the stop-condition clauses (the clause list is short and always fits comfortably within the bound in practice).
- Immutable once constructed; never mutated after creation.

## Non-Goals

This contract does not attempt to bound Codex's own tool use once invoked (that is the sandbox/approval flags' responsibility, set once in `DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG`, not per-prompt). It bounds only what product code hands to Codex as input.
