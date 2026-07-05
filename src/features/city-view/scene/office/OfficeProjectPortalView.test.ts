import { describe, expect, it } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import {
  createEmptyCompanyDashboardSnapshot,
  INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
} from "./dashboard/CompanyDashboardTypes";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";

describe("OfficeProjectPortalView", () => {
  it("renders Company Dashboard project source signals in the Phaser portal panel", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);

    new OfficeProjectPortalView(scene, createPortalState());

    expect(renderedText.map((item) => item.text)).toContain("[SOURCE] Daily Proof: Internal; AIverse: GitHub linked [Fresh]");
  });

  it("keeps wrapped Company Dashboard source signals above the project list panel", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    new OfficeProjectPortalView(scene, createPortalState({
      companySummary: "2 of 3 employee(s) are active. 1 active project(s) are visible. 4 active task(s) are unassigned. 1 risk(s) need attention.",
      sourceProjects: [
        createDashboardProject("daily-proof-long-name", "Daily Proof Operations", "Internal", "internal", "Internal"),
        createDashboardProject("aiverse-platform", "AIverse Platform", "GitHub linked", "fresh", "Fresh"),
        createDashboardProject("client-delivery", "Client Delivery", "GitHub linked", "stale", "Stale"),
        createDashboardProject("research-lab", "Research Lab", "GitHub linked", "unavailable", "Unavailable"),
        createDashboardProject("future-growth", "Future Growth", "GitHub linked", "offline", "Offline"),
      ],
    }));

    const sourceRow = renderedText.find((item) => item.text.startsWith("[SOURCE]"));
    const summaryRow = renderedText.find((item) => item.text.startsWith("2 of 3 employee"));

    expect(summaryRow?.text).toMatch(/4 active task\(s\)\s+are unassigned\./);
    expect(summaryRow?.text).toContain("1 risk(s) need attention.");
    expect(summaryRow?.text.split("\n")).toHaveLength(2);
    expect(sourceRow).toBeDefined();
    expect(sourceRow?.text).not.toContain("\n");
    expect(sourceRow?.text).toContain("+1 more");
    expect(sourceRow?.y ?? 0).toBeGreaterThanOrEqual((summaryRow?.y ?? 0) + 40);
    const projectsHeading = renderedText.find((item) => item.text === "Projects");
    expect(projectsHeading).toBeDefined();
    const projectsPanel = renderedPanels.find((panel) => panel.y === (projectsHeading?.y ?? 0) - 12);
    expect(projectsPanel).toBeDefined();
    expect((sourceRow?.y ?? 0) + 14).toBeLessThan((projectsPanel?.y ?? 0) - 2);
  });
});

type RenderedText = {
  text: string;
  y: number;
};

type RenderedPanel = {
  y: number;
  height: number;
};

function createSceneStub(renderedText: RenderedText[], renderedPanels: RenderedPanel[]): PhaserScene {
  const createChainable = () => ({
    setOrigin: () => createChainable(),
    setScrollFactor: () => createChainable(),
    setDepth: () => createChainable(),
    setVisible: () => createChainable(),
    destroy: () => undefined,
  });
  const createGraphics = () => {
    const graphics = {
      fillStyle: () => graphics,
      fillRoundedRect: (_x: number, y: number, _width: number, height: number) => {
        renderedPanels.push({ y, height });
        return graphics;
      },
      lineStyle: () => graphics,
      strokeRoundedRect: () => graphics,
      lineBetween: () => graphics,
    };
    return graphics;
  };
  const createContainer = () => ({
    add: () => undefined,
    removeAll: () => undefined,
    setScrollFactor: () => createContainer(),
    setDepth: () => createContainer(),
    setVisible: () => createContainer(),
    destroy: () => undefined,
  });

  return {
    scale: {
      width: 1024,
      height: 768,
    },
    add: {
      rectangle: () => createChainable(),
      graphics: () => createGraphics(),
      container: () => createContainer(),
      text: (_x: number, y: number, text: string) => {
        renderedText.push({ text, y });
        return createChainable();
      },
    },
  } as unknown as PhaserScene;
}

function createPortalState(options: {
  companySummary?: string;
  sourceProjects?: NonNullable<ProjectPortalState["companyDashboardSnapshot"]>["projects"]["projects"];
} = {}): ProjectPortalState {
  const sourceProjects = options.sourceProjects ?? [
    createDashboardProject("daily-proof", "Daily Proof", "Internal", "internal", "Internal"),
    createDashboardProject("aiverse", "AIverse", "GitHub linked", "fresh", "Fresh"),
  ];
  const companyDashboardSnapshot = {
    ...createEmptyCompanyDashboardSnapshot(
      INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
      "2026-01-01T00:00:00.000Z",
    ),
    projects: {
      totalProjects: sourceProjects.length,
      activeProjects: sourceProjects.length,
      completedProjects: 0,
      blockedProjects: 0,
      projects: sourceProjects,
    },
    companySummary: options.companySummary ?? "Company simulation is stable.",
  };

  return {
    isOpen: true,
    justOpened: false,
    viewMode: "list",
    selectedProjectIndex: 0,
    selectedProjectId: "daily-proof",
    selectedWorkspaceSectionIndex: 0,
    selectedTaskIndex: 0,
    selectedEmployeeIndex: 0,
    selectedInfluenceFocusIndex: 0,
    projects: [{
      id: "daily-proof",
      name: "Daily Proof",
      status: "Active",
      type: "Company",
      enabled: true,
      description: "",
      linkedServices: [],
      nextAction: {
        label: "Review workspace",
        enabled: true,
        placeholder: true,
      },
    }],
    services: [],
    workspaces: {},
    repositoryMappings: [],
    repositorySummaries: {},
    taskCollections: {},
    taskAnalyses: {},
    employeeRecommendations: {},
    projectManagementSuggestions: {},
    employees: [],
    employeeSimulations: {},
    employeeAssignments: {},
    workSessions: {},
    companyDashboardSnapshot,
    companyInfluencePlan: {},
  };
}

function createDashboardProject(
  projectId: string,
  name: string,
  label: string,
  status: "internal" | "fresh" | "stale" | "unavailable" | "offline",
  statusLabel: string,
): NonNullable<ProjectPortalState["companyDashboardSnapshot"]>["projects"]["projects"][number] {
  return {
    projectId,
    name,
    status: "Active",
    activeTaskCount: 1,
    completedTaskCount: 0,
    blockedTaskCount: 0,
    sourceSignal: {
      kind: status === "internal" ? "internal" : "github",
      label,
      status,
      statusLabel,
    },
  };
}
