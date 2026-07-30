# Contract: Execution Plan Creation

## Command

```ts
createExecutionPlan(input: ExecutionPlanCreationInput): ExecutionPlanCreationOutcome
```

## Input

```ts
type ExecutionPlanCreationInput = {
  request: {
    projectId: string;
    projectTaskId: string;
    activeSessionId: string;
    requestedAt: string;
  };
  taskCollection?: TaskCollection;
  confirmedAssignments?: Record<string, ConfirmedEmployeeAssignmentRecord>;
  preparedSessions?: Record<string, PreparedWorkSessionRecord>;
  activeSessions?: Record<string, WorkSession[]>;
  employees?: Employee[];
  repositoryContext?: {
    repositoryId: string;
    repositoryPath: string;
    worktreePath: string;
    branchName: string;
    specPath: string;
  };
  roleContext?: {
    implementerAgent: string;
    reviewerAgent: string;
    validationCommands: string[];
    allowedMutationScope: string[];
  };
  existingPlans?: ExecutionPlanCollection;
  pathChecks?: {
    worktreeExists: boolean;
    specExists: boolean;
  };
};
```

## Output

```ts
type ExecutionPlanCreationOutcome = {
  result: ExecutionPlanResult;
  plan?: ExecutionPlan;
  planCollection?: ExecutionPlanCollection;
};
```

## Status Contract

- `Created`: `plan` and `planCollection` are present; execution flags are false.
- `AlreadyExists`: existing compatible plan is returned; no duplicate is created.
- `Blocked`: input state is stale, mismatched, or incomplete; no plan is created.
- `Failed`: required store/context is unavailable; no plan is created.

## Safety Contract

The command must not:

- mutate ProjectTask, employee, confirmed assignment, prepared session, active session, repository, or GitHub state;
- invoke Codex or Claude;
- spawn subprocesses;
- create branches, commits, PRs, or runtime artifacts;
- mark execution, runtime, repository mutation, or GitHub mutation as started.
