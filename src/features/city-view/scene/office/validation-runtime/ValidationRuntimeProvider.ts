import { hasPathTraversal, isSafeImplementerCommandLine } from "../implementer-runtime/ClaudeImplementerRuntimeProvider";
import { isSafeCommandLine } from "../runtime-preflight/RuntimePreflightProvider";
import type { ValidationCommandEvidence, ValidationRuntimeEvidence, ValidationRuntimeStatus } from "./ValidationRuntimeTypes";

const OUTPUT_SUMMARY_MAX_LENGTH = 2000;
export const VALIDATION_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_VALIDATION_RUNTIME_SPAWN";

type SpawnSyncLike = (
  command: string,
  args: ReadonlyArray<string>,
  options: { cwd: string; timeout: number; killSignal: string },
) => {
  status: number | null;
  signal: string | null;
  error?: { code?: string; message?: string };
  stdout?: Buffer | string | null;
  stderr?: Buffer | string | null;
};

export type ValidationRuntimeProviderCommand = {
  workingDirectory: string;
  expectedHead: string;
  commands: ReadonlyArray<string>;
  timeoutMs: number;
};

export type ValidationRuntimeProviderResult = {
  status: ValidationRuntimeStatus;
  evidence: ValidationRuntimeEvidence;
};

export type ValidationRuntimeProvider = {
  readonly providerId: string;
  invoke(command: ValidationRuntimeProviderCommand): Promise<ValidationRuntimeProviderResult>;
};

export class LocalValidationRuntimeProvider implements ValidationRuntimeProvider {
  readonly providerId = "local-validation";

  constructor(private readonly spawnSyncImpl?: SpawnSyncLike) {}

  async invoke(command: ValidationRuntimeProviderCommand): Promise<ValidationRuntimeProviderResult> {
    const parsedCommands = command.commands.map(parseValidationCommand);
    const unsafeIndex = parsedCommands.findIndex((parsed) => !parsed);
    if (unsafeIndex >= 0 || !isValidTimeout(command.timeoutMs) || hasPathTraversal(command.workingDirectory)) {
      return this.blocked(command, "Command rejected by safety validation.");
    }

    const spawnSyncImpl = await this.resolveSpawnSync();
    if (!spawnSyncImpl) {
      const message = typeof window !== "undefined"
        ? "The Validation Runtime provider is not available in this environment."
        : `Real validation spawn requires ${VALIDATION_SPAWN_ALLOW_ENV_VAR}=1 to be set explicitly.`;
      return this.blocked(command, message);
    }

    const evidences: ValidationCommandEvidence[] = [];
    for (const parsed of parsedCommands) {
      if (!parsed) continue;
      const startedAt = Date.now();
      let raw: ReturnType<SpawnSyncLike>;
      try {
        raw = spawnSyncImpl(parsed.command, parsed.args, {
          cwd: command.workingDirectory,
          timeout: command.timeoutMs,
          killSignal: "SIGTERM",
        });
      } catch {
        evidences.push(createCommandEvidence(parsed.display, {
          started: true,
          completed: false,
          timedOut: false,
          durationMs: Date.now() - startedAt,
          stdoutSummary: "",
          stderrSummary: "The validation command could not be started.",
          outputTruncated: false,
        }));
        continue;
      }

      const stdout = truncateOutput(bufferToString(raw.stdout));
      const stderr = truncateOutput(bufferToString(raw.stderr));
      const timedOut = raw.error?.code === "ETIMEDOUT" || raw.signal === "SIGTERM" || raw.signal === "SIGKILL";
      evidences.push(createCommandEvidence(parsed.display, {
        started: true,
        completed: !raw.error && !timedOut && raw.status === 0,
        timedOut,
        exitCode: typeof raw.status === "number" ? raw.status : undefined,
        signal: raw.signal ?? undefined,
        durationMs: Date.now() - startedAt,
        stdoutSummary: stdout.text,
        stderrSummary: raw.error && !timedOut ? "The validation command failed to run." : stderr.text,
        outputTruncated: stdout.truncated || stderr.truncated,
      }));
    }

    return {
      status: statusFromEvidence(evidences),
      evidence: createEvidence(this.providerId, command, evidences),
    };
  }

  private blocked(command: ValidationRuntimeProviderCommand, stderrSummary: string): ValidationRuntimeProviderResult {
    const evidences = command.commands.map((display) => createCommandEvidence(display, {
      started: false,
      completed: false,
      timedOut: false,
      durationMs: 0,
      stdoutSummary: "",
      stderrSummary,
      outputTruncated: false,
    }));
    return { status: "Blocked", evidence: createEvidence(this.providerId, command, evidences) };
  }

  private async resolveSpawnSync(): Promise<SpawnSyncLike | undefined> {
    if (this.spawnSyncImpl) return this.spawnSyncImpl;
    if (typeof window !== "undefined") return undefined;
    if (process.env[VALIDATION_SPAWN_ALLOW_ENV_VAR] !== "1") return undefined;
    const nodeChildProcess = await import("node:child_process");
    return nodeChildProcess.spawnSync as unknown as SpawnSyncLike;
  }
}

export function isSafeValidationCommandLine(commandLine: string) {
  if (!isSafeCommandLine(commandLine)) return false;
  if (!isSafeImplementerCommandLine(commandLine)) return false;
  if (/[<>]/.test(commandLine)) return false;
  return Boolean(parseValidationCommand(commandLine));
}

function parseValidationCommand(commandLine: string): { command: string; args: string[]; display: string } | undefined {
  const normalized = commandLine.trim();
  if (!normalized || /["']/.test(normalized)) return undefined;
  if (/(&&|\|\||[;|<>`]|\\\n|\$\()/.test(normalized)) return undefined;
  if (hasPathTraversal(normalized)) return undefined;
  const parts = normalized.split(/\s+/);
  if (parts.length === 0 || parts.some((part) => !part.trim())) return undefined;
  return { command: parts[0]!, args: parts.slice(1), display: normalized };
}

function createEvidence(
  providerId: string,
  command: ValidationRuntimeProviderCommand,
  commands: ValidationCommandEvidence[],
): ValidationRuntimeEvidence {
  return {
    providerId,
    role: "ValidationRuntime",
    workingDirectory: command.workingDirectory,
    expectedHead: command.expectedHead,
    commandCount: commands.length,
    completedCommandCount: commands.filter((item) => item.completed).length,
    failedCommandCount: commands.filter((item) => item.started && !item.completed && !item.timedOut).length,
    timedOutCommandCount: commands.filter((item) => item.timedOut).length,
    commands,
  };
}

function createCommandEvidence(commandDisplay: string, fields: Omit<ValidationCommandEvidence, "commandDisplay">): ValidationCommandEvidence {
  return { commandDisplay, ...fields };
}

function statusFromEvidence(evidence: ReadonlyArray<ValidationCommandEvidence>): ValidationRuntimeStatus {
  if (evidence.some((item) => item.timedOut)) return "TimedOut";
  if (evidence.length > 0 && evidence.every((item) => item.completed && item.exitCode === 0)) return "Completed";
  return "Failed";
}

function isValidTimeout(timeoutMs: number) {
  return Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 30 * 60 * 1000;
}

function bufferToString(value: Buffer | string | null | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value.toString("utf8");
}

function truncateOutput(text: string) {
  if (text.length <= OUTPUT_SUMMARY_MAX_LENGTH) return { text, truncated: false };
  return { text: `${text.slice(0, OUTPUT_SUMMARY_MAX_LENGTH)}...`, truncated: true };
}
