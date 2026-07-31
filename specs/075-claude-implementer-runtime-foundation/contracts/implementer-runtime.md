# Implementer Runtime Contract

## Command

```text
ImplementerRuntimeCommand
projectId
runtimeStartId
executionPlanId
approvedImplementerAgent   ("claude")
approvedReviewerAgent      ("codex")
startedBy
requestedAt
```

The command is available only through the distinct `startImplementerPressed` input, never through `enterPressed`/`actionPressed`. The actor must be a human label, rejecting Claude, Codex, agent, bot, automation, and workflow.

## Result Statuses

```text
Completed
TimedOut
Cancelled   (modeled, not reachable via any product-code path in this spec)
Blocked
Failed
```

## Required Service Behavior

1. Revalidate Execution Plan, Execution Readiness, Human Execution Approval, and Runtime Preflight (reusing each existing service unmodified).
2. Require a current Runtime Start with status `Started` or `AlreadyStarted`, re-derived fresh, not read from a cached collection alone.
3. Verify the approved Implementer/Reviewer role binding as explicit request data; reject the default repository mapping, a swapped binding, or an identical agent in both roles.
4. Validate the exact configured Claude command and argument vector for safety (`isSafeCommandLine` plus this feature's additional shell-chaining/substitution/encoded-command/traversal checks).
5. Validate the working directory against the Runtime Start's exact worktree/branch/spec path.
6. Block a duplicate start if an Implementer Runtime attempt is already active for the same Runtime Start.
7. Construct a bounded, deterministic prompt from approved context only.
8. Invoke `ClaudeImplementerRuntimeProvider` with the exact validated command, arguments, working directory, prompt, and timeout.
9. Map the provider's outcome to exactly one immutable terminal result.
10. Never invoke Codex, run the dedicated Validation stage, stage files, commit, push, create/update a PR, mark a PR ready, or merge.

## Provider Boundary

```text
ImplementerRuntimeProvider.invoke(request): Promise<ImplementerRuntimeProviderResult>
```

`ClaudeImplementerRuntimeProvider` is the sole concrete implementation. In a browser runtime (`typeof window !== "undefined"`) it returns `Blocked`/`implementer_runtime_provider_unavailable` without attempting a spawn. In a Node runtime (this repository's Vitest suite, or the documented manual smoke script) it performs a real, timeout-bounded, safety-validated `spawnSync` and maps the result.

## Dashboard Contract

Rows must be equivalent to:

```text
[IMPLEMENTER RUNTIME] Implementer Unavailable; Runtime Start Required; Agent Not Started
[IMPLEMENTER RUNTIME] Claude Implementer Ready; Explicit Human Start Required; Codex Reviewer Not Started
[IMPLEMENTER RUNTIME] Claude Implementer Blocked; Resolve Runtime Requirements; Codex Reviewer Not Started
[IMPLEMENTER RUNTIME] Claude Implementer Completed; Changes Require Validation; Codex Reviewer Not Started; Remote Mutation Disabled
[IMPLEMENTER RUNTIME] Claude Implementer Timed Out; Human Inspection Required; Codex Reviewer Not Started; Remote Mutation Disabled
[IMPLEMENTER RUNTIME] Claude Implementer Failed; Human Inspection Required; Codex Reviewer Not Started; Remote Mutation Disabled
```

None of these rows may ever read "Implementation Approved," "Validation Passed," "Review Approved," "Ready to Merge," "Changes Committed," "PR Created," or "Codex Running."
