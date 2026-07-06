import { describe, expect, it } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import {
  createEmptyCompanyDashboardSnapshot,
  INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
} from "./dashboard/CompanyDashboardTypes";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";
import {
  INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID,
  type ProjectDashboardSnapshot,
} from "./project-dashboard/ProjectDashboardTypes";

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

  it("renders Project Dashboard advisory rows in the Phaser portal panel", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    new OfficeProjectPortalView(scene, createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [createExternalSource("ai-verse/daily-proof-enterprise-operations-terminal-source-with-read-only-provider-context")],
      }),
    }));

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const dialogPanel = findDialogPanel(renderedPanels);
    const riskRow = findRenderedRow(renderedText, "[RISK]");
    const activityRow = findRenderedRow(renderedText, "[ACTIVITY]");
    const advisoryRow = findRenderedRow(renderedText, "[ADVISORY]");
    const attentionRow = findRenderedRow(renderedText, "[ATTENTION]");
    const sourceRow = findRenderedRow(renderedText, "[SOURCE]");
    const syncRow = findRenderedRow(renderedText, "[SYNC]");

    expect(riskRow).toBeDefined();
    expect(activityRow).toBeDefined();
    expect(advisoryRow?.text).toBe(
      "[ADVISORY] Daily Proof has 1 active task and 0 completed tasks. Risk:\nDashboard advisory needs review.",
    );
    expect(attentionRow?.text).toBe(
      "[ATTENTION] Reduce project risk: Critical dashboard work needs attention.",
    );
    expect(sourceRow?.text).toContain("[SOURCE] Repo ai-verse/daily-proof-enterprise-operations-terminal-source");
    expect(sourceRow?.text).toContain("...");
    expect(sourceRow?.text).not.toContain("\n");
    expect(syncRow?.text).toContain("[SYNC] Status: Fresh | Default Branch: main");
    expect(findRenderedRow(renderedText, "[FOCUS]")).toBeUndefined();
    expect(findRenderedRow(renderedText, "[NEXT]")).toBeUndefined();
    assertRowClears(advisoryRow, attentionRow);
    assertRowClears(attentionRow, sourceRow);
    assertRowClears(sourceRow, syncRow);
    assertPanelInsideDialog(lowerPanel, dialogPanel);
    [riskRow, activityRow, advisoryRow, attentionRow, sourceRow, syncRow].forEach((row) => {
      assertRowInsidePanel(row, lowerPanel);
    });
  });

  it("renders Project Dashboard empty advisory state without overlapping following rows", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    new OfficeProjectPortalView(scene, createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        advisory: {
          status: "empty",
          healthSummary: "Local advisory waiting for project-manager signal.",
          topRiskLabel: "No local advisory risk is available.",
          nextAttentionLabel: "Open project work areas to prepare advisory context.",
        },
        externalSources: [],
      }),
    }));

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const dialogPanel = findDialogPanel(renderedPanels);
    const advisoryRow = findRenderedRow(renderedText, "[ADVISORY]");
    const attentionRow = findRenderedRow(renderedText, "[ATTENTION]");
    const focusRow = findRenderedRow(renderedText, "[FOCUS]");
    const nextRow = findRenderedRow(renderedText, "[NEXT]");

    expect(advisoryRow?.text).toContain("Local advisory waiting for project-manager signal.");
    expect(attentionRow?.text).toContain("Open project work areas to prepare advisory context.");
    expect(focusRow).toBeDefined();
    expect(nextRow).toBeDefined();
    assertRowClears(advisoryRow, attentionRow);
    assertRowClears(attentionRow, focusRow);
    assertRowClears(focusRow, nextRow);
    assertPanelInsideDialog(lowerPanel, dialogPanel);
    [advisoryRow, attentionRow, focusRow, nextRow].forEach((row) => {
      assertRowInsidePanel(row, lowerPanel);
    });
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

const PROJECT_ROW_LINE_HEIGHT = 14;
const PROJECT_ROW_SAFE_GAP = 2;

function findRenderedRow(renderedText: RenderedText[], prefix: string) {
  return renderedText.find((item) => item.text.startsWith(prefix));
}

function findDialogPanel(renderedPanels: RenderedPanel[]) {
  const dialogPanel = renderedPanels.find((panel) => panel.height === 430);
  expect(dialogPanel).toBeDefined();
  return dialogPanel;
}

function findLowerProjectPanel(renderedPanels: RenderedPanel[]) {
  const lowerPanel = renderedPanels
    .filter((panel) => panel.y > 400)
    .sort((left, right) => right.y - left.y)[0];
  expect(lowerPanel).toBeDefined();
  return lowerPanel;
}

function assertRowClears(previous: RenderedText | undefined, next: RenderedText | undefined) {
  expect(previous).toBeDefined();
  expect(next).toBeDefined();

  const previousBottom = (previous?.y ?? 0) + (previous?.text.split("\n").length ?? 0) * PROJECT_ROW_LINE_HEIGHT;
  expect(next?.y ?? 0).toBeGreaterThanOrEqual(previousBottom + PROJECT_ROW_SAFE_GAP);
}

function assertPanelInsideDialog(panel: RenderedPanel | undefined, dialogPanel: RenderedPanel | undefined) {
  expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeLessThanOrEqual((dialogPanel?.y ?? 0) + (dialogPanel?.height ?? 0));
}

function assertRowInsidePanel(row: RenderedText | undefined, panel: RenderedPanel | undefined) {
  expect(row).toBeDefined();
  expect(panel).toBeDefined();

  const rowBottom = (row?.y ?? 0) + (row?.text.split("\n").length ?? 0) * PROJECT_ROW_LINE_HEIGHT;
  expect(row?.y ?? 0).toBeGreaterThanOrEqual(panel?.y ?? 0);
  expect(rowBottom).toBeLessThanOrEqual((panel?.y ?? 0) + (panel?.height ?? 0));
}

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
  viewMode?: ProjectPortalState["viewMode"];
  projectDashboardSnapshot?: ProjectDashboardSnapshot;
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
    viewMode: options.viewMode ?? "list",
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
    projectDashboardSnapshot: options.projectDashboardSnapshot,
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

function createProjectDashboardSnapshot(
  options: Partial<ProjectDashboardSnapshot> = {},
): ProjectDashboardSnapshot {
  return {
    providerId: INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID,
    generatedAt: "2026-01-01T10:00:00.000Z",
    project: {
      projectId: "daily-proof",
      name: "Daily Proof",
      status: "Active",
      isAvailable: true,
    },
    progress: {
      percentComplete: 50,
      completedWorkCount: 0,
      totalWorkCount: 1,
      label: "50% complete",
    },
    health: {
      status: "watch",
      label: "Project is progressing",
      reason: "Visible project tasks are moving through the workflow.",
      signals: [],
    },
    activeWork: [{
      id: "task-dashboard",
      title: "Build project dashboard",
      status: "In Progress",
      priority: "High",
      progressPercent: 50,
      updatedAt: "2026-01-01T10:00:00.000Z",
    }],
    employees: [],
    blockers: [],
    activity: [],
    relatedFocus: {
      employeeFocusLabels: [],
      summary: "No project focus signals are visible.",
    },
    nextSuggestedFocus: "Improve delivery speed",
    advisory: {
      status: "available",
      healthSummary: "Daily Proof has 1 active task and 0 completed tasks.",
      topRiskLabel: "Dashboard advisory needs review.",
      nextAttentionLabel: "Reduce project risk: Critical dashboard work needs attention.",
      generatedAt: "2026-01-01T09:45:00.000Z",
    },
    source: {
      sourceType: "internal-simulation",
      sourceId: "daily-proof",
      mappingConfidence: "native",
    },
    externalSources: options.externalSources ?? [createExternalSource("ai-verse/daily-proof")],
    sections: [],
    ...options,
  };
}

function createExternalSource(displayName: string): NonNullable<ProjectDashboardSnapshot["externalSources"]>[number] {
  return {
      sourceType: "github",
      sourceId: "github:ai-verse/daily-proof",
      displayName,
      mappingConfidence: "mapped",
      statusLabel: "Fresh",
      signals: [
        {
          id: "repository",
          label: "Repository",
          value: displayName,
        },
        {
          id: "default-branch",
          label: "Default Branch",
          value: "main",
        },
      ],
  };
}
