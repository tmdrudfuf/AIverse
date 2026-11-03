import { describe, expect, it, vi } from "vitest";

import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createSceneStub } from "./OfficeProjectPortalController.testHelpers";

function fakeFetchReturning(bodyJson: unknown, ok = true) {
  return vi.fn(async () => ({ ok, json: async () => bodyJson })) as unknown as typeof fetch;
}

describe("OfficeProjectPortalController runtime bridge enablement visibility", () => {
  it("starts as null (unknown) before any refresh", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());

    expect(controller.getRuntimeBridgeEnablement()).toBeNull();
  });

  it("caches the fetched enablement state after a successful refresh", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const fetchImpl = fakeFetchReturning({ implementerEnabled: true, reviewerEnabled: false });

    await controller.refreshRuntimeBridgeEnablement(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("/api/runtime/status");
    expect(controller.getRuntimeBridgeEnablement()).toEqual({ implementerEnabled: true, reviewerEnabled: false });
  });

  it("leaves the previous value in place when the fetch fails, instead of throwing", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const okFetch = fakeFetchReturning({ implementerEnabled: true, reviewerEnabled: true });
    await controller.refreshRuntimeBridgeEnablement(okFetch);

    const failingFetch = vi.fn(async () => {
      throw new Error("network error");
    }) as unknown as typeof fetch;

    await expect(controller.refreshRuntimeBridgeEnablement(failingFetch)).resolves.toBeUndefined();
    expect(controller.getRuntimeBridgeEnablement()).toEqual({ implementerEnabled: true, reviewerEnabled: true });
  });

  it("leaves the previous value in place on a non-ok HTTP response", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const notOkFetch = fakeFetchReturning({}, false);

    await controller.refreshRuntimeBridgeEnablement(notOkFetch);

    expect(controller.getRuntimeBridgeEnablement()).toBeNull();
  });
});
