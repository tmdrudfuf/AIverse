# Contract: Active Work Session Start

## Command

The project dashboard exposes a local human command:

```text
Start work session
```

The command acts on the currently selected approved/promoted/assigned/prepared task chain and starts only one prepared session.

## Input

```ts
type WorkSessionStartRequest = {
  projectId: string;
  projectTaskId: string;
  preparedSessionId: string;
  requestedAt: string;
};
```

The start service also receives current in-memory task collection, confirmed assignments, prepared sessions, employees, and active work sessions.

## Output

```ts
type WorkSessionStartStatus =
  | "Started"
  | "AlreadyStarted"
  | "Ineligible"
  | "Unavailable"
  | "Conflict"
  | "Failed";
```

Successful output includes:

- one active-session record;
- updated task collection;
- updated employee list;
- a start result.

Blocked output includes:

- no active-session record;
- no task mutation;
- no employee mutation;
- one safe start result when the result store is available.

## State Guarantees

- A successful active session has `active=true` and `workStarted=true`.
- A successful active session has `executionStarted=false`, `agentStarted=false`, `repositoryMutationStarted=false`, and `githubMutationStarted=false`.
- Prepared-session and confirmed-assignment records remain unchanged.
- Repeated starts return `AlreadyStarted` only after current-state validation.
- One input action performs at most one transition.

## Safety Contract

The command never:

- invokes Codex;
- invokes Claude;
- spawns a subprocess;
- modifies repository files;
- creates a branch or commit;
- mutates GitHub;
- starts agent execution.
