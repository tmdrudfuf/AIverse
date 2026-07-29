import { describe, expect, it } from "vitest";

import type { ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import { createConfirmedEmployeeAssignmentRecordId } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import { PreparedWorkSessionService } from "./PreparedWorkSessionService";
import { createPreparedWorkSessionId } from "./PreparedWorkSessionTypes";

describe("PreparedWorkSessionService", () => {
  it("prepares a valid confirmed assignment without mutating task, employee, assignment, or work sessions", () => {
    const service = new PreparedWorkSessionService();
    const input = createInput();
    const taskBefore = structuredClone(input.taskCollection);
    const employeeBefore = structuredClone(input.employees);
    const assignmentBefore = structuredClone(input.confirmedAssignments);
    const sessionsBefore = structuredClone(input.workSessions);

    const outcome = service.prepare(input);

    expect(outcome.result).toMatchObject({
      status: "Prepared",
      reasonCodes: ["PREPARED"],
      prepared: true,
      humanPrepared: true,
      active: false,
      workStarted: false,
      executionStarted: false,
      employeeMoved: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.preparedSession).toMatchObject({
      id: createPreparedWorkSessionId("daily-proof", "task-12", createAssignment().id),
      projectTaskId: "task-12",
      employeeId: "gpt-engineer",
      status: "Prepared",
      humanPrepared: true,
      active: false,
      agentStarted: false,
    });
    expect(input.taskCollection).toEqual(taskBefore);
    expect(input.employees).toEqual(employeeBefore);
    expect(input.confirmedAssignments).toEqual(assignmentBefore);
    expect(input.workSessions).toEqual(sessionsBefore);
  });

  it("returns AlreadyPrepared for repeated preparation without duplicating records", () => {
    const service = new PreparedWorkSessionService();
    const first = service.prepare(createInput());
    const second = service.prepare(createInput({
      existingPreparedSessions: {
        [first.preparedSession!.id]: first.preparedSession!,
      },
    }));

    expect(second.result).toMatchObject({
      status: "AlreadyPrepared",
      reasonCodes: ["ALREADY_PREPARED"],
      prepared: true,
      duplicateExistingPreparation: true,
    });
    expect(second.preparedSession?.id).toBe(first.preparedSession?.id);
  });

  it("revalidates current state before returning AlreadyPrepared for a repeated command", () => {
    const service = new PreparedWorkSessionService();
    const first = service.prepare(createInput());
    const second = service.prepare(createInput({
      taskCollection: {
        projectId: "daily-proof",
        tasks: [createTask({ status: "In Progress" })],
      },
      existingPreparedSessions: {
        [first.preparedSession!.id]: first.preparedSession!,
      },
    }));

    expect(second.result).toMatchObject({
      status: "Ineligible",
      reasonCodes: ["TASK_ALREADY_STARTED"],
      prepared: false,
      duplicateExistingPreparation: false,
    });
    expect(second.preparedSession).toBeUndefined();
  });

  it("blocks repeated preparation when a later active employee work session appears", () => {
    const service = new PreparedWorkSessionService();
    const first = service.prepare(createInput());
    const second = service.prepare(createInput({
      existingPreparedSessions: {
        [first.preparedSession!.id]: first.preparedSession!,
      },
      workSessions: {
        "other-task": [createWorkSession()],
      },
    }));

    expect(second.result).toMatchObject({
      status: "Conflict",
      reasonCodes: ["EMPLOYEE_CONFLICT"],
      prepared: false,
      duplicateExistingPreparation: false,
    });
  });

  it("blocks invalid task states and assignee mismatches", () => {
    expect(prepareWithTask({ assigneeId: undefined, assignee: undefined }).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_STALE"]);
    expect(prepareWithTask({ assigneeId: "other" }).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_STALE"]);
    expect(prepareWithTask({ assignee: "Other Name" }).result.reasonCodes).toEqual(["TASK_ASSIGNEE_MISMATCH"]);
    expect(prepareWithTask({ status: "In Progress" }).result.reasonCodes).toEqual(["TASK_ALREADY_STARTED"]);
    expect(prepareWithTask({ status: "Review" }).result.reasonCodes).toEqual(["TASK_ALREADY_STARTED"]);
    expect(prepareWithTask({ status: "Done" }).result.reasonCodes).toEqual(["TASK_COMPLETED"]);
    expect(prepareWithTask({ description: "No provenance" }).result.reasonCodes).toEqual(["MALFORMED_PROVENANCE"]);
  });

  it("blocks missing and stale confirmed assignments", () => {
    expect(new PreparedWorkSessionService().prepare(createInput({ confirmedAssignments: {} })).result.reasonCodes).toEqual([
      "CONFIRMED_ASSIGNMENT_MISSING",
    ]);
    expect(new PreparedWorkSessionService().prepare(createInput({
      confirmedAssignments: { [createAssignment().id]: createAssignment({ candidateTaskId: "other-candidate" }) },
    })).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_STALE"]);
    expect(new PreparedWorkSessionService().prepare(createInput({
      confirmedAssignments: { [createAssignment().id]: createAssignment({ workStarted: true } as unknown as Partial<ConfirmedEmployeeAssignmentRecord>) },
    })).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_WORK_STARTED"]);
    expect(new PreparedWorkSessionService().prepare(createInput({
      confirmedAssignments: { [createAssignment().id]: createAssignment({ executionStarted: true } as unknown as Partial<ConfirmedEmployeeAssignmentRecord>) },
    })).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_EXECUTION_STARTED"]);
  });

  it("blocks unavailable, working, conflicting, and active-session employees", () => {
    expect(new PreparedWorkSessionService().prepare(createInput({ employees: [] })).result.reasonCodes).toEqual(["EMPLOYEE_MISSING"]);
    expect(new PreparedWorkSessionService().prepare(createInput({
      employees: [createEmployee({ status: "Offline" })],
    })).result.reasonCodes).toEqual(["EMPLOYEE_UNAVAILABLE"]);
    expect(new PreparedWorkSessionService().prepare(createInput({
      employees: [createEmployee({ status: "Working" })],
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);
    expect(new PreparedWorkSessionService().prepare(createInput({
      employees: [createEmployee({ assignedTaskId: "other-task" })],
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);
    expect(new PreparedWorkSessionService().prepare(createInput({
      workSessions: { "other-task": [createWorkSession()] },
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);
  });

  it("blocks project mismatches and missing stores safely", () => {
    expect(new PreparedWorkSessionService().prepare(createInput({
      taskCollection: { projectId: "other-project", tasks: [createTask({ projectId: "other-project" })] },
    })).result.reasonCodes).toEqual(["PROJECT_MISMATCH"]);
    expect(new PreparedWorkSessionService().prepare(createInput({ employees: undefined })).result.reasonCodes).toEqual(["EMPLOYEE_REGISTRY_UNAVAILABLE"]);
    expect(new PreparedWorkSessionService().prepare(createInput({ existingPreparedSessions: undefined })).result.reasonCodes).toEqual([
      "PREPARED_SESSION_STORE_UNAVAILABLE",
    ]);
  });

  it("upserts records and results defensively", () => {
    const service = new PreparedWorkSessionService();
    const outcome = service.prepare(createInput());
    const records = service.upsertRecord({}, outcome.preparedSession!);
    const collection = service.upsertResult(undefined, outcome.result);

    records[outcome.preparedSession!.id]!.reasonCodes.push("PROJECT_MISMATCH");
    collection.results[0]!.reasonCodes.push("PROJECT_MISMATCH");

    const reread = service.prepare(createInput());
    expect(reread.preparedSession?.reasonCodes).toEqual(["PREPARED"]);
    expect(reread.result.reasonCodes).toEqual(["PREPARED"]);
  });
});

function prepareWithTask(overrides: Partial<ProjectTask>) {
  return new PreparedWorkSessionService().prepare(createInput({
    taskCollection: {
      projectId: "daily-proof",
      tasks: [{ ...createTask(), ...overrides }],
    },
  }));
}

function createInput(overrides: Partial<Parameters<PreparedWorkSessionService["prepare"]>[0]> = {}) {
  const assignment = createAssignment();
  return {
    request: {
      projectId: "daily-proof",
      projectTaskId: "task-12",
      confirmedAssignmentId: assignment.id,
      requestedAt: "2026-01-03T00:00:00.000Z",
    },
    taskCollection: createTaskCollection(),
    confirmedAssignments: { [assignment.id]: assignment },
    employees: [createEmployee()],
    workSessions: {},
    existingPreparedSessions: {},
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
    updatedAt: "2026-01-02T00:00:00.000Z",
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

function createWorkSession(): WorkSession {
  return {
    id: "session-1",
    taskId: "other-task",
    projectId: "daily-proof",
    employeeId: "gpt-engineer",
    employeeName: "GPT Engineer",
    provider: "placeholder",
    status: "running",
    startedAt: "2026-01-02T00:00:00.000Z",
  };
}
