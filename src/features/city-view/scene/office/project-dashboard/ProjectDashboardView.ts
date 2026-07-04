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
  sourceSignalRows: string[];
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
      sourceSignalRows: [],
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
      sourceSignalRows: createSourceSignalRows(snapshot),
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
    sourceText: createSourceText(snapshot),
    sourceSignalRows: createSourceSignalRows(snapshot),
  };
}

function createSourceText(snapshot: ProjectDashboardSnapshot) {
  const externalSource = snapshot.externalSources?.[0];
  if (!externalSource) return `Source: ${snapshot.source.sourceType}`;

  const status = externalSource.statusLabel ? ` [${externalSource.statusLabel}]` : "";
  return `Source: ${snapshot.source.sourceType} + ${externalSource.sourceType}${status}`;
}

function createSourceSignalRows(snapshot: ProjectDashboardSnapshot) {
  const source = snapshot.externalSources?.[0];
  if (!source) return [];

  const repositoryLabel = source.displayName ? `Repo ${source.displayName}` : undefined;
  const signalRows = (source.signals ?? [])
    .filter((signal) => signal.id !== "repository")
    .slice(0, 3)
    .map((signal) => `${signal.label}: ${signal.value}`);

  return [
    ...(repositoryLabel ? [repositoryLabel] : []),
    ...(source.statusLabel ? [`Status: ${source.statusLabel}`] : []),
    ...signalRows,
  ].slice(0, 4);
}
