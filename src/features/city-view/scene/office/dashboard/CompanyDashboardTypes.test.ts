import { describe, expect, it } from "vitest";

import {
  createCompanyDashboardSectionAvailability,
  createEmptyCompanyDashboardSnapshot,
  createUnavailableCompanyDashboardSection,
  INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
  type CompanyDashboardProvider,
} from "./CompanyDashboardTypes";

describe("CompanyDashboardTypes provider-neutral helpers", () => {
  it("creates explicit unavailable section metadata", () => {
    const section = createUnavailableCompanyDashboardSection(
      "employee_summary",
      "Employee Summary",
      ["employee_ai", "schedule"],
    );

    expect(section).toEqual({
      id: "employee_summary",
      label: "Employee Summary",
      status: "unavailable",
      sourceSystems: ["employee_ai", "schedule"],
      message: "Source data is not available yet.",
    });
  });

  it("copies source systems so callers cannot mutate section metadata through shared arrays", () => {
    const sourceSystems = ["projects"] as const;

    const section = createCompanyDashboardSectionAvailability(
      "project_summary",
      "Project Summary",
      sourceSystems,
      "empty",
    );

    expect(section.sourceSystems).toEqual(["projects"]);
    expect(section.sourceSystems).not.toBe(sourceSystems);
  });

  it("creates an empty provider-neutral snapshot without duplicating source state", () => {
    const sourceAvailability = [
      { source: "employee_ai" as const, available: true },
      { source: "projects" as const, available: false, reason: "No projects loaded." },
    ];

    const snapshot = createEmptyCompanyDashboardSnapshot(
      INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
      "2026-01-01T00:00:00.000Z",
      sourceAvailability,
    );

    expect(snapshot).toMatchObject({
      providerId: "internal-simulation",
      generatedAt: "2026-01-01T00:00:00.000Z",
      health: {
        status: "unknown",
        label: "Company health unavailable",
        signals: [],
      },
      employees: {
        totalEmployees: 0,
        currentWork: [],
      },
      projects: {
        totalProjects: 0,
        projects: [],
      },
      companySummary: "Company dashboard data is not available yet.",
    });
    expect(snapshot.sections).toHaveLength(14);
    expect(snapshot.sections.every((section) => section.status === "unavailable")).toBe(true);
    expect(snapshot.companyFocus).toBeUndefined();
    expect(snapshot.sourceAvailability).toEqual(sourceAvailability);
    expect(snapshot.sourceAvailability).not.toBe(sourceAvailability);
  });

  it("defines the provider interface around snapshots instead of implementation-specific data", () => {
    const provider: CompanyDashboardProvider = {
      id: INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
      label: "Internal Simulation",
      getSnapshot: () => createEmptyCompanyDashboardSnapshot(
        INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
        "2026-01-01T00:00:00.000Z",
      ),
    };

    expect(provider.getSnapshot().providerId).toBe(provider.id);
  });
});
