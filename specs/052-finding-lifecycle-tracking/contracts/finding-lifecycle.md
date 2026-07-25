# Contract: Finding Lifecycle Tracking

## Structured Review Additive Field

Structured Review schema version 1 may include:

```json
{
  "findingLifecycle": [
    {
      "findingId": "F1",
      "status": "still_open",
      "explanation": "The committed branch diff remains outside the edit signature."
    }
  ]
}
```

Rules:

- `findingLifecycle` is optional for initial reviews.
- `findingLifecycle` is required for decision-producing re-reviews when previous structured findings exist.
- `status` must be `new`, `still_open`, or `resolved`.
- `explanation` must be non-empty.
- The workflow rejects duplicate lifecycle entries.
- Markdown-only re-review cannot satisfy lifecycle requirements.

## Normalized Lifecycle Artifact

The workflow writes a JSON artifact beside the review result when lifecycle normalization is applicable:

```json
{
  "schemaVersion": 1,
  "reviewSequence": 2,
  "status": "valid",
  "previousFindings": [
    {
      "findingId": "F1",
      "kind": "blocking",
      "severity": "P1",
      "currentStatus": "open"
    }
  ],
  "classifications": [
    {
      "findingId": "F1",
      "status": "resolved",
      "explanation": "Regression coverage and committed-diff detection were added."
    }
  ],
  "newFindings": [],
  "stillOpenFindings": [],
  "resolvedFindings": ["F1"],
  "activeBlockingFindings": [],
  "diagnostics": []
}
```

## Decision Consistency

- `approved` is valid only when no current blocking findings and no previous blocking findings are `still_open`.
- `changes_requested` is valid only when at least one active current blocking finding exists.
- `questions` does not finalize lifecycle status.
- Invalid lifecycle data forces Unknown or blocked workflow behavior.
