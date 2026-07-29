# Contract: Confirmed Employee Assignment

## Confirm Request

```ts
type ConfirmedEmployeeAssignmentRequest = {
  projectId: string;
  projectTaskId: string;
  assignmentRecommendationId: string;
  employeeId: string;
  requestedAt: string;
};
```

The request is created only from explicit human input. It must not be generated from render, refresh, or recommendation creation alone.

## Service Input

```ts
type ConfirmedEmployeeAssignmentInput = {
  request: ConfirmedEmployeeAssignmentRequest;
  taskCollection?: {
    projectId: string;
    tasks: ReadonlyArray<ProjectTask>;
  };
  assignments?: CandidateAssignmentRecommendationCollection;
  employees?: ReadonlyArray<Employee>;
  workSessions?: Readonly<Record<string, ReadonlyArray<WorkSession>>>;
  existingAssignments?: Readonly<Record<string, ConfirmedEmployeeAssignmentRecord>>;
};
```

## Service Outcome

```ts
type ConfirmedEmployeeAssignmentOutcome = {
  result: ConfirmedEmployeeAssignmentResult;
  assignmentRecord?: ConfirmedEmployeeAssignmentRecord;
  taskCollection?: {
    projectId: string;
    tasks: ProjectTask[];
  };
};
```

## Guarantees

- `Assigned` returns an updated task collection and assignment record.
- `AlreadyAssigned` returns the existing task identity and does not duplicate records.
- Blocked results return no task collection mutation.
- Work-session and employee objects are never mutated.
- All returned arrays and nested provenance objects are defensive copies.

## Controller Contract

The portal controller may call the service only when a selected dashboard item maps to:

1. a promoted ProjectTask,
2. a matching `Recommended` assignment recommendation,
3. a recommended employee ID.

The controller must revalidate at command time and must preserve manual repository/issue sync fallback when no assignment command applies.
