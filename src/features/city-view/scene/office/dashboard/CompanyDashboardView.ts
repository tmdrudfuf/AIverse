import type { CompanyDashboardSnapshot } from "./CompanyDashboardTypes";

export type CompanyDashboardPanelRows = {
  title: string;
  healthText: string;
  employeeText: string;
  projectText: string;
  workloadText: string;
  activityText: string;
};

export function createCompanyDashboardPanelRows(snapshot: CompanyDashboardSnapshot | undefined): CompanyDashboardPanelRows {
  if (!snapshot) {
    return {
      title: "AI Company Command Center",
      healthText: "Health: Waiting for simulation data",
      employeeText: "Employees: Unavailable",
      projectText: "Projects: Unavailable",
      workloadText: "Workload: Unavailable",
      activityText: "Activity: No recent company activity",
    };
  }

  return {
    title: "AI Company Command Center",
    healthText: `Health: ${snapshot.health.label}`,
    employeeText: `Employees: ${snapshot.employees.activeEmployees}/${snapshot.employees.totalEmployees} active`,
    projectText: `Projects: ${snapshot.projects.activeProjects}/${snapshot.projects.totalProjects} active`,
    workloadText: `Workload: ${snapshot.workload.unassignedTaskCount} unassigned, ${snapshot.workload.activeWorkSessionCount} running`,
    activityText: snapshot.activity[0]?.label ?? "Activity: No recent company activity",
  };
}
