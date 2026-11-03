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
 *
 * Generates its own `runId` (a round-2 independent review finding, P2-003):
 * the server route's response only carries a run's id once that run is
 * already terminal, so without a caller-supplied id there would be no way
 * to look up and cancel a run while it is still in flight. `getActiveRunId`/
 * `cancelActiveRun` expose that id and a cancel action for exactly this;
 * `OfficeProjectPortalController.cancelActiveRuntimeBridgeRun()` calls the
 * latter from the office UI's Cancel control (Spec 149 T029).
 *
 * `activeRunId` holds exactly one in-flight run (round-4 review finding
 * N-004, non-blocking): a second concurrent `invoke()` on the SAME
 * instance would overwrite it, making `cancelActiveRun()` target the
 * wrong run. `ImplementerRuntimeService` (this provider's only real
 * caller) already serializes calls to its one provider instance and
 * refuses a second concurrent start before ever reaching `invoke()`
 * again, so this is a latent constraint on how this class may be reused,
 * not a reachable bug in this provider's current, only caller.
 */
export class ServerBridgeImplementerRuntimeProvider implements ImplementerRuntimeProvider {
  readonly providerId = "claude";
  private activeRunId: string | null = null;

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  getActiveRunId(): string | null {
    return this.activeRunId;
  }

  async cancelActiveRun(): Promise<boolean> {
    const runId = this.activeRunId;
    if (!runId) return false;
    try {
      const response = await this.fetchImpl(`${EXECUTE_ENDPOINT}/${runId}`, { method: "DELETE" });
      if (!response.ok) return false;
      const body = await response.json();
      return Boolean(body?.accepted);
    } catch {
      return false;
    }
  }

  async invoke(command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult> {
    const runId = globalThis.crypto.randomUUID();
    this.activeRunId = runId;
    try {
      let response: Response;
      try {
        response = await this.fetchImpl(EXECUTE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "implementer", command, runId }),
        });
      } catch {
        return { status: "Blocked", evidence: createUnreachableEvidence(command) };
      }

      if (!response.ok) {
        return { status: "Blocked", evidence: createUnreachableEvidence(command) };
      }

      let body: { status?: string; evidence?: Partial<ImplementerRuntimeEvidence> };
      try {
        body = await response.json();
        if (!body?.evidence) throw new Error("malformed response");
      } catch {
        return { status: "Blocked", evidence: createUnreachableEvidence(command) };
      }

      return {
        status: STATUS_FROM_BRIDGE[body.status as string] ?? "Blocked",
        evidence: {
          providerId: "claude",
          agentId: "Claude",
          role: "Implementer",
          commandDisplay: body.evidence.commandDisplay ?? "",
          workingDirectory: body.evidence.workingDirectory ?? command.workingDirectory,
          started: Boolean(body.evidence.started),
          completed: Boolean(body.evidence.completed),
          timedOut: Boolean(body.evidence.timedOut),
          cancelled: Boolean(body.evidence.cancelled),
          exitCode: body.evidence.exitCode,
          signal: body.evidence.signal,
          durationMs: body.evidence.durationMs ?? 0,
          stdoutSummary: body.evidence.stdoutSummary ?? "",
          stderrSummary: body.evidence.stderrSummary ?? "",
          outputTruncated: Boolean(body.evidence.outputTruncated),
        },
      };
    } finally {
      this.activeRunId = null;
    }
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
