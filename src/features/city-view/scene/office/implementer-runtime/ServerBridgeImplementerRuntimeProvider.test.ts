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

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toBe("/api/runtime/execute");
    expect(init?.method).toBe("POST");
    const sentBody = JSON.parse(init?.body as string);
    expect(sentBody.role).toBe("implementer");
    expect(sentBody.command).toEqual(createCommand());
    expect(typeof sentBody.runId).toBe("string");
    expect(sentBody.runId.length).toBeGreaterThan(0);
    expect(result.status).toBe("Completed");
    expect(result.evidence.stdoutSummary).toBe("done");
    expect(result.evidence.role).toBe("Implementer");
  });

  it("exposes the active run's id only while invoke() is in flight, and clears it once resolved", async () => {
    let capturedRunId: string | null = null;
    const provider = new ServerBridgeImplementerRuntimeProvider(
      vi.fn(async (_url, init: RequestInit) => {
        capturedRunId = JSON.parse(init.body as string).runId;
        expect(provider.getActiveRunId()).toBe(capturedRunId);
        return {
          ok: true,
          json: async () => ({
            status: "completed",
            evidence: {
              commandDisplay: "claude",
              workingDirectory: "C:/scratch/project-a",
              started: true,
              completed: true,
              timedOut: false,
              cancelled: false,
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

    expect(provider.getActiveRunId()).toBeNull();
    await provider.invoke(createCommand());
    expect(provider.getActiveRunId()).toBeNull();
    expect(capturedRunId).not.toBeNull();
  });

  it("cancelActiveRun() DELETEs the active run and returns the server's accepted flag", async () => {
    const calls: Array<[string, string | undefined]> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push([url, init?.method]);
      if (init?.method === "DELETE") return { ok: true, json: async () => ({ runId: "x", accepted: true }) };
      return {
        ok: true,
        json: async () => ({
          status: "cancelled",
          evidence: {
            commandDisplay: "claude",
            workingDirectory: "C:/scratch/project-a",
            started: true,
            completed: false,
            timedOut: false,
            cancelled: true,
            durationMs: 10,
            stdoutSummary: "",
            stderrSummary: "",
            outputTruncated: false,
          },
        }),
      };
    }) as unknown as typeof fetch;
    const provider = new ServerBridgeImplementerRuntimeProvider(fetchImpl);

    const invokePromise = provider.invoke(createCommand());
    const accepted = await provider.cancelActiveRun();
    await invokePromise;

    expect(accepted).toBe(true);
    expect(calls.some(([, method]) => method === "DELETE")).toBe(true);
  });

  it("cancelActiveRun() returns false when no run is in flight", async () => {
    const provider = new ServerBridgeImplementerRuntimeProvider(vi.fn() as unknown as typeof fetch);

    expect(await provider.cancelActiveRun()).toBe(false);
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
