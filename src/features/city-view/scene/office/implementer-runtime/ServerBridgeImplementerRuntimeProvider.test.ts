import { describe, expect, it, vi } from "vitest";
import { ServerBridgeImplementerRuntimeProvider } from "./ServerBridgeImplementerRuntimeProvider";
import type { ImplementerRuntimeProviderCommand } from "./ImplementerRuntimeProvider";

function createCommand(overrides: Partial<ImplementerRuntimeProviderCommand> = {}): ImplementerRuntimeProviderCommand {
  return {
    command: "claude",
    arguments: ["-p", "{{prompt}}"],
    inputMode: "argument",
    workingDirectory: "C:/scratch/project-a",
    prompt: "do the thing",
    timeoutMs: 60_000,
    ...overrides,
  };
}

function fakeFetchReturning(bodyJson: unknown, ok = true) {
  return vi.fn(async () => ({
    ok,
    json: async () => bodyJson,
  })) as unknown as typeof fetch;
}

describe("ServerBridgeImplementerRuntimeProvider", () => {
  it("POSTs the implementer role and command to the execute endpoint", async () => {
    const fetchImpl = fakeFetchReturning({
      status: "completed",
      evidence: {
        commandDisplay: "claude -p do the thing",
        workingDirectory: "C:/scratch/project-a",
        started: true,
        completed: true,
        timedOut: false,
        cancelled: false,
        exitCode: 0,
        durationMs: 1200,
        stdoutSummary: "done",
        stderrSummary: "",
        outputTruncated: false,
      },
    });
    const provider = new ServerBridgeImplementerRuntimeProvider(fetchImpl);

    const result = await provider.invoke(createCommand());

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/runtime/execute",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ role: "implementer", command: createCommand() }),
      }),
    );
    expect(result.status).toBe("Completed");
    expect(result.evidence.stdoutSummary).toBe("done");
    expect(result.evidence.role).toBe("Implementer");
  });

  it("maps each bridge status onto the existing ImplementerRuntimeStatus", async () => {
    const cases: Array<[string, string]> = [
      ["failed", "Failed"],
      ["timed_out", "TimedOut"],
      ["cancelled", "Cancelled"],
      ["refused", "Blocked"],
    ];

    for (const [bridgeStatus, expected] of cases) {
      const fetchImpl = fakeFetchReturning({
        status: bridgeStatus,
        evidence: {
          commandDisplay: "claude -p x",
          workingDirectory: "C:/scratch/project-a",
          started: false,
          completed: false,
          timedOut: bridgeStatus === "timed_out",
          cancelled: bridgeStatus === "cancelled",
          durationMs: 0,
          stdoutSummary: "",
          stderrSummary: "",
          outputTruncated: false,
        },
      });
      const provider = new ServerBridgeImplementerRuntimeProvider(fetchImpl);

      const result = await provider.invoke(createCommand());

      expect(result.status).toBe(expected);
    }
  });

  it("reports Blocked without throwing when the bridge cannot be reached", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network error");
    }) as unknown as typeof fetch;
    const provider = new ServerBridgeImplementerRuntimeProvider(fetchImpl);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Blocked");
    expect(result.evidence.started).toBe(false);
  });

  it("reports Blocked when the bridge responds with a non-ok HTTP status", async () => {
    const fetchImpl = fakeFetchReturning({}, false);
    const provider = new ServerBridgeImplementerRuntimeProvider(fetchImpl);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Blocked");
  });
});
