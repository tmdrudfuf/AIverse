# Data Model: CLI Agent Runner Foundation

## AgentRunnerConfig

- `agentId`: Stable id such as `codex` or `claude`.
- `identity`: Human-readable label.
- `command`: Executable command name or path.
- `args`: Optional argument array.
- `inputMode`: `stdin` for this foundation.
- `timeoutMs`: Optional per-agent timeout override.

## AgentDetectionResult

- `agentId`
- `identity`
- `command`
- `installed`
- `exitCode`
- `stdout`
- `stderr`
- `errorMessage`
- `durationMs`

## AgentExecutionRecord

- `featureId`
- `stage`
- `agentId`
- `agentIdentity`
- `command`
- `args`
- `startedAt`
- `completedAt`
- `durationMs`
- `exitCode`
- `signal`
- `timedOut`
- `interrupted`
- `outputState`: `ok`, `empty`, `non-zero`, `timeout`, or `interrupted`
- `stdout`
- `stderr`
- `recordedResultPath`

## ProcessAdapter

Injected process abstraction:

- `run(command, args, options)` returns stdout, stderr, exitCode, signal, timedOut, interrupted, and durationMs.

The default adapter uses `child_process.spawn` with `shell: false`; tests use fake adapters.
