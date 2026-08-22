# Research: Persistent ADOS Playwright Home Canvas Validation Command

## Decision: Reuse The Canonical Default Validation Command Export

**Rationale**: `DEFAULT_VALIDATION_COMMANDS` already contains `npm run test:e2e:home-canvas`. Test fixtures that hand-copy default command arrays can drift from that canonical list, which is how ADOS handoffs can omit the browser smoke command even after the production default changed.

**Alternatives considered**:

- Duplicate the five-command list in every fixture: rejected because it preserves the drift risk.
- Change production resolution again: rejected because Spec 119 already added the command to the production default.

## Decision: Preserve Override Semantics

**Rationale**: State and CLI overrides are intentionally responsible for their own validation command set. This feature only changes default fixture persistence; explicit overrides should continue to replace the default list.

**Alternatives considered**:

- Force-inject the home canvas command into every custom override: rejected because it would break existing override behavior and user control.

## Decision: Do Not Run Validation In This Runtime

**Rationale**: The handoff explicitly prohibits validation, review, publication, merge, deployment, GitHub mutation, and primary repository mutation from this runtime.

**Alternatives considered**:

- Run focused workflow tests locally: rejected because validation is reserved for a later allowed validation runtime.
