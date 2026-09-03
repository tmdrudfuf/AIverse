# Data Model: Controlled Backlog Readiness Promotion Policy

## BacklogReadinessPromotionPolicy

- `projectId`: canonical registered project id. Must match record key and current context.
- `enabled`: explicit operator consent. Defaults false.
- `allowedPriorities`: existing backlog priorities allowed for promotion.
- `allowedOrigins`: existing provenance origins allowed for promotion.
- `maxPromotionsPerEvaluation`: bounded integer, default 1.
- `requireNoActiveExecution`: true by default.
- `requireValidTask`: true.
- `requireNonDuplicate`: true.
- `updatedAt`: timestamp.
- `updatedByOperator`: false for generated defaults, true after explicit operator update.
- `lastEvaluation`: optional concise audit summary.

## BacklogReadinessEvaluationResult

- `projectId`: evaluated project id.
- `policy`: policy snapshot used for evaluation.
- `promoted`: tasks successfully promoted to Ready with deterministic reasons.
- `skipped`: task ids/titles skipped with deterministic reasons.
- `evaluatedAt`: timestamp.
- `latestResultText`: compact UI/audit text.

## ProjectBacklogTask

Existing entity from Spec 141. Spec 146 requires:

- `id`, `projectId`, `title`, `description`, `status`, `priority`, `createdAt`, and `updatedAt` must be valid.
- Only `status: "backlog"` is eligible.
- Existing provenance fields determine origin where present.
- Existing execution/development association fields are used for duplicate and active-work protection.

## State Transitions

- Allowed by Spec 146: `backlog -> ready`.
- Disallowed by Spec 146: every other transition, including `ready -> in_progress`.
