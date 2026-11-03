export type RuntimeBridgeRole = "implementer" | "reviewer";

export type RuntimeBridgeTerminalStatus = "completed" | "failed" | "timed_out" | "cancelled" | "refused";

export type RuntimeBridgeStatus = "running" | RuntimeBridgeTerminalStatus;

export type RuntimeBridgeRefusalReason = "not_enabled" | "project_unavailable" | "already_running" | "unsafe_command";

export type RuntimeBridgeCommandFile = {
  relativePath: string;
  baseDirectory?: "workingDirectory" | "applicationRoot";
  content: string;
};

export type RuntimeBridgeCommand = {
  command: string;
  arguments: ReadonlyArray<string>;
  inputMode: "argument" | "stdin";
  workingDirectory: string;
  prompt: string;
  /** Implementer role only. */
  files?: ReadonlyArray<RuntimeBridgeCommandFile>;
  /** Reviewer role only. */
  reviewTargetSha?: string;
  timeoutMs: number;
};

export type RuntimeBridgeExecuteRequest = {
  role: RuntimeBridgeRole;
  command: RuntimeBridgeCommand;
  /**
   * Optional, caller-generated id (e.g. `crypto.randomUUID()`). Supplying
   * one lets the caller learn its own run's id before the run reaches a
   * terminal status (POST only returns the run's id in its response once
   * the run is already done), so it can call `DELETE
   * /api/runtime/execute/:runId` on a genuinely in-flight run. When
   * omitted, the server generates one as before, which the caller only
   * ever sees after the run has already ended.
   *
   * Must be unique per in-flight run (round-4 review finding N-002,
   * non-blocking): the route restricts it to a safe charset, but does not
   * deduplicate it against other runIds -- a caller that reuses one while
   * its prior run is still active (or whose audit record still exists)
   * can overwrite that audit record and make `DELETE`'s cancel lookup
   * ambiguous. `ServerBridgeImplementerRuntimeProvider`/
   * `ServerBridgeReviewerRuntimeProvider` always generate a fresh
   * `crypto.randomUUID()` per call, so this is a direct-API caller's own
   * responsibility, not a risk from the browser's real usage path.
   */
  runId?: string;
};

export type RuntimeBridgeEvidence = {
  started: boolean;
  completed: boolean;
  timedOut: boolean;
  cancelled: boolean;
  exitCode?: number;
  signal?: string;
  durationMs: number;
  stdoutSummary: string;
  stderrSummary: string;
  outputTruncated: boolean;
  commandDisplay: string;
  workingDirectory: string;
};

export type RuntimeBridgeExecuteResponse = {
  runId: string;
  status: RuntimeBridgeStatus;
  refusalReason: RuntimeBridgeRefusalReason | null;
  evidence: RuntimeBridgeEvidence;
  /** Reviewer role only: the parsed review decision, "Unknown" unless status is "completed". */
  decision?: "Approved" | "ChangesRequested" | "Unknown";
  /** Reviewer role only: parsed findings, present (possibly empty) only when status is "completed". */
  findings?: ReadonlyArray<unknown>;
};

export type RunAuditRecord = {
  runId: string;
  role: RuntimeBridgeRole;
  status: RuntimeBridgeTerminalStatus;
  refusalReason: RuntimeBridgeRefusalReason | null;
  startedAt: string;
  completedAt: string;
  command: string;
  workingDirectory: string;
  evidence: RuntimeBridgeEvidence;
};

export const RUNTIME_BRIDGE_DEFAULT_GRACE_PERIOD_MS = 2_000;
