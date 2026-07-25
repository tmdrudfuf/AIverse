# Data Model: Finding Lifecycle Tracking

## Structured Finding

Represents one Reviewer-supplied issue in a structured review.

Fields:

- `id`: Required stable ID within the orchestration run.
- `severity`: Required `P0`, `P1`, `P2`, or `P3`.
- `filePath`: Optional repository-relative path.
- `location`: Optional line range, function name, or section.
- `summary`: Required concise problem statement.
- `reason`: Optional explanation of impact.
- `recommendation`: Required for blocking findings.
- `kind`: Derived by collection: `blocking` or `non_blocking`.

Validation:

- IDs are unique across blocking and non-blocking findings in one structured review.
- Blocking findings must be actionable.

## Lifecycle Classification

Represents the Reviewer's status for a finding ID during one decision-producing review.

Fields:

- `findingId`: Required ID.
- `status`: Required `new`, `still_open`, or `resolved`.
- `explanation`: Required non-empty explanation.

Validation:

- Previous findings must be classified exactly once.
- Previous findings cannot be `new`.
- New current findings must be `new`.
- Unknown lifecycle IDs are invalid unless they correspond to current new findings.

## Finding History Entry

Persisted workflow state for one finding ID.

Fields:

- `findingId`
- `kind`
- `severity`
- `summary`
- `recommendation`
- `firstSeenReviewSequence`
- `lastSeenReviewSequence`
- `currentStatus`
- `resolvedReviewSequence`
- `sourceReviewArtifactPath`
- `latestReviewArtifactPath`
- `latestStructuredReviewPath`

State transitions:

- Initial/current new finding: `new` -> active open.
- Re-review `still_open`: remains active open.
- Re-review `resolved`: becomes resolved and inactive for fix prompts.
- Invalid lifecycle: no transition is accepted.

## Normalized Lifecycle

Workflow-generated artifact derived from prior history plus the current structured review.

Fields:

- `schemaVersion`: `1`
- `reviewSequence`
- `status`: `valid`, `absent`, `invalid`, or `unsupported`
- `previousFindings`
- `classifications`
- `newFindings`
- `stillOpenFindings`
- `resolvedFindings`
- `activeBlockingFindings`
- `diagnostics`

Relationships:

- References a structured review artifact.
- Updates finding history only when valid.
- Supplies active blocking findings to the next fix prompt.
