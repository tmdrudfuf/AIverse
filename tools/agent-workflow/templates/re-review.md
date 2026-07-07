# Re-review {{featureId}} - {{featureName}}

Re-review the latest fix on branch `{{currentBranch}}` against base `{{baseBranch}}`.

Expected commit: `{{expectedCommit}}`

## Review Focus

- Confirm previous blocking findings are fixed.
- Confirm no scope expansion occurred.
- Confirm validation still passes.

## Scope Constraints

{{scopeConstraints}}

## Validation Commands

{{validationCommands}}

## Decision Format

{{reviewDecisionFormat}}

## Safety Rules

{{safetyRules}}

{{primaryWorktreeRule}}

Return Approved or Changes Requested only.

## Human-Only Commands

{{humanOnlyCommands}}
