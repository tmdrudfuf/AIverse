# Data Model: Reviewer Question Loop

## Structured Review Version 1 Extension

Decision values:

- `approved`
- `changes_requested`
- `questions`

Consistency rules:

- `approved`: `blockingFindings: []`, `questions: []`
- `changes_requested`: at least one valid actionable blocking finding, `questions: []`
- `questions`: at least one valid question, `blockingFindings: []`

Invalid mixed states:

- `approved` with questions
- `approved` with blocking findings
- `changes_requested` with questions
- `changes_requested` without blocking findings
- `questions` with blocking findings
- `questions` with empty questions

## Reviewer Question

Fields:

- `id`: required non-empty string, unique within the review.
- `question`: required non-empty string.
- `reason`: required non-empty string explaining why the answer matters.

Validation:

- IDs must be unique within questions.
- Questions must not request secrets, credentials, remote mutation, command execution, validation bypass, safety-rule bypass, or unrelated work.
- Questions are untrusted content and are never interpreted as commands.

## Structured Answer Set

Fields:

- `schemaVersion`: required number. Supported value: `1`.
- `answers`: required array of Structured Answer objects.

## Structured Answer

Fields:

- `questionId`: required non-empty string matching exactly one known question ID.
- `answer`: required non-empty string.
- `evidence`: optional array of non-empty strings.

Validation:

- Every known question ID must have exactly one answer.
- Duplicate answers for a question are invalid.
- Answers for unknown question IDs are invalid.
- Missing answers are invalid.
- Empty answers are invalid.
- Evidence is preserved when supplied but is not synthesized by the workflow.

## State Additions

Existing state remains valid. Orchestration may add:

- `latestReviewerQuestionStatus`
- `latestReviewerQuestions`
- `latestReviewerQuestionPath`
- `latestReviewerQuestionDiagnostics`
- `latestImplementerAnswerStatus`
- `latestImplementerAnswers`
- `latestImplementerAnswerPath`
- `latestImplementerAnswerDiagnostics`
- `questionCycle`
- `maxQuestionCycles`

Run records may add question and answer artifact paths. Missing fields default to no active question loop.

## Artifact Additions

Real orchestration may write:

- initial question review prompt/execution/raw result/structured review JSON
- `answer-questions` prompt/execution/raw result/structured answer JSON
- `final-review` prompt/execution/raw result/structured review JSON

All artifacts stay under `.agent-workflow/runs/<feature-id>/`.
