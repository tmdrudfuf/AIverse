# Contract: Structured Review Output

Reviewer output remains Markdown. A Reviewer that supports structured handoff must include exactly one structured review payload under the `## Structured Review` section.

````markdown
# Review Decision: Changes Requested

## Blocking Findings

- Severity: P1
  File: tools/agent-workflow/example.js
  Location: 42-48
  Problem: Unsafe command reaches process spawn.
  Impact: Remote-mutating commands could bypass the safety gate.
  Recommendation: Validate the normalized command before spawn.

## Non-Blocking Improvements

(none)

## Validation Performed

npm test

## Final Recommendation

Request changes.

## Structured Review

```json
{
  "schemaVersion": 1,
  "decision": "changes_requested",
  "summary": "One blocking safety issue was found.",
  "blockingFindings": [
    {
      "id": "P1-001",
      "severity": "P1",
      "filePath": "tools/agent-workflow/example.js",
      "location": "42-48",
      "summary": "Unsafe command reaches process spawn.",
      "reason": "The configured command is replaced before safety validation.",
      "recommendation": "Validate the normalized configured command before creating the process invocation."
    }
  ],
  "nonBlockingFindings": [],
  "questions": []
}
```
````

## Decisions

Structured decisions:

- `approved`
- `changes_requested`

Workflow decisions:

- `approved` maps to `Approved`.
- `changes_requested` maps to `Changes Requested`.

## Consistency Policy

- If the structured block is absent, the workflow uses existing Markdown-only behavior.
- If the structured block is valid and Markdown is `Unknown`, the structured decision is used.
- If the structured block is valid and Markdown agrees, the structured decision is used.
- If Markdown and structured decisions conflict, the workflow returns `Unknown`.
- If a structured block is present but malformed, unsupported, duplicated, or invalid, the workflow returns `Unknown`.
- Only `Approved` may advance toward final verification.

## Finding Rules

- IDs must be unique within one review artifact.
- Severity must be `P0`, `P1`, `P2`, or `P3`.
- Blocking findings must include a recommendation and at least one actionable context field.
- The workflow preserves supplied fields exactly and does not synthesize missing details.

## Safety

This contract does not permit remote mutation. Push, PR creation/editing/readiness/approval, merge, remote branch deletion, and mutating GitHub operations remain human-only.
