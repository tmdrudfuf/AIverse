import { isSafeImplementerCommandLine } from "../implementer-runtime/ClaudeImplementerRuntimeProvider";
import { isSafeCommandLine } from "../runtime-preflight/RuntimePreflightProvider";
import { parseReviewOutput } from "./ReviewDecisionParser";
import type {
  ReviewerRuntimeProvider,
  ReviewerRuntimeProviderCommand,
  ReviewerRuntimeProviderResult,
} from "./ReviewerRuntimeProvider";

const OUTPUT_SUMMARY_MAX_LENGTH = 2000;
const PROVIDER_UNAVAILABLE_MESSAGE = "The Reviewer runtime provider is not available in this environment.";
// Distinct from Spec 075's AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN by design:
// the Implementer spawn gate alone must never enable a real Codex spawn (and
// vice versa). This is the fix for Spec 075's own documented NB-001
// non-blocking finding (Implementer Provider Boundary docs did not
// explicitly restate the env-var gate alongside the browser guard) -- this
// gate is restated here, in the provider contract (contracts/provider-contract.md),
// the implementation plan (plan.md, Architecture Decision 4), and the
// quickstart (quickstart.md), not only in this comment.
export const REVIEWER_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN";
const SPAWN_NOT_EXPLICITLY_ALLOWED_MESSAGE =
  `Real Codex CLI spawn requires ${REVIEWER_SPAWN_ALLOW_ENV_VAR}=1 to be set explicitly.`;

type SpawnSyncLike = (
  command: string,
  args: ReadonlyArray<string>,
  options: { cwd: string; input?: string; timeout: number; killSignal: string },
) => {
  status: number | null;
  signal: string | null;
  error?: { code?: string; message?: string };
  stdout?: Buffer | string | null;
  stderr?: Buffer | string | null;
};

/**
 * Real Codex CLI subprocess invocation, safe in both a browser session and a
 * Node process, mirroring `ClaudeImplementerRuntimeProvider`'s double-gate
 * boundary exactly: `typeof window !== "undefined"` first, then a second,
 * independent, explicit `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN=1` opt-in
 * before dynamically importing `node:child_process`. Codex reviews the exact
 * repository/commit in `workingDirectory` itself rather than product code
 * embedding a diff into the prompt (see contracts/prompt-contract.md).
 */
export class CodexReviewerRuntimeProvider implements ReviewerRuntimeProvider {
  readonly providerId = "codex";

  constructor(private readonly spawnSyncImpl?: SpawnSyncLike) {}

  async invoke(command: ReviewerRuntimeProviderCommand): Promise<ReviewerRuntimeProviderResult> {
    const commandDisplay = formatCommandDisplay(command);

    if (!isSafeReviewerCommand(command)) {
      return {
        status: "Blocked",
        decision: "Unknown",
        findings: [],
        evidence: createEvidence(command, commandDisplay, {
          started: false,
          completed: false,
          timedOut: false,
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
        decision: "Unknown",
        findings: [],
        evidence: createEvidence(command, commandDisplay, {
          started: false,
          completed: false,
          timedOut: false,
          durationMs: 0,
          stdoutSummary: "",
          stderrSummary: message,
          outputTruncated: false,
        }),
      };
    }

    const startedAt = Date.now();
    let raw: ReturnType<SpawnSyncLike>;
    try {
      raw = spawnSyncImpl(command.command, command.arguments, {
        cwd: command.workingDirectory,
        input: command.inputMode === "stdin" ? command.prompt : undefined,
        timeout: command.timeoutMs,
        killSignal: "SIGTERM",
      });
    } catch {
      return {
        status: "Failed",
        decision: "Unknown",
        findings: [],
        evidence: createEvidence(command, commandDisplay, {
          started: true,
          completed: false,
          timedOut: false,
          durationMs: Date.now() - startedAt,
          stdoutSummary: "",
          stderrSummary: "The Codex process could not be started.",
          outputTruncated: false,
        }),
      };
    }

    const durationMs = Date.now() - startedAt;
    const stdoutFull = bufferToString(raw.stdout);
    const stdout = truncateOutput(stdoutFull);
    const stderr = truncateOutput(bufferToString(raw.stderr));

    if (raw.error?.code === "ETIMEDOUT" || raw.signal === "SIGTERM" || raw.signal === "SIGKILL") {
      return {
        status: "TimedOut",
        decision: "Unknown",
        findings: [],
        evidence: createEvidence(command, commandDisplay, {
          started: true,
          completed: false,
          timedOut: true,
          signal: raw.signal ?? undefined,
          durationMs,
          stdoutSummary: stdout.text,
          stderrSummary: stderr.text,
          outputTruncated: stdout.truncated || stderr.truncated,
        }),
      };
    }

    if (raw.error || typeof raw.status !== "number") {
      return {
        status: "Failed",
        decision: "Unknown",
        findings: [],
        evidence: createEvidence(command, commandDisplay, {
          started: true,
          completed: false,
          timedOut: false,
          durationMs,
          stdoutSummary: stdout.text,
          stderrSummary: raw.error ? "The Codex process could not be started." : "The Codex process returned no exit status.",
          outputTruncated: stdout.truncated || stderr.truncated,
        }),
      };
    }

    const parsed = parseReviewOutput(stdoutFull, raw.status);
    return {
      status: "Completed",
      decision: parsed.decision,
      findings: parsed.findings,
      evidence: createEvidence(command, commandDisplay, {
        started: true,
        completed: true,
        timedOut: false,
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
    if (process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] !== "1") return undefined;
    const nodeChildProcess = await import("node:child_process");
    return nodeChildProcess.spawnSync as unknown as SpawnSyncLike;
  }
}

function createEvidence(
  command: ReviewerRuntimeProviderCommand,
  commandDisplay: string,
  fields: {
    started: boolean;
    completed: boolean;
    timedOut: boolean;
    exitCode?: number;
    signal?: string;
    durationMs: number;
    stdoutSummary: string;
    stderrSummary: string;
    outputTruncated: boolean;
  },
) {
  return {
    providerId: "codex",
    agentId: "Codex",
    role: "Reviewer" as const,
    commandDisplay,
    workingDirectory: command.workingDirectory,
    reviewTargetSha: command.reviewTargetSha,
    ...fields,
  };
}

function formatCommandDisplay(command: ReviewerRuntimeProviderCommand) {
  return [command.command, ...command.arguments].join(" ");
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
 * Reuses the two existing, independently-maintained safety checks
 * (runtime-preflight's `isSafeCommandLine` and the Implementer Runtime's
 * `isSafeImplementerCommandLine`) rather than a third, narrower copy -- see
 * plan.md, Architecture Decision 5 -- and layers one additional check
 * (unsafe redirection) neither of them covers.
 */
export function isSafeReviewerCommand(command: ReviewerRuntimeProviderCommand) {
  const joined = [command.command, ...command.arguments].join(" ");
  if (!isSafeCommandLine(joined)) return false;
  if (!isSafeImplementerCommandLine(joined)) return false;
  return !hasUnsafeRedirection(joined);
}

function hasUnsafeRedirection(value: string) {
  return /[<>]/.test(value);
}
