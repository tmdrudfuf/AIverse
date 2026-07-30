# Contract: Execution Readiness Validation

## Command

```ts
evaluateReadiness(input: ExecutionReadinessEvaluationInput): ExecutionReadinessEvaluationOutcome
```

## Input

The command receives current product-side state:

- request: project ID, execution plan ID, evaluated timestamp
- execution plan collection
- task collection
- confirmed assignment records
- prepared session records
- active work sessions
- employee registry
- repository identity
- repository sync snapshot
- role context
- mutation-scope policy
- optional prior readiness collections/results

No input is a live filesystem, subprocess, Git, GitHub, Codex, or Claude handle.

## Output

```ts
type ExecutionReadinessEvaluationOutcome = {
  readiness?: ExecutionReadiness;
  readinessCollection?: ExecutionReadinessCollection;
  result: ExecutionReadinessResult;
  resultCollection?: ExecutionReadinessResultCollection;
};
```

## Status Semantics

- `Ready`: all required product-side checks pass.
- `Blocked`: ordinary stale, missing, mismatched, unsafe, or incompatible state.
- `Failed`: malformed or internally inconsistent input prevents ordinary blocked classification.

## Safety Guarantees

The command:

- does not grant human execution approval
- does not start execution
- does not invoke agents
- does not spawn subprocesses
- does not run validation commands
- does not inspect real filesystem paths
- does not mutate repository or GitHub state
- returns defensive copies
