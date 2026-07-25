# Data Model: Structured Review Handoff

## Structured Review

Fields:

- `schemaVersion`: required number. Supported value: `1`.
- `decision`: required string. Supported values: `approved`, `changes_requested`.
- `summary`: optional string.
- `blockingFindings`: required array of Structured Finding objects.
- `nonBlockingFindings`: optional array of Structured Finding objects. Defaults to `[]` when absent.
- `questions`: optional array of strings or objects. Defaults to `[]` when absent.

Validation rules:

- Unsupported schema versions are rejected with status `unsupported`.
- Invalid decision values are rejected with status `invalid`.
- `blockingFindings` must be an array.
- `nonBlockingFindings`, when present, must be an array.
- `questions`, when present, must be an array.
- The normalized review preserves only supplied fields; missing optional values are not invented.

## Structured Finding

Fields:

- `id`: required string, unique within the structured review.
- `severity`: required string enum: `P0`, `P1`, `P2`, `P3`.
- `filePath`: optional string.
- `location`: optional string.
- `summary`: required string.
- `reason`: optional string.
- `recommendation`: optional string.

Validation rules:

- `id` must be non-empty and unique across blocking and non-blocking findings.
- `severity` must be one of the supported values.
- `summary` must be non-empty.
- A blocking finding is actionable only when it has at least one of `filePath`, `location`, `reason`, or `recommendation`, and must include `recommendation`.
- Non-blocking findings are validated for field shape but do not authorize fix cycles.

## Structured Review Parse Result

Fields:

- `status`: `valid`, `absent`, `invalid`, or `unsupported`.
- `review`: normalized Structured Review when status is `valid`.
- `decision`: normalized workflow decision (`Approved`, `Changes Requested`, or `Unknown`) after reconciliation.
- `diagnostics`: array of human-readable parser diagnostics.
- `blockCount`: number of designated structured JSON blocks discovered.

## State Additions

Existing state remains valid. Review and orchestration commands may add:

- `latestStructuredReviewStatus`: `valid`, `absent`, `invalid`, or `unsupported`.
- `latestStructuredReview`: normalized Structured Review when valid.
- `latestStructuredReviewPath`: relative path to the structured JSON artifact when valid.
- `latestStructuredReviewDiagnostics`: parser diagnostics.

Review run records may add:

- `structuredReviewStatus`
- `structuredReviewPath`
- `structuredReviewDiagnostics`
- `structuredReviewDecision`

## Artifact Additions

When structured status is `valid`, the workflow writes:

```text
.agent-workflow/runs/<feature-id>/<timestamp>-structured-review.json
```

The raw Markdown result artifact remains unchanged and is always written for real review runs.
