# Research: Fifth Employee Recruiting Action

## Decision: Add a deterministic local fifth employee

**Rationale**: Existing employee data is in-memory and deterministic. A deterministic fifth employee keeps tests stable, avoids external account provisioning, and matches the current placeholder employee model.

**Alternatives considered**: Randomized recruitment candidates were rejected because they would make tests and progression state harder to reason about.

## Decision: Use a dedicated recruiting service

**Rationale**: Idempotency, roster boundary checks, and defensive copying are domain rules that can be unit tested without rendering or controller setup.

**Alternatives considered**: Inlining the logic in the portal controller was rejected because the controller is already large and the rule is reusable outside input handling.

## Decision: Surface the action in the operating terminal list

**Rationale**: The recruiting action affects company-wide roster and progression state, not a single project. The operating terminal already presents company summary and global focus actions.

**Alternatives considered**: Putting recruitment in task assignment was rejected because recruitment should not assign work or mutate tasks.
