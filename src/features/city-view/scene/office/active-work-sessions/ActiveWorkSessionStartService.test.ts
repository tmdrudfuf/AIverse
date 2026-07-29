import { describe, expect, it } from "vitest";

import { createConfirmedEmployeeAssignmentRecordId, type ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import { createPreparedWorkSessionId, type PreparedWorkSessionRecord } from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectTask, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import { ActiveWorkSessionStartService } from "./ActiveWorkSessionStartService";
import { createActiveWorkSessionId } from "./ActiveWorkSessionTypes";

describe("ActiveWorkSessionStartService", () => {
  it("starts a valid prepared session and updates only task, employee, active session, and result", () => {
    const service = new ActiveWorkSessionStartService();
    const input = createInput();
    const assignmentBefore = structuredClone(input.confirmedAssignments);
    const preparedBefore = structuredClone(input.preparedSessions);

    const outcome = service.start(input);

    expect(outcome.result).toMatchObject({
      status: "Started",
      reasonCodes: ["STARTED"],
      started: true,
      active: true,
      workStarted: true,
      executionStarted: false,
      agentStarted: false,
      employeeMoved: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.activeSession).toMatchObject({
      id: createActiveWorkSessionId("daily-proof", "task-12", createPreparedSession().id),
      projectTaskId: "task-12",
      preparedSessionId: createPreparedSession().id,
      confirmedAssignmentId: createAssignment().id,
      employeeId: "gpt-engineer",
      provider: "placeholder",
      status: "running",
      humanStarted: true,
      active: true,
      workStarted: true,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.taskCollection?.tasks[0]).toMatchObject({
      status: "In Progress",
      assigneeId: "gpt-engineer",
      assignee: "GPT Engineer",
    });
    expect(outcome.taskCollection?.tasks[0]?.activityLog?.[0]).toMatchObject({
      type: "work_started",
      actorId: "gpt-engineer",
      message: "Work session active for GPT Engineer. Agent execution not started. No repository mutation.",
    });
    expect(outcome.employees?.[0]).toMatchObject({
      id: "gpt-engineer",
      status: "Working",
      assignedTaskId: "task-12",
      currentProjectId: "daily-proof",
    });
    expect(outcome.activeSessions?.["task-12"]?.[0]?.id).toBe(outcome.activeSession?.id);
    expect(input.confirmedAssignments).toEqual(assignmentBefore);
    expect(input.preparedSessions).toEqual(preparedBefore);
  });

  it("returns AlreadyStarted only after revalidating current started state", () => {
    const service = new ActiveWorkSessionStartService();
    const first = service.start(createInput());
    const second = service.start(createInput({
      taskCollection: {
        projectId: "daily-proof",
        tasks: [createTask({ status: "In Progress" })],
      },
      employees: [createEmployee({ status: "Working", assignedTaskId: "task-12", currentProjectId: "daily-proof" })],
      activeSessions: first.activeSessions,
    }));

    expect(second.result).toMatchObject({
      status: "AlreadyStarted",
      reasonCodes: ["ALREADY_STARTED"],
      started: true,
      duplicateExistingSession: true,
      activeSessionId: first.activeSession?.id,
    });
    expect(second.activeSession?.id).toBe(first.activeSession?.id);
  });

  it("blocks stale repeated starts instead of returning AlreadyStarted early", () => {
    const service = new ActiveWorkSessionStartService();
    const first = service.start(createInput());
    const second = service.start(createInput({
      taskCollection: {
        projectId: "daily-proof",
        tasks: [createTask({ status: "Done" })],
      },
      employees: [createEmployee({ status: "Working", assignedTaskId: "task-12", currentProjectId: "daily-proof" })],
      activeSessions: first.activeSessions,
    }));

    expect(second.result).toMatchObject({
      status: "Ineligible",
      reasonCodes: ["TASK_COMPLETED"],
      started: false,
      duplicateExistingSession: false,
    });
    expect(second.taskCollection).toBeUndefined();
    expect(second.employees).toBeUndefined();
  });

  it("blocks missing, stale, malformed, and unsafe prepared sessions", () => {
    const service = new ActiveWorkSessionStartService();
    expect(service.start(createInput({ preparedSessions: {} })).result.reasonCodes).toEqual(["PREPARED_SESSION_NOT_FOUND"]);
    expect(service.start(createInput({
      preparedSessions: { [createPreparedSession().id]: createPreparedSession({ projectId: "other-project" }) },
    })).result.reasonCodes).toEqual(["PREPARED_SESSION_STALE"]);
    expect(service.start(createInput({
      preparedSessions: { [createPreparedSession().id]: createPreparedSession({ status: "AlreadyPrepared" }) },
    })).result.reasonCodes).toEqual(["PREPARED_SESSION_STALE"]);
    expect(service.start(createInput({
      preparedSessions: { [createPreparedSession().id]: createPreparedSession({ active: true } as unknown as Partial<PreparedWorkSessionRecord>) },
    })).result.reasonCodes).toEqual(["PREPARED_SESSION_ALREADY_ACTIVE"]);
    expect(service.start(createInput({
      preparedSessions: { [createPreparedSession().id]: createPreparedSession({ executionStarted: true } as unknown as Partial<PreparedWorkSessionRecord>) },
    })).result.reasonCodes).toEqual(["PREPARED_SESSION_EXECUTION_STARTED"]);
  });

  it("blocks invalid task, assignment, and employee states", () => {
    expect(startWithTask({ assigneeId: undefined, assignee: undefined }).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_STALE"]);
    expect(startWithTask({ assigneeId: "other" }).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_STALE"]);
    expect(startWithTask({ assignee: "Other" }).result.reasonCodes).toEqual(["TASK_ASSIGNEE_MISMATCH"]);
    expect(startWithTask({ status: "In Progress" }).result.reasonCodes).toEqual(["TASK_ALREADY_STARTED"]);
    expect(startWithTask({ status: "Review" }).result.reasonCodes).toEqual(["TASK_ALREADY_STARTED"]);
    expect(startWithTask({ status: "Done" }).result.reasonCodes).toEqual(["TASK_COMPLETED"]);
    expect(startWithTask({ description: "No provenance" }).result.reasonCodes).toEqual(["MALFORMED_PROVENANCE"]);

    expect(new ActiveWorkSessionStartService().start(createInput({ confirmedAssignments: {} })).result.reasonCodes).toEqual([
      "CONFIRMED_ASSIGNMENT_MISSING",
    ]);
    expect(new ActiveWorkSessionStartService().start(createInput({
      confirmedAssignments: { [createAssignment().id]: createAssignment({ employeeId: "other" }) },
    })).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_STALE"]);
    expect(new ActiveWorkSessionStartService().start(createInput({
      confirmedAssignments: { [createAssignment().id]: createAssignment({ humanConfirmed: false } as unknown as Partial<ConfirmedEmployeeAssignmentRecord>) },
    })).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_NOT_HUMAN_CONFIRMED"]);

    expect(new ActiveWorkSessionStartService().start(createInput({ employees: [] })).result.reasonCodes).toEqual(["EMPLOYEE_MISSING"]);
    expect(new ActiveWorkSessionStartService().start(createInput({ employees: [createEmployee({ status: "Offline" })] })).result.reasonCodes).toEqual([
      "EMPLOYEE_UNAVAILABLE",
    ]);
    expect(new ActiveWorkSessionStartService().start(createInput({ employees: [createEmployee({ status: "Working" })] })).result.reasonCodes).toEqual([
      "EMPLOYEE_CONFLICT",
    ]);
  });

  it("blocks project mismatches, missing stores, and active-session conflicts safely", () => {
    const service = new ActiveWorkSessionStartService();
    expect(service.start(createInput({
      taskCollection: { projectId: "other-project", tasks: [createTask({ projectId: "other-project" })] },
    })).result.reasonCodes).toEqual(["PROJECT_MISMATCH"]);
    expect(service.start(createInput({ employees: undefined })).result.reasonCodes).toEqual(["EMPLOYEE_REGISTRY_UNAVAILABLE"]);
    expect(service.start(createInput({ activeSessions: undefined })).result.reasonCodes).toEqual(["ACTIVE_SESSION_STORE_UNAVAILABLE"]);
    expect(service.start(createInput({
      activeSessions: {
        "other-task": [createWorkSession({ taskId: "other-task", employeeId: "gpt-engineer" })],
      },
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);
    expect(service.start(createInput({
      activeSessions: {
        "task-12": [createWorkSession({ taskId: "task-12", employeeId: "other-employee" })],
      },
    })).result.reasonCodes).toEqual(["ACTIVE_SESSION_CONFLICT"]);
  });

  it("keeps unrelated tasks and employees unchanged and protects returned arrays", () => {
    const service = new ActiveWorkSessionStartService();
    const otherTask = createTask({ id: "same-title-other", title: "Fix crash on launch" });
    const otherEmployee = createEmployee({ id: "same-name-other", name: "GPT Engineer" });
    const input = createInput({
      taskCollection: { projectId: "daily-proof", tasks: [createTask(), otherTask] },
      employees: [createEmployee(), otherEmployee],
    });
    const outcome = service.start(input);

    expect(outcome.taskCollection?.tasks[1]).toEqual(otherTask);
    expect(outcome.employees?.[1]).toEqual(otherEmployee);

    outcome.result.reasonCodes.push("PROJECT_MISMATCH");
    const collection = service.upsertResult(undefined, outcome.result);
    collection.results[0]?.reasonCodes.push("PROJECT_MISMATCH");

    const fresh = service.start(createInput());
    expect(fresh.result.reasonCodes).toEqual(["STARTED"]);
  });
});

function startWithTask(overrides: Partial<ProjectTask>) {
  return new ActiveWorkSessionStartService().start(createInput({
    taskCollection: {
      projectId: "daily-proof",
      tasks: [{ ...createTask(), ...overrides }],
    },
  }));
}

function createInput(overrides: Partial<Parameters<ActiveWorkSessionStartService["start"]>[0]> = {}) {
  const preparedSession = createPreparedSession();
  const assignment = createAssignment();
  return {
    request: {
      projectId: "daily-proof",
      projectTaskId: "task-12",
      preparedSessionId: preparedSession.id,
      requestedAt: "2026-01-04T00:00:00.000Z",
    },
    taskCollection: createTaskCollection(),
    confirmedAssignments: { [assignment.id]: assignment },
    preparedSessions: { [preparedSession.id]: preparedSession },
    employees: [createEmployee()],
    activeSessions: {},
    ...overrides,
  };
}

function createTaskCollection(): TaskCollection {
  return {
    projectId: "daily-proof",
    tasks: [createTask()],
  };
}

function createTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "task-12",
    title: "Fix crash on launch",
    description: [
      "Fix crash on launch",
      "Candidate Task: candidate-12",
      "Promotion Decision: promotion-12",
      "Assignment Recommendation: recommendation-12",
      "[AIverse Promotion: project=daily-proof; candidateTask=candidate-12; ruleset=candidate-promotion-v1]",
    ].join("\n"),
    status: "Todo",
    priority: "High",
    projectId: "daily-proof",
    assigneeId: "gpt-engineer",
    assignee: "GPT Engineer",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
    activityLog: [],
    ...overrides,
  };
}

function createAssignment(overrides: Partial<ConfirmedEmployeeAssignmentRecord> = {}): ConfirmedEmployeeAssignmentRecord {
  return {
    id: createConfirmedEmployeeAssignmentRecordId("daily-proof", "task-12", "gpt-engineer"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    promotionDecisionId: "promotion-12",
    assignmentRecommendationId: "recommendation-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    status: "Assigned",
    reasonCodes: ["ASSIGNED"],
    assignmentSource: "Human",
    assignedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: "confirmed-assignment-v1",
    taskStatusAtAssignment: "Todo",
    recommendationProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    humanConfirmed: true,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
    ...overrides,
  };
}

function createPreparedSession(overrides: Partial<PreparedWorkSessionRecord> = {}): PreparedWorkSessionRecord {
  const assignment = createAssignment();
  return {
    id: createPreparedWorkSessionId("daily-proof", "task-12", assignment.id),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    confirmedAssignmentId: assignment.id,
    assignmentRecommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    status: "Prepared",
    preparationSource: "Human",
    reasonCodes: ["PREPARED"],
    preparedAt: "2026-01-03T00:00:00.000Z",
    rulesetVersion: "prepared-session-v1",
    taskStatusAtPreparation: "Todo",
    assignmentProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    taskProvenance: {
      projectId: "daily-proof",
      candidateTaskId: "candidate-12",
      promotionDecisionId: "promotion-12",
      assignmentRecommendationId: "recommendation-12",
    },
    humanPrepared: true,
    active: false,
    workStarted: false,
    paused: false,
    completed: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#64748b",
    capabilities: ["coding"],
    description: "Test engineer",
    ...overrides,
  };
}

function createWorkSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    id: "session-1",
    taskId: "task-12",
    projectId: "daily-proof",
    employeeId: "gpt-engineer",
    employeeName: "GPT Engineer",
    provider: "placeholder",
    status: "running",
    startedAt: "2026-01-04T00:00:00.000Z",
    ...overrides,
  };
}
