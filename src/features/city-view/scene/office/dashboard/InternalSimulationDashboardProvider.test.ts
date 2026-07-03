import { describe, expect, it } from "vitest";

import { InternalSimulationDashboardProvider } from "./InternalSimulationDashboardProvider";
import type { EmployeeInsightSource } from "../insight/EmployeeInsightTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";

describe("InternalSimulationDashboardProvider", () => {
  it("derives a populated dashboard snapshot from existing simulation data", () => {
    const provider = new InternalSimulationDashboardProvider();

    const snapshot = provider.getSnapshot({
      companyProgression: {
        companyLevel: 2,
        companyStage: "smallOffice",
        floorCount: 1,
        layoutId: "small-office",
        maxEmployees: 6,
        requiredMilestones: [],
        unlockedOfficeZones: ["workspace"],
      },
      employeeInsightSources: [
        createInsightSource({ employeeId: "employee-1", aiState: "working", includeCurrentTask: false, name: "Ada", role: "Engineer" }),
        createInsightSource({ employeeId: "employee-2", aiState: "idle", includeCurrentTask: false, name: "Grace", role: "QA" }),
      ],
      projects: [createProject()],
      tasks: [
        createTask({ id: "task-1", status: "Done", assigneeId: "employee-1" }),
        createTask({ id: "task-2", status: "In Progress", assigneeId: "employee-1" }),
      ],
      workSessions: [createWorkSession({ status: "finished" })],
      generatedAt: "2026-01-01T10:00:00.000Z",
    });

    expect(snapshot.providerId).toBe("internal-simulation");
    expect(snapshot.generatedAt).toBe("2026-01-01T10:00:00.000Z");
    expect(snapshot.employees).toMatchObject({
      totalEmployees: 2,
      activeEmployees: 1,
      idleEmployees: 1,
      focusedEmployees: 1,
    });
    expect(snapshot.projects).toMatchObject({
      totalProjects: 1,
      activeProjects: 1,
      averageProgress: 75,
    });
    expect(snapshot.workload).toMatchObject({
      assignedTaskCount: 2,
      unassignedTaskCount: 0,
    });
    expect(snapshot.productivity.recentProgressLabel).toBe("1 completed task(s), 1 finished work session(s).");
    expect(snapshot.companySummary).toContain("1 of 2 employee(s) are active.");
  });

  it("returns explicit empty and unavailable states when source data is missing", () => {
    const provider = new InternalSimulationDashboardProvider();

    const snapshot = provider.getSnapshot({ generatedAt: "2026-01-01T10:00:00.000Z" });

    expect(snapshot.employees.totalEmployees).toBe(0);
    expect(snapshot.projects.totalProjects).toBe(0);
    expect(snapshot.companySummary).toBe("No company simulation data is available yet.");
    expect(snapshot.risks.map((risk) => risk.id)).toEqual(["no-employees", "no-projects"]);
    expect(snapshot.sections.find((section) => section.id === "employee_summary")?.status).toBe("empty");
    expect(snapshot.sections.find((section) => section.id === "company_health")?.status).toBe("unavailable");
  });

  it("derives bottlenecks, risks, and recent activity without fabricating missing data", () => {
    const provider = new InternalSimulationDashboardProvider();

    const snapshot = provider.getSnapshot({
      employeeInsightSources: [createInsightSource({ employeeId: "employee-1", aiState: "working" })],
      projects: [createProject()],
      tasks: [
        createTask({
          id: "task-critical",
          priority: "Critical",
          status: "Todo",
          activityLog: [{
            id: "activity-1",
            taskId: "task-critical",
            type: "note_added",
            message: "Blocked on API shape",
            createdAt: "2026-01-01T11:00:00.000Z",
          }],
        }),
      ],
      workSessions: [createWorkSession({ id: "session-1", status: "failed" })],
    });

    expect(snapshot.bottlenecks.map((bottleneck) => bottleneck.id)).toContain("unassigned-critical-task-critical");
    expect(snapshot.risks.map((risk) => risk.id)).toEqual([
      "critical-task-task-critical",
      "failed-session-session-1",
    ]);
    expect(snapshot.activity.map((activity) => activity.id)).toEqual([
      "task-activity-activity-1",
      "work-session-session-1",
    ]);
    expect(snapshot.conversations.highlights).toEqual([]);
  });

  it("derives recent conversation and productivity summaries when source records exist", () => {
    const provider = new InternalSimulationDashboardProvider();

    const snapshot = provider.getSnapshot({
      employeeInsightSources: [createInsightSource({ employeeId: "employee-1", aiState: "talking" })],
      projects: [createProject()],
      tasks: [createTask({ id: "task-done", status: "Done" })],
      workSessions: [
        createWorkSession({ id: "session-running", status: "running" }),
        createWorkSession({ id: "session-finished", status: "finished" }),
      ],
      conversations: [{
        employeeId: "employee-1",
        conversationId: "conversation-1",
        speakerName: "Ada",
        dialogueText: "Reviewing the dashboard.",
        dialogueType: "projectStatus",
        sourceState: "working",
        currentTaskTitle: "Build dashboard",
        timestamp: "2026-01-01T12:00:00.000Z",
      }],
    });

    expect(snapshot.conversations).toMatchObject({
      recentCount: 1,
      lastConversationAt: "2026-01-01T12:00:00.000Z",
    });
    expect(snapshot.conversations.highlights[0]).toMatchObject({
      id: "conversation-conversation-1",
      label: "Ada: projectStatus",
    });
    expect(snapshot.productivity).toMatchObject({
      completedTaskCount: 1,
      activeWorkSessionCount: 1,
      finishedWorkSessionCount: 1,
      recentProgressLabel: "1 completed task(s), 1 finished work session(s).",
    });
  });

  it("derives employee, project, workload, and occupancy detail from source snapshots", () => {
    const provider = new InternalSimulationDashboardProvider();

    const snapshot = provider.getSnapshot({
      employeeInsightSources: [
        createInsightSource({ employeeId: "employee-1", aiState: "working", role: "Engineer" }),
        createInsightSource({ employeeId: "employee-2", aiState: "working", role: "Designer" }),
        createInsightSource({ employeeId: "employee-3", aiState: "idle", role: "Engineer" }),
      ],
      projects: [createProject()],
      tasks: [
        createTask({ id: "task-1", assigneeId: "employee-1", status: "In Progress" }),
        createTask({ id: "task-2", assigneeId: "employee-1", status: "Review" }),
        createTask({ id: "task-3", status: "Todo" }),
      ],
      workSessions: [createWorkSession({ employeeId: "employee-2", status: "running" })],
    });

    expect(snapshot.employees.byState).toEqual([
      { state: "idle", count: 1 },
      { state: "working", count: 2 },
    ]);
    expect(snapshot.employees.byRole).toEqual([
      { role: "Designer", count: 1 },
      { role: "Engineer", count: 2 },
    ]);
    expect(snapshot.employees.currentWork[0]).toMatchObject({
      employeeId: "employee-1",
      currentTaskTitle: "Build dashboard",
      currentProjectName: "Daily Proof",
      progressPercent: 50,
    });
    expect(snapshot.projects.projects[0]).toMatchObject({
      projectId: "daily-proof",
      activeTaskCount: 6,
      progressPercent: 47,
    });
    expect(snapshot.workload).toMatchObject({
      assignedTaskCount: 5,
      unassignedTaskCount: 1,
      activeWorkSessionCount: 1,
      availableEmployeeCount: 1,
    });
    expect(snapshot.workload.overloadedEmployees.map((employee) => employee.employeeId)).toEqual(["employee-1"]);
    expect(snapshot.occupancy).toMatchObject({
      presentEmployees: 3,
      occupiedWorkstations: 3,
    });
  });

  it("uses the latest known source timestamp when generatedAt is not supplied", () => {
    const provider = new InternalSimulationDashboardProvider();

    const snapshot = provider.getSnapshot({
      tasks: [
        createTask({ id: "task-1", updatedAt: "2026-01-01T09:00:00.000Z" }),
        createTask({ id: "task-2", updatedAt: "2026-01-01T11:30:00.000Z" }),
      ],
    });

    expect(snapshot.generatedAt).toBe("2026-01-01T11:30:00.000Z");
  });
});

function createInsightSource(options: {
  aiState: EmployeeInsightSource["aiState"];
  employeeId: string;
  includeCurrentTask?: boolean;
  mood?: EmployeeInsightSource["mood"];
  name?: string;
  role?: EmployeeInsightSource["role"];
}): EmployeeInsightSource {
  return {
    employeeId: options.employeeId,
    name: options.name ?? "Ada",
    role: options.role ?? "Engineer",
    aiState: options.aiState,
    currentProject: createProject(),
    currentTask: options.includeCurrentTask === false
      ? undefined
      : createTask({ id: `task-${options.employeeId}`, assigneeId: options.employeeId, status: "In Progress" }),
    mood: options.mood,
    workProgress: { label: "In Progress", percent: 50, status: "In Progress" },
    workstationSnapshot: {
      workstationId: `workstation-${options.employeeId}`,
      label: "Desk",
      positionHint: { zone: "workstation", slot: 0 },
      occupiedByEmployeeId: options.employeeId,
      state: "occupied",
    },
  };
}

function createProject(options: Partial<ProjectPortalProject> = {}): ProjectPortalProject {
  return {
    id: options.id ?? "daily-proof",
    name: options.name ?? "Daily Proof",
    status: options.status ?? "Active",
    type: options.type ?? "Company",
    enabled: options.enabled ?? true,
    description: options.description ?? "",
    linkedServices: options.linkedServices ?? [],
    nextAction: options.nextAction ?? { enabled: true, label: "Review workspace", placeholder: true },
  };
}

function createTask(options: Partial<ProjectTask> & { id: string }): ProjectTask {
  return {
    id: options.id,
    title: options.title ?? "Build dashboard",
    description: options.description ?? "",
    status: options.status ?? "Todo",
    priority: options.priority ?? "Medium",
    projectId: options.projectId ?? "daily-proof",
    assignee: options.assignee,
    assigneeId: options.assigneeId,
    estimatedHours: options.estimatedHours,
    createdAt: options.createdAt ?? "2026-01-01T08:00:00.000Z",
    updatedAt: options.updatedAt ?? "2026-01-01T09:00:00.000Z",
    activityLog: options.activityLog,
  };
}

function createWorkSession(options: Partial<WorkSession> = {}): WorkSession {
  return {
    id: options.id ?? "session-1",
    taskId: options.taskId ?? "task-1",
    projectId: options.projectId ?? "daily-proof",
    employeeId: options.employeeId ?? "employee-1",
    employeeName: options.employeeName ?? "Ada",
    provider: options.provider ?? "placeholder",
    status: options.status ?? "running",
    startedAt: options.startedAt ?? "2026-01-01T10:00:00.000Z",
    finishedAt: options.finishedAt ?? (options.status === "finished" ? "2026-01-01T10:30:00.000Z" : undefined),
    summary: options.summary,
    resultType: options.resultType,
    activityIds: options.activityIds,
  };
}
