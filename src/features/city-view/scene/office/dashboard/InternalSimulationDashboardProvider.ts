import type { EmployeeConversation } from "../conversations/EmployeeConversationTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { EmployeeSimulationSnapshot } from "../employees/EmployeeSimulationTypes";
import type { EmployeeInsightSource } from "../insight/EmployeeInsightTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { CompanyProgressionSnapshot } from "../progression/CompanyProgressionTypes";
import type { ProjectTask, TaskActivity } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import type { WorkstationSnapshot } from "../workstations/WorkstationTypes";
import {
  createCompanyDashboardSectionAvailability,
  createEmptyCompanyDashboardSnapshot,
  INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
  type BottleneckSummary,
  type CompanyActivityItem,
  type CompanyDashboardEmployeeWorkItem,
  type CompanyDashboardProvider,
  type CompanyDashboardProviderContext,
  type CompanyDashboardSectionAvailability,
  type CompanyDashboardSourceAvailability,
  type CompanyDashboardSnapshot,
  type EmployeeDashboardSummary,
  type OfficeOccupancySummary,
  type ProductivitySummary,
  type ProjectDashboardSummary,
  type RiskSummary,
  type WorkloadSummary,
} from "./CompanyDashboardTypes";

const DEFAULT_DASHBOARD_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export type InternalSimulationDashboardProviderContext = CompanyDashboardProviderContext & {
  employees?: ReadonlyArray<Employee>;
  employeeSimulations?: ReadonlyArray<EmployeeSimulationSnapshot>;
  employeeInsightSources?: ReadonlyArray<EmployeeInsightSource>;
  projects?: ReadonlyArray<ProjectPortalProject>;
  tasks?: ReadonlyArray<ProjectTask>;
  workSessions?: ReadonlyArray<WorkSession>;
  workstations?: ReadonlyArray<WorkstationSnapshot>;
  conversations?: ReadonlyArray<EmployeeConversation>;
  companyProgression?: CompanyProgressionSnapshot;
};

export class InternalSimulationDashboardProvider implements CompanyDashboardProvider {
  readonly id = INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID;
  readonly label = "Internal Simulation";

  getSnapshot(context: InternalSimulationDashboardProviderContext = {}): CompanyDashboardSnapshot {
    const generatedAt = context.generatedAt ?? getLatestKnownTimestamp(context) ?? DEFAULT_DASHBOARD_TIMESTAMP;
    const tasks = collectTasks(context);
    const projects = collectProjects(context);
    const employeeSources = context.employeeInsightSources ?? [];
    const workSessions = context.workSessions ?? [];
    const workstations = context.workstations ?? collectWorkstations(employeeSources);
    const conversations = context.conversations ?? [];
    const snapshot = createEmptyCompanyDashboardSnapshot(
      this.id,
      generatedAt,
      createSourceAvailability(context, tasks, projects, workSessions, workstations, conversations),
    );

    const employees = createEmployeeSummary(context.employees ?? [], employeeSources);
    const projectSummary = createProjectSummary(projects, tasks);
    const workload = createWorkloadSummary(tasks, workSessions, employees.currentWork);
    const occupancy = createOccupancySummary(workstations, employeeSources);
    const bottlenecks = createBottlenecks(tasks, workload, projectSummary);
    const activity = createActivity(tasks, workSessions, conversations);
    const productivity = createProductivitySummary(tasks, workSessions);
    const risks = createRisks(tasks, employees, projectSummary, workSessions, context.companyProgression);

    return {
      ...snapshot,
      sections: createSectionAvailability({
        employeeSources,
        projects,
        tasks,
        workSessions,
        workstations,
        conversations,
        bottlenecks,
        activity,
        risks,
        companyProgression: context.companyProgression,
      }),
      health: {
        status: risks.some((risk) => risk.severity === "critical") ? "critical" : risks.length > 0 ? "needs_attention" : "stable",
        label: createHealthLabel(context.companyProgression, risks),
        score: context.companyProgression ? Math.min(100, 50 + context.companyProgression.companyLevel * 10) : undefined,
        signals: [
          ...bottlenecks.slice(0, 2).map((bottleneck) => ({
            id: `bottleneck-${bottleneck.id}`,
            label: bottleneck.label,
            description: bottleneck.description,
            tone: bottleneck.severity === "high" || bottleneck.severity === "critical" ? "warning" as const : "neutral" as const,
            sourceSystems: bottleneck.sourceSystems,
          })),
          ...risks.slice(0, 2).map((risk) => ({
            id: `risk-${risk.id}`,
            label: risk.label,
            description: risk.reason,
            tone: risk.severity === "critical" ? "critical" as const : "warning" as const,
            sourceSystems: risk.sourceSystems,
          })),
        ],
        updatedAt: generatedAt,
      },
      employees,
      projects: projectSummary,
      workload,
      occupancy,
      bottlenecks,
      activity,
      conversations: {
        recentCount: conversations.length,
        highlights: activity.filter((item) => item.type === "conversation").slice(0, 3),
        lastConversationAt: conversations.map((conversation) => conversation.timestamp).sort().at(-1),
      },
      productivity,
      risks,
      companySummary: createCompanySummary(employees, projectSummary, workload, risks),
    };
  }
}

function collectTasks(context: InternalSimulationDashboardProviderContext): ProjectTask[] {
  const taskMap = new Map<string, ProjectTask>();
  (context.tasks ?? []).forEach((task) => taskMap.set(task.id, task));
  (context.employeeInsightSources ?? []).forEach((source) => {
    if (source.currentTask) taskMap.set(source.currentTask.id, source.currentTask);
  });
  return Array.from(taskMap.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function collectProjects(context: InternalSimulationDashboardProviderContext): ProjectPortalProject[] {
  const projectMap = new Map<string, ProjectPortalProject>();
  (context.projects ?? []).forEach((project) => projectMap.set(project.id, project));
  (context.employeeInsightSources ?? []).forEach((source) => {
    if (source.currentProject) projectMap.set(source.currentProject.id, source.currentProject);
  });
  return Array.from(projectMap.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function collectWorkstations(employeeSources: ReadonlyArray<EmployeeInsightSource>): WorkstationSnapshot[] {
  const workstationMap = new Map<string, WorkstationSnapshot>();
  employeeSources.forEach((source) => {
    if (source.workstationSnapshot) workstationMap.set(source.workstationSnapshot.workstationId, source.workstationSnapshot);
  });
  return Array.from(workstationMap.values()).sort((left, right) => left.workstationId.localeCompare(right.workstationId));
}

function createSourceAvailability(
  context: InternalSimulationDashboardProviderContext,
  tasks: ReadonlyArray<ProjectTask>,
  projects: ReadonlyArray<ProjectPortalProject>,
  workSessions: ReadonlyArray<WorkSession>,
  workstations: ReadonlyArray<WorkstationSnapshot>,
  conversations: ReadonlyArray<EmployeeConversation>,
): CompanyDashboardSourceAvailability[] {
  return [
    { source: "employee_ai", available: (context.employeeInsightSources?.length ?? 0) > 0, reason: "Employee insight sources supply AI state." },
    { source: "schedule", available: (context.employeeInsightSources ?? []).some((source) => source.scheduleSnapshot), reason: "Schedule snapshots are read from employee insight sources." },
    { source: "projects", available: projects.length > 0 || tasks.length > 0 },
    { source: "company_progression", available: Boolean(context.companyProgression) },
    { source: "office_layout", available: workstations.length > 0 },
    { source: "conversation", available: conversations.length > 0 },
    { source: "employee_insight", available: (context.employeeInsightSources?.length ?? 0) > 0 },
    { source: "employee_knowledge", available: false, reason: "Employee Knowledge remains employee-focused until dashboard integration needs it." },
    { source: "work_session", available: workSessions.length > 0 },
    { source: "task_activity", available: tasks.some((task) => (task.activityLog?.length ?? 0) > 0) },
  ];
}

function createEmployeeSummary(
  employees: ReadonlyArray<Employee>,
  employeeSources: ReadonlyArray<EmployeeInsightSource>,
): EmployeeDashboardSummary {
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const currentWork = employeeSources.map<CompanyDashboardEmployeeWorkItem>((source) => {
    const employee = employeeById.get(source.employeeId);
    return {
      employeeId: source.employeeId,
      employeeName: source.name,
      role: source.role,
      aiState: source.aiState,
      scheduleState: source.scheduleState,
      currentTaskId: source.currentTask?.id,
      currentTaskTitle: source.currentTask?.title,
      currentProjectId: source.currentProject?.id ?? employee?.currentProjectId,
      currentProjectName: source.currentProject?.name,
      progressPercent: source.workProgress?.percent,
      moodLabel: source.mood?.label,
    };
  }).sort((left, right) => left.employeeId.localeCompare(right.employeeId));
  const employeeCount = Math.max(employees.length, employeeSources.length);

  return {
    totalEmployees: employeeCount,
    activeEmployees: currentWork.filter((item) => item.aiState !== "idle" && item.aiState !== "going_home").length,
    idleEmployees: currentWork.filter((item) => item.aiState === "idle").length,
    focusedEmployees: currentWork.filter((item) => item.aiState === "working").length,
    blockedEmployees: 0,
    byState: countBy(currentWork, (item) => item.aiState).map(([state, count]) => ({ state, count })),
    byRole: countBy(currentWork, (item) => item.role).map(([role, count]) => ({ role, count })),
    currentWork,
  };
}

function createProjectSummary(
  projects: ReadonlyArray<ProjectPortalProject>,
  tasks: ReadonlyArray<ProjectTask>,
): ProjectDashboardSummary {
  const projectItems = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    return {
      projectId: project.id,
      name: project.name,
      status: project.status,
      activeTaskCount: projectTasks.filter((task) => task.status !== "Done").length,
      completedTaskCount: projectTasks.filter((task) => task.status === "Done").length,
      blockedTaskCount: projectTasks.filter((task) => task.priority === "Critical" && task.status !== "Done").length,
      progressPercent: projectTasks.length > 0 ? average(projectTasks.map((task) => getTaskProgress(task.status))) : undefined,
    };
  });

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status === "Active").length,
    completedProjects: projectItems.filter((project) => project.progressPercent === 100).length,
    blockedProjects: projectItems.filter((project) => project.blockedTaskCount > 0).length,
    averageProgress: projectItems.length > 0
      ? average(projectItems.map((project) => project.progressPercent ?? 0))
      : undefined,
    projects: projectItems,
  };
}

function createWorkloadSummary(
  tasks: ReadonlyArray<ProjectTask>,
  workSessions: ReadonlyArray<WorkSession>,
  currentWork: ReadonlyArray<CompanyDashboardEmployeeWorkItem>,
): WorkloadSummary {
  const activeWorkSessions = workSessions.filter((session) => session.status === "running" || session.status === "queued");
  const activeTaskAssignmentsByEmployee = tasks
    .filter((task) => task.status !== "Done" && task.assigneeId)
    .reduce<Record<string, number>>((counts, task) => {
      counts[task.assigneeId ?? ""] = (counts[task.assigneeId ?? ""] ?? 0) + 1;
      return counts;
    }, {});

  return {
    assignedTaskCount: tasks.filter((task) => task.assigneeId || task.assignee).length,
    unassignedTaskCount: tasks.filter((task) => task.status !== "Done" && !task.assigneeId && !task.assignee).length,
    activeWorkSessionCount: activeWorkSessions.length,
    employeesWithActiveWork: new Set(activeWorkSessions.map((session) => session.employeeId)).size,
    availableEmployeeCount: currentWork.filter((item) => item.aiState === "idle").length,
    overloadedEmployees: currentWork.filter((item) => (activeTaskAssignmentsByEmployee[item.employeeId] ?? 0) > 1),
  };
}

function createOccupancySummary(
  workstations: ReadonlyArray<WorkstationSnapshot>,
  employeeSources: ReadonlyArray<EmployeeInsightSource>,
): OfficeOccupancySummary {
  return {
    presentEmployees: employeeSources.filter((source) => source.aiState !== "going_home").length,
    occupiedWorkstations: workstations.filter((workstation) => workstation.state === "occupied").length,
    availableWorkstations: workstations.filter((workstation) => workstation.state === "available").length,
    reservedWorkstations: workstations.filter((workstation) => workstation.state === "reserved").length,
    unavailableWorkstations: workstations.filter((workstation) => workstation.state === "unavailable").length,
  };
}

function createBottlenecks(
  tasks: ReadonlyArray<ProjectTask>,
  workload: WorkloadSummary,
  projects: ProjectDashboardSummary,
): BottleneckSummary[] {
  return [
    ...tasks
      .filter((task) => task.status !== "Done" && task.priority === "Critical" && !task.assigneeId && !task.assignee)
      .map((task) => ({
        id: `unassigned-critical-${task.id}`,
        severity: "high" as const,
        label: "Critical task is unassigned",
        description: `${task.title} is critical and has no employee assigned.`,
        sourceSystems: ["projects" as const, "task_activity" as const],
      })),
    ...(workload.overloadedEmployees.length > 0
      ? [{
          id: "employee-overload",
          severity: "medium" as const,
          label: "Employee workload is concentrated",
          description: `${workload.overloadedEmployees.length} employee(s) have multiple active assignments.`,
          sourceSystems: ["projects" as const, "employee_ai" as const],
        }]
      : []),
    ...(projects.blockedProjects > 0
      ? [{
          id: "blocked-projects",
          severity: "medium" as const,
          label: "Projects need attention",
          description: `${projects.blockedProjects} project(s) include critical unfinished work.`,
          sourceSystems: ["projects" as const],
        }]
      : []),
  ];
}

function createActivity(
  tasks: ReadonlyArray<ProjectTask>,
  workSessions: ReadonlyArray<WorkSession>,
  conversations: ReadonlyArray<EmployeeConversation>,
): CompanyActivityItem[] {
  return [
    ...tasks.flatMap((task) => (task.activityLog ?? []).map((activity) => createTaskActivityItem(activity))),
    ...workSessions.map((session) => ({
      id: `work-session-${session.id}`,
      timestamp: session.finishedAt ?? session.startedAt,
      type: "work_session" as const,
      label: `${session.employeeName} ${session.status} work on ${session.taskId}.`,
      sourceId: session.id,
      sourceSystems: ["work_session" as const],
    })),
    ...conversations.map((conversation) => ({
      id: `conversation-${conversation.conversationId}`,
      timestamp: conversation.timestamp,
      type: "conversation" as const,
      label: `${conversation.speakerName}: ${conversation.dialogueType}`,
      description: conversation.currentTaskTitle,
      sourceId: conversation.conversationId,
      sourceSystems: ["conversation" as const],
    })),
  ].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

function createTaskActivityItem(activity: TaskActivity): CompanyActivityItem {
  return {
    id: `task-activity-${activity.id}`,
    timestamp: activity.createdAt,
    type: "task_activity",
    label: activity.message,
    sourceId: activity.taskId,
    sourceSystems: ["task_activity"],
  };
}

function createProductivitySummary(
  tasks: ReadonlyArray<ProjectTask>,
  workSessions: ReadonlyArray<WorkSession>,
): ProductivitySummary {
  const completedTaskCount = tasks.filter((task) => task.status === "Done").length;
  const activeWorkSessionCount = workSessions.filter((session) => session.status === "running" || session.status === "queued").length;
  const finishedWorkSessionCount = workSessions.filter((session) => session.status === "finished").length;
  const failedWorkSessionCount = workSessions.filter((session) => session.status === "failed").length;

  return {
    completedTaskCount,
    activeWorkSessionCount,
    finishedWorkSessionCount,
    failedWorkSessionCount,
    recentProgressLabel: completedTaskCount > 0 || finishedWorkSessionCount > 0
      ? `${completedTaskCount} completed task(s), ${finishedWorkSessionCount} finished work session(s).`
      : "No completed work recorded yet.",
  };
}

function createRisks(
  tasks: ReadonlyArray<ProjectTask>,
  employees: EmployeeDashboardSummary,
  projects: ProjectDashboardSummary,
  workSessions: ReadonlyArray<WorkSession>,
  companyProgression?: CompanyProgressionSnapshot,
): RiskSummary[] {
  return [
    ...(employees.totalEmployees === 0
      ? [{
          id: "no-employees",
          severity: "high" as const,
          label: "No employees available",
          reason: "The company has no visible employees to carry work.",
          sourceSystems: ["employee_ai" as const],
        }]
      : []),
    ...(projects.totalProjects === 0
      ? [{
          id: "no-projects",
          severity: "medium" as const,
          label: "No active project data",
          reason: "The dashboard has no project source data to evaluate.",
          sourceSystems: ["projects" as const],
        }]
      : []),
    ...tasks
      .filter((task) => task.status !== "Done" && task.priority === "Critical")
      .map((task) => ({
        id: `critical-task-${task.id}`,
        severity: "high" as const,
        label: "Critical unfinished task",
        reason: `${task.title} is still ${task.status}.`,
        sourceSystems: ["projects" as const],
      })),
    ...workSessions
      .filter((session) => session.status === "failed")
      .map((session) => ({
        id: `failed-session-${session.id}`,
        severity: "medium" as const,
        label: "Work session failed",
        reason: `${session.employeeName}'s work session did not complete.`,
        sourceSystems: ["work_session" as const],
      })),
    ...(companyProgression?.requiredMilestones.some((milestone) => !milestone.isMet)
      ? [{
          id: "progression-milestones-open",
          severity: "low" as const,
          label: "Progression milestones remain",
          reason: "Some company progression milestones are not yet met.",
          sourceSystems: ["company_progression" as const],
        }]
      : []),
  ];
}

function createSectionAvailability(input: {
  employeeSources: ReadonlyArray<EmployeeInsightSource>;
  projects: ReadonlyArray<ProjectPortalProject>;
  tasks: ReadonlyArray<ProjectTask>;
  workSessions: ReadonlyArray<WorkSession>;
  workstations: ReadonlyArray<WorkstationSnapshot>;
  conversations: ReadonlyArray<EmployeeConversation>;
  bottlenecks: ReadonlyArray<BottleneckSummary>;
  activity: ReadonlyArray<CompanyActivityItem>;
  risks: ReadonlyArray<RiskSummary>;
  companyProgression?: CompanyProgressionSnapshot;
}): CompanyDashboardSectionAvailability[] {
  return [
    createCompanyDashboardSectionAvailability("company_health", "Company Health", ["company_progression"], input.companyProgression ? "available" : "unavailable"),
    createCompanyDashboardSectionAvailability("employee_summary", "Employee Summary", ["employee_ai", "schedule"], getCollectionStatus(input.employeeSources)),
    createCompanyDashboardSectionAvailability("employee_states", "Employee States", ["employee_ai"], getCollectionStatus(input.employeeSources)),
    createCompanyDashboardSectionAvailability("project_summary", "Project Summary", ["projects"], getCollectionStatus(input.projects)),
    createCompanyDashboardSectionAvailability("project_progress", "Project Progress", ["projects", "task_activity"], getCollectionStatus(input.tasks)),
    createCompanyDashboardSectionAvailability("current_workload", "Current Workload", ["projects", "work_session"], getCollectionStatus(input.tasks)),
    createCompanyDashboardSectionAvailability("office_occupancy", "Office Occupancy", ["office_layout"], getCollectionStatus(input.workstations)),
    createCompanyDashboardSectionAvailability("current_bottlenecks", "Current Bottlenecks", ["employee_ai", "projects"], input.bottlenecks.length > 0 ? "available" : "empty"),
    createCompanyDashboardSectionAvailability("recent_company_activity", "Recent Company Activity", ["task_activity", "work_session"], getCollectionStatus(input.activity)),
    createCompanyDashboardSectionAvailability("recent_conversations", "Recent Conversations", ["conversation"], getCollectionStatus(input.conversations)),
    createCompanyDashboardSectionAvailability("company_focus", "Company Focus", ["company_progression"], "unavailable"),
    createCompanyDashboardSectionAvailability("company_summary", "Company Summary", ["company_progression", "projects"], "available"),
    createCompanyDashboardSectionAvailability("recent_productivity", "Recent Productivity", ["task_activity", "work_session"], input.workSessions.length > 0 || input.tasks.length > 0 ? "available" : "empty"),
    createCompanyDashboardSectionAvailability("current_risks", "Current Risks", ["employee_ai", "projects", "company_progression"], input.risks.length > 0 ? "available" : "empty"),
  ];
}

function createHealthLabel(companyProgression: CompanyProgressionSnapshot | undefined, risks: ReadonlyArray<RiskSummary>) {
  if (!companyProgression) return "Company health unavailable";
  if (risks.some((risk) => risk.severity === "critical")) return "Critical risks detected";
  if (risks.length > 0) return `${companyProgression.companyStage} needs attention`;
  return `${companyProgression.companyStage} is stable`;
}

function createCompanySummary(
  employees: EmployeeDashboardSummary,
  projects: ProjectDashboardSummary,
  workload: WorkloadSummary,
  risks: ReadonlyArray<RiskSummary>,
) {
  if (employees.totalEmployees === 0 && projects.totalProjects === 0) {
    return "No company simulation data is available yet.";
  }

  return [
    `${employees.activeEmployees} of ${employees.totalEmployees} employee(s) are active.`,
    `${projects.activeProjects} active project(s) are visible.`,
    `${workload.unassignedTaskCount} active task(s) are unassigned.`,
    risks.length > 0 ? `${risks.length} risk(s) need attention.` : "No immediate risks are visible.",
  ].join(" ");
}

function getCollectionStatus(collection: { length: number }) {
  return collection.length > 0 ? "available" : "empty";
}

function countBy<TItem, TKey extends string>(
  items: ReadonlyArray<TItem>,
  getKey: (item: TItem) => TKey,
): [TKey, number][] {
  const counts = items.reduce<Record<string, number>>((nextCounts, item) => {
    const key = getKey(item);
    nextCounts[key] = (nextCounts[key] ?? 0) + 1;
    return nextCounts;
  }, {});

  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => [key as TKey, count]);
}

function getTaskProgress(status: ProjectTask["status"]) {
  if (status === "Done") return 100;
  if (status === "Review") return 80;
  if (status === "In Progress") return 50;
  return 0;
}

function average(values: ReadonlyArray<number>) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getLatestKnownTimestamp(context: InternalSimulationDashboardProviderContext) {
  return [
    ...(context.tasks ?? []).flatMap((task) => [task.updatedAt, ...(task.activityLog ?? []).map((activity) => activity.createdAt)]),
    ...(context.workSessions ?? []).flatMap((session) => [session.startedAt, session.finishedAt].filter(Boolean) as string[]),
    ...(context.conversations ?? []).map((conversation) => conversation.timestamp),
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
