import { isSafeCommandLine } from "../runtime-preflight/RuntimePreflightProvider";
import type {
  ImplementerRuntimeProvider,
  ImplementerRuntimeProviderCommand,
  ImplementerRuntimeProviderResult,
} from "./ImplementerRuntimeProvider";

const OUTPUT_SUMMARY_MAX_LENGTH = 2000;
const PROVIDER_UNAVAILABLE_MESSAGE = "The Implementer runtime provider is not available in this environment.";
// A real spawn is a genuinely consequential action (a live Claude CLI agent
// process against this repository's own worktree) and this codebase's own
// test suite runs in a real Node environment, where the browser guard below
// does not apply. Requiring this explicit opt-in is what actually enforces
// "explicit human action" at the code level, not just at the UI-input
// level -- without it, any current or future automated test that reaches
// this provider unmocked would silently spawn a real agent process. This is
// not a hypothetical: exactly that happened during this feature's own
// development (five real Claude processes spawned by an early draft
// integration test) before this guard was added.
export const SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN";
const SPAWN_NOT_EXPLICITLY_ALLOWED_MESSAGE =
  `Real Claude CLI spawn requires ${SPAWN_ALLOW_ENV_VAR}=1 to be set explicitly.`;

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

/**
 * Real Claude CLI subprocess invocation, safe in both a browser session and
 * a Node process (this repository's own Vitest suite, or the documented
 * manual smoke script).
 *
 * `OfficeProjectPortalController`/`View`/`Registry` are transitively bundled
 * into the browser client (verified empirically -- see plan.md, Architecture
 * Decision 2). `node:child_process` cannot be statically imported anywhere
 * in that graph without breaking `npm run build`. This class is therefore
 * safe to construct and reference directly from the controller: it checks
 * `typeof window !== "undefined"` first and, only when that is false (a
 * genuine Node context), dynamically imports `node:child_process` and
 * performs a real, timeout-bounded, safety-validated `spawnSync` call. In an
 * actual browser session the guard is always true, so it reports
 * `Blocked` / `implementer_runtime_provider_unavailable` without ever
 * attempting the dynamic import.
 */
export class ClaudeImplementerRuntimeProvider implements ImplementerRuntimeProvider {
  readonly providerId = "claude";

  constructor(private readonly spawnSyncImpl?: SpawnSyncLike) {}

  async invoke(command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult> {
    const commandDisplay = formatCommandDisplay(command);

    if (!isSafeImplementerCommand(command)) {
      return {
        status: "Blocked",
        evidence: createEvidence(command, commandDisplay, {
          started: false,
          completed: false,
          timedOut: false,
          cancelled: false,
          durationMs: 0,
          stdoutSummary: "",
          stderrSummary: "Command rejected by safety validation.",
          outputTruncated: false,
        }),
      };
    }

    const spawnSyncImpl = await this.resolveSpawnSync();
    if (!spawnSyncImpl) {
      const message = typeof window !== "undefined" ? PROVIDER_UNAVAILABLE_MESSAGE : SPAWN_NOT_EXPLICITLY_ALLOWED_MESSAGE;
      return {
        status: "Blocked",
        evidence: createEvidence(command, commandDisplay, {
          started: false,
          completed: false,
          timedOut: false,
          cancelled: false,
          durationMs: 0,
          stdoutSummary: "",
          stderrSummary: message,
          outputTruncated: false,
        }),
      };
    }

    const resolvedArguments = substitutePromptPlaceholder(command.arguments, command.prompt, command.inputMode);
    const startedAt = Date.now();

    let raw: ReturnType<SpawnSyncLike>;
    try {
      raw = spawnSyncImpl(command.command, resolvedArguments, {
        cwd: command.workingDirectory,
        timeout: command.timeoutMs,
        killSignal: "SIGTERM",
      });
    } catch (error) {
      return {
        status: "Failed",
        evidence: createEvidence(command, commandDisplay, {
          started: true,
          completed: false,
          timedOut: false,
          cancelled: false,
          durationMs: Date.now() - startedAt,
          stdoutSummary: "",
          stderrSummary: "The Claude process could not be started.",
          outputTruncated: false,
        }),
      };
    }

    const durationMs = Date.now() - startedAt;
    const stdout = truncateOutput(bufferToString(raw.stdout));
    const stderr = truncateOutput(bufferToString(raw.stderr));

    if (raw.error?.code === "ETIMEDOUT" || raw.signal === "SIGTERM" || raw.signal === "SIGKILL") {
      return {
        status: "TimedOut",
        evidence: createEvidence(command, commandDisplay, {
          started: true,
          completed: false,
          timedOut: true,
          cancelled: false,
          signal: raw.signal ?? undefined,
          durationMs,
          stdoutSummary: stdout.text,
          stderrSummary: stderr.text,
          outputTruncated: stdout.truncated || stderr.truncated,
        }),
      };
    }

    if (raw.error) {
      return {
        status: "Failed",
        evidence: createEvidence(command, commandDisplay, {
          started: false,
          completed: false,
          timedOut: false,
          cancelled: false,
          durationMs,
          stdoutSummary: "",
          stderrSummary: "The Claude process could not be started.",
          outputTruncated: false,
        }),
      };
    }

    if (typeof raw.status !== "number") {
      return {
        status: "Failed",
        evidence: createEvidence(command, commandDisplay, {
          started: true,
          completed: false,
          timedOut: false,
          cancelled: false,
          durationMs,
          stdoutSummary: stdout.text,
          stderrSummary: "The Claude process returned no exit status.",
          outputTruncated: stdout.truncated || stderr.truncated,
        }),
      };
    }

    // A "Completed" status means the process ran to a real exit within the
    // timeout and produced a bounded result -- it does not mean the exit
    // code was zero, and it does not prove the implementation is correct.
    // The exit code is preserved in evidence for human inspection either way.
    return {
      status: "Completed",
      evidence: createEvidence(command, commandDisplay, {
        started: true,
        completed: true,
        timedOut: false,
        cancelled: false,
        exitCode: raw.status,
        durationMs,
        stdoutSummary: stdout.text,
        stderrSummary: stderr.text,
        outputTruncated: stdout.truncated || stderr.truncated,
      }),
    };
  }

  private async resolveSpawnSync(): Promise<SpawnSyncLike | undefined> {
    if (this.spawnSyncImpl) return this.spawnSyncImpl;
    if (typeof window !== "undefined") return undefined;
    if (process.env[SPAWN_ALLOW_ENV_VAR] !== "1") return undefined;
    const nodeChildProcess = await import("node:child_process");
    return nodeChildProcess.spawnSync as unknown as SpawnSyncLike;
  }
}

function createEvidence(
  command: ImplementerRuntimeProviderCommand,
  commandDisplay: string,
  fields: {
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
  },
) {
  return {
    providerId: "claude",
    agentId: "Claude",
    role: "Implementer" as const,
    commandDisplay,
    workingDirectory: command.workingDirectory,
    ...fields,
  };
}

function formatCommandDisplay(command: ImplementerRuntimeProviderCommand) {
  return [command.command, ...command.arguments].join(" ");
}

function substitutePromptPlaceholder(
  args: ReadonlyArray<string>,
  prompt: string,
  inputMode: ImplementerRuntimeProviderCommand["inputMode"],
) {
  if (inputMode !== "argument") return [...args];
  const substituted = args.map((arg) => (arg === "{{prompt}}" || arg === "{prompt}" ? prompt : arg));
  const promptAlreadyPresent = substituted.some((arg) => arg === prompt);
  return promptAlreadyPresent ? substituted : [...substituted, prompt];
}

function bufferToString(value: Buffer | string | null | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value.toString("utf8");
}

function truncateOutput(text: string) {
  if (text.length <= OUTPUT_SUMMARY_MAX_LENGTH) return { text, truncated: false };
  return { text: `${text.slice(0, OUTPUT_SUMMARY_MAX_LENGTH)}...`, truncated: true };
}

/**
 * Layers additional rejection patterns on top of the existing, reused
 * `isSafeCommandLine` (Runtime Preflight): shell chaining, command
 * substitution, encoded command wrappers, and path traversal -- none of
 * which the existing regex set covers.
 */
export function isSafeImplementerCommand(command: ImplementerRuntimeProviderCommand) {
  const joined = [command.command, ...command.arguments].join(" ");
  if (!isSafeCommandLine(joined)) return false;
  return isSafeImplementerCommandLine(joined) && !hasPathTraversal(command.workingDirectory);
}

export function isSafeImplementerCommandLine(commandLine: string) {
  const normalized = commandLine.trim();
  if (!normalized) return false;
  if (/(&&|\|\||[;|]|`|\$\()/.test(normalized)) return false;
  if (/-encodedcommand/i.test(normalized)) return false;
  if (/\bcmd\s*\/c\b/i.test(normalized)) return false;
  if (/curl\s+.*\|\s*sh\b/i.test(normalized)) return false;
  if (hasPathTraversal(normalized)) return false;
  return true;
}

export function hasPathTraversal(value: string) {
  return /\.\.[\\/]/.test(value);
}
