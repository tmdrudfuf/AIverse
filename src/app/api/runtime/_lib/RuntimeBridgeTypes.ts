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
  files?: ReadonlyArray<RuntimeBridgeCommandFile>;
  timeoutMs: number;
};

export type RuntimeBridgeExecuteRequest = {
  projectId: string;
  role: RuntimeBridgeRole;
  command: RuntimeBridgeCommand;
};

export type RuntimeBridgeEvidence = {
  started: boolean;
  completed: boolean;
  timedOut: boolean;
  cancelled: boolean;
  exitCode?: number;
  signal?: string;
  stdoutSummary: string;
  stderrSummary: string;
  commandDisplay: string;
  workingDirectory: string;
};

export type RuntimeBridgeExecuteResponse = {
  runId: string;
  status: RuntimeBridgeStatus;
  refusalReason: RuntimeBridgeRefusalReason | null;
  evidence: RuntimeBridgeEvidence;
};

export type RunAuditRecord = {
  runId: string;
  projectId: string;
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
