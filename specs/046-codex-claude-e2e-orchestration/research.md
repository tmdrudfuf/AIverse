# Research: Role-Based E2E Agent Orchestration

## Decision: Extend the Existing Workflow Runner

**Rationale**: Specs 042-044 already define workflow stages, prompt templates, local run records, subprocess execution, and human-only command boundaries. Extending these modules keeps the first E2E slice small and avoids a parallel orchestration path.

**Alternatives considered**:

- Create a new vendor-specific runner script: rejected because it would duplicate stage and path-containment logic and couple the workflow to specific CLI products.
- Wait for PR #35: rejected because the required E2E behavior does not need `detectAgentCli` or the configuration guide changes.

## Decision: Use Logical Workflow Roles

**Rationale**: The workflow needs an Implementer and a Reviewer, not permanent dependence on specific vendors. Codex CLI remains the default Implementer and Claude CLI remains the default Reviewer, but stage-to-agent mapping stays configurable so roles can be swapped during rate limits, quota exhaustion, maintenance, or local CLI issues.

**Alternatives considered**:

- Hardcode Codex for implementation and Claude for review: rejected because it makes fallback and future agents harder.
- Allow the same agent to implement and review by default: rejected because independent review is safer. The reviewer should be different from the implementer whenever possible.

## Decision: Use Prompt Argument Mode for the Default Claude Reviewer

**Rationale**: Claude non-interactive mode is available as `claude --dangerously-skip-permissions -p "<prompt>"` for this local workflow. Supporting prompt-as-argument invocation through runner configuration lets the default Claude Reviewer work while the default Codex Implementer continues using stdin. The same configuration shape can support Gemini CLI, OpenAI CLI, Qwen CLI, and future local agents with their own prompt-delivery modes.

**Alternatives considered**:

- Pipe all review prompts via stdin: rejected because some CLIs require prompt arguments.
- Hardcode Claude behavior in the run command: rejected because the runner should remain provider-neutral and configurable.

## Decision: Conservative Review Decision Parsing

**Rationale**: A review should only advance workflow state when the output clearly contains one accepted decision. Ambiguous text, both decisions, failed executions, timeouts, and missing CLIs must not record approval.

**Alternatives considered**:

- Keep substring parsing: rejected because "not Approved" and mixed outputs can be unsafe.
- Require JSON output: rejected for this first slice because existing templates and reviewer prompts are plain text.

## Decision: Preserve Findings in Workflow State and Run Records

**Rationale**: The fix stage needs the Reviewer's requested changes without reading arbitrary files. Storing successful review findings in local state and run records makes the next prompt grounded and auditable.

**Alternatives considered**:

- Only store result file path: rejected because the implementation prompt should remain self-contained.
- Store findings for failed reviews: rejected because failed or ambiguous output should not drive stage changes.
