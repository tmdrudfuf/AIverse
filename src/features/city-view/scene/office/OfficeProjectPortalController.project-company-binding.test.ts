import { describe, expect, it } from "vitest";

import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import type { ExternalProjectAdosRunStatus } from "./external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import { BrowserOfficeSessionService } from "./browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./browser-session/BrowserOfficeSessionTypes";
import { createInput, createSceneStub, employee, getControllerInternals } from "./OfficeProjectPortalController.testHelpers";

describe("OfficeProjectPortalController project-company binding", () => {
  it("entering Company A activates Project A", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "daily-proof",
      activeProjectBuildingId: "daily-proof-inc",
      activeProjectBindingId: "daily-proof-inc",
      activeProjectCompanyName: "DAILY PROOF INC.",
    });
    const internals = getControllerInternals(controller);

    controller.open();

    expect(internals.state.selectedProjectId).toBe("daily-proof");
    expect(projectPortalState(internals).activeProjectCompanyContext).toMatchObject({
      projectId: "daily-proof",
      companyName: "Daily Proof Inc.",
      status: "bound",
    });
  });

  it("entering Company B activates Project B", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "portfolio",
      activeProjectBuildingId: "portfolio-studio",
      activeProjectBindingId: "portfolio-studio",
      activeProjectCompanyName: "PORTFOLIO STUDIO",
    });
    const internals = getControllerInternals(controller);

    controller.open();

    expect(internals.state.selectedProjectId).toBe("portfolio");
    expect(internals.state.selectedProjectIndex).toBe(internals.state.projects.findIndex((project) => project.id === "portfolio"));
    expect(controller.getLiveAgentWorkState()).toMatchObject({
      projectId: "portfolio",
      lifecycle: "no-active-run",
      stage: "idle",
    });
  });

  it("live work and employee reads stay scoped to the active company while portal browsing changes", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "daily-proof",
      activeProjectBuildingId: "daily-proof-inc",
      activeProjectBindingId: "daily-proof-inc",
    });
    const internals = getControllerInternals(controller);

    controller.open();
    controller.updateInput(createInput({}));
    controller.updateInput(createInput({ downPressed: true }));

    expect(internals.state.selectedProjectId).toBe("portfolio");
    expect(internals.state.selectedProjectIndex).toBe(internals.state.projects.findIndex((project) => project.id === "portfolio"));

    const workState = controller.getLiveAgentWorkState();

    expect(workState.projectId).toBe("daily-proof");
    expect(workState.projectStatus.title).toBe("Daily Proof Inc.");
    expect(internals.state.selectedProjectId).toBe("portfolio");
    expect(internals.state.selectedProjectIndex).toBe(internals.state.projects.findIndex((project) => project.id === "portfolio"));

    controller.getEmployeeNpcViewModels();

    expect(internals.state.selectedProjectId).toBe("portfolio");
    expect(internals.state.selectedProjectIndex).toBe(internals.state.projects.findIndex((project) => project.id === "portfolio"));
  });

  it("does not show Project A validation activity in Project B no-active-run office", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "portfolio",
      activeProjectBuildingId: "portfolio-studio",
      activeProjectBindingId: "portfolio-studio",
    });
    const internals = getControllerInternals(controller);
    internals.state.externalProjectAdosRunStatuses = {
      "daily-proof": status("daily-proof", "Started", "validation"),
    };

    const workState = controller.getLiveAgentWorkState();

    expect(workState.projectId).toBe("portfolio");
    expect(workState.lifecycle).toBe("no-active-run");
    expect(workState.rawStatus).toBeUndefined();
    expect(workState.stage).toBe("idle");
    expect(JSON.stringify(workState)).not.toContain("daily-proof");
  });

  it("scopes complete, review, and blocked states to the bound project", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "portfolio",
      activeProjectBuildingId: "portfolio-studio",
      activeProjectBindingId: "portfolio-studio",
    });
    const internals = getControllerInternals(controller);
    internals.state.externalProjectAdosRunStatuses = {
      "daily-proof": status("daily-proof", "Completed", "Completed implementer"),
      portfolio: status("portfolio", "Blocked", "reviewer blocked", ["EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"]),
    };

    const workState = controller.getLiveAgentWorkState();

    expect(workState.projectId).toBe("portfolio");
    expect(workState.lifecycle).toBe("blocked");
    expect(workState.stage).toBe("blocked");
    expect(workState.assignments[0]).toMatchObject({
      department: "review",
      visualTone: "warning",
    });
    expect(JSON.stringify(workState)).not.toContain("Completed implementer");
  });

  it("Project Status uses the bound project identity", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "daily-proof",
      activeProjectBuildingId: "daily-proof-inc",
    });

    const workState = controller.getLiveAgentWorkState();

    expect(workState.projectStatus.title).toBe("Daily Proof Inc.");
    expect(workState.projectStatus.rows).toContain("Run No active ADOS run");
  });

  it("Live Agent Work Visualization uses the bound project and its semantic provider separation", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "daily-proof",
      activeProjectBuildingId: "daily-proof-inc",
    });
    const internals = getControllerInternals(controller);
    internals.state.employees = [
      employee({ id: "engineer", name: "Provider Engineer", role: "Engineer", capabilities: ["Coding"], currentProjectId: "daily-proof" }),
      employee({ id: "qa", name: "Other QA", role: "QA", capabilities: ["Testing"], currentProjectId: "portfolio" }),
    ];
    internals.state.externalProjectAdosRunStatuses = {
      "daily-proof": status("daily-proof", "Started", "implementation"),
      portfolio: status("portfolio", "Started", "validation"),
    };

    const workState = controller.getLiveAgentWorkState();
    const viewModels = controller.getEmployeeNpcViewModels();

    expect(workState.projectId).toBe("daily-proof");
    expect(workState.assignments[0]).toMatchObject({
      role: "implementer",
      department: "engineering",
    });
    expect(viewModels.map((viewModel) => viewModel.employeeId)).toContain("engineer");
    expect(viewModels.map((viewModel) => viewModel.employeeId)).not.toContain("qa");
  });

  it("missing project binding fails safely without substituting Daily Proof", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      activeProjectId: "missing-project",
      activeProjectBuildingId: "missing-building",
      activeProjectBindingId: "missing-building",
      activeProjectCompanyName: "MISSING PROJECT",
    });
    const internals = getControllerInternals(controller);
    internals.state.externalProjectAdosRunStatuses = {
      "daily-proof": status("daily-proof", "Started", "validation"),
    };

    const workState = controller.getLiveAgentWorkState();

    expect(projectPortalState(internals).activeProjectCompanyContext).toMatchObject({
      projectId: "missing-project",
      status: "unavailable",
      unavailableReason: "MissingProject",
    });
    expect(workState.projectId).toBeUndefined();
    expect(workState.lifecycle).toBe("no-active-run");
    expect(JSON.stringify(workState)).not.toContain("daily-proof");
    expect(workState.rawStatus).toBeUndefined();
    expect(workState.stage).toBe("idle");
  });

  it("persistence restores project-company binding metadata", () => {
    const storage = createMemoryStorage();
    const first = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage, now: () => "2026-08-29T00:00:00.000Z" }),
      activeProjectId: "portfolio",
      activeProjectBuildingId: "portfolio-studio",
      activeProjectBindingId: "portfolio-studio",
    });
    const firstInternals = getControllerInternals(first);

    first.open();
    browserOfficeSessionService(firstInternals)?.saveState(projectPortalState(firstInternals));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(
      createProjectPortalState({ browserOfficeSessionService: false }),
    );

    expect(restored.selectedProjectId).toBe("portfolio");
    expect(restored.projectCompanyBindings?.some((binding) =>
      binding.bindingId === "portfolio-studio" &&
      binding.projectId === "portfolio" &&
      binding.companyName === "AIverse Internal"
    )).toBe(true);
  });
});

function status(
  projectId: string,
  stage: "Started" | "Completed" | "Blocked",
  runStatus: string,
  reasonCodes: ExternalProjectAdosRunStatus["reasonCodes"] = [],
): ExternalProjectAdosRunStatus {
  return {
    id: `${projectId}:external-ados-run-status:external-ados-run-status-v1`,
    projectId,
    stage,
    status: runStatus,
    source: "execution",
    reasonCodes,
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

function projectPortalState(internals: ReturnType<typeof getControllerInternals>): ProjectPortalState {
  return internals.state as unknown as ProjectPortalState;
}

function browserOfficeSessionService(
  internals: ReturnType<typeof getControllerInternals>,
): BrowserOfficeSessionService | undefined {
  return (internals as unknown as { browserOfficeSessionService?: BrowserOfficeSessionService }).browserOfficeSessionService;
}

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}
