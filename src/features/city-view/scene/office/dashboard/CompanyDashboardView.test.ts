import { describe, expect, it } from "vitest";

import { createCompanyDashboardPanelRows } from "./CompanyDashboardView";
import {
  createEmptyCompanyDashboardSnapshot,
  INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
} from "./CompanyDashboardTypes";

describe("CompanyDashboardView read-only rows", () => {
  it("creates command center rows from a provider-neutral snapshot", () => {
    const snapshot = {
      ...createEmptyCompanyDashboardSnapshot(
        INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
        "2026-01-01T00:00:00.000Z",
      ),
      health: {
        status: "stable" as const,
        label: "smallOffice is stable",
        signals: [],
      },
      employees: {
        ...createEmptyCompanyDashboardSnapshot(
          INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
          "2026-01-01T00:00:00.000Z",
        ).employees,
        totalEmployees: 3,
        activeEmployees: 2,
        byRole: [
          { role: "Engineer" as const, count: 2 },
          { role: "QA" as const, count: 1 },
        ],
        byState: [
          { state: "idle" as const, count: 1 },
          { state: "working" as const, count: 2 },
        ],
      },
      projects: {
        ...createEmptyCompanyDashboardSnapshot(
          INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
          "2026-01-01T00:00:00.000Z",
        ).projects,
        totalProjects: 2,
        activeProjects: 1,
      },
      workload: {
        ...createEmptyCompanyDashboardSnapshot(
          INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
          "2026-01-01T00:00:00.000Z",
        ).workload,
        activeWorkSessionCount: 1,
        unassignedTaskCount: 4,
      },
      occupancy: {
        presentEmployees: 3,
        occupiedWorkstations: 2,
        availableWorkstations: 1,
        reservedWorkstations: 0,
        unavailableWorkstations: 0,
      },
      activity: [{
        id: "activity-1",
        timestamp: "2026-01-01T09:00:00.000Z",
        type: "task_activity" as const,
        label: "Started dashboard work",
        sourceSystems: ["task_activity" as const],
      }],
      bottlenecks: [{
        id: "bottleneck-1",
        severity: "medium" as const,
        label: "Employee workload is concentrated",
        description: "One employee has multiple active assignments.",
        sourceSystems: ["projects" as const],
      }],
      conversations: {
        recentCount: 1,
        highlights: [],
      },
      productivity: {
        completedTaskCount: 1,
        activeWorkSessionCount: 1,
        finishedWorkSessionCount: 2,
        failedWorkSessionCount: 0,
        recentProgressLabel: "1 completed task(s), 2 finished work session(s).",
      },
      risks: [{
        id: "risk-1",
        severity: "medium" as const,
        label: "Critical unfinished task",
        reason: "A critical task is unfinished.",
        sourceSystems: ["projects" as const],
      }],
      companySummary: "2 of 3 employees are active. 1 risk needs attention.",
    };

    expect(createCompanyDashboardPanelRows(snapshot)).toEqual({
      title: "AI Company Command Center",
      healthText: "Health: smallOffice is stable",
      employeeText: "Employees: 2/3 active",
      employeeStateText: "States: idle 1, working 2",
      roleText: "Roles: Engineer 2, QA 1",
      projectText: "Projects: 1/2 active",
      projectProgressText: "Progress: 0% average",
      workloadText: "Workload: 4 unassigned, 1 running",
      occupancyText: "Office: 2 occupied, 1 open",
      bottleneckText: "Bottleneck: Employee workload is concentrated",
      conversationText: "Conversations: 1 recent",
      productivityText: "Productivity: 1 completed task(s), 2 finished work session(s).",
      focusText: "Focus: None selected",
      riskText: "Risk: Critical unfinished task",
      summaryText: "2 of 3 employees are active. 1 risk needs attention.",
      activityText: "Started dashboard work",
    });
  });

  it("surfaces selected company focus from provider-neutral snapshot data", () => {
    const rows = createCompanyDashboardPanelRows({
      ...createEmptyCompanyDashboardSnapshot(
        INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
        "2026-01-01T00:00:00.000Z",
      ),
      companyFocus: {
        isSet: true,
        summary: "Current focus: reduce project risk by watching blockers and critical work.",
        currentFocus: {
          id: "project-risk",
          label: "Reduce project risk",
          description: "Watch blockers.",
          advisorySummary: "Current focus: reduce project risk by watching blockers and critical work.",
          futureMetadataTags: ["risk"],
        },
        options: [],
      },
    });

    expect(rows.focusText).toBe("Focus: Reduce project risk");
  });

  it("does not expose management, assignment, editing, dialogue, or project-control affordances", () => {
    const rows = createCompanyDashboardPanelRows(undefined);
    const text = Object.values(rows).join(" ").toLowerCase();

    expect(text).not.toContain("assign");
    expect(text).not.toContain("manage");
    expect(text).not.toContain("edit");
    expect(text).not.toContain("dialogue");
    expect(text).not.toContain("control project");
  });
});
