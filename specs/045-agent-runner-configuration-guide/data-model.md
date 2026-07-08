# Data Model: Agent Runner Configuration and Real CLI Usage Guide

## DryRunSummary

- `stage`: workflow stage being previewed
- `agentId`: selected runner id, when a runner is applicable
- `agentIdentity`: readable runner identity
- `command`: command that would be executed
- `args`: command arguments that would be used
- `promptPath`: generated prompt path under `.agent-workflow/runs/<feature-id>/`
- `runDirectory`: run directory under `.agent-workflow/runs/<feature-id>/`
- `nextStage`: expected next stage if the current stage succeeds
- `blocked`: boolean indicating no agent CLI should be run
- `blockedReason`: human-readable explanation when blocked

## RunnerDiagnostic

- `agentId`: runner id
- `identity`: readable identity
- `command`: configured command
- `args`: configured args
- `configured`: whether a runner config exists
- `safe`: whether command passes remote-mutation safety checks
- `installed`: whether the command appears executable, when checked
- `exitCode`: version-check exit code, when checked
- `timedOut`: whether detection timed out
- `message`: display-safe status message

## ExampleWorkflowState

- `featureId`
- `featureName`
- `currentBranch`
- `baseBranch`
- `expectedCommit`
- `validationCommands`
- `scopeConstraints`
- `agentRunners`
- `stageAgents`
- `results`

## State Transitions

- Dry-run writes a prompt file but does not record an agent execution or stage result.
- Diagnostics does not mutate workflow state.
- Successful real runs continue to use Spec 043/044 behavior.
- Failed real runs continue to record diagnostics only and do not advance workflow stage.
