import { describe, expect, it, vi } from "vitest";

import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { ServerBridgeImplementerRuntimeProvider } from "./implementer-runtime/ServerBridgeImplementerRuntimeProvider";
import { ServerBridgeReviewerRuntimeProvider } from "./reviewer-runtime/ServerBridgeReviewerRuntimeProvider";
import { createSceneStub, getControllerInternals } from "./OfficeProjectPortalController.testHelpers";

function fakeFetch(onCall: (url: string, init?: RequestInit) => unknown) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const pending = onCall(url, init);
    if (pending) return { ok: true, json: async () => pending };
    return new Promise(() => {}); // never resolves -- simulates a genuinely in-flight POST
  }) as unknown as typeof fetch;
}

describe("OfficeProjectPortalController T029 cancel control", () => {
  it("reports null when neither bridge provider has an active run", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());

    expect(controller.getActiveRuntimeBridgeRunId()).toBeNull();
  });

  it("reports the implementer bridge provider's active runId while its invoke() is in flight, and cancels it", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);

    let deleteCalled = false;
    const fetchImpl = fakeFetch((_url, init) => {
      if (init?.method === "DELETE") {
        deleteCalled = true;
        return { runId: "x", accepted: true };
      }
      return undefined;
    });
    internals.implementerRuntimeBridgeProvider = new ServerBridgeImplementerRuntimeProvider(fetchImpl);

    const invokePromise = internals.implementerRuntimeBridgeProvider.invoke({
      command: "claude",
      arguments: ["-p", "x"],
      inputMode: "argument",
      workingDirectory: "C:/scratch",
      prompt: "x",
      timeoutMs: 60_000,
    });

    expect(controller.getActiveRuntimeBridgeRunId()).not.toBeNull();

    const accepted = await controller.cancelActiveRuntimeBridgeRun();

    expect(accepted).toBe(true);
    expect(deleteCalled).toBe(true);

    void invokePromise; // intentionally left pending -- this test only exercises the cancel call itself
  });

  it("falls back to the reviewer bridge provider when the implementer one has no active run", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);

    let deleteCalled = false;
    const fetchImpl = fakeFetch((_url, init) => {
      if (init?.method === "DELETE") {
        deleteCalled = true;
        return { runId: "x", accepted: true };
      }
      return undefined;
    });
    internals.reviewerRuntimeBridgeProvider = new ServerBridgeReviewerRuntimeProvider(fetchImpl);

    const invokePromise = internals.reviewerRuntimeBridgeProvider.invoke({
      command: "codex",
      arguments: ["exec", "-"],
      inputMode: "stdin",
      workingDirectory: "C:/scratch",
      prompt: "x",
      timeoutMs: 60_000,
      reviewTargetSha: "abc",
    });

    expect(controller.getActiveRuntimeBridgeRunId()).not.toBeNull();

    const accepted = await controller.cancelActiveRuntimeBridgeRun();

    expect(accepted).toBe(true);
    expect(deleteCalled).toBe(true);

    void invokePromise;
  });

  it("cancelActiveRuntimeBridgeRun() returns false when nothing is active", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());

    expect(await controller.cancelActiveRuntimeBridgeRun()).toBe(false);
  });
});
