# Data Model: Agent Workflow Run Command

## WorkflowRunSummary

- `steps`: list of `WorkflowRunStep`
- `stopReason`: `single-stage-complete`, `failure`, `human-merge-decision`, `missing-agent`, or `max-steps`
- `nextStage`
- `statePath`

## WorkflowRunStep

- `stage`
- `agentId`
- `agentIdentity`
- `outputState`
- `exitCode`
- `recordPath`
- `resultPath`
- `nextStage`

## Run Options

- `untilBlocked`: boolean
- `maxSteps`: positive integer
- `stage`: optional explicit stage
- `agentId`: optional explicit agent id
- `timeoutMs`: optional timeout override
