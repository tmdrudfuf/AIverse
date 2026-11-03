import { describe, expect, it, vi } from "vitest";
import { ServerBridgeReviewerRuntimeProvider } from "./ServerBridgeReviewerRuntimeProvider";
import type { ReviewerRuntimeProviderCommand } from "./ReviewerRuntimeProvider";

function createCommand(overrides: Partial<ReviewerRuntimeProviderCommand> = {}): ReviewerRuntimeProviderCommand {
  return {
    command: "codex",
    arguments: ["exec", "-"],
    inputMode: "stdin",
    workingDirectory: "C:/scratch/project-a",
    prompt: "review this",
    timeoutMs: 60_000,
    reviewTargetSha: "abc123",
    ...overrides,
  };
}

function fakeFetchReturning(bodyJson: unknown, ok = true) {
  return vi.fn(async () => ({
    ok,
    json: async () => bodyJson,
  })) as unknown as typeof fetch;
}

describe("ServerBridgeReviewerRuntimeProvider", () => {
  it("POSTs the reviewer role and command, and returns the parsed decision/findings", async () => {
    const fetchImpl = fakeFetchReturning({
      status: "completed",
      decision: "Approved",
      findings: [],
      evidence: {
        commandDisplay: "codex exec -",
        workingDirectory: "C:/scratch/project-a",
        started: true,
        completed: true,
        timedOut: false,
        exitCode: 0,
        durationMs: 2000,
        stdoutSummary: "# Review Decision: Approved",
        stderrSummary: "",
        outputTruncated: false,
      },
    });
    const provider = new ServerBridgeReviewerRuntimeProvider(fetchImpl);

    const result = await provider.invoke(createCommand());

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/runtime/execute",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ role: "reviewer", command: createCommand() }),
      }),
    );
    expect(result.status).toBe("Completed");
    expect(result.decision).toBe("Approved");
    expect(result.findings).toEqual([]);
    expect(result.evidence.reviewTargetSha).toBe("abc123");
  });

  it("maps a cancelled run to Failed, since ReviewerRuntimeStatus has no Cancelled member", async () => {
    const fetchImpl = fakeFetchReturning({
      status: "cancelled",
      decision: "Unknown",
      findings: [],
      evidence: {
        commandDisplay: "codex exec -",
        workingDirectory: "C:/scratch/project-a",
        started: true,
        completed: false,
        timedOut: false,
        durationMs: 500,
        stdoutSummary: "",
        stderrSummary: "",
        outputTruncated: false,
      },
    });
    const provider = new ServerBridgeReviewerRuntimeProvider(fetchImpl);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Failed");
    expect(result.decision).toBe("Unknown");
  });

  it("reports Blocked without throwing when the bridge cannot be reached", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network error");
    }) as unknown as typeof fetch;
    const provider = new ServerBridgeReviewerRuntimeProvider(fetchImpl);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Blocked");
    expect(result.decision).toBe("Unknown");
    expect(result.findings).toEqual([]);
  });
});
