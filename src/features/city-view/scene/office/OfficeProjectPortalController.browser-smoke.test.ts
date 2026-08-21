import { describe, expect, it } from "vitest";

import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  driveDailyProofToRuntimeStart,
  flushPromises,
  getControllerInternals,
} from "./OfficeProjectPortalController.testHelpers";

describe("Daily Proof Project Portal browser smoke validation", () => {
  it("opens Daily Proof from the fresh browser-facing portal path without starting downstream runtimes", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);

    controller.open();
    controller.updateInput(createInput({}));

    expect(internals.state.viewMode).toBe("list");
    expect(internals.state.projects[0]).toMatchObject({
      id: "daily-proof",
      name: "Daily Proof",
    });

    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(internals.state.viewMode).toBe("project-dashboard");
    expect(internals.state.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(controller.getProjectDashboardSnapshot("daily-proof").project).toMatchObject({
      projectId: "daily-proof",
      name: "Daily Proof",
    });
    expectNoDownstreamRuntimeStarted(internals);
  });

  it("drives the Daily Proof portal chain to one runtime-start record without starting downstream runtimes", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);

    const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

    const starts = internals.state.runtimeStartCollections["daily-proof"]?.starts ?? [];
    expect(promotedTaskId).toBeTruthy();
    expect(starts).toHaveLength(1);
    expect(starts[0]).toMatchObject({
      projectId: "daily-proof",
      executionStarted: true,
      implementerStarted: false,
      reviewerStarted: false,
      validationStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expectNoDownstreamRuntimeStarted(internals);
  });
});

function expectNoDownstreamRuntimeStarted(internals: ReturnType<typeof getControllerInternals>) {
  expect(internals.state.implementerRuntimeCollections["daily-proof"]).toBeUndefined();
  expect(internals.state.implementerRuntimeResultCollections["daily-proof"]).toBeUndefined();
  expect(internals.state.reviewerRuntimeCollections["daily-proof"]).toBeUndefined();
  expect(internals.state.reviewerRuntimeResultCollections["daily-proof"]).toBeUndefined();
  expect(internals.state.validationRuntimeCollections?.["daily-proof"]).toBeUndefined();
  expect(internals.state.validationRuntimeResultCollections?.["daily-proof"]).toBeUndefined();
}
