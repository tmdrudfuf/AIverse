import { spawn, type ChildProcess } from "node:child_process";

import { RUNTIME_BRIDGE_DEFAULT_GRACE_PERIOD_MS } from "./RuntimeBridgeTypes";

export type RuntimeBridgeProcessResult = {
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  cancelled: boolean;
  stdout: string;
  stderr: string;
  errorMessage: string;
  durationMs: number;
};

export type RuntimeBridgeProcessHandle = {
  result: Promise<RuntimeBridgeProcessResult>;
  /** Requests shutdown of this one specific in-flight process. Returns false if it has already settled. */
  cancel(): boolean;
};

export type RuntimeBridgeSpawnImpl = typeof spawn;

export type RuntimeBridgeProcessOptions = {
  cwd: string;
  input?: string;
  timeoutMs: number;
  gracePeriodMs?: number;
  spawnImpl?: RuntimeBridgeSpawnImpl;
};

/**
 * Async, cancellable subprocess execution for the real execution server
 * bridge. Mirrors the proven timeout/grace-period/SIGTERM-then-SIGKILL
 * shutdown pattern already used by `tools/agent-workflow/agentRunner.js`'s
 * `createDefaultProcessAdapter` (that module is this repository's own
 * Spec Kit meta-workflow tooling and is reused by reading its pattern, not
 * by importing it -- see research.md, Decision 2), with one addition that
 * module does not expose: an external `cancel()` handle for one specific
 * in-flight run, independent of the timeout.
 */
export function runRuntimeBridgeProcess(
  command: string,
  args: ReadonlyArray<string>,
  options: RuntimeBridgeProcessOptions,
): RuntimeBridgeProcessHandle {
  const spawnImpl = options.spawnImpl ?? spawn;
  const gracePeriodMs = options.gracePeriodMs ?? RUNTIME_BRIDGE_DEFAULT_GRACE_PERIOD_MS;
  const startedAtMs = Date.now();

  let settled = false;
  let timedOut = false;
  let cancelled = false;
  let forceKillTimeout: ReturnType<typeof setTimeout> | undefined;

  const child: ChildProcess = spawnImpl(command, [...args], {
    cwd: options.cwd,
    shell: false,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  const requestShutdown = () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    child.kill("SIGTERM");
    clearTimeout(forceKillTimeout);
    forceKillTimeout = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }, gracePeriodMs);
  };

  const timeout = setTimeout(() => {
    timedOut = true;
    requestShutdown();
  }, options.timeoutMs);

  child.stdout?.on("data", (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  const result = new Promise<RuntimeBridgeProcessResult>((resolve) => {
    child.on("error", (error: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(forceKillTimeout);
      resolve({
        exitCode: null,
        signal: null,
        timedOut,
        cancelled,
        stdout,
        stderr: stderr || error.message,
        errorMessage: error.message,
        durationMs: Date.now() - startedAtMs,
      });
    });
    child.on("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(forceKillTimeout);
      resolve({
        exitCode,
        signal,
        timedOut,
        cancelled,
        stdout,
        stderr,
        errorMessage: "",
        durationMs: Date.now() - startedAtMs,
      });
    });
  });

  if (options.input) child.stdin?.write(options.input);
  child.stdin?.end();

  return {
    result,
    cancel() {
      if (settled) return false;
      cancelled = true;
      requestShutdown();
      return true;
    },
  };
}
