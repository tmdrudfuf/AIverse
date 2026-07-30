# Contract: Runtime Preflight

## Command

```ts
type RuntimePreflightCommand = {
  projectId: string;
  executionPlanId: string;
  approvalId: string;
  evaluatedAt: string;
};
```

## Service

```ts
runPreflight(input: RuntimePreflightInput): RuntimePreflightOutcome
```

The service receives current plan, readiness, approval, provider evidence, and existing collections. It returns a complete immutable preflight and result.

## Provider

```ts
interface RuntimeEnvironmentProvider {
  inspect(request: RuntimePreflightProviderRequest): RuntimePreflightEvidence;
}
```

Provider evidence must be bounded, structured, display-safe, and safe to defensive-copy. Provider errors are mapped to Failed preflight results by controller integration.
