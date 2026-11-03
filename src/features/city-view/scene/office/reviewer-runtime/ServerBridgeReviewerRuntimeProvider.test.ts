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

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toBe("/api/runtime/execute");
    expect(init?.method).toBe("POST");
    const sentBody = JSON.parse(init?.body as string);
    expect(sentBody.role).toBe("reviewer");
    expect(sentBody.command).toEqual(createCommand());
    expect(typeof sentBody.runId).toBe("string");
    expect(result.status).toBe("Completed");
    expect(result.decision).toBe("Approved");
    expect(result.findings).toEqual([]);
    expect(result.evidence.reviewTargetSha).toBe("abc123");
  });

  it("exposes the active run's id only while invoke() is in flight", async () => {
    let sawActiveRunIdDuringFetch = false;
    const provider = new ServerBridgeReviewerRuntimeProvider(
      vi.fn(async () => {
        sawActiveRunIdDuringFetch = provider.getActiveRunId() !== null;
        return {
          ok: true,
          json: async () => ({
            status: "completed",
            decision: "Approved",
            findings: [],
            evidence: {
              commandDisplay: "codex",
              workingDirectory: "C:/scratch/project-a",
              started: true,
              completed: true,
              timedOut: false,
              exitCode: 0,
              durationMs: 10,
              stdoutSummary: "",
              stderrSummary: "",
              outputTruncated: false,
            },
          }),
        };
      }) as unknown as typeof fetch,
    );

    await provider.invoke(createCommand());

    expect(sawActiveRunIdDuringFetch).toBe(true);
    expect(provider.getActiveRunId()).toBeNull();
  });

  it("cancelActiveRun() returns false when no run is in flight", async () => {
    const provider = new ServerBridgeReviewerRuntimeProvider(vi.fn() as unknown as typeof fetch);

    expect(await provider.cancelActiveRun()).toBe(false);
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
