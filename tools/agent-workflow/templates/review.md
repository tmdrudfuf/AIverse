# Review {{featureId}} - {{featureName}}

Review branch `{{currentBranch}}` against base `{{baseBranch}}`.

Expected commit: `{{expectedCommit}}`

Repository path: `{{repositoryPath}}`

Task/spec scope:

{{taskScope}}

Changed files / diff scope:

{{changedFiles}}

Validation evidence:

{{validationEvidence}}

## Review Focus

- Correctness
- Scope control
- Test quality
- Safety boundaries
- CI/readiness

## Scope Constraints

{{scopeConstraints}}

## Validation Commands

{{validationCommands}}

## Decision Format

{{reviewDecisionFormat}}

Return exactly one review decision:

- `Approved`
- `Changes Requested` with exact file/line comments and behavioral risk

## Safety Rules

{{safetyRules}}

{{primaryWorktreeRule}}

Do not modify files unless a human explicitly asks for a fix.
Do not commit, push, create or update pull requests, mark pull requests ready, merge, delete branches, or perform remote mutations.

## Human-Only Commands

{{humanOnlyCommands}}
