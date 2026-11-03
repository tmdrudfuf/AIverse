import { describe, expect, it } from "vitest";
import { DELETE } from "./route";
import { getSharedRuntimeBridgeRunRegistry } from "../../_lib/RuntimeBridgeRunRegistry";

function deleteRequest(runId: string) {
  return { params: Promise.resolve({ runId }) };
}

describe("DELETE /api/runtime/execute/[runId]", () => {
  it("delegates to the shared registry's cancel() and returns accepted: true for a known in-flight run", async () => {
    const registry = getSharedRuntimeBridgeRunRegistry();
    let cancelled = false;
    registry.tryStart("c:/scratch/delete-route-test-a", "run-delete-1", {
      cancel: () => {
        cancelled = true;
        return true;
      },
    });

    const response = await DELETE(new Request("http://localhost"), deleteRequest("run-delete-1"));
    const body = await response.json();

    expect(body).toEqual({ runId: "run-delete-1", accepted: true });
    expect(cancelled).toBe(true);

    registry.finish("c:/scratch/delete-route-test-a");
  });

  it("returns accepted: false for an unknown runId, without throwing", async () => {
    const response = await DELETE(new Request("http://localhost"), deleteRequest("unknown-run"));
    const body = await response.json();

    expect(body).toEqual({ runId: "unknown-run", accepted: false });
  });
});
