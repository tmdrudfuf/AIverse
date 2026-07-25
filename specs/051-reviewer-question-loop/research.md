# Research: Reviewer Question Loop

## Decision: Extend Schema Version 1 With `questions`

**Rationale**: Schema version 1 already includes a `questions` array, but Spec 050 required it to be empty for final decisions. Adding `decision: "questions"` with stricter consistency rules is backward-compatible for existing artifacts.

**Alternatives considered**:

- Schema version 2: rejected because no incompatible field changes are needed.
- Infer questions from non-empty `questions` arrays: rejected because the clarification state must be explicit and deterministic.

## Decision: Separate Structured Answer Artifact

**Rationale**: Answers are produced by the Implementer and should not mutate or rewrite the original Reviewer artifact. Separate raw and normalized answer artifacts preserve evidence and replayability.

**Alternatives considered**:

- Embed answers in orchestration state only: rejected because humans need artifact evidence.
- Append answers to the original review artifact: rejected because it would blur Reviewer and Implementer evidence.

## Decision: One New Answer Stage and One New Final-Review Stage

**Rationale**: The current orchestrator already persists stages and artifacts. Adding `answer-questions` and `final-review` preserves architecture and resume behavior without building a new conversation engine.

**Alternatives considered**:

- Reuse `fix` for answers: rejected because answers must not edit files and must not consume fix-cycle count.
- Reuse `re-review` for final review: rejected because final review after questions has different prompt inputs and no second question loop.

## Decision: Treat Clarification Content as Untrusted

**Rationale**: Questions and answers may contain prompt-injection text. The workflow must preserve and quote them in prompts but never execute commands from artifact content.

**Implementation implication**: Only configured runner commands and validation commands are executed. Question/answer strings are never parsed as shell commands.
