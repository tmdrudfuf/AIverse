# Research: Playwright Home Canvas Smoke ADOS Validation Gate

## Decision: Add the smoke command to the default full validation list

**Rationale**: The ADOS workflow already resolves default full validation through `DEFAULT_VALIDATION_COMMANDS` when neither CLI options nor state files provide custom validation commands. Adding the existing home canvas smoke command there makes the gate automatic for default workflows while preserving all custom override precedence.

**Alternatives considered**:
- Add a focused validation default: rejected because Spec 055 intentionally keeps focused validation opt-in and custom configured.
- Only document the command: rejected because documentation alone does not gate workflow execution.
- Add browser smoke to `npm test`: rejected because the Playwright command has separate browser/runtime prerequisites and should stay explicit.

## Decision: Keep custom override behavior unchanged

**Rationale**: `state.validationCommands`, `state.validationPolicy.fullCommands`, and CLI validation command options are explicit operator choices. This feature should improve the default gate without silently rewriting custom policies.

**Alternatives considered**:
- Append the smoke command to every custom command list: rejected because it would violate existing override semantics and surprise operators.

## Decision: Do not run validation in this runtime

**Rationale**: The handoff explicitly prohibits validation, review, publication, merge, deployment, GitHub mutation, and primary-repository mutation from this runtime.

**Alternatives considered**:
- Run focused Vitest or Playwright checks here: rejected because the execution policy forbids validation from this runtime.
