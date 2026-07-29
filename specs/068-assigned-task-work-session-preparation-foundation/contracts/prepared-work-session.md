# Contract: Prepared Work Session

## Command

`prepareWorkSession(request, stateInputs)`

Request fields:
- `projectId`
- `projectTaskId`
- `confirmedAssignmentId`
- `requestedAt`

Required state inputs:
- current ProjectTask collection for the project
- confirmed assignment record map
- employee collection
- current active work-session snapshots
- existing prepared-session records

## Success Contract

For a valid confirmed assignment:
- returns status `Prepared`
- returns one prepared-session record
- returns a result with `prepared: true`
- leaves ProjectTask, employee, confirmed assignment, and active work-session inputs unchanged
- sets all active/execution/mutation flags false

For repeated preparation:
- returns status `AlreadyPrepared`
- returns the same prepared-session ID
- does not create duplicate records

## Failure Contract

For invalid input:
- returns `Ineligible`, `Unavailable`, `Conflict`, or `Failed`
- includes safe reason codes
- returns no prepared-session record
- does not mutate task, employee, assignment, work-session, repository, or GitHub state

## Dashboard Contract

The project dashboard may render:

```text
[WORK SESSION PREPARATION] 1 result; Prepared GPT Engineer; Not started; Inactive; No agent execution
```

Forbidden wording unless explicitly false:
- Working
- Started
- Active session
- Executing
- Running Codex
- Running Claude
