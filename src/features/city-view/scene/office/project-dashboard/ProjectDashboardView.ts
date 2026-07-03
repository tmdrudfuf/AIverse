import type { ProjectDashboardSnapshot } from "./ProjectDashboardTypes";

export type ProjectDashboardPanelRows = {
  title: string;
  statusText: string;
  progressText: string;
  healthText: string;
  activeWorkHeading: string;
  activeWorkRows: string[];
  employeeHeading: string;
  employeeRows: string[];
  blockerText: string;
  activityText: string;
  relatedFocusText: string;
  nextSuggestedFocusText: string;
  sourceText: string;
};

export function createProjectDashboardPanelRows(snapshot: ProjectDashboardSnapshot | undefined): ProjectDashboardPanelRows {
  if (!snapshot) {
    return {
      title: "Project Dashboard",
      statusText: "Project unavailable",
      progressText: "Progress: Unavailable",
      healthText: "Health: Unavailable",
      activeWorkHeading: "Active Work",
      activeWorkRows: ["No active tasks visible."],
      employeeHeading: "Employees",
      employeeRows: ["No employee context visible."],
      blockerText: "Blockers: None visible",
      activityText: "Activity: No recent project activity",
      relatedFocusText: "Focus: No project focus signals are visible.",
      nextSuggestedFocusText: "Next suggested focus: None",
      sourceText: "Source: Unavailable",
    };
  }

  if (!snapshot.project.isAvailable) {
    return {
      title: snapshot.project.name,
      statusText: "Project unavailable",
      progressText: "Progress: Unavailable",
      healthText: snapshot.health.reason,
      activeWorkHeading: "Active Work",
      activeWorkRows: ["No active tasks visible."],
      employeeHeading: "Employees",
      employeeRows: ["No employee context visible."],
      blockerText: "Blockers: None visible",
      activityText: "Activity: No recent project activity",
      relatedFocusText: "Focus: No project focus is available.",
      nextSuggestedFocusText: "Next suggested focus: None",
      sourceText: `Source: ${snapshot.source.sourceType}`,
    };
  }

  return {
    title: snapshot.project.name,
    statusText: `${snapshot.project.status} | ${snapshot.health.label}`,
    progressText: `Progress: ${snapshot.progress.label}`,
    healthText: snapshot.health.reason,
    activeWorkHeading: "Active Work",
    activeWorkRows: snapshot.activeWork.length > 0
      ? snapshot.activeWork.slice(0, 4).map((workItem) => `${workItem.title} - ${workItem.status} (${workItem.priority})`)
      : ["No active tasks visible."],
    employeeHeading: "Employees",
    employeeRows: snapshot.employees.length > 0
      ? snapshot.employees.slice(0, 4).map((employee) => `${employee.name} - ${employee.aiState}`)
      : ["No employee context visible."],
    blockerText: snapshot.blockers[0]
      ? `Blocker: ${snapshot.blockers[0].label}`
      : "Blockers: None visible",
    activityText: snapshot.activity[0]?.label
      ? `Activity: ${snapshot.activity[0].label}`
      : "Activity: No recent project activity",
    relatedFocusText: `Focus: ${snapshot.relatedFocus.summary}`,
    nextSuggestedFocusText: `Next suggested focus: ${snapshot.nextSuggestedFocus ?? "None"}`,
    sourceText: `Source: ${snapshot.source.sourceType}`,
  };
}
