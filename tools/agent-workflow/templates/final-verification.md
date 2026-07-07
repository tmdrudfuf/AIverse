# Final Verification for {{featureId}} - {{featureName}}

Perform final verification for branch `{{currentBranch}}` against base `{{baseBranch}}`.

Expected commit: `{{expectedCommit}}`

## Verification Scope

- Confirm the final diff matches the approved implementation.
- Confirm no unrelated files are present.
- Confirm validation evidence is current.
- Confirm safety constraints remain intact.

## Scope Constraints

{{scopeConstraints}}

## Validation Commands

{{validationCommands}}

## Decision Format

{{reviewDecisionFormat}}

## Safety Rules

{{safetyRules}}

{{primaryWorktreeRule}}

Do not mark ready, push, merge, or delete branches. Return whether it is ready for a human decision.

## Human-Only Commands

{{humanOnlyCommands}}
