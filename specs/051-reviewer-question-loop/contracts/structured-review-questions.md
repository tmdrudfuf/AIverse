# Contract: Structured Review Questions

Reviewer output remains Markdown with one `## Structured Review` fenced JSON block.

## Question Decision Example

````markdown
# Review Decision: Questions

## Blocking Findings

(none)

## Questions

- Q1: Which validation result covers the timeout path?

## Non-Blocking Improvements

(none)

## Validation Performed

Repository inspection only.

## Final Recommendation

Answer the questions, then request final review.

## Structured Review

```json
{
  "schemaVersion": 1,
  "decision": "questions",
  "summary": "Clarification is needed before final decision.",
  "blockingFindings": [],
  "nonBlockingFindings": [],
  "questions": [
    {
      "id": "Q1",
      "question": "Which validation result covers the timeout path?",
      "reason": "The review artifact does not show evidence for this behavior."
    }
  ]
}
```
````

## Decision Rules

- `approved` requires no questions and no blocking findings.
- `changes_requested` requires no questions and at least one actionable blocking finding.
- `questions` requires one or more valid questions and no blocking findings.
- Mixed states are invalid and classify as `Unknown`.
- A final review after answers must not return `questions` again.

## Safety Rules

Questions must not ask for secrets, credentials, command execution, remote mutation, validation bypass, safety-rule bypass, or unrelated work.
