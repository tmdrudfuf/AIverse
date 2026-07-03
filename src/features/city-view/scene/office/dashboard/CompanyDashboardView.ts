import type { CompanyDashboardSnapshot } from "./CompanyDashboardTypes";

export type CompanyDashboardPanelRows = {
  title: string;
  healthText: string;
  employeeText: string;
  employeeStateText: string;
  roleText: string;
  projectText: string;
  projectProgressText: string;
  workloadText: string;
  occupancyText: string;
  bottleneckText: string;
  conversationText: string;
  productivityText: string;
  focusText: string;
  riskText: string;
  summaryText: string;
  activityText: string;
};

export function createCompanyDashboardPanelRows(snapshot: CompanyDashboardSnapshot | undefined): CompanyDashboardPanelRows {
  if (!snapshot) {
    return {
      title: "AI Company Command Center",
      healthText: "Health: Waiting for simulation data",
      employeeText: "Employees: Unavailable",
      employeeStateText: "States: Unavailable",
      roleText: "Roles: Unavailable",
      projectText: "Projects: Unavailable",
      projectProgressText: "Progress: Unavailable",
      workloadText: "Workload: Unavailable",
      occupancyText: "Office: Unavailable",
      bottleneckText: "Bottlenecks: None visible",
      conversationText: "Conversations: None recent",
      productivityText: "Productivity: Unavailable",
      focusText: "Focus: None selected",
      riskText: "Risks: None visible",
      summaryText: "No company simulation data is available yet.",
      activityText: "Activity: No recent company activity",
    };
  }

  return {
    title: "AI Company Command Center",
    healthText: `Health: ${snapshot.health.label}`,
    employeeText: `Employees: ${snapshot.employees.activeEmployees}/${snapshot.employees.totalEmployees} active`,
    employeeStateText: `States: ${formatCounts(snapshot.employees.byState, "state")}`,
    roleText: `Roles: ${formatCounts(snapshot.employees.byRole, "role")}`,
    projectText: `Projects: ${snapshot.projects.activeProjects}/${snapshot.projects.totalProjects} active`,
    projectProgressText: `Progress: ${snapshot.projects.averageProgress ?? 0}% average`,
    workloadText: `Workload: ${snapshot.workload.unassignedTaskCount} unassigned, ${snapshot.workload.activeWorkSessionCount} running`,
    occupancyText: `Office: ${snapshot.occupancy.occupiedWorkstations} occupied, ${snapshot.occupancy.availableWorkstations} open`,
    bottleneckText: snapshot.bottlenecks[0]?.label
      ? `Bottleneck: ${snapshot.bottlenecks[0].label}`
      : "Bottlenecks: None visible",
    conversationText: `Conversations: ${snapshot.conversations.recentCount} recent`,
    productivityText: `Productivity: ${snapshot.productivity.recentProgressLabel}`,
    focusText: snapshot.companyFocus?.currentFocus?.label
      ? `Focus: ${snapshot.companyFocus.currentFocus.label}`
      : "Focus: None selected",
    riskText: snapshot.risks[0]?.label ? `Risk: ${snapshot.risks[0].label}` : "Risks: None visible",
    summaryText: snapshot.companySummary,
    activityText: snapshot.activity[0]?.label ?? "Activity: No recent company activity",
  };
}

function formatCounts<TItem extends Record<TKey, string> & { count: number }, TKey extends keyof TItem>(
  items: ReadonlyArray<TItem>,
  key: TKey,
) {
  if (items.length === 0) return "None";
  return items.map((item) => `${item[key]} ${item.count}`).join(", ");
}
