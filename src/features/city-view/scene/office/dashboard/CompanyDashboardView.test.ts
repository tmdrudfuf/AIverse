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
      activity: [{
        id: "activity-1",
        timestamp: "2026-01-01T09:00:00.000Z",
        type: "task_activity" as const,
        label: "Started dashboard work",
        sourceSystems: ["task_activity" as const],
      }],
    };

    expect(createCompanyDashboardPanelRows(snapshot)).toEqual({
      title: "AI Company Command Center",
      healthText: "Health: smallOffice is stable",
      employeeText: "Employees: 2/3 active",
      projectText: "Projects: 1/2 active",
      workloadText: "Workload: 4 unassigned, 1 running",
      activityText: "Started dashboard work",
    });
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
