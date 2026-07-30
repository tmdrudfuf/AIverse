import { describe, expect, it } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import type { ActiveWorkSessionStartResultCollection } from "./active-work-sessions/ActiveWorkSessionTypes";
import {
  createEmptyCompanyDashboardSnapshot,
  INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
} from "./dashboard/CompanyDashboardTypes";
import type { CandidateAssignmentRecommendationCollection } from "./candidate-assignments/CandidateAssignmentTypes";
import type { CandidateProjectTaskPromotionResultCollection } from "./candidate-project-task-promotions/CandidateProjectTaskPromotionTypes";
import type { CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { ConfirmedEmployeeAssignmentResultCollection } from "./confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type {
  ExecutionPlanCollection,
  ExecutionPlanResultCollection,
} from "./execution-plans/ExecutionPlanTypes";
import type {
  ExecutionReadinessCollection,
  ExecutionReadinessResultCollection,
} from "./execution-readiness/ExecutionReadinessTypes";
import type {
  HumanExecutionApprovalCollection,
  HumanExecutionApprovalResultCollection,
} from "./human-execution-approvals/HumanExecutionApprovalTypes";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";
import type { PreparedWorkSessionResultCollection } from "./prepared-work-sessions/PreparedWorkSessionTypes";
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

  it("renders the office zone unlock progress row in its locked state (next zone plus required level)", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);

    new OfficeProjectPortalView(scene, createPortalState({
      officeZoneProgress: {
        unlockedZoneCount: 5,
        nextUnlock: { zoneType: "reception", label: "Reception", requiredLevel: 2 },
      },
    }));

    expect(renderedText.map((item) => item.text)).toContain("Zones: 5 unlocked, next: Reception at Lv2");
  });

  it("renders the office zone unlock progress row in its unlocked state once every zone is unlocked", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);

    new OfficeProjectPortalView(scene, createPortalState({
      officeZoneProgress: {
        unlockedZoneCount: 9,
        nextUnlock: undefined,
      },
    }));

    expect(renderedText.map((item) => item.text)).toContain("Zones: 9 unlocked");
  });

  it("keeps wrapped Company Dashboard source signals above the project list panel", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels, 1200);

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
    const scene = createSceneStub(renderedText, renderedPanels, 1200);

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

  it("keeps wrapped Active Work and Employee rows inside their section panels for realistic multi-item, long-title projects", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    new OfficeProjectPortalView(scene, createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [],
        activeWork: [
          { id: "task-1", title: "Rebuild the reporting pipeline", status: "In Progress", priority: "High", progressPercent: 40, updatedAt: "2026-01-01T10:00:00.000Z" },
          { id: "task-2", title: "Investigate auth failures in staging", status: "Review", priority: "Critical", progressPercent: 10, updatedAt: "2026-01-01T10:00:00.000Z" },
          { id: "task-3", title: "Migrate legacy billing exports", status: "In Progress", priority: "Medium", progressPercent: 60, updatedAt: "2026-01-01T10:00:00.000Z" },
        ],
        employees: [
          { employeeId: "emp-1", name: "Alexandria Fitzgerald", role: "Engineer", aiState: "working", focusLabel: "Focused" },
          { employeeId: "emp-2", name: "Christopher Worthington III", role: "QA", aiState: "talking", focusLabel: "Focused" },
          { employeeId: "emp-3", name: "Bartholomew Okonkwo-Adeyemi", role: "Designer", aiState: "taking_break", focusLabel: "Focused" },
        ],
      }),
    }));

    const sectionPanels = renderedPanels.filter((panel) => panel.height === PROJECT_DASHBOARD_SECTION_PANEL_HEIGHT);
    expect(sectionPanels).toHaveLength(2);
    const activeWorkRows = renderedText.filter((item) => item.text.startsWith(">"));
    expect(activeWorkRows.length).toBeGreaterThanOrEqual(6);
    activeWorkRows.forEach((row) => {
      const matchingPanel = sectionPanels.find((panel) => panel.y <= row.y);
      assertRowInsidePanel(row, matchingPanel);
    });
  });

  it("renders registry-derived Repository and Company info on the project detail screen", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);
    const state = createPortalState({ viewMode: "detail" });
    state.projects = [{
      id: "daily-proof",
      name: "Daily Proof",
      status: "Active",
      type: "Company",
      enabled: true,
      description: "Daily Proof is the active company workspace for validating AIverse office workflows.",
      linkedServices: [],
      nextAction: { label: "Review project workspace", enabled: true, placeholder: true },
      ownerCompany: "Daily Proof Inc.",
      localRepositoryLabel: "Connected (local)",
      repositoryIdentity: {
        provider: "github",
        owner: "ai-verse",
        name: "daily-proof",
        url: "https://github.com/ai-verse/daily-proof",
        defaultBranch: "main",
        connectionState: "Configured",
      },
    }];

    new OfficeProjectPortalView(scene, state);

    expect(renderedText.map((item) => item.text)).toContain("Repository: Connected (local)");
    expect(renderedText.map((item) => item.text)).toContain("Company: Daily Proof Inc.");
    expect(renderedText.map((item) => item.text)).toContain("Repo: ai-verse/daily-proof (GitHub)");
    expect(renderedText.map((item) => item.text)).toContain("Default Branch: main  ·  Status: Configured");
  });

  it("renders a not-connected repository and internal owner for a placeholder project", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);
    const state = createPortalState({ viewMode: "detail" });
    state.projects = [{
      id: "portfolio",
      name: "Portfolio",
      status: "Planned",
      type: "Portfolio",
      enabled: false,
      description: "Portfolio will become the public-facing project showcase.",
      linkedServices: [],
      nextAction: { label: "Coming soon", enabled: false, placeholder: true },
      ownerCompany: "AIverse Internal",
      localRepositoryLabel: "Not connected",
      repositoryIdentity: { provider: "local", connectionState: "Unknown" },
    }];

    new OfficeProjectPortalView(scene, state);

    expect(renderedText.map((item) => item.text)).toContain("Repository: Not connected");
    expect(renderedText.map((item) => item.text)).toContain("Company: AIverse Internal");
    expect(renderedText.map((item) => item.text)).toContain("Repo: Not yet known (Local)");
    expect(renderedText.map((item) => item.text)).toContain("Status: Unknown");
    expect(renderedText.some((item) => item.text.includes("Default Branch:"))).toBe(false);
  });

  it("keeps Repository/Company rows clear of the bottom instruction row when a placeholder action was just recorded", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);
    const state = createPortalState({ viewMode: "detail" });
    state.selectedProjectId = "daily-proof";
    state.lastPlaceholderAction = {
      projectId: "daily-proof",
      actionLabel: "Review project workspace",
      status: "placeholder",
    };
    state.projects = [{
      id: "daily-proof",
      name: "Daily Proof",
      status: "Active",
      type: "Company",
      enabled: true,
      description: "Daily Proof is the active company workspace for validating AIverse office workflows.",
      linkedServices: [],
      nextAction: { label: "Review project workspace", enabled: true, placeholder: true },
      ownerCompany: "Daily Proof Inc.",
      localRepositoryLabel: "Connected (local)",
      repositoryIdentity: {
        provider: "github",
        owner: "ai-verse",
        name: "daily-proof",
        url: "https://github.com/ai-verse/daily-proof",
        defaultBranch: "main",
        connectionState: "Configured",
      },
    }];

    new OfficeProjectPortalView(scene, state);

    const repositoryRow = renderedText.find((item) => item.text === "Repository: Connected (local)");
    const companyRow = renderedText.find((item) => item.text === "Company: Daily Proof Inc.");
    const repoIdentityRow = renderedText.find((item) => item.text === "Repo: ai-verse/daily-proof (GitHub)");
    const branchStatusRow = renderedText.find((item) => item.text === "Default Branch: main  ·  Status: Configured");
    const lastActionRow = renderedText.find((item) => item.text.startsWith("Placeholder action recorded"));
    const instructionRow = renderedText.find((item) => item.text.startsWith("Esc back"));
    const nextActionHeadingRow = renderedText.find((item) => item.text === "Next Action");

    expect(repositoryRow).toBeDefined();
    expect(companyRow).toBeDefined();
    expect(repoIdentityRow).toBeDefined();
    expect(branchStatusRow).toBeDefined();
    expect(lastActionRow).toBeDefined();
    expect(instructionRow).toBeDefined();
    expect(nextActionHeadingRow).toBeDefined();

    const ROW_LINE_HEIGHT = 18;
    expect((repositoryRow?.y ?? 0) + ROW_LINE_HEIGHT).toBeLessThan(instructionRow?.y ?? 0);
    expect((companyRow?.y ?? 0) + ROW_LINE_HEIGHT).toBeLessThan(instructionRow?.y ?? 0);
    expect((repoIdentityRow?.y ?? 0) + ROW_LINE_HEIGHT).toBeLessThan(instructionRow?.y ?? 0);
    expect((branchStatusRow?.y ?? 0) + ROW_LINE_HEIGHT).toBeLessThan(instructionRow?.y ?? 0);
    expect((lastActionRow?.y ?? 0) + ROW_LINE_HEIGHT).toBeLessThan(instructionRow?.y ?? 0);
  });

  it("omits the registry detail line for a project with no owner or repository metadata", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);
    const state = createPortalState({ viewMode: "detail" });
    state.projects = [{
      id: "portfolio",
      name: "Portfolio",
      status: "Planned",
      type: "Portfolio",
      enabled: false,
      description: "Portfolio will become the public-facing project showcase.",
      linkedServices: [],
      nextAction: { label: "Coming soon", enabled: false, placeholder: true },
    }];

    new OfficeProjectPortalView(scene, state);

    expect(renderedText.some((item) => item.text.startsWith("Repository:"))).toBe(false);
    expect(renderedText.some((item) => item.text.startsWith("Company:"))).toBe(false);
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

  it("renders a Succeeded [REPO-SYNC] row with branch and short commit sha for a verified GitHub read", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({ externalSources: [] }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    };
    state.repositorySyncSnapshots = {
      "daily-proof": {
        provider: "github",
        availability: "available",
        defaultBranch: "main",
        latestCommit: { sha: "a1b2c3d4e5f6", message: "Fix bug", committedAt: "2026-01-01T00:00:00.000Z" },
        syncStatus: "Succeeded",
        lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
      },
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const repoSyncRow = findRenderedRow(renderedText, "[REPO-SYNC]");

    expect(repoSyncRow?.text).toBe("[REPO-SYNC] Succeeded · main · a1b2c3d");
    assertRowInsidePanel(repoSyncRow, lowerPanel);
  });

  it("renders an Unavailable [REPO-SYNC] row for a project this runtime cannot verify, never a fabricated Succeeded row", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({ externalSources: [] }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "local", connectionState: "Unknown" };
    state.repositorySyncSnapshots = {
      "daily-proof": {
        provider: "local",
        availability: "unavailable",
        syncStatus: "Unavailable",
        errorSummary: "Local repository reads need server-side support.",
      },
    };

    new OfficeProjectPortalView(scene, state);

    const repoSyncRow = findRenderedRow(renderedText, "[REPO-SYNC]");

    expect(repoSyncRow?.text).toBe("[REPO-SYNC] Unavailable: Local repository reads need server-side support.");
    expect(repoSyncRow?.text).not.toContain("Succeeded");
  });

  it("renders no [REPO-SYNC] row when the selected project has no repository identity", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({ externalSources: [] }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";

    new OfficeProjectPortalView(scene, state);

    expect(findRenderedRow(renderedText, "[REPO-SYNC]")).toBeUndefined();
  });

  it("renders [ISSUES]/[ISSUE LIST]/[ISSUE DETAIL] rows for a Succeeded issue collection", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    // Uses a single minimal external source (one signal row instead of the
    // default fixture's [SOURCE]+[SYNC] pair) and a short advisory so all
    // three issue rows genuinely fit within the lower panel's row-count
    // budget -- this is a realistic minimal project, not a padded one.
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [{ id: "repository", label: "Repository", value: "ai-verse/daily-proof" }],
        }],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    };
    state.issueSyncCollections = {
      "daily-proof": {
        provider: "github",
        owner: "ai-verse",
        name: "daily-proof",
        syncStatus: "Succeeded",
        openCount: 2,
        closedCount: 1,
        isTruncated: false,
        issues: [
          {
            id: "ai-verse/daily-proof#12",
            number: 12,
            title: "Fix crash on launch",
            state: "Open",
            assignees: ["octocat"],
            labels: ["bug"],
            provider: "github",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
            syncedAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "ai-verse/daily-proof#8",
            number: 8,
            title: "Second issue",
            state: "Open",
            assignees: [],
            labels: [],
            provider: "github",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            syncedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
      },
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const issuesRow = findRenderedRow(renderedText, "[ISSUES]");
    const issueListRow = findRenderedRow(renderedText, "[ISSUE LIST]");
    const issueDetailRow = findRenderedRow(renderedText, "[ISSUE DETAIL]");

    expect(issuesRow?.text).toBe("[ISSUES] Succeeded · 2 open, 1 closed");
    expect(issueListRow?.text).toBe("[ISSUE LIST] #12 Fix crash on launch (Open); +1 more");
    expect(issueDetailRow?.text).toBe("[ISSUE DETAIL] Labels: bug · Assignees: octocat");
    [issuesRow, issueListRow, issueDetailRow].forEach((row) => {
      assertRowInsidePanel(row, lowerPanel);
    });
  });

  it("keeps Spec 062 issue detail rows ahead of candidate task rows when both are present", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [{ id: "repository", label: "Repository", value: "ai-verse/daily-proof" }],
        }],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.issueSyncCollections = {
      "daily-proof": {
        provider: "github",
        owner: "ai-verse",
        name: "daily-proof",
        syncStatus: "Succeeded",
        openCount: 2,
        closedCount: 0,
        isTruncated: false,
        issues: [
          {
            id: "ai-verse/daily-proof#12",
            number: 12,
            title: "Fix crash on launch",
            state: "Open",
            assignees: ["octocat"],
            labels: ["bug"],
            provider: "github",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
            syncedAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "ai-verse/daily-proof#8",
            number: 8,
            title: "Second issue",
            state: "Open",
            assignees: [],
            labels: [],
            provider: "github",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            syncedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
      },
    };
    state.candidateTaskCollections = {
      "daily-proof": {
        projectId: "daily-proof",
        sourceProvider: "github",
        syncStatus: "Succeeded",
        taskCount: 2,
        sourceIssueCount: 2,
        sourceIssueSyncStatus: "Succeeded",
        sourceIssueSyncedAt: "2026-01-02T00:00:00.000Z",
        tasks: [
          createCandidateTask(12, "Fix crash on launch", "High", "Bug"),
          createCandidateTask(8, "Second issue", "Normal", "Unknown"),
        ],
      },
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const issueDetailRow = findRenderedRow(renderedText, "[ISSUE DETAIL]");

    expect(findRenderedRow(renderedText, "[ISSUE LIST]")?.text).toBe("[ISSUE LIST] #12 Fix crash on launch (Open); +1 more");
    expect(issueDetailRow?.text).toBe("[ISSUE DETAIL] Labels: bug · Assignees: octocat");
    assertRowInsidePanel(issueDetailRow, lowerPanel);
  });

  it("drops lowest-priority issue rows (list and detail) rather than overlapping the panel when space is limited", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);

    // The default advisory/attention text below is long enough to wrap the
    // [ADVISORY] row to two lines, and the default external source produces
    // both [SOURCE] and [SYNC] rows -- which, combined with the always-present
    // [REPO-SYNC] row, leaves room for only the [ISSUES] row, not
    // [ISSUE LIST] or [ISSUE DETAIL]. This is the real, realistic worst case
    // (this is the default createProjectDashboardSnapshot() fixture), not a
    // synthetic one.
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({ externalSources: [] }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    };
    state.issueSyncCollections = {
      "daily-proof": {
        provider: "github",
        owner: "ai-verse",
        name: "daily-proof",
        syncStatus: "Succeeded",
        openCount: 1,
        closedCount: 0,
        isTruncated: false,
        issues: [
          {
            id: "ai-verse/daily-proof#1",
            number: 1,
            title: "An issue with labels and assignees",
            state: "Open",
            assignees: ["octocat"],
            labels: ["bug"],
            provider: "github",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
            syncedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
      },
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const issuesRow = findRenderedRow(renderedText, "[ISSUES]");
    const issueListRow = findRenderedRow(renderedText, "[ISSUE LIST]");
    const issueDetailRow = findRenderedRow(renderedText, "[ISSUE DETAIL]");

    expect(issuesRow?.text).toBe("[ISSUES] Succeeded · 1 open, 0 closed");
    expect(issueListRow).toBeUndefined();
    expect(issueDetailRow).toBeUndefined();
    assertRowInsidePanel(issuesRow, lowerPanel);
  });

  it("distinguishes a real zero-issue Succeeded collection from an Unavailable one", () => {
    const renderedTextSucceeded: RenderedText[] = [];
    const sceneSucceeded = createSceneStub(renderedTextSucceeded, []);
    const succeededState = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({ externalSources: [] }),
    });
    succeededState.selectedProjectDashboardProjectId = "daily-proof";
    succeededState.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    succeededState.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 0, closedCount: 0, isTruncated: false, issues: [] },
    };
    new OfficeProjectPortalView(sceneSucceeded, succeededState);

    const renderedTextUnavailable: RenderedText[] = [];
    const sceneUnavailable = createSceneStub(renderedTextUnavailable, []);
    const unavailableState = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({ externalSources: [] }),
    });
    unavailableState.selectedProjectDashboardProjectId = "daily-proof";
    unavailableState.projects[0].repositoryIdentity = { provider: "local", connectionState: "Unknown" };
    unavailableState.issueSyncCollections = {
      "daily-proof": {
        provider: "local",
        syncStatus: "Unavailable",
        openCount: 0,
        closedCount: 0,
        isTruncated: false,
        issues: [],
        errorSummary: "Local repository reads need server-side support.",
      },
    };
    new OfficeProjectPortalView(sceneUnavailable, unavailableState);

    expect(findRenderedRow(renderedTextSucceeded, "[ISSUES]")?.text).toBe("[ISSUES] Succeeded · 0 open, 0 closed");
    expect(findRenderedRow(renderedTextUnavailable, "[ISSUES]")?.text).toBe(
      "[ISSUES] Unavailable: Local repository reads need server-side support.",
    );
  });

  it("renders AIverse Candidate Task rows separately from raw GitHub Issue rows", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [{ id: "repository", label: "Repository", value: "ai-verse/daily-proof" }],
        }],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 0, closedCount: 0, isTruncated: false, issues: [] },
    };
    state.candidateTaskCollections = {
      "daily-proof": {
        projectId: "daily-proof",
        sourceProvider: "github",
        syncStatus: "Succeeded",
        taskCount: 1,
        sourceIssueCount: 1,
        sourceIssueSyncStatus: "Succeeded",
        sourceIssueSyncedAt: "2026-01-02T00:00:00.000Z",
        tasks: [{
          id: "daily-proof:candidate-task:ai-verse/daily-proof#12",
          originatingIssueId: "ai-verse/daily-proof#12",
          issueNumber: 12,
          projectId: "daily-proof",
          title: "Fix crash on launch",
          summary: "Fix crash on launch",
          labels: ["bug"],
          assignees: [],
          state: "Open",
          estimatedPriority: "High",
          estimatedTaskType: "Bug",
          sourceProvider: "github",
          issueCreatedAt: "2026-01-01T00:00:00.000Z",
          issueUpdatedAt: "2026-01-02T00:00:00.000Z",
          mappedAt: "2026-01-02T00:00:00.000Z",
          syncedAt: "2026-01-02T00:00:00.000Z",
        }],
      },
    };

    new OfficeProjectPortalView(scene, state);

    expect(findRenderedRow(renderedText, "[ISSUES]")?.text).toBe("[ISSUES] Succeeded · 0 open, 0 closed");
    expect(findRenderedRow(renderedText, "[CANDIDATE TASKS]")?.text).toBe("[CANDIDATE TASKS] Succeeded - 1 candidate task");
    expect(findRenderedRow(renderedText, "[CANDIDATE TOP]")?.text).toBe("[CANDIDATE TOP] High/Bug #12 Fix crash on launch (Open)");
  });

  it("renders assignment recommendation rows separately below candidate task rows", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [{ id: "repository", label: "Repository", value: "ai-verse/daily-proof" }],
        }],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 0, closedCount: 0, isTruncated: false, issues: [] },
    };
    state.candidateTaskCollections = {
      "daily-proof": {
        projectId: "daily-proof",
        sourceProvider: "github",
        syncStatus: "Succeeded",
        taskCount: 0,
        sourceIssueCount: 1,
        sourceIssueSyncStatus: "Succeeded",
        sourceIssueSyncedAt: "2026-01-02T00:00:00.000Z",
        tasks: [],
      },
    };
    state.candidateAssignmentCollections = {
      "daily-proof": createCandidateAssignmentCollection("Recommended", "Strong"),
    };
    state.candidatePromotionReviewCollections = {
      "daily-proof": createCandidatePromotionCollection("PendingReview"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const candidateRow = findRenderedRow(renderedText, "[CANDIDATE TASKS]");
    const assignmentRow = findRenderedRow(renderedText, "[ASSIGNMENT RECOMMENDATIONS]");

    expect(assignmentRow?.text).toBe(
      "[ASSIGNMENT RECOMMENDATIONS] Succeeded - 1 assignment recommendation; Recom...",
    );
    expect(assignmentRow?.text).not.toMatch(/Assigned and working|In progress|Started|Executing/i);
    assertRowClears(candidateRow, assignmentRow);
    [candidateRow, assignmentRow].forEach((row) => assertRowInsidePanel(row, lowerPanel));
  });

  it("drops assignment rows before candidate task rows when the lower panel is crowded", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [{ id: "repository", label: "Repository", value: "ai-verse/daily-proof" }],
        }],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.repositorySyncSnapshots = {
      "daily-proof": {
        provider: "github",
        availability: "available",
        syncStatus: "Succeeded",
        defaultBranch: "main",
        latestCommit: { sha: "a1b2c3d4e5f6", message: "Fix bug", committedAt: "2026-01-01T00:00:00.000Z" },
      },
    };
    state.issueSyncCollections = {
      "daily-proof": {
        provider: "github",
        syncStatus: "Succeeded",
        openCount: 0,
        closedCount: 0,
        isTruncated: false,
        issues: [],
      },
    };
    state.candidateTaskCollections = {
      "daily-proof": {
        projectId: "daily-proof",
        sourceProvider: "github",
        syncStatus: "Succeeded",
        taskCount: 1,
        sourceIssueCount: 1,
        sourceIssueSyncStatus: "Succeeded",
        sourceIssueSyncedAt: "2026-01-02T00:00:00.000Z",
        tasks: [createCandidateTask(12, "Fix crash on launch", "High", "Bug")],
      },
    };
    state.candidateAssignmentCollections = {
      "daily-proof": createCandidateAssignmentCollection("Recommended", "Strong"),
    };

    new OfficeProjectPortalView(scene, state);

    expect(findRenderedRow(renderedText, "[ISSUES]")).toBeDefined();
    expect(findRenderedRow(renderedText, "[CANDIDATE TASKS]")).toBeDefined();
    expect(findRenderedRow(renderedText, "[CANDIDATE TOP]")).toBeDefined();
    expect(findRenderedRow(renderedText, "[ASSIGNMENT RECOMMENDATIONS]")).toBeUndefined();
    expect(findRenderedRow(renderedText, "[PROMOTION REVIEW]")).toBeUndefined();
  });

  it("renders promotion review rows below assignment recommendations when space allows", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [{ id: "repository", label: "Repository", value: "ai-verse/daily-proof" }],
        }],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 0, closedCount: 0, isTruncated: false, issues: [] },
    };
    state.candidateAssignmentCollections = {
      "daily-proof": {
        ...createCandidateAssignmentCollection("Recommended", "Strong"),
        recommendations: [],
        recommendationCount: 0,
      },
    };
    state.candidatePromotionReviewCollections = {
      "daily-proof": createCandidatePromotionCollection("Approved"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const assignmentRow = findRenderedRow(renderedText, "[ASSIGNMENT RECOMMENDATIONS]");
    const promotionRow = findRenderedRow(renderedText, "[PROMOTION REVIEW]");

    expect(promotionRow?.text).toContain("[PROMOTION REVIEW] Succeeded - 1 promotion review");
    expect(promotionRow?.text).not.toMatch(/Working|Started|Running|Assigned and active|Executing|Coding now/i);
    assertRowClears(assignmentRow, promotionRow);
    assertRowInsidePanel(promotionRow, lowerPanel);
  });

  it("renders promotion result rows below promotion review rows with safe non-execution wording", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [{ id: "repository", label: "Repository", value: "ai-verse/daily-proof" }],
        }],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.candidatePromotionReviewCollections = {
      "daily-proof": createCandidatePromotionCollection("Approved"),
    };
    state.candidateProjectTaskPromotionResultCollections = {
      "daily-proof": createProjectTaskPromotionResultCollection("Promoted"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const promotionRow = findRenderedRow(renderedText, "[PROMOTION REVIEW]");
    const resultRow = findRenderedRow(renderedText, "[PROMOTION RESULT]");

    expect(resultRow?.text).toContain("Promoted to project task");
    expect(resultRow?.text).toContain("Not started");
    expect(resultRow?.text).toContain("Unassigned");
    expect(resultRow?.text).not.toMatch(/Working|Coding|Executing|Assigned and running|Started automatically/i);
    assertRowClears(promotionRow, resultRow);
    assertRowInsidePanel(resultRow, lowerPanel);
  });

  it("drops promotion result rows before promotion review rows when the lower panel is crowded", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [createExternalSource("ai-verse/daily-proof")],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 0, closedCount: 0, isTruncated: false, issues: [] },
    };
    state.candidatePromotionReviewCollections = {
      "daily-proof": createCandidatePromotionCollection("Approved"),
    };
    state.candidateProjectTaskPromotionResultCollections = {
      "daily-proof": createProjectTaskPromotionResultCollection("Promoted"),
    };

    new OfficeProjectPortalView(scene, state);

    expect(findRenderedRow(renderedText, "[ISSUES]")).toBeDefined();
    expect(findRenderedRow(renderedText, "[PROMOTION REVIEW]")).toBeDefined();
    expect(findRenderedRow(renderedText, "[PROMOTION RESULT]")).toBeUndefined();
  });

  it("renders confirmed assignment rows below promotion result rows with safe non-execution wording", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [],
        }],
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.candidateProjectTaskPromotionResultCollections = {
      "daily-proof": createProjectTaskPromotionResultCollection("Promoted"),
    };
    state.confirmedEmployeeAssignmentResultCollections = {
      "daily-proof": createConfirmedAssignmentResultCollection("Assigned"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const promotionResultRow = findRenderedRow(renderedText, "[PROMOTION RESULT]");
    const confirmedAssignmentRow = findRenderedRow(renderedText, "[CONFIRMED ASSIGNMENT]");

    expect(confirmedAssignmentRow?.text).toContain("Confirmed GPT Engineer");
    expect(confirmedAssignmentRow?.text).toContain("Not started");
    expect(confirmedAssignmentRow?.text).toContain("No work session");
    expect(confirmedAssignmentRow?.text).not.toMatch(/Working|Executing|Coding now|Running task|Work session active/i);
    assertRowClears(promotionResultRow, confirmedAssignmentRow);
    assertRowInsidePanel(confirmedAssignmentRow, lowerPanel);
  });

  it("renders work-session preparation rows after confirmed assignment rows with inactive no-agent wording", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [{
          sourceType: "github",
          sourceId: "github:ai-verse/daily-proof",
          displayName: "ai-verse/daily-proof",
          mappingConfidence: "mapped",
          signals: [],
        }],
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.confirmedEmployeeAssignmentResultCollections = {
      "daily-proof": createConfirmedAssignmentResultCollection("Assigned"),
    };
    state.preparedWorkSessionResultCollections = {
      "daily-proof": createPreparedWorkSessionResultCollection("Prepared"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const confirmedAssignmentRow = findRenderedRow(renderedText, "[CONFIRMED ASSIGNMENT]");
    const preparationRow = findRenderedRow(renderedText, "[WORK SESSION PREPARATION]");

    expect(preparationRow?.text).toContain("Prepared");
    expect(preparationRow?.text).toContain("Not started");
    expect(preparationRow?.text).toContain("Inactive");
    expect(preparationRow?.text).toContain("No agent execution");
    expect(preparationRow?.text).not.toMatch(/Working|Active session|Executing|Running Codex|Running Claude/i);
    assertRowClears(confirmedAssignmentRow, preparationRow);
    assertRowInsidePanel(preparationRow, lowerPanel);
  });

  it("drops confirmed assignment rows before promotion result rows when the lower panel is crowded", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [createExternalSource("ai-verse/daily-proof")],
        advisory: {
          status: "available",
          healthSummary: "On track.",
          topRiskLabel: "None.",
          nextAttentionLabel: "Keep going.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.projects[0].repositoryIdentity = { provider: "github", owner: "ai-verse", name: "daily-proof", connectionState: "Configured" };
    state.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 0, closedCount: 0, isTruncated: false, issues: [] },
    };
    state.candidatePromotionReviewCollections = {
      "daily-proof": createCandidatePromotionCollection("Approved"),
    };
    state.candidateProjectTaskPromotionResultCollections = {
      "daily-proof": createProjectTaskPromotionResultCollection("Promoted"),
    };
    state.confirmedEmployeeAssignmentResultCollections = {
      "daily-proof": createConfirmedAssignmentResultCollection("Assigned"),
    };
    state.preparedWorkSessionResultCollections = {
      "daily-proof": createPreparedWorkSessionResultCollection("Prepared"),
    };

    new OfficeProjectPortalView(scene, state);

    expect(findRenderedRow(renderedText, "[ISSUES]")).toBeDefined();
    expect(findRenderedRow(renderedText, "[PROMOTION REVIEW]")).toBeDefined();
    expect(findRenderedRow(renderedText, "[PROMOTION RESULT]")).toBeUndefined();
    expect(findRenderedRow(renderedText, "[CONFIRMED ASSIGNMENT]")).toBeUndefined();
    expect(findRenderedRow(renderedText, "[WORK SESSION PREPARATION]")).toBeUndefined();
  });

  it("renders active work-session rows above candidate history without implying agent execution", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [createExternalSource("ai-verse/daily-proof")],
        advisory: {
          status: "available",
          healthSummary: "Ok.",
          topRiskLabel: "None.",
          nextAttentionLabel: "None.",
        },
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 1, closedCount: 0, isTruncated: false, issues: [] },
    };
    state.candidateTaskCollections = {
      "daily-proof": {
        projectId: "daily-proof",
        sourceProvider: "github",
        syncStatus: "Succeeded",
        sourceIssueCount: 1,
        sourceIssueSyncStatus: "Succeeded",
        sourceIssueSyncedAt: "2026-01-02T00:00:00.000Z",
        tasks: [createCandidateTask(12, "Fix crash on launch", "High", "Bug")],
        taskCount: 1,
      },
    };
    state.activeWorkSessionStartResultCollections = {
      "daily-proof": createActiveWorkSessionStartResultCollection("Started"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const issueRow = findRenderedRow(renderedText, "[ISSUES]");
    const activeRow = findRenderedRow(renderedText, "[ACTIVE WORK SESSION]");

    expect(activeRow?.text).toContain("Active");
    expect(activeRow?.text).toContain("No agent execution");
    expect(activeRow?.text).toContain("Repo safe");
    expect(activeRow?.text).not.toMatch(/Codex running|Claude running|Agent executing|Repository updating/i);
    assertRowClears(issueRow, activeRow);
    assertRowInsidePanel(activeRow, lowerPanel);
  });

  it("renders execution-plan rows after active work sessions without implying execution", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [createExternalSource("ai-verse/daily-proof")],
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.issueSyncCollections = {
      "daily-proof": { provider: "github", syncStatus: "Succeeded", openCount: 1, closedCount: 0, isTruncated: false, issues: [] },
    };
    state.candidateTaskCollections = {
      "daily-proof": {
        projectId: "daily-proof",
        sourceProvider: "github",
        syncStatus: "Succeeded",
        sourceIssueCount: 1,
        sourceIssueSyncStatus: "Succeeded",
        sourceIssueSyncedAt: "2026-01-02T00:00:00.000Z",
        tasks: [createCandidateTask(12, "Fix crash on launch", "High", "Bug")],
        taskCount: 1,
      },
    };
    state.activeWorkSessionStartResultCollections = {
      "daily-proof": createActiveWorkSessionStartResultCollection("Started"),
    };
    state.executionPlanCollections = {
      "daily-proof": createExecutionPlanCollection(),
    };
    state.executionPlanResultCollections = {
      "daily-proof": createExecutionPlanResultCollection("Created"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const activeRow = findRenderedRow(renderedText, "[ACTIVE WORK SESSION]");
    const planRow = findRenderedRow(renderedText, "[EXECUTION PLAN]");

    expect(planRow?.text).toContain("Execution Plan Ready");
    expect(planRow?.text).toContain("Execution Not Started");
    expect(planRow?.text).toMatch(/Awaiting\s+Readiness Validation/);
    expect(planRow?.text).toContain("Implementer Codex CLI");
    expect(planRow?.text).toContain("Reviewer Claude CLI");
    expect(planRow?.text).toContain("Branch");
    expect(planRow?.text).not.toMatch(/Running|Executing|Coding|Reviewing/i);
    assertRowClears(activeRow, planRow);
    assertRowInsidePanel(planRow, lowerPanel);
  });

  it("keeps source rows visible alongside execution-plan rows when space allows", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({
        externalSources: [createExternalSource("ai-verse/daily-proof")],
      }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.executionPlanResultCollections = {
      "daily-proof": createExecutionPlanResultCollection("Blocked"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const sourceRow = findRenderedRow(renderedText, "[SOURCE]");
    const planRow = findRenderedRow(renderedText, "[EXECUTION PLAN]");

    expect(sourceRow?.text).toContain("Repo ai-verse/daily-proof");
    expect(planRow?.text).toContain("Execution Plan Blocked");
    assertRowClears(sourceRow, planRow);
    [sourceRow, planRow].forEach((row) => assertRowInsidePanel(row, lowerPanel));
  });

  it("renders execution readiness rows without hiding execution-plan context", () => {
    const renderedText: RenderedText[] = [];
    const renderedPanels: RenderedPanel[] = [];
    const scene = createSceneStub(renderedText, renderedPanels);
    // Keep this fixture focused on plan/readiness priority; source-row coexistence has its own test above.
    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot(),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.executionPlanCollections = {
      "daily-proof": createExecutionPlanCollection(),
    };
    state.executionPlanResultCollections = {
      "daily-proof": createExecutionPlanResultCollection("Created"),
    };
    state.executionReadinessCollections = {
      "daily-proof": createExecutionReadinessCollection("Ready"),
    };
    state.executionReadinessResultCollections = {
      "daily-proof": createExecutionReadinessResultCollection("Ready"),
    };

    new OfficeProjectPortalView(scene, state);

    const lowerPanel = findLowerProjectPanel(renderedPanels);
    const planRow = findRenderedRow(renderedText, "[EXECUTION PLAN]");
    const readinessRow = findRenderedRow(renderedText, "[EXECUTION READINESS]");

    expect(planRow?.text).toContain("Execution Plan Ready");
    expect(readinessRow?.text).toContain("Ready");
    expect(readinessRow?.text).toContain("No approval");
    expect(readinessRow?.text).toContain("Not started");
    expect(readinessRow?.text).not.toMatch(/Approved to Execute|Execution Approved|Running|Executing|Coding|Reviewing|Codex Started|Claude Started|Repository Changing/i);
    [planRow, readinessRow].forEach((row) => assertRowInsidePanel(row, lowerPanel));
  });

  it("renders approved and blocked human execution approval rows safely", () => {
    for (const status of ["Approved", "Blocked"] as const) {
      const renderedText: RenderedText[] = [];
      const renderedPanels: RenderedPanel[] = [];
      const scene = createSceneStub(renderedText, renderedPanels, 1200);
      const state = createPortalState({
        viewMode: "project-dashboard",
        projectDashboardSnapshot: createProjectDashboardSnapshot(),
      });
      state.selectedProjectDashboardProjectId = "daily-proof";
      state.executionReadinessCollections = {
        "daily-proof": createExecutionReadinessCollection(status === "Approved" ? "Ready" : "Blocked"),
      };
      state.executionReadinessResultCollections = {
        "daily-proof": createExecutionReadinessResultCollection(status === "Approved" ? "Ready" : "Blocked"),
      };
      state.humanExecutionApprovalCollections = status === "Approved"
        ? { "daily-proof": createHumanExecutionApprovalCollection() }
        : {};
      state.humanExecutionApprovalResultCollections = {
        "daily-proof": createHumanExecutionApprovalResultCollection(status),
      };

      new OfficeProjectPortalView(scene, state);

      const approvalRow = findRenderedRow(renderedText, "[HUMAN EXECUTION APPROVAL]");
      expect(approvalRow?.text).toContain(status === "Approved" ? "Execution Approved" : "Unavailable");
      expect(approvalRow?.text).toContain("Not started");
      expect(approvalRow?.text).not.toMatch(/Running|Executing|Coding|Reviewing|Codex Started|Claude Started|Repository Changing/i);
      assertRowInsidePanel(approvalRow, findLowerProjectPanel(renderedPanels));
    }
  });

  it("renders blocked and failed execution readiness wording in the dashboard", () => {
    for (const status of ["Blocked", "Failed"] as const) {
      const renderedText: RenderedText[] = [];
      const renderedPanels: RenderedPanel[] = [];
      const scene = createSceneStub(renderedText, renderedPanels);
      const state = createPortalState({
        viewMode: "project-dashboard",
        projectDashboardSnapshot: createProjectDashboardSnapshot(),
      });
      state.selectedProjectDashboardProjectId = "daily-proof";
      state.executionReadinessCollections = {
        "daily-proof": createExecutionReadinessCollection(status),
      };
      state.executionReadinessResultCollections = {
        "daily-proof": createExecutionReadinessResultCollection(status),
      };

      new OfficeProjectPortalView(scene, state);

      const readinessRow = findRenderedRow(renderedText, "[EXECUTION READINESS]");
      expect(readinessRow?.text).toContain(status === "Blocked" ? "Blocked" : "Readiness failed");
      expect(readinessRow?.text).toContain("Not started");
      expect(readinessRow?.text).toContain("TASK_STATE");
      assertRowInsidePanel(readinessRow, findLowerProjectPanel(renderedPanels));
    }
  });

  it("renders an explicit No repository identity row (never silence) when the selected project has none", () => {
    const renderedText: RenderedText[] = [];
    const scene = createSceneStub(renderedText, []);

    const state = createPortalState({
      viewMode: "project-dashboard",
      projectDashboardSnapshot: createProjectDashboardSnapshot({ externalSources: [] }),
    });
    state.selectedProjectDashboardProjectId = "daily-proof";

    new OfficeProjectPortalView(scene, state);

    expect(findRenderedRow(renderedText, "[ISSUES]")?.text).toBe("[ISSUES] No repository identity");
    expect(findRenderedRow(renderedText, "[ISSUE LIST]")).toBeUndefined();
    expect(findRenderedRow(renderedText, "[ISSUE DETAIL]")).toBeUndefined();
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
const PROJECT_DASHBOARD_SECTION_PANEL_HEIGHT = 136;

function findRenderedRow(renderedText: RenderedText[], prefix: string) {
  return renderedText.find((item) => item.text.startsWith(prefix));
}

function findDialogPanel(renderedPanels: RenderedPanel[]) {
  const dialogPanel = renderedPanels.find((panel) => panel.height === 454);
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

function createSceneStub(renderedText: RenderedText[], renderedPanels: RenderedPanel[], height = 768): PhaserScene {
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
      height,
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
  officeZoneProgress?: NonNullable<ProjectPortalState["companyDashboardSnapshot"]>["officeZoneProgress"];
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
    officeZoneProgress: options.officeZoneProgress ?? {
      unlockedZoneCount: 0,
      nextUnlock: undefined,
    },
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
    selectedCandidatePromotionIndex: 0,
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
    projectRegistryEntries: [],
    services: [],
    workspaces: {},
    repositoryMappings: [],
    repositorySummaries: {},
    repositorySyncSnapshots: {},
    issueSyncCollections: {},
    candidateTaskCollections: {},
    candidateAssignmentCollections: {},
    candidatePromotionReviewCollections: {},
    candidatePromotionDecisionRecords: {},
    candidateProjectTaskPromotionResultCollections: {},
    confirmedEmployeeAssignmentRecords: {},
    confirmedEmployeeAssignmentResultCollections: {},
    preparedWorkSessionRecords: {},
    preparedWorkSessionResultCollections: {},
    activeWorkSessionStartResultCollections: {},
    executionPlanCollections: {},
    executionPlanResultCollections: {},
    executionReadinessCollections: {},
    executionReadinessResultCollections: {},
    humanExecutionApprovalCollections: {},
    humanExecutionApprovalResultCollections: {},
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

function createCandidateTask(
  issueNumber: number,
  title: string,
  estimatedPriority: "High" | "Medium" | "Low" | "Normal",
  estimatedTaskType: "Bug" | "Feature" | "Documentation" | "Maintenance" | "Research" | "Unknown",
) {
  return {
    id: `daily-proof:candidate-task:ai-verse/daily-proof#${issueNumber}`,
    originatingIssueId: `ai-verse/daily-proof#${issueNumber}`,
    issueNumber,
    projectId: "daily-proof",
    title,
    summary: title,
    labels: [],
    assignees: [],
    state: "Open" as const,
    estimatedPriority,
    estimatedTaskType,
    sourceProvider: "github",
    issueCreatedAt: "2026-01-01T00:00:00.000Z",
    issueUpdatedAt: "2026-01-02T00:00:00.000Z",
    mappedAt: "2026-01-02T00:00:00.000Z",
    syncedAt: "2026-01-02T00:00:00.000Z",
  };
}

function createCandidateAssignmentCollection(
  assignmentStatus: "Recommended" | "NeedsReview" | "Unassigned" | "Unavailable",
  matchTier: "Strong" | "Moderate" | "Weak" | "None",
): CandidateAssignmentRecommendationCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded" as const,
    recommendationStatus: "Succeeded" as const,
    recommendationCount: 1,
    generatedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    sourceCandidateTaskCount: 1,
    recommendations: [{
      id: "daily-proof:assignment:candidate-12:gpt-engineer:candidate-assignment-v1",
      candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
      candidateTaskTitle: "Fix crash on launch",
      projectId: "daily-proof",
      recommendedEmployeeId: assignmentStatus === "Recommended" || assignmentStatus === "NeedsReview" ? "gpt-engineer" : undefined,
      recommendedEmployeeName: assignmentStatus === "Recommended" || assignmentStatus === "NeedsReview" ? "GPT Engineer" : undefined,
      employeeRole: assignmentStatus === "Recommended" || assignmentStatus === "NeedsReview" ? "Engineer" : undefined,
      assignmentStatus,
      matchTier,
      matchedCapabilities: matchTier === "None" ? [] : ["BugFixing" as const],
      unmatchedRequirements: [],
      warnings: [],
      taskType: "Bug" as const,
      proposedPriority: "High" as const,
      reasonCodes: ["CAPABILITY_MATCH" as const],
      generatedAt: "2026-01-02T00:00:00.000Z",
      rulesetVersion: "candidate-assignment-v1",
      provenance: {
        candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
        originatingIssueId: "ai-verse/daily-proof#12",
        issueNumber: 12,
      },
      alternatives: [],
    }],
  };
}

function createCandidatePromotionCollection(
  promotionStatus: "PendingReview" | "Approved" | "Rejected" | "Deferred" | "NeedsReview" | "Ineligible" | "Unavailable",
): CandidatePromotionReviewCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    sourceAssignmentStatus: "Succeeded",
    reviewStatus: "Succeeded",
    reviewCount: 1,
    selectedIndex: 0,
    generatedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: "candidate-promotion-v1",
    sourceCandidateTaskCount: 1,
    sourceAssignmentCount: 1,
    reviews: [{
      id: "daily-proof:candidate-promotion:daily-proof:candidate-task:ai-verse/daily-proof#12:candidate-promotion-v1",
      projectId: "daily-proof",
      candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
      candidateTaskTitle: "Fix crash on launch",
      candidateTaskType: "Bug",
      candidateTaskPriority: "High",
      candidateTaskState: "Open",
      candidateTaskProvenance: {
        candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
        originatingIssueId: "ai-verse/daily-proof#12",
        issueNumber: 12,
        sourceProvider: "github",
      },
      assignmentRecommendationId: "daily-proof:assignment:candidate-12:gpt-engineer:candidate-assignment-v1",
      recommendedEmployeeId: "gpt-engineer",
      recommendedEmployeeName: "GPT Engineer",
      assignmentStatus: "Recommended",
      promotionStatus,
      eligibility: {
        status: promotionStatus === "Unavailable" ? "Unavailable" : promotionStatus === "Ineligible" ? "Ineligible" : "PendingReview",
        isApprovable: promotionStatus !== "Unavailable" && promotionStatus !== "Ineligible",
        reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
        summary: "Ready for human promotion review.",
      },
      availableActions: ["Approved", "Rejected", "Deferred", "PendingReview"],
      rulesetVersion: "candidate-promotion-v1",
    }],
  };
}

function createProjectTaskPromotionResultCollection(
  status: "Promoted" | "AlreadyPromoted" | "Rejected" | "Ineligible" | "Unavailable" | "Failed",
): CandidateProjectTaskPromotionResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "daily-proof:project-task-promotion:daily-proof:candidate-task:ai-verse/daily-proof#12:candidate-promotion-v1",
      projectId: "daily-proof",
      candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
      promotionDecisionId: "daily-proof:candidate-promotion:daily-proof:candidate-task:ai-verse/daily-proof#12:candidate-promotion-v1",
      createdProjectTaskId: "task-12",
      status,
      reasonCodes: [status === "Promoted" ? "PROMOTED" : "ALREADY_PROMOTED"],
      duplicateExistingTask: status === "AlreadyPromoted",
      promotedAt: "2026-01-02T00:00:00.000Z",
      rulesetVersion: "candidate-promotion-v1",
      activeTaskCreated: status === "Promoted" || status === "AlreadyPromoted",
      workStarted: false,
      employeeAssigned: false,
      executionStarted: false,
    }],
    resultCount: 1,
    generatedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: "candidate-promotion-v1",
  };
}

function createConfirmedAssignmentResultCollection(
  status: "Assigned" | "AlreadyAssigned" | "Ineligible" | "Unavailable" | "Conflict" | "Failed",
): ConfirmedEmployeeAssignmentResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "daily-proof:task-assignment-result:task-12:confirmed-assignment-v1",
      projectId: "daily-proof",
      projectTaskId: "task-12",
      candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
      employeeId: "gpt-engineer",
      employeeDisplayName: "GPT Engineer",
      assignmentRecordId: "daily-proof:task-assignment:task-12:gpt-engineer:confirmed-assignment-v1",
      status,
      reasonCodes: [status === "Assigned" ? "ASSIGNED" : status === "AlreadyAssigned" ? "ALREADY_ASSIGNED" : "EMPLOYEE_CONFLICT"],
      assignedTask: status === "Assigned" || status === "AlreadyAssigned",
      humanConfirmed: status === "Assigned" || status === "AlreadyAssigned",
      workStarted: false,
      workSessionCreated: false,
      executionStarted: false,
      duplicateExistingAssignment: status === "AlreadyAssigned",
      resultAt: "2026-01-02T00:00:00.000Z",
      rulesetVersion: "confirmed-assignment-v1",
    }],
    resultCount: 1,
    generatedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: "confirmed-assignment-v1",
  };
}

function createPreparedWorkSessionResultCollection(
  status: "Prepared" | "AlreadyPrepared" | "Ineligible" | "Unavailable" | "Conflict" | "Failed",
): PreparedWorkSessionResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "daily-proof:prepared-work-session-result:task-12:prepared-session-v1",
      projectId: "daily-proof",
      projectTaskId: "task-12",
      confirmedAssignmentId: "daily-proof:task-assignment:task-12:gpt-engineer:confirmed-assignment-v1",
      employeeId: "gpt-engineer",
      employeeDisplayName: "GPT Engineer",
      preparedSessionId: "daily-proof:prepared-work-session:task-12:daily-proof:task-assignment:task-12:gpt-engineer:confirmed-assignment-v1:prepared-session-v1",
      status,
      reasonCodes: [status === "Prepared" ? "PREPARED" : status === "AlreadyPrepared" ? "ALREADY_PREPARED" : "EMPLOYEE_CONFLICT"],
      prepared: status === "Prepared" || status === "AlreadyPrepared",
      duplicateExistingPreparation: status === "AlreadyPrepared",
      humanPrepared: status === "Prepared" || status === "AlreadyPrepared",
      active: false,
      workStarted: false,
      executionStarted: false,
      employeeMoved: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      resultAt: "2026-01-03T00:00:00.000Z",
      rulesetVersion: "prepared-session-v1",
    }],
    resultCount: 1,
    generatedAt: "2026-01-03T00:00:00.000Z",
    rulesetVersion: "prepared-session-v1",
  };
}

function createActiveWorkSessionStartResultCollection(
  status: "Started" | "AlreadyStarted" | "Ineligible" | "Unavailable" | "Conflict" | "Failed",
): ActiveWorkSessionStartResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "daily-proof:work-session-start-result:task-12:prepared-12:active-session-v1",
      projectId: "daily-proof",
      projectTaskId: "task-12",
      preparedSessionId: "prepared-12",
      confirmedAssignmentId: "daily-proof:task-assignment:task-12:gpt-engineer:confirmed-assignment-v1",
      candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
      employeeId: "gpt-engineer",
      employeeDisplayName: "GPT Engineer",
      activeSessionId: "daily-proof:work-session:task-12:prepared-12:active-session-v1",
      status,
      reasonCodes: [status === "Started" ? "STARTED" : status === "AlreadyStarted" ? "ALREADY_STARTED" : "EMPLOYEE_CONFLICT"],
      started: status === "Started" || status === "AlreadyStarted",
      duplicateExistingSession: status === "AlreadyStarted",
      humanStarted: status === "Started" || status === "AlreadyStarted",
      active: status === "Started" || status === "AlreadyStarted",
      workStarted: status === "Started" || status === "AlreadyStarted",
      executionStarted: false,
      agentStarted: false,
      employeeMoved: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      resultAt: "2026-01-04T00:00:00.000Z",
      rulesetVersion: "active-session-v1",
    }],
    resultCount: 1,
    generatedAt: "2026-01-04T00:00:00.000Z",
    rulesetVersion: "active-session-v1",
  };
}

function createExecutionPlanCollection(): ExecutionPlanCollection {
  return {
    projectId: "daily-proof",
    plans: [{
      planId: "daily-proof:execution-plan:daily-proof:work-session:task-12:prepared-12:active-session-v1:plan-v1",
      projectId: "daily-proof",
      featureId: "070-execution-plan-foundation",
      projectTaskId: "task-12",
      candidateTaskId: "daily-proof:candidate-task:ai-verse/daily-proof#12",
      recommendationId: "daily-proof:assignment:candidate-12:gpt-engineer:candidate-assignment-v1",
      promotionDecisionId: "daily-proof:candidate-promotion:daily-proof:candidate-task:ai-verse/daily-proof#12:candidate-promotion-v1",
      confirmedAssignmentId: "daily-proof:task-assignment:task-12:gpt-engineer:confirmed-assignment-v1",
      preparedSessionId: "prepared-12",
      activeSessionId: "daily-proof:work-session:task-12:prepared-12:active-session-v1",
      employeeId: "gpt-engineer",
      repositoryId: "github:ai-verse/daily-proof",
      repositoryPath: "C:\\Projects\\daily-proof",
      worktreePath: "C:\\Projects\\daily-proof-spec-070",
      branchName: "codex/070-execution-plan-foundation",
      specPath: "specs/070-execution-plan-foundation/spec.md",
      implementerAgent: "Codex CLI",
      reviewerAgent: "Claude CLI",
      validationCommands: ["npm test", "npx tsc --noEmit"],
      allowedMutationScope: ["local-worktree-only", "no-agent-runtime"],
      createdAt: "2026-01-05T00:00:00.000Z",
      rulesVersion: "plan-v1",
      executionStarted: false,
      runtimeStarted: false,
      subprocessStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    }],
    planCount: 1,
    generatedAt: "2026-01-05T00:00:00.000Z",
    rulesVersion: "plan-v1",
  };
}

function createExecutionPlanResultCollection(
  status: "Created" | "AlreadyExists" | "Blocked" | "Failed",
): ExecutionPlanResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "daily-proof:execution-plan-result:daily-proof:work-session:task-12:prepared-12:active-session-v1:plan-v1",
      projectId: "daily-proof",
      projectTaskId: "task-12",
      activeSessionId: "daily-proof:work-session:task-12:prepared-12:active-session-v1",
      planId: status === "Created" || status === "AlreadyExists"
        ? "daily-proof:execution-plan:daily-proof:work-session:task-12:prepared-12:active-session-v1:plan-v1"
        : undefined,
      status,
      reasonCodes: [status === "Created" ? "CREATED" : status === "AlreadyExists" ? "ALREADY_EXISTS" : "EMPLOYEE_STALE"],
      createdPlan: status === "Created" || status === "AlreadyExists",
      duplicateExistingPlan: status === "AlreadyExists",
      executionStarted: false,
      runtimeStarted: false,
      subprocessStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      resultAt: "2026-01-05T00:00:00.000Z",
      rulesVersion: "plan-v1",
    }],
    resultCount: 1,
    generatedAt: "2026-01-05T00:00:00.000Z",
    rulesVersion: "plan-v1",
  };
}

function createExecutionReadinessCollection(status: "Ready" | "Blocked" | "Failed"): ExecutionReadinessCollection {
  return {
    projectId: "daily-proof",
    readiness: [{
      readinessId: "daily-proof:execution-readiness:plan-1:readiness-v1",
      projectId: "daily-proof",
      executionPlanId: "plan-1",
      activeSessionId: "active-session-1",
      projectTaskId: "task-12",
      confirmedAssignmentId: "assignment-12",
      preparedSessionId: "prepared-12",
      employeeId: "gpt-engineer",
      repositoryId: "github:ai-verse/daily-proof",
      status,
      checks: [
        {
          checkId: "check-plan",
          category: "ExecutionPlan",
          status: "Passed",
          reason: "READY",
          message: "Execution plan is current.",
        },
        {
          checkId: "check-task",
          category: "ProjectTask",
          status: status === "Ready" ? "Passed" : "Blocked",
          reason: status === "Ready" ? "READY" : "TASK_STATE_INCOMPATIBLE",
          message: "ProjectTask state checked.",
        },
      ],
      evaluatedAt: "2026-01-06T00:00:00.000Z",
      rulesVersion: "readiness-v1",
      executionApproved: false,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    }],
    readinessCount: 1,
    generatedAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "readiness-v1",
  };
}

function createExecutionReadinessResultCollection(status: "Ready" | "Blocked" | "Failed"): ExecutionReadinessResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "daily-proof:execution-readiness-result:plan-1:readiness-v1",
      projectId: "daily-proof",
      executionPlanId: "plan-1",
      readinessId: "daily-proof:execution-readiness:plan-1:readiness-v1",
      status,
      reasonCodes: status === "Ready" ? ["READY"] : ["TASK_STATE_INCOMPATIBLE"],
      primaryReason: status === "Ready" ? "READY" : "TASK_STATE_INCOMPATIBLE",
      passedCheckCount: status === "Ready" ? 10 : 9,
      blockedCheckCount: status === "Blocked" ? 1 : 0,
      failedCheckCount: status === "Failed" ? 1 : 0,
      executionApproved: false,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      evaluatedAt: "2026-01-06T00:00:00.000Z",
      rulesVersion: "readiness-v1",
    }],
    resultCount: 1,
    generatedAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "readiness-v1",
  };
}

function createHumanExecutionApprovalCollection(): HumanExecutionApprovalCollection {
  return {
    projectId: "daily-proof",
    approvals: [{
      approvalId: "daily-proof:human-execution-approval:plan-1:approval-v1",
      projectId: "daily-proof",
      executionPlanId: "plan-1",
      readinessId: "daily-proof:execution-readiness:plan-1:readiness-v1",
      activeSessionId: "active-session-1",
      projectTaskId: "task-12",
      confirmedAssignmentId: "assignment-12",
      preparedSessionId: "prepared-12",
      employeeId: "gpt-engineer",
      repositoryId: "github:ai-verse/daily-proof",
      implementerAgent: "Implementer",
      reviewerAgent: "Reviewer",
      validationCommands: ["npm test"],
      allowedMutationScope: ["local-files"],
      decision: "Approved",
      executionApproved: true,
      approvedAt: "2026-01-07T00:00:00.000Z",
      approvedBy: "Local Human",
      rulesVersion: "approval-v1",
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    }],
    approvalCount: 1,
    generatedAt: "2026-01-07T00:00:00.000Z",
    rulesVersion: "approval-v1",
  };
}

function createHumanExecutionApprovalResultCollection(
  status: "Approved" | "AlreadyApproved" | "Blocked" | "Failed",
): HumanExecutionApprovalResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "daily-proof:human-execution-approval-result:plan-1:approval-v1",
      projectId: "daily-proof",
      executionPlanId: "plan-1",
      readinessId: "daily-proof:execution-readiness:plan-1:readiness-v1",
      approvalId: status === "Approved" || status === "AlreadyApproved"
        ? "daily-proof:human-execution-approval:plan-1:approval-v1"
        : undefined,
      status,
      reasonCodes: [status === "Approved" ? "APPROVED" : status === "AlreadyApproved" ? "ALREADY_APPROVED" : "READINESS_NOT_READY"],
      approved: status === "Approved",
      duplicateExistingApproval: status === "AlreadyApproved",
      executionApproved: status === "Approved" || status === "AlreadyApproved",
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      resultAt: "2026-01-07T00:00:00.000Z",
      rulesVersion: "approval-v1",
    }],
    resultCount: 1,
    generatedAt: "2026-01-07T00:00:00.000Z",
    rulesVersion: "approval-v1",
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
