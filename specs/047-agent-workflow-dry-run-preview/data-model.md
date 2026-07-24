# Data Model: Agent Workflow Dry Run Preview

## Dry Run Preview

Represents the display-only result of resolving a workflow stage without spawning an agent.

Fields:

- `stage`: Current or overridden workflow stage.
- `nextStage`: Stage expected after a real successful execution, or the unchanged human gate when no agent should run.
- `agentId`: Selected runner identifier for runnable stages.
- `agentIdentity`: Display name of the selected runner.
- `commandPreview`: Display-safe command and argument preview, including prompt placeholder placement without exposing large prompt content.
- `promptPath`: Local path where the generated prompt preview is written or would be written.
- `runDirectory`: Local `.agent-workflow/runs/<feature-id>/` directory for the feature.
- `willSpawn`: Always `false` for this feature.

Validation rules:

- Dry-run preview must not record stage results.
- Dry-run preview must not append execution records.
- Dry-run preview must not spawn an agent process.
- Dry-run preview must stop at human-merge-decision.
- Dry-run preview must reject unsafe runner configurations before presenting them as runnable.

## Workflow State

Existing local state used to resolve feature id, current stage, stage-to-agent mapping, runner configuration, branch, scope, validation evidence, and review findings.

State transition:

- Dry-run preview reads state and may write a generated prompt preview if the existing prompt helper requires it.
- Dry-run preview must not advance workflow state.
