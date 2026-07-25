# Contract: Structured Implementer Answers

Implementer answer output may be human-readable Markdown, but it must include exactly one structured answer payload under `## Structured Answers`.

````markdown
# Implementer Answers

## Answers

- Q1: The timeout path is covered by `tools/agent-workflow/orchestrateCommand.test.ts`.

## Structured Answers

```json
{
  "schemaVersion": 1,
  "answers": [
    {
      "questionId": "Q1",
      "answer": "The timeout path is covered by the Reviewer timeout and Implementer timeout tests in orchestrateCommand.test.ts.",
      "evidence": [
        "tools/agent-workflow/orchestrateCommand.test.ts"
      ]
    }
  ]
}
```
````

## Validation Rules

- `schemaVersion` must be `1`.
- `answers` must be an array.
- Every answer must reference exactly one known question ID.
- Every known question must receive exactly one answer.
- Duplicate answers are invalid.
- Answers for unknown question IDs are invalid.
- Empty answers are invalid.
- Evidence is optional and preserved only when supplied.
