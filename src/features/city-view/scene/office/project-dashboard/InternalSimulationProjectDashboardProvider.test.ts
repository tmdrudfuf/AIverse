import { describe, expect, it } from "vitest";

import type { EmployeeInsightSource } from "../insight/EmployeeInsightTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import { InternalSimulationProjectDashboardProvider } from "./InternalSimulationProjectDashboardProvider";

describe("InternalSimulationProjectDashboardProvider", () => {
  it("lists selectable projects with derived progress and health", () => {
    const provider = new InternalSimulationProjectDashboardProvider();

    const projects = provider.listProjects({
      projects: [createProject()],
      tasks: [
        createTask({ id: "task-1", status: "Done" }),
        createTask({ id: "task-2", status: "In Progress" }),
      ],
    });

    expect(projects).toEqual([{
      projectId: "daily-proof",
      name: "Daily Proof",
      status: "Active",
      progressPercent: 75,
      healthLabel: "Project is progressing",
    }]);
  });

  it("derives a selected project snapshot from existing simulation data", () => {
    const provider = new InternalSimulationProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      generatedAt: "2026-01-01T12:00:00.000Z",
      companyFocus: {
        isSet: true,
        summary: "Current focus: reduce project risk.",
        currentFocus: {
          id: "project-risk",
          label: "Reduce project risk",
          description: "Watch blockers.",
          advisorySummary: "Current focus: reduce project risk.",
          futureMetadataTags: ["risk"],
        },
        options: [],
      },
      projects: [createProject()],
      tasks: [
        createTask({ id: "task-1", status: "Done", assigneeId: "employee-1", assignee: "Ada" }),
        createTask({
          id: "task-critical",
          status: "Todo",
          priority: "Critical",
          activityLog: [{
            id: "activity-1",
            taskId: "task-critical",
            type: "note_added",
            message: "Blocked on API shape",
            createdAt: "2026-01-01T11:00:00.000Z",
            actorName: "Ada",
          }],
        }),
      ],
      employeeInsightSources: [createInsightSource()],
      workSessions: [createWorkSession({ status: "failed", finishedAt: "2026-01-01T11:30:00.000Z" })],
    }, "daily-proof");

    expect(snapshot.providerId).toBe("internal-simulation");
    expect(snapshot.generatedAt).toBe("2026-01-01T12:00:00.000Z");
    expect(snapshot.project).toMatchObject({
      projectId: "daily-proof",
      name: "Daily Proof",
      status: "Active",
      isAvailable: true,
    });
    expect(snapshot.progress).toMatchObject({
      percentComplete: 50,
      completedWorkCount: 1,
      totalWorkCount: 3,
    });
    expect(snapshot.health).toMatchObject({
      status: "risk",
      label: "Project needs attention",
    });
    expect(snapshot.activeWork.map((item) => item.id)).toEqual(["task-employee-1", "task-critical"]);
    expect(snapshot.employees[0]).toMatchObject({
      employeeId: "employee-1",
      name: "Ada",
      aiState: "working",
      currentTaskTitle: "Build dashboard",
    });
    expect(snapshot.blockers.map((blocker) => blocker.id)).toEqual([
      "critical-task-task-critical",
      "unassigned-task-task-critical",
      "failed-session-session-1",
    ]);
    expect(snapshot.activity.map((activity) => activity.id)).toContain("task-activity-activity-1");
    expect(snapshot.relatedFocus.companyFocusLabel).toBe("Reduce project risk");
    expect(snapshot.nextSuggestedFocus).toBe("Reduce project risk");
    expect(snapshot.source).toEqual({
      sourceType: "internal-simulation",
      sourceId: "daily-proof",
      mappingConfidence: "native",
    });
  });

  it("returns safe unavailable and empty states without fabricating data", () => {
    const provider = new InternalSimulationProjectDashboardProvider();

    const missing = provider.getProjectSnapshot({ generatedAt: "2026-01-01T12:00:00.000Z" }, "missing-project");
    const empty = provider.getProjectSnapshot({
      generatedAt: "2026-01-01T12:00:00.000Z",
      projects: [createProject()],
    }, "daily-proof");

    expect(missing.project).toMatchObject({
      projectId: "missing-project",
      name: "Project unavailable",
      isAvailable: false,
    });
    expect(missing.sections.find((section) => section.id === "project_summary")?.status).toBe("unavailable");
    expect(empty.progress.label).toBe("No task progress available");
    expect(empty.activeWork).toEqual([]);
    expect(empty.employees).toEqual([]);
    expect(empty.blockers).toEqual([]);
    expect(empty.sections.find((section) => section.id === "active_work")?.status).toBe("empty");
    expect(empty.sections.find((section) => section.id === "related_employees")?.status).toBe("empty");
  });

  it("uses the latest known source timestamp when generatedAt is not supplied", () => {
    const provider = new InternalSimulationProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      projects: [createProject()],
      tasks: [
        createTask({ id: "task-1", updatedAt: "2026-01-01T09:00:00.000Z" }),
        createTask({ id: "task-2", updatedAt: "2026-01-01T11:30:00.000Z" }),
      ],
    }, "daily-proof");

    expect(snapshot.generatedAt).toBe("2026-01-01T11:30:00.000Z");
  });

  it("includes company progression as recent project activity when progression data is available", () => {
    const provider = new InternalSimulationProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      generatedAt: "2026-01-01T12:00:00.000Z",
      companyProgression: {
        companyLevel: 2,
        companyStage: "smallOffice",
        floorCount: 1,
        layoutId: "small-office",
        maxEmployees: 6,
        requiredMilestones: [],
        unlockedOfficeZones: ["workspace"],
      },
      projects: [createProject()],
    }, "daily-proof");

    expect(snapshot.activity).toContainEqual(expect.objectContaining({
      id: "progression-level-2",
      timestamp: "2026-01-01T12:00:00.000Z",
      type: "progression",
      label: "Company level 2 supports small-office.",
      description: "smallOffice stage with 6 employee capacity.",
    }));
    expect(snapshot.sections.find((section) => section.id === "recent_activity")?.status).toBe("available");
  });

  it("includes open company progression milestones in project health", () => {
    const provider = new InternalSimulationProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      generatedAt: "2026-01-01T12:00:00.000Z",
      companyProgression: {
        companyLevel: 2,
        companyStage: "smallOffice",
        floorCount: 1,
        layoutId: "small-office",
        maxEmployees: 6,
        requiredMilestones: [{
          milestoneId: "complete-first-client-project",
          label: "Complete first client project",
          description: "Complete first client project to unlock the next office stage.",
          isMet: false,
          targetValue: 1,
          currentValue: 0,
        }],
        unlockedOfficeZones: ["workspace"],
      },
      projects: [createProject()],
      tasks: [createTask({ id: "task-1", status: "In Progress" })],
    }, "daily-proof");

    expect(snapshot.health).toMatchObject({
      status: "watch",
      label: "Project should be watched",
      reason: "Company progression still has milestone requirements.",
      signals: ["Progression milestone: Complete first client project"],
    });
  });

  it("includes employee context for project tasks assigned by employee name only", () => {
    const provider = new InternalSimulationProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      generatedAt: "2026-01-01T12:00:00.000Z",
      projects: [createProject()],
      tasks: [
        createTask({
          id: "task-name-only",
          status: "In Progress",
          assignee: "Ada",
        }),
      ],
      employeeInsightSources: [
        createInsightSource({
          currentProject: createProject({ id: "other-project" }),
          currentTask: createTask({ id: "other-task", projectId: "other-project" }),
        }),
      ],
    }, "daily-proof");

    expect(snapshot.employees).toEqual([expect.objectContaining({
      employeeId: "employee-1",
      name: "Ada",
    })]);
    expect(snapshot.sections.find((section) => section.id === "related_employees")?.status).toBe("available");
  });

  it("keeps the provider internal-only and read-only by contract shape", () => {
    const provider = new InternalSimulationProjectDashboardProvider();
    const beforeProjects = [createProject()];
    const beforeTasks = [createTask({ id: "task-1", status: "Todo" })];
    const projects = structuredClone(beforeProjects);
    const tasks = structuredClone(beforeTasks);

    provider.getProjectSnapshot({ projects, tasks }, "daily-proof");

    expect(projects).toEqual(beforeProjects);
    expect(tasks).toEqual(beforeTasks);
    expect(Object.keys(provider)).toEqual(["id", "label"]);
  });
});

function createProject(options: Partial<ProjectPortalProject> = {}): ProjectPortalProject {
  return {
    id: options.id ?? "daily-proof",
    name: options.name ?? "Daily Proof",
    status: options.status ?? "Active",
    type: options.type ?? "Company",
    enabled: options.enabled ?? true,
    description: options.description ?? "Daily Proof validates AIverse office workflows.",
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

function createInsightSource(options: Partial<EmployeeInsightSource> = {}): EmployeeInsightSource {
  const currentTask = createTask({
    id: "task-employee-1",
    status: "In Progress",
    assigneeId: "employee-1",
    assignee: "Ada",
  });

  return {
    employeeId: options.employeeId ?? "employee-1",
    name: options.name ?? "Ada",
    role: options.role ?? "Engineer",
    aiState: options.aiState ?? "working",
    currentProject: options.currentProject ?? createProject(),
    currentTask: options.currentTask ?? currentTask,
    workProgress: options.workProgress ?? { label: "In Progress", status: "In Progress", percent: 50 },
    mood: options.mood,
    scheduleState: options.scheduleState ?? "focused",
    aiSnapshot: options.aiSnapshot ?? {
      employeeId: "employee-1",
      currentState: "working",
      lastUpdatedAt: "2026-01-01T10:00:00.000Z",
      contextSummary: {},
    },
  };
}

function createWorkSession(options: Partial<WorkSession> = {}): WorkSession {
  return {
    id: options.id ?? "session-1",
    taskId: options.taskId ?? "task-critical",
    projectId: options.projectId ?? "daily-proof",
    employeeId: options.employeeId ?? "employee-1",
    employeeName: options.employeeName ?? "Ada",
    provider: options.provider ?? "placeholder",
    status: options.status ?? "running",
    startedAt: options.startedAt ?? "2026-01-01T10:00:00.000Z",
    finishedAt: options.finishedAt,
    summary: options.summary,
    resultType: options.resultType,
    activityIds: options.activityIds,
  };
}
