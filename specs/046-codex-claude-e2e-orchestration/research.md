# Research: Codex Claude E2E Orchestration

## Decision: Extend the Existing Workflow Runner

**Rationale**: Specs 042-044 already define workflow stages, prompt templates, local run records, subprocess execution, and human-only command boundaries. Extending these modules keeps the first E2E slice small and avoids a parallel orchestration path.

**Alternatives considered**:

- Create a new `codex-claude-runner` script: rejected because it would duplicate stage and path-containment logic.
- Wait for PR #35: rejected because the required E2E behavior does not need `detectAgentCli` or the configuration guide changes.

## Decision: Use Prompt Argument Mode for Claude Review

**Rationale**: Claude non-interactive mode is available as `claude -p "<prompt>"`. Supporting prompt-as-argument invocation through runner configuration lets Claude review stages work while Codex implementation stages continue using stdin.

**Alternatives considered**:

- Pipe Claude prompts via stdin: rejected because the required local mode is `claude -p`.
- Hardcode Claude behavior in the run command: rejected because the runner should remain provider-neutral and configurable.

## Decision: Conservative Review Decision Parsing

**Rationale**: A review should only advance workflow state when the output clearly contains one accepted decision. Ambiguous text, both decisions, failed executions, timeouts, and missing CLIs must not record approval.

**Alternatives considered**:

- Keep substring parsing: rejected because "not Approved" and mixed outputs can be unsafe.
- Require JSON output: rejected for this first slice because existing templates and reviewer prompts are plain text.

## Decision: Preserve Findings in Workflow State and Run Records

**Rationale**: The fix stage needs Claude's requested changes without reading arbitrary files. Storing successful review findings in local state and run records makes the next prompt grounded and auditable.

**Alternatives considered**:

- Only store result file path: rejected because the implementation prompt should remain self-contained.
- Store findings for failed reviews: rejected because failed or ambiguous output should not drive stage changes.
