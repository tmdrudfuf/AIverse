import { describe, expect, it } from "vitest";

import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import type { ExternalProjectAdosRunStatus } from "./external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import {
  createSceneStub,
  employee,
  getControllerInternals,
} from "./OfficeProjectPortalController.testHelpers";

describe("OfficeProjectPortalController live agent work visualization", () => {
  it("maps selected-project validation state into an existing NPC view model", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.employees = [
      employee({ id: "engineer", name: "Provider Engineer", role: "Engineer", capabilities: ["Coding"] }),
      employee({ id: "qa", name: "Provider QA", role: "QA", capabilities: ["Testing"] }),
    ];
    internals.state.employeeSimulations = {};
    internals.state.externalProjectAdosRunStatuses = {
      "daily-proof": status("daily-proof", "Started", "validation"),
    };

    const viewModels = controller.getEmployeeNpcViewModels();
    const qa = viewModels.find((viewModel) => viewModel.employeeId === "qa");

    expect(qa).toMatchObject({
      displayName: "Provider QA",
      displayLabel: "Validating",
      semanticRole: "validator",
      visualTone: "active",
      positionHint: { zone: "workstation", slot: 4 },
    });
  });

  it("clears stale active labels when the selected project is complete", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.employees = [
      employee({ id: "engineer", name: "Provider Engineer", role: "Engineer", capabilities: ["Coding"] }),
    ];
    internals.state.employeeSimulations = {};
    internals.state.externalProjectAdosRunStatuses = {
      "daily-proof": status("daily-proof", "Completed", "Completed implementer"),
    };

    const viewModels = controller.getEmployeeNpcViewModels();

    expect(viewModels[0]).toMatchObject({
      displayLabel: "Complete",
      visualTone: "complete",
      positionHint: { zone: "idleSpot", slot: 0 },
    });
    expect(JSON.stringify(viewModels)).not.toContain("Implementing");
    expect(JSON.stringify(viewModels)).not.toContain("Validating");
    expect(JSON.stringify(viewModels)).not.toContain("Reviewing");
  });

  it("does not leak a previous project's reviewing state after selected project changes", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.projects.push({
      id: "external-crm",
      name: "External CRM",
      status: "Active",
      type: "Company",
      enabled: true,
      description: "",
      linkedServices: [],
      nextAction: { label: "", enabled: true, placeholder: true },
    });
    internals.state.selectedProjectId = "external-crm";
    internals.state.selectedProjectIndex = internals.state.projects.findIndex((project) => project.id === "external-crm");
    internals.state.employees = [
      employee({ id: "qa", name: "Provider QA", role: "QA", capabilities: ["Testing"] }),
    ];
    internals.state.employeeSimulations = {};
    internals.state.externalProjectAdosRunStatuses = {
      "daily-proof": status("daily-proof", "Started", "reviewer"),
      "external-crm": status("external-crm", "Started", "validation"),
    };

    const workState = controller.getLiveAgentWorkState();
    const viewModels = controller.getEmployeeNpcViewModels();

    expect(workState.projectId).toBe("external-crm");
    expect(workState.stage).toBe("validation");
    expect(JSON.stringify(workState)).not.toContain("reviewer");
    expect(viewModels[0]).toMatchObject({
      displayLabel: "Validating",
      semanticRole: "validator",
    });
  });
});

function status(projectId: string, stage: "Started" | "Completed" | "Blocked", runStatus: string): ExternalProjectAdosRunStatus {
  return {
    id: `${projectId}:external-ados-run-status:external-ados-run-status-v1`,
    projectId,
    stage,
    status: runStatus,
    source: "execution",
    reasonCodes: [],
    updatedAt: "2026-08-29T00:00:00.000Z",
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    rulesVersion: "external-ados-run-status-v1",
  };
}
