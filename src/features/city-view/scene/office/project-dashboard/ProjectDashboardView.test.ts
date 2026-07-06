import { describe, expect, it } from "vitest";

import {
  createUnavailableProjectDashboardSnapshot,
  INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID,
  type ProjectDashboardSnapshot,
} from "./ProjectDashboardTypes";
import { createProjectDashboardPanelRows } from "./ProjectDashboardView";

describe("ProjectDashboardView rows", () => {
  it("creates read-only rows for populated provider-neutral project data", () => {
    const rows = createProjectDashboardPanelRows(createSnapshot());

    expect(rows).toEqual({
      title: "Daily Proof",
      statusText: "Active | Project needs attention",
      progressText: "Progress: 50% complete",
      healthText: "Critical unfinished work is visible.",
      activeWorkHeading: "Active Work",
      activeWorkRows: ["Build project dashboard - In Progress (High)"],
      employeeHeading: "Employees",
      employeeRows: ["Ada - working"],
      blockerText: "Blocker: Critical unfinished task",
      activityText: "Activity: Build project dashboard is In Progress.",
      advisoryText: "Advisory: Daily Proof has 1 active task and 1 completed task. Risk: Critical work needs review.",
      advisoryNextText: "Next attention: Reduce project risk: Critical dashboard work needs attention.",
      relatedFocusText: "Focus: Company focus is Reduce project risk.",
      nextSuggestedFocusText: "Next suggested focus: Reduce project risk",
      sourceText: "Source: internal-simulation",
      sourceSignalRows: [],
    });
  });

  it("creates provider-neutral source rows for external repository context", () => {
    const rows = createProjectDashboardPanelRows({
      ...createSnapshot(),
      externalSources: [{
        sourceType: "github",
        sourceId: "github:ai-verse/daily-proof",
        displayName: "ai-verse/daily-proof",
        mappingConfidence: "mapped",
        statusLabel: "Fresh",
        signals: [
          {
            id: "repository",
            label: "Repository",
            value: "ai-verse/daily-proof",
          },
          {
            id: "default-branch",
            label: "Default Branch",
            value: "main",
          },
          {
            id: "open-issues",
            label: "Open Issues",
            value: "0",
          },
        ],
      }],
    });

    expect(rows.sourceText).toBe("Source: internal-simulation + github [Fresh]");
    expect(rows.sourceSignalRows).toEqual([
      "Repo ai-verse/daily-proof",
      "Status: Fresh",
      "Default Branch: main",
      "Open Issues: 0",
    ]);
  });

  it("creates empty rows for partial data without fabricating project activity", () => {
    const rows = createProjectDashboardPanelRows({
      ...createSnapshot(),
      activeWork: [],
      employees: [],
      blockers: [],
      activity: [],
      relatedFocus: {
        employeeFocusLabels: [],
        summary: "No project focus signals are visible.",
      },
      nextSuggestedFocus: undefined,
    });

    expect(rows.activeWorkRows).toEqual(["No active tasks visible."]);
    expect(rows.employeeRows).toEqual(["No employee context visible."]);
    expect(rows.blockerText).toBe("Blockers: None visible");
    expect(rows.activityText).toBe("Activity: No recent project activity");
    expect(rows.advisoryText).toBe("Advisory: Daily Proof has 1 active task and 1 completed task. Risk: Critical work needs review.");
    expect(rows.advisoryNextText).toBe("Next attention: Reduce project risk: Critical dashboard work needs attention.");
    expect(rows.relatedFocusText).toBe("Focus: No project focus signals are visible.");
    expect(rows.nextSuggestedFocusText).toBe("Next suggested focus: None");
  });

  it("creates unavailable rows for a missing selected project", () => {
    const rows = createProjectDashboardPanelRows(
      createUnavailableProjectDashboardSnapshot(
        INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID,
        "2026-01-01T10:00:00.000Z",
        "missing-project",
      ),
    );

    expect(rows.title).toBe("Project unavailable");
    expect(rows.statusText).toBe("Project unavailable");
    expect(rows.healthText).toBe("The selected project could not be found in the current dashboard source.");
    expect(rows.advisoryText).toBe("Advisory: Advisory unavailable Risk: Project unavailable");
    expect(rows.advisoryNextText).toBe("Next attention: No project advisory can be shown.");
  });

  it("creates clear empty advisory rows when local suggestion data is missing", () => {
    const rows = createProjectDashboardPanelRows({
      ...createSnapshot(),
      advisory: {
        status: "empty",
        healthSummary: "Local advisory waiting for project-manager signal.",
        topRiskLabel: "No local advisory risk is available.",
        nextAttentionLabel: "Open project work areas to prepare advisory context.",
      },
    });

    expect(rows.advisoryText).toBe(
      "Advisory: Local advisory waiting for project-manager signal. Risk: No local advisory risk is available.",
    );
    expect(rows.advisoryNextText).toBe(
      "Next attention: Open project work areas to prepare advisory context.",
    );
  });

  it("does not expose assignment, editing, issue creation, dialogue, or direct control affordances", () => {
    const rows = createProjectDashboardPanelRows(createSnapshot());
    const text = Object.values(rows).flat().join(" ").toLowerCase();

    expect(text).not.toContain("assign");
    expect(text).not.toContain("edit");
    expect(text).not.toContain("create issue");
    expect(text).not.toContain("dialogue");
    expect(text).not.toContain("control employee");
    expect(text).not.toContain("github");
  });

  it("does not expose repository mutation, credential, webhook, or autonomous coding affordances", () => {
    const rows = createProjectDashboardPanelRows({
      ...createSnapshot(),
      externalSources: [{
        sourceType: "github",
        sourceId: "github:ai-verse/daily-proof",
        displayName: "ai-verse/daily-proof",
        statusLabel: "Fresh",
        signals: [{
          id: "open-pull-requests",
          label: "Open Pull Requests",
          value: "0",
        }],
      }],
    });
    const text = Object.values(rows).flat().join(" ").toLowerCase();

    expect(text).not.toContain("create issue");
    expect(text).not.toContain("create pull request");
    expect(text).not.toContain("create branch");
    expect(text).not.toContain("commit action");
    expect(text).not.toContain("merge pull request");
    expect(text).not.toContain("github actions");
    expect(text).not.toContain("webhook");
    expect(text).not.toContain("token");
    expect(text).not.toContain("credential");
    expect(text).not.toContain("autonomous coding");
  });

  it("does not import GitHub provider or API response types directly", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL("./ProjectDashboardView.ts", import.meta.url), "utf8");

    expect(source).not.toContain("../github");
    expect(source).not.toContain("GitHubRepository");
    expect(source).not.toContain("GitHubProjectDashboardProvider");
  });
});

function createSnapshot(): ProjectDashboardSnapshot {
  return {
    providerId: INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID,
    generatedAt: "2026-01-01T10:00:00.000Z",
    project: {
      projectId: "daily-proof",
      name: "Daily Proof",
      status: "Active",
      description: "Daily Proof validates AIverse office workflows.",
      isAvailable: true,
    },
    progress: {
      percentComplete: 50,
      completedWorkCount: 1,
      totalWorkCount: 2,
      label: "50% complete",
    },
    health: {
      status: "risk",
      label: "Project needs attention",
      reason: "Critical unfinished work is visible.",
      signals: ["Critical unfinished task"],
    },
    activeWork: [{
      id: "task-dashboard",
      title: "Build project dashboard",
      status: "In Progress",
      priority: "High",
      progressPercent: 50,
      updatedAt: "2026-01-01T10:00:00.000Z",
    }],
    employees: [{
      employeeId: "employee-1",
      name: "Ada",
      role: "Engineer",
      aiState: "working",
      focusLabel: "Build project dashboard",
    }],
    blockers: [{
      id: "critical-task-task-dashboard",
      severity: "high",
      label: "Critical unfinished task",
      reason: "Build project dashboard is still In Progress.",
    }],
    activity: [{
      id: "task-status-task-dashboard",
      timestamp: "2026-01-01T10:00:00.000Z",
      type: "task_status",
      label: "Build project dashboard is In Progress.",
    }],
    relatedFocus: {
      companyFocusLabel: "Reduce project risk",
      employeeFocusLabels: ["Ada: Build project dashboard"],
      summary: "Company focus is Reduce project risk.",
    },
    nextSuggestedFocus: "Reduce project risk",
    advisory: {
      status: "available",
      healthSummary: "Daily Proof has 1 active task and 1 completed task.",
      topRiskLabel: "Critical work needs review.",
      nextAttentionLabel: "Reduce project risk: Critical dashboard work needs attention.",
      generatedAt: "2026-01-01T10:00:00.000Z",
    },
    source: {
      sourceType: "internal-simulation",
      sourceId: "daily-proof",
      mappingConfidence: "native",
    },
    sections: [],
  };
}
