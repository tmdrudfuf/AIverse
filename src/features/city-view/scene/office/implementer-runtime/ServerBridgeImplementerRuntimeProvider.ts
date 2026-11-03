import type { ImplementerRuntimeEvidence, ImplementerRuntimeStatus } from "./ImplementerRuntimeTypes";
import type {
  ImplementerRuntimeProvider,
  ImplementerRuntimeProviderCommand,
  ImplementerRuntimeProviderResult,
} from "./ImplementerRuntimeProvider";

const EXECUTE_ENDPOINT = "/api/runtime/execute";

const STATUS_FROM_BRIDGE: Record<string, ImplementerRuntimeStatus> = {
  completed: "Completed",
  failed: "Failed",
  timed_out: "TimedOut",
  cancelled: "Cancelled",
  refused: "Blocked",
};

/**
 * Browser-side `ImplementerRuntimeProvider`: a plain `fetch()` wrapper with
 * no `node:child_process` (or any other server-only) import, so it carries
 * no bundling risk at all -- unlike `ClaudeImplementerRuntimeProvider`, it
 * does not need the `typeof window` guard, because it never needs to no-op
 * in the browser; it IS the browser's path to real execution, mediated by
 * the server route at `EXECUTE_ENDPOINT` (see
 * specs/149-real-execution-server-bridge/contracts/real-execution-bridge.md).
 */
export class ServerBridgeImplementerRuntimeProvider implements ImplementerRuntimeProvider {
  readonly providerId = "claude";

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async invoke(command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult> {
    let response: Response;
    try {
      response = await this.fetchImpl(EXECUTE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "implementer", command }),
      });
    } catch {
      return { status: "Blocked", evidence: createUnreachableEvidence(command) };
    }

    if (!response.ok) {
      return { status: "Blocked", evidence: createUnreachableEvidence(command) };
    }

    const body = await response.json();
    return {
      status: STATUS_FROM_BRIDGE[body.status as string] ?? "Blocked",
      evidence: {
        providerId: "claude",
        agentId: "Claude",
        role: "Implementer",
        commandDisplay: body.evidence.commandDisplay,
        workingDirectory: body.evidence.workingDirectory,
        started: body.evidence.started,
        completed: body.evidence.completed,
        timedOut: body.evidence.timedOut,
        cancelled: body.evidence.cancelled,
        exitCode: body.evidence.exitCode,
        signal: body.evidence.signal,
        durationMs: body.evidence.durationMs,
        stdoutSummary: body.evidence.stdoutSummary,
        stderrSummary: body.evidence.stderrSummary,
        outputTruncated: body.evidence.outputTruncated,
      },
    };
  }
}

function createUnreachableEvidence(command: ImplementerRuntimeProviderCommand): ImplementerRuntimeEvidence {
  return {
    providerId: "claude",
    agentId: "Claude",
    role: "Implementer",
    commandDisplay: [command.command, ...command.arguments].join(" "),
    workingDirectory: command.workingDirectory,
    started: false,
    completed: false,
    timedOut: false,
    cancelled: false,
    durationMs: 0,
    stdoutSummary: "",
    stderrSummary: "The real execution server bridge could not be reached.",
    outputTruncated: false,
  };
}
