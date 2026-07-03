import type { EmployeeInsightSource } from "../insight/EmployeeInsightTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectTask, TaskActivity } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import {
  createProjectDashboardSectionAvailability,
  createUnavailableProjectDashboardSnapshot,
  INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID,
  type ProjectDashboardActivityItem,
  type ProjectDashboardBlockerSummary,
  type ProjectDashboardEmployeeContext,
  type ProjectDashboardHealthSummary,
  type ProjectDashboardListItem,
  type ProjectDashboardProvider,
  type ProjectDashboardProviderContext,
  type ProjectDashboardRelatedFocus,
  type ProjectDashboardSnapshot,
  type ProjectDashboardWorkItemSummary,
} from "./ProjectDashboardTypes";

const DEFAULT_PROJECT_DASHBOARD_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export type InternalSimulationProjectDashboardProviderContext = ProjectDashboardProviderContext & {
  employeeInsightSources?: ReadonlyArray<EmployeeInsightSource>;
  projects?: ReadonlyArray<ProjectPortalProject>;
  tasks?: ReadonlyArray<ProjectTask>;
  workSessions?: ReadonlyArray<WorkSession>;
};

export class InternalSimulationProjectDashboardProvider implements ProjectDashboardProvider {
  readonly id = INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID;
  readonly label = "Internal Simulation";

  listProjects(context: InternalSimulationProjectDashboardProviderContext = {}): ProjectDashboardListItem[] {
    const tasks = collectTasks(context);
    return collectProjects(context).map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      return {
        projectId: project.id,
        name: project.name,
        status: project.status,
        progressPercent: deriveProgressPercent(projectTasks),
        healthLabel: deriveHealth(project, projectTasks, [], []).label,
      };
    });
  }

  getProjectSnapshot(
    context: InternalSimulationProjectDashboardProviderContext = {},
    projectId: string,
  ): ProjectDashboardSnapshot {
    const generatedAt = context.generatedAt ?? getLatestKnownTimestamp(context) ?? DEFAULT_PROJECT_DASHBOARD_TIMESTAMP;
    const projects = collectProjects(context);
    const project = projects.find((item) => item.id === projectId);
    if (!project) return createUnavailableProjectDashboardSnapshot(this.id, generatedAt, projectId);

    const tasks = collectTasks(context).filter((task) => task.projectId === project.id);
    const employeeSources = collectProjectEmployeeSources(context.employeeInsightSources ?? [], project.id, tasks);
    const workSessions = (context.workSessions ?? []).filter((session) => session.projectId === project.id);
    const blockers = deriveBlockers(tasks, workSessions);
    const health = deriveHealth(project, tasks, blockers, workSessions);
    const activeWork = tasks
      .filter((task) => task.status !== "Done")
      .map((task) => createWorkItemSummary(task))
      .sort((left, right) => right.progressPercent - left.progressPercent || left.id.localeCompare(right.id));
    const employees = employeeSources.map(createEmployeeContext).sort((left, right) => left.employeeId.localeCompare(right.employeeId));
    const activity = createActivity(tasks, workSessions, employeeSources).slice(0, 6);
    const relatedFocus = createRelatedFocus(context.companyFocus, employees);
    const progressPercent = deriveProgressPercent(tasks);

    return {
      providerId: this.id,
      generatedAt,
      project: {
        projectId: project.id,
        name: project.name,
        status: project.status,
        description: project.description,
        isAvailable: true,
      },
      progress: {
        percentComplete: progressPercent,
        completedWorkCount: tasks.filter((task) => task.status === "Done").length,
        totalWorkCount: tasks.length,
        label: tasks.length > 0 ? `${progressPercent ?? 0}% complete` : "No task progress available",
      },
      health,
      activeWork,
      employees,
      blockers,
      activity,
      relatedFocus,
      nextSuggestedFocus: createNextSuggestedFocus(health, blockers, context.companyFocus),
      source: {
        sourceType: "internal-simulation",
        sourceId: project.id,
        mappingConfidence: "native",
      },
      sections: [
        createProjectDashboardSectionAvailability("project_summary", "Project Summary", "available"),
        createProjectDashboardSectionAvailability("project_progress", "Project Progress", tasks.length > 0 ? "available" : "empty"),
        createProjectDashboardSectionAvailability("active_work", "Active Work", activeWork.length > 0 ? "available" : "empty"),
        createProjectDashboardSectionAvailability("related_employees", "Related Employees", employees.length > 0 ? "available" : "empty"),
        createProjectDashboardSectionAvailability("blockers", "Blockers", blockers.length > 0 ? "available" : "empty"),
        createProjectDashboardSectionAvailability("recent_activity", "Recent Activity", activity.length > 0 ? "available" : "empty"),
        createProjectDashboardSectionAvailability("related_focus", "Related Focus", relatedFocus.employeeFocusLabels.length > 0 || Boolean(relatedFocus.companyFocusLabel) ? "available" : "empty"),
        createProjectDashboardSectionAvailability("project_health", "Project Health", "available"),
        createProjectDashboardSectionAvailability("source_metadata", "Source Metadata", "available"),
      ],
    };
  }
}

function collectTasks(context: InternalSimulationProjectDashboardProviderContext): ProjectTask[] {
  const taskMap = new Map<string, ProjectTask>();
  (context.tasks ?? []).forEach((task) => taskMap.set(task.id, task));
  (context.employeeInsightSources ?? []).forEach((source) => {
    if (source.currentTask) taskMap.set(source.currentTask.id, source.currentTask);
  });
  return Array.from(taskMap.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function collectProjects(context: InternalSimulationProjectDashboardProviderContext): ProjectPortalProject[] {
  const projectMap = new Map<string, ProjectPortalProject>();
  (context.projects ?? []).forEach((project) => projectMap.set(project.id, project));
  (context.employeeInsightSources ?? []).forEach((source) => {
    if (source.currentProject) projectMap.set(source.currentProject.id, source.currentProject);
  });
  return Array.from(projectMap.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function collectProjectEmployeeSources(
  sources: ReadonlyArray<EmployeeInsightSource>,
  projectId: string,
  tasks: ReadonlyArray<ProjectTask>,
) {
  const assignedEmployeeIds = new Set(tasks.flatMap((task) => task.assigneeId ? [task.assigneeId] : []));
  return sources.filter((source) => source.currentProject?.id === projectId || assignedEmployeeIds.has(source.employeeId));
}

function deriveProgressPercent(tasks: ReadonlyArray<ProjectTask>) {
  if (tasks.length === 0) return undefined;
  return Math.round(tasks.reduce((sum, task) => sum + getTaskProgress(task.status), 0) / tasks.length);
}

function createWorkItemSummary(task: ProjectTask): ProjectDashboardWorkItemSummary {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    progressPercent: getTaskProgress(task.status),
    assigneeId: task.assigneeId,
    assigneeName: task.assignee,
    blockerLabel: task.priority === "Critical" && task.status !== "Done" ? "Critical unfinished work" : undefined,
    updatedAt: task.updatedAt,
  };
}

function createEmployeeContext(source: EmployeeInsightSource): ProjectDashboardEmployeeContext {
  return {
    employeeId: source.employeeId,
    name: source.name,
    role: source.role,
    aiState: source.aiState,
    scheduleState: source.scheduleState,
    currentTaskId: source.currentTask?.id,
    currentTaskTitle: source.currentTask?.title,
    focusLabel: source.currentTask?.title ?? source.aiState,
    moodLabel: source.mood?.label,
  };
}

function deriveBlockers(
  tasks: ReadonlyArray<ProjectTask>,
  workSessions: ReadonlyArray<WorkSession>,
): ProjectDashboardBlockerSummary[] {
  return [
    ...tasks
      .filter((task) => task.status !== "Done" && task.priority === "Critical")
      .map((task) => ({
        id: `critical-task-${task.id}`,
        severity: "high" as const,
        label: "Critical unfinished task",
        reason: `${task.title} is still ${task.status}.`,
      })),
    ...tasks
      .filter((task) => task.status !== "Done" && !task.assigneeId && !task.assignee)
      .map((task) => ({
        id: `unassigned-task-${task.id}`,
        severity: task.priority === "High" ? "medium" as const : "low" as const,
        label: "Task has no assigned employee",
        reason: `${task.title} is ${task.status} and has no assigned employee.`,
      })),
    ...workSessions
      .filter((session) => session.status === "failed")
      .map((session) => ({
        id: `failed-session-${session.id}`,
        severity: "medium" as const,
        label: "Recent work session failed",
        reason: `${session.employeeName}'s work on ${session.taskId} did not complete.`,
      })),
  ];
}

function deriveHealth(
  project: ProjectPortalProject,
  tasks: ReadonlyArray<ProjectTask>,
  blockers: ReadonlyArray<ProjectDashboardBlockerSummary>,
  workSessions: ReadonlyArray<WorkSession>,
): ProjectDashboardHealthSummary {
  if (!project.enabled) {
    return {
      status: "unknown",
      label: "Project not active",
      reason: `${project.name} is ${project.status}.`,
      signals: [],
    };
  }

  if (blockers.some((blocker) => blocker.severity === "blocked" || blocker.severity === "high")) {
    return {
      status: "risk",
      label: "Project needs attention",
      reason: "Critical unfinished work or blockers are visible.",
      signals: blockers.slice(0, 3).map((blocker) => blocker.label),
    };
  }

  if (workSessions.some((session) => session.status === "failed")) {
    return {
      status: "watch",
      label: "Project should be watched",
      reason: "A recent work session failed.",
      signals: ["Failed work session"],
    };
  }

  if (tasks.length === 0) {
    return {
      status: "unknown",
      label: "Project has no task data",
      reason: "No active or completed task data is available.",
      signals: [],
    };
  }

  return {
    status: tasks.every((task) => task.status === "Done") ? "healthy" : "watch",
    label: tasks.every((task) => task.status === "Done") ? "Project work is complete" : "Project is progressing",
    reason: tasks.every((task) => task.status === "Done")
      ? "All visible project tasks are complete."
      : "Visible project tasks are moving through the workflow.",
    signals: [`${tasks.filter((task) => task.status === "Done").length} completed task(s)`],
  };
}

function createActivity(
  tasks: ReadonlyArray<ProjectTask>,
  workSessions: ReadonlyArray<WorkSession>,
  employeeSources: ReadonlyArray<EmployeeInsightSource>,
): ProjectDashboardActivityItem[] {
  return [
    ...tasks.flatMap((task) => (task.activityLog ?? []).map((activity) => createTaskActivityItem(activity))),
    ...tasks.map((task) => ({
      id: `task-status-${task.id}`,
      timestamp: task.updatedAt,
      type: "task_status" as const,
      label: `${task.title} is ${task.status}.`,
      description: task.assignee ? `Assigned to ${task.assignee}.` : undefined,
    })),
    ...workSessions.map((session) => ({
      id: `work-session-${session.id}`,
      timestamp: session.finishedAt ?? session.startedAt,
      type: "work_session" as const,
      label: `${session.employeeName} ${session.status} work.`,
      description: session.summary,
    })),
    ...employeeSources.map((source) => ({
      id: `employee-focus-${source.employeeId}`,
      timestamp: source.aiSnapshot?.lastUpdatedAt ?? source.scheduleSnapshot?.lastUpdatedAt ?? DEFAULT_PROJECT_DASHBOARD_TIMESTAMP,
      type: "employee_focus" as const,
      label: `${source.name} is ${source.aiState}.`,
      description: source.currentTask?.title,
    })),
  ]
    .filter((activity) => Number.isFinite(Date.parse(activity.timestamp)))
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

function createTaskActivityItem(activity: TaskActivity): ProjectDashboardActivityItem {
  return {
    id: `task-activity-${activity.id}`,
    timestamp: activity.createdAt,
    type: "task_activity",
    label: activity.message,
    description: activity.actorName ? `By ${activity.actorName}.` : undefined,
  };
}

function createRelatedFocus(
  companyFocus: InternalSimulationProjectDashboardProviderContext["companyFocus"],
  employees: ReadonlyArray<ProjectDashboardEmployeeContext>,
): ProjectDashboardRelatedFocus {
  const employeeFocusLabels = employees.map((employee) => `${employee.name}: ${employee.focusLabel}`);
  const companyFocusLabel = companyFocus?.currentFocus?.label;

  return {
    companyFocusLabel,
    employeeFocusLabels,
    summary: companyFocusLabel
      ? `Company focus is ${companyFocusLabel}.`
      : employeeFocusLabels.length > 0
        ? `${employeeFocusLabels.length} employee focus signal(s) are visible.`
        : "No project focus signals are visible.",
  };
}

function createNextSuggestedFocus(
  health: ProjectDashboardHealthSummary,
  blockers: ReadonlyArray<ProjectDashboardBlockerSummary>,
  companyFocus: InternalSimulationProjectDashboardProviderContext["companyFocus"],
) {
  if (health.status === "risk" || blockers.length > 0) return "Reduce project risk";
  if (companyFocus?.currentFocus?.label) return `Maintain ${companyFocus.currentFocus.label}`;
  if (health.status === "healthy") return "Prepare for company growth";
  return "Improve delivery speed";
}

function getTaskProgress(status: ProjectTask["status"]) {
  if (status === "Done") return 100;
  if (status === "Review") return 80;
  if (status === "In Progress") return 50;
  return 0;
}

function getLatestKnownTimestamp(context: InternalSimulationProjectDashboardProviderContext) {
  return [
    ...(context.tasks ?? []).flatMap((task) => [task.updatedAt, ...(task.activityLog ?? []).map((activity) => activity.createdAt)]),
    ...(context.workSessions ?? []).flatMap((session) => [session.startedAt, session.finishedAt].filter(Boolean) as string[]),
    ...(context.employeeInsightSources ?? []).flatMap((source) => [
      source.aiSnapshot?.lastUpdatedAt,
      source.scheduleSnapshot?.lastUpdatedAt,
      source.simulationSnapshot?.lastStateChangeAt,
      source.movementSnapshot?.lastUpdatedAt,
    ].filter(Boolean) as string[]),
  ]
    .filter((timestamp) => Number.isFinite(Date.parse(timestamp)))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}
