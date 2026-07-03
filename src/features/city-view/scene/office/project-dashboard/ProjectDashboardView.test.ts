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
      relatedFocusText: "Focus: Company focus is Reduce project risk.",
      nextSuggestedFocusText: "Next suggested focus: Reduce project risk",
      sourceText: "Source: internal-simulation",
    });
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
    source: {
      sourceType: "internal-simulation",
      sourceId: "daily-proof",
      mappingConfidence: "native",
    },
    sections: [],
  };
}
