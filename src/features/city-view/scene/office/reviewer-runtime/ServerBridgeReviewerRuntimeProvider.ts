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
 * `ServerBridgeImplementerRuntimeProvider` for the Reviewer/Codex role. See
 * that file's own comment for why this carries no bundling risk.
 */
export class ServerBridgeReviewerRuntimeProvider implements ReviewerRuntimeProvider {
  readonly providerId = "codex";

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async invoke(command: ReviewerRuntimeProviderCommand): Promise<ReviewerRuntimeProviderResult> {
    let response: Response;
    try {
      response = await this.fetchImpl(EXECUTE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reviewer", command }),
      });
    } catch {
      return { status: "Blocked", decision: "Unknown", findings: [], evidence: createUnreachableEvidence(command) };
    }

    if (!response.ok) {
      return { status: "Blocked", decision: "Unknown", findings: [], evidence: createUnreachableEvidence(command) };
    }

    const body = await response.json();
    return {
      status: STATUS_FROM_BRIDGE[body.status as string] ?? "Blocked",
      decision: (body.decision as ReviewerRuntimeDecision) ?? "Unknown",
      findings: (body.findings as ReviewerRuntimeFinding[]) ?? [],
      evidence: {
        providerId: "codex",
        agentId: "Codex",
        role: "Reviewer",
        commandDisplay: body.evidence.commandDisplay,
        workingDirectory: body.evidence.workingDirectory,
        reviewTargetSha: command.reviewTargetSha,
        started: body.evidence.started,
        completed: body.evidence.completed,
        timedOut: body.evidence.timedOut,
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
