# Reviewer Runtime Provider Contract

## Boundary

```text
ReviewerRuntimeProvider.invoke(command: ReviewerRuntimeProviderCommand): Promise<ReviewerRuntimeProviderResult>
```

No mutation methods exist on this contract by design — only a single, bounded, terminal invocation (`ReviewerRuntimeProvider.ts`). `CodexReviewerRuntimeProvider` is its sole concrete implementation.

```text
ReviewerRuntimeProviderCommand
command, arguments, inputMode, workingDirectory, prompt, timeoutMs, reviewTargetSha

ReviewerRuntimeProviderResult
status: ReviewerRuntimeStatus
decision: ReviewerRuntimeDecision
findings: ReviewerRuntimeFinding[]
evidence: ReviewerRuntimeEvidence
```

## Double Gate

`CodexReviewerRuntimeProvider` mirrors `ClaudeImplementerRuntimeProvider`'s boundary exactly, in order:

1. `typeof window !== "undefined"` — the browser guard. True in every real browser session; the provider returns `Blocked`/`REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE` immediately, without attempting a spawn.
2. **Env-Var Spawn Gate** — `process.env.AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN !== "1"`. Even in a genuine Node runtime (this repository's Vitest suite, or a documented manual smoke script), the provider will not resolve the real `node:child_process` import unless this exact environment variable is set to `"1"`. Failing this check also returns `Blocked`/`REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE`.

This variable is `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN`, deliberately distinct from Spec 075's `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` — enabling one spawn gate must never enable the other. This is the direct fix for Spec 075's own documented **NB-001** non-blocking finding (the Implementer Provider Boundary docs did not explicitly restate the env-var gate alongside the browser guard); this contract, `plan.md`'s Architecture Decision 4, and `quickstart.md` each restate the gate independently so the omission is not repeated.

An explicitly-injected test `spawnSyncImpl` (constructor parameter) bypasses both checks — supplying a test double is itself an explicit, controlled substitution with no real-process risk.

## Command Safety

Before any spawn attempt, `isSafeReviewerCommand` must pass: `isSafeCommandLine` (reused from `runtime-preflight`) AND `isSafeImplementerCommandLine` (reused from the Implementer Runtime) AND no unsafe redirection (`<`/`>`). `ReviewerRuntimeService` calls the identical function immediately before invoking the provider, so a command the service allows through is always one the provider itself would also allow — no gap exists between the two checks.

## Result Statuses

```text
Completed
TimedOut
Blocked
Failed
```

No `Starting`/`Running`/`Cancelled` member — see `plan.md`, Architecture Decision 3, and `data-model.md`.

## Required Provider Behavior

1. Reject an unsafe command before any spawn attempt (`Blocked`, no evidence of a real process).
2. In a browser context, return `Blocked` without attempting the dynamic import.
3. In a Node context without the spawn-allow env var set to `"1"`, return `Blocked` without attempting the dynamic import.
4. Otherwise, perform a real, timeout-bounded, safety-validated `spawnSync` against the exact validated command, arguments, working directory, and prompt (via stdin, per `inputMode: "stdin"`).
5. Map `spawnSync`'s result deterministically: normal exit → parse output via `ReviewDecisionParser` and return `Completed`; timeout (`status: null`, `signal: "SIGTERM"`, `error.code: "ETIMEDOUT"`) → `TimedOut`; spawn failure (`error.code: "ENOENT"` or similar) → `Failed`.
6. Truncate `stdout`/`stderr` to a bounded length (2000 characters) and record `outputTruncated`.
7. Never retry, never leave an orphaned process — `spawnSync` blocks until the child is fully reaped.
