import type { ReviewerRuntimeDecision, ReviewerRuntimeEvidence, ReviewerRuntimeFinding, ReviewerRuntimeStatus } from "./ReviewerRuntimeTypes";
import type {
  ReviewerRuntimeProvider,
  ReviewerRuntimeProviderCommand,
  ReviewerRuntimeProviderResult,
} from "./ReviewerRuntimeProvider";

const EXECUTE_ENDPOINT = "/api/runtime/execute";

// ReviewerRuntimeStatus (unlike ImplementerRuntimeStatus) has no "Cancelled"
// member -- a reviewer run never reached that distinction in the existing
// type system. An operator-cancelled reviewer run is mapped to "Failed"
// (the closest existing terminal non-success status) rather than widening
// that shared type for this one case; `evidence.cancelled` is not part of
// ReviewerRuntimeEvidence either, so the cancellation itself is still
// visible in `stderrSummary`.
const STATUS_FROM_BRIDGE: Record<string, ReviewerRuntimeStatus> = {
  completed: "Completed",
  failed: "Failed",
  timed_out: "TimedOut",
  cancelled: "Failed",
  refused: "Blocked",
};

/**
 * Browser-side `ReviewerRuntimeProvider`: a plain `fetch()` wrapper, mirroring
 * `ServerBridgeImplementerRuntimeProvider` for the Reviewer/Codex role,
 * including the same caller-generated `runId` / `getActiveRunId()` /
 * `cancelActiveRun()` mechanism -- see that file's own comment for why
 * either exists.
 *
 * `activeRunId` holds exactly one in-flight run (round-4 review finding
 * N-004, non-blocking) -- see `ServerBridgeImplementerRuntimeProvider`'s
 * own comment on the same constraint; `ReviewerRuntimeService` is this
 * provider's only real caller and already serializes its calls the same
 * way.
 */
export class ServerBridgeReviewerRuntimeProvider implements ReviewerRuntimeProvider {
  readonly providerId = "codex";
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

  async invoke(command: ReviewerRuntimeProviderCommand): Promise<ReviewerRuntimeProviderResult> {
    const runId = globalThis.crypto.randomUUID();
    this.activeRunId = runId;
    try {
      let response: Response;
      try {
        response = await this.fetchImpl(EXECUTE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "reviewer", command, runId }),
        });
      } catch {
        return { status: "Blocked", decision: "Unknown", findings: [], evidence: createUnreachableEvidence(command) };
      }

      if (!response.ok) {
        return { status: "Blocked", decision: "Unknown", findings: [], evidence: createUnreachableEvidence(command) };
      }

      let body: {
        status?: string;
        decision?: string;
        findings?: ReviewerRuntimeFinding[];
        evidence?: Partial<ReviewerRuntimeEvidence>;
      };
      try {
        body = await response.json();
        if (!body?.evidence) throw new Error("malformed response");
      } catch {
        return { status: "Blocked", decision: "Unknown", findings: [], evidence: createUnreachableEvidence(command) };
      }

      return {
        status: STATUS_FROM_BRIDGE[body.status as string] ?? "Blocked",
        decision: (body.decision as ReviewerRuntimeDecision) ?? "Unknown",
        findings: body.findings ?? [],
        evidence: {
          providerId: "codex",
          agentId: "Codex",
          role: "Reviewer",
          commandDisplay: body.evidence.commandDisplay ?? "",
          workingDirectory: body.evidence.workingDirectory ?? command.workingDirectory,
          reviewTargetSha: command.reviewTargetSha,
          started: Boolean(body.evidence.started),
          completed: Boolean(body.evidence.completed),
          timedOut: Boolean(body.evidence.timedOut),
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

function createUnreachableEvidence(command: ReviewerRuntimeProviderCommand): ReviewerRuntimeEvidence {
  return {
    providerId: "codex",
    agentId: "Codex",
    role: "Reviewer",
    commandDisplay: [command.command, ...command.arguments].join(" "),
    workingDirectory: command.workingDirectory,
    reviewTargetSha: command.reviewTargetSha,
    started: false,
    completed: false,
    timedOut: false,
    durationMs: 0,
    stdoutSummary: "",
    stderrSummary: "The real execution server bridge could not be reached.",
    outputTruncated: false,
  };
}
