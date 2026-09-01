# Contract: Project Autonomous Execution Policy

## Read Policy

Inputs:

- Canonical project id.
- Current project registry and binding state.

Outputs:

- Disabled default policy when no valid stored policy exists.
- Stored per-project policy when valid.

Failure behavior:

- Missing project, malformed policy, project mismatch, or unavailable binding resolves to disabled/manual-only evaluation.

## Update Policy

Inputs:

- Canonical active project id.
- Operator action: enable, disable, allowed priorities, or explicit reevaluation.

Outputs:

- Updated policy stored under the same project id.
- `updatedByOperator` set for deliberate policy edits.

Failure behavior:

- Reject unavailable projects and cross-project writes.
- Never mutate another project's policy.

## Evaluate And Start

Inputs:

- Canonical project id.
- Current backlog tasks for that project.
- Project policy.
- Existing request/preparation/run associations and active ADOS run status.

Outputs:

- No-op result with deterministic reason, or selected task and delegated Spec 142 start outcome.

Required guarantees:

- Starts use the same manual Start Development bridge.
- At most one task is started per evaluation.
- Repeated evaluation does not duplicate request, preparation, execution, or association.
- Suggestions are not accepted or converted to tasks.
